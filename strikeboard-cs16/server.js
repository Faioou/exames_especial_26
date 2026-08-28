const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data', 'database.json');

const ALLOWED_MAPS = new Set([
  'de_dust2',
  'de_inferno',
  'de_nuke',
  'de_train',
  'de_tuscan',
  'de_mirage'
]);

const LEVELS = [
  { level: 1, min: 0, max: 800 },
  { level: 2, min: 801, max: 950 },
  { level: 3, min: 951, max: 1100 },
  { level: 4, min: 1101, max: 1250 },
  { level: 5, min: 1251, max: 1400 },
  { level: 6, min: 1401, max: 1550 },
  { level: 7, min: 1551, max: 1700 },
  { level: 8, min: 1701, max: 1850 },
  { level: 9, min: 1851, max: 2000 },
  { level: 10, min: 2001, max: Infinity }
];

function cleanPlayerName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeUsername(value) {
  return cleanPlayerName(value).toLowerCase();
}

function cleanTeamName(value, fallback) {
  const name = cleanPlayerName(value) || fallback;
  if (name.length > 40) throw new Error('O nome da equipa pode ter no máximo 40 caracteres.');
  return name;
}

function clampRating(value) {
  return Math.max(0, Math.min(9999, Math.round(Number(value) || 0)));
}

function randomNearbyRating(baseRating) {
  const base = clampRating(baseRating || 1000);
  // Mantém os jogadores novos muito próximos do rating do perfil (±80 pontos).
  return clampRating(base + crypto.randomInt(0, 161) - 80);
}

function getLevel(rating) {
  const value = clampRating(rating);
  return LEVELS.find(item => value >= item.min && value <= item.max) || LEVELS[LEVELS.length - 1];
}

function defaultDb() {
  return {
    profile: {
      nickname: '[ZYQX] Cuddlesoks',
      game: 'Counter-Strike 1.6',
      country: 'Portugal',
      initialRating: 1000,
      createdAt: new Date().toISOString().slice(0, 10)
    },
    matches: [],
    players: []
  };
}

function rawReadDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = defaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

function deriveStats(db) {
  const matches = Array.isArray(db.matches) ? db.matches : [];
  const last = matches[matches.length - 1];
  const initialRating = clampRating(db.profile?.initialRating ?? 1000);
  const currentRating = last ? clampRating(last.ratingAfter) : initialRating;
  const wins = matches.filter(m => m.result === 'win').length;
  const losses = matches.filter(m => m.result === 'loss').length;
  const kills = matches.reduce((sum, m) => sum + Number(m.playerStats?.kills || 0), 0);
  const deaths = matches.reduce((sum, m) => sum + Number(m.playerStats?.deaths || 0), 0);
  const currentLevel = getLevel(currentRating);
  const nextLevel = currentLevel.level === 10 ? null : LEVELS.find(l => l.level === currentLevel.level + 1);

  let progress = 100;
  if (nextLevel) {
    const span = nextLevel.min - currentLevel.min;
    progress = Math.max(0, Math.min(100, ((currentRating - currentLevel.min) / span) * 100));
  }

  return {
    matches: matches.length,
    wins,
    losses,
    winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    kills,
    deaths,
    kd: deaths ? Number((kills / deaths).toFixed(2)) : kills,
    avgKills: matches.length ? Number((kills / matches.length).toFixed(1)) : 0,
    avgDeaths: matches.length ? Number((deaths / matches.length).toFixed(1)) : 0,
    rating: currentRating,
    level: currentLevel.level,
    levelMin: currentLevel.min,
    nextLevelRating: nextLevel ? nextLevel.min : null,
    levelProgress: Number(progress.toFixed(1))
  };
}

function findPlayerById(db, id) {
  return (db.players || []).find(player => player.id === id) || null;
}

function findPlayerByUsername(db, username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return (db.players || []).find(player => normalizeUsername(player.username) === normalized) || null;
}

function createPlayerRecord(db, username, rating, options = {}) {
  const record = {
    id: options.id || `player-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    username: cleanPlayerName(username),
    rating: clampRating(rating),
    friend: Boolean(options.friend),
    isProfilePlayer: Boolean(options.isProfilePlayer),
    createdAt: new Date().toISOString()
  };
  db.players.push(record);
  return record;
}

function ensurePlayerAccount(db, username, baseRating, options = {}) {
  const cleaned = cleanPlayerName(username);
  if (!cleaned) throw new Error('O username do jogador não pode estar vazio.');

  if (options.id) {
    const byId = findPlayerById(db, options.id);
    if (byId) return byId;
  }

  const existing = findPlayerByUsername(db, cleaned);
  if (existing) {
    if (options.isProfilePlayer) existing.isProfilePlayer = true;
    return existing;
  }

  const rating = options.explicitRating != null
    ? clampRating(options.explicitRating)
    : randomNearbyRating(baseRating);

  return createPlayerRecord(db, cleaned, rating, options);
}

function ensureDbShape(db) {
  let changed = false;

  if (!db || typeof db !== 'object') throw new Error('Base de dados inválida.');
  if (!db.profile || typeof db.profile !== 'object') {
    db.profile = defaultDb().profile;
    changed = true;
  }
  if (!cleanPlayerName(db.profile.nickname)) {
    db.profile.nickname = '[ZYQX] Cuddlesoks';
    changed = true;
  }
  if (!Number.isFinite(Number(db.profile.initialRating))) {
    db.profile.initialRating = 1000;
    changed = true;
  }
  if (!Array.isArray(db.matches)) {
    db.matches = [];
    changed = true;
  }
  if (!Array.isArray(db.players)) {
    db.players = [];
    changed = true;
  }

  const stats = deriveStats(db);
  let profilePlayer = null;
  if (db.profile.playerId) profilePlayer = findPlayerById(db, db.profile.playerId);
  if (!profilePlayer) profilePlayer = (db.players || []).find(p => p.isProfilePlayer) || null;
  if (!profilePlayer) profilePlayer = findPlayerByUsername(db, db.profile.nickname);

  if (!profilePlayer) {
    profilePlayer = createPlayerRecord(db, db.profile.nickname, stats.rating, {
      id: 'player-profile',
      isProfilePlayer: true
    });
    changed = true;
  }

  if (profilePlayer.username !== db.profile.nickname) {
    profilePlayer.username = db.profile.nickname;
    changed = true;
  }
  if (!profilePlayer.isProfilePlayer) {
    profilePlayer.isProfilePlayer = true;
    changed = true;
  }
  if (profilePlayer.rating !== stats.rating) {
    profilePlayer.rating = stats.rating;
    changed = true;
  }
  if (db.profile.playerId !== profilePlayer.id) {
    db.profile.playerId = profilePlayer.id;
    changed = true;
  }

  const baseRating = stats.rating;

  for (const match of db.matches) {
    if (!match.ourTeamName) {
      match.ourTeamName = 'ZYQX';
      changed = true;
    }
    if (!match.opponentTeamName) {
      match.opponentTeamName = 'ENEMY';
      changed = true;
    }
    if (!match.playerName) {
      match.playerName = db.profile.nickname;
      changed = true;
    }
    if (!match.scoreboard || typeof match.scoreboard !== 'object') continue;

    for (const teamKey of ['ourTeam', 'opponentTeam']) {
      if (!Array.isArray(match.scoreboard[teamKey])) continue;
      for (const entry of match.scoreboard[teamKey]) {
        const isMe = Boolean(entry.isProfilePlayer) ||
          (entry.playerId && entry.playerId === profilePlayer.id) ||
          normalizeUsername(entry.name) === normalizeUsername(match.playerName) ||
          normalizeUsername(entry.name) === normalizeUsername(db.profile.nickname);

        const account = isMe
          ? profilePlayer
          : ensurePlayerAccount(db, entry.name, baseRating, { id: entry.playerId });

        if (entry.playerId !== account.id) {
          entry.playerId = account.id;
          changed = true;
        }
        if (isMe) {
          if (!entry.isProfilePlayer) {
            entry.isProfilePlayer = true;
            changed = true;
          }
          if (entry.name !== db.profile.nickname) {
            entry.name = db.profile.nickname;
            changed = true;
          }
        }
      }
    }
  }

  // Remove duplicados por username, preservando o primeiro registo e as referências.
  const seen = new Map();
  for (const player of [...db.players]) {
    const key = normalizeUsername(player.username);
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, player);
      continue;
    }
    const keeper = seen.get(key);
    if (player.id === profilePlayer.id) {
      seen.set(key, player);
      continue;
    }
    for (const match of db.matches) {
      for (const teamKey of ['ourTeam', 'opponentTeam']) {
        for (const entry of match.scoreboard?.[teamKey] || []) {
          if (entry.playerId === player.id) entry.playerId = keeper.id;
        }
      }
    }
    if (player.friend) keeper.friend = true;
    db.players = db.players.filter(p => p.id !== player.id);
    changed = true;
  }

  return changed;
}

function readDb() {
  const db = rawReadDb();
  const before = JSON.stringify(db);
  ensureDbShape(db);
  if (JSON.stringify(db) !== before) writeDb(db);
  return db;
}

function matchKd(match) {
  const kills = Number(match?.playerStats?.kills || 0);
  const deaths = Number(match?.playerStats?.deaths || 0);
  return deaths ? kills / deaths : kills;
}

function cleanPlayer(raw, isProfilePlayer = false, profileNickname = '') {
  const name = isProfilePlayer ? cleanPlayerName(profileNickname) : cleanPlayerName(raw?.name);
  const kills = Number(raw?.kills);
  const deaths = Number(raw?.deaths);

  if (!name) throw new Error('Todos os 10 jogadores precisam de nome.');
  if (name.length > 48) throw new Error(`O nome "${name}" é demasiado comprido.`);
  if (!Number.isInteger(kills) || kills < 0 || kills > 999) throw new Error(`Kills inválidas para ${name}.`);
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 999) throw new Error(`Deaths inválidas para ${name}.`);

  return {
    name,
    kills,
    deaths,
    ...(isProfilePlayer ? { isProfilePlayer: true } : {})
  };
}

function calculateRatingChange(match) {
  return match.result === 'win' ? 25 : -25;
}

function publicPlayer(player, profileRating) {
  const rating = player.isProfilePlayer ? clampRating(profileRating) : clampRating(player.rating);
  return {
    id: player.id,
    username: player.username,
    rating,
    level: getLevel(rating).level,
    friend: Boolean(player.friend),
    isProfilePlayer: Boolean(player.isProfilePlayer)
  };
}

function enrichScoreboardEntry(db, entry, profileRating) {
  let account = entry.playerId ? findPlayerById(db, entry.playerId) : null;
  if (!account) account = findPlayerByUsername(db, entry.name);
  const rating = account
    ? (account.isProfilePlayer ? profileRating : account.rating)
    : profileRating;

  return {
    ...entry,
    playerId: account?.id || entry.playerId || null,
    rankRating: clampRating(rating),
    rankLevel: getLevel(rating).level,
    isFriend: Boolean(account?.friend),
    username: account?.username || entry.name
  };
}

function dashboardPayload(db) {
  const stats = deriveStats(db);
  const matches = [...(db.matches || [])]
    .sort((a, b) => {
      const kdDiff = matchKd(b) - matchKd(a);
      if (Math.abs(kdDiff) > Number.EPSILON) return kdDiff;
      return new Date(b.playedAt || 0) - new Date(a.playedAt || 0);
    })
    .map(match => ({
      ...match,
      scoreboard: match.scoreboard ? {
        ourTeam: (match.scoreboard.ourTeam || []).map(p => enrichScoreboardEntry(db, p, stats.rating)),
        opponentTeam: (match.scoreboard.opponentTeam || []).map(p => enrichScoreboardEntry(db, p, stats.rating))
      } : null
    }));

  const players = (db.players || [])
    .map(player => publicPlayer(player, stats.rating))
    .sort((a, b) => {
      if (a.isProfilePlayer !== b.isProfilePlayer) return a.isProfilePlayer ? -1 : 1;
      if (a.friend !== b.friend) return a.friend ? -1 : 1;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.username.localeCompare(b.username, 'pt');
    });

  return {
    profile: db.profile,
    stats,
    matches,
    players,
    friends: players.filter(player => player.friend && !player.isProfilePlayer),
    matchHistorySort: 'kd-desc',
    levels: LEVELS.map(l => ({ ...l, max: Number.isFinite(l.max) ? l.max : null }))
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBytes) {
        tooLarge = true;
        reject(new Error('Pedido demasiado grande.'));
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function safeStaticPath(urlPath) {
  const normalized = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized === '/' ? 'index.html' : normalized);
  return filePath.startsWith(PUBLIC_DIR) ? filePath : null;
}

function playerIdFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[1] === 'players' && parts[2] ? decodeURIComponent(parts[2]) : null;
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    return json(res, 200, dashboardPayload(readDb()));
  }

  if (req.method === 'GET' && url.pathname === '/api/export') {
    const body = JSON.stringify(readDb(), null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="strikeboard-database.json"',
      'Content-Length': Buffer.byteLength(body)
    });
    return res.end(body);
  }

  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    try {
      const input = await readJsonBody(req, 100_000);
      const nickname = cleanPlayerName(input.nickname);
      if (!nickname) return json(res, 400, { error: 'O nome não pode ficar vazio.' });
      if (nickname.length > 48) return json(res, 400, { error: 'O nome pode ter no máximo 48 caracteres.' });

      const db = readDb();
      const oldNickname = db.profile.nickname;
      const conflict = findPlayerByUsername(db, nickname);
      if (conflict && conflict.id !== db.profile.playerId) {
        return json(res, 409, { error: 'Já existe outro jogador com esse username.' });
      }

      const profilePlayer = findPlayerById(db, db.profile.playerId);
      db.profile.nickname = nickname;
      if (profilePlayer) profilePlayer.username = nickname;

      for (const match of db.matches || []) {
        const oldMatchName = match.playerName || oldNickname;
        match.playerName = nickname;

        if (match.scoreboard) {
          for (const teamKey of ['ourTeam', 'opponentTeam']) {
            for (const player of match.scoreboard[teamKey] || []) {
              if (player.playerId === db.profile.playerId || player.isProfilePlayer || player.name === oldMatchName || player.name === oldNickname) {
                player.name = nickname;
                player.playerId = db.profile.playerId;
                player.isProfilePlayer = true;
              }
            }
          }
        }
      }

      writeDb(db);
      return json(res, 200, dashboardPayload(db));
    } catch (err) {
      return json(res, 400, { error: err.message || 'Não foi possível alterar o nome.' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/players') {
    try {
      const input = await readJsonBody(req, 100_000);
      const username = cleanPlayerName(input.username);
      const rating = Number(input.rating);
      if (!username) return json(res, 400, { error: 'Escreve um username.' });
      if (username.length > 48) return json(res, 400, { error: 'O username pode ter no máximo 48 caracteres.' });
      if (!Number.isInteger(rating) || rating < 0 || rating > 9999) return json(res, 400, { error: 'O rating deve ser um número entre 0 e 9999.' });

      const db = readDb();
      if (findPlayerByUsername(db, username)) {
        return json(res, 409, { error: 'Esse username já existe. Podes editar o jogador existente.' });
      }

      const player = createPlayerRecord(db, username, rating, { friend: Boolean(input.friend) });
      writeDb(db);
      return json(res, 201, { player: publicPlayer(player, deriveStats(db).rating), dashboard: dashboardPayload(db) });
    } catch (err) {
      return json(res, 400, { error: err.message || 'Não foi possível criar o jogador.' });
    }
  }

  const apiPlayerId = playerIdFromPath(url.pathname);
  if (apiPlayerId && req.method === 'PUT' && /^\/api\/players\/[^/]+$/.test(url.pathname)) {
    try {
      const input = await readJsonBody(req, 100_000);
      const db = readDb();
      const player = findPlayerById(db, apiPlayerId);
      if (!player) return json(res, 404, { error: 'Jogador não encontrado.' });
      if (player.isProfilePlayer) return json(res, 403, { error: 'O teu perfil é editado no botão “Editar nome”.' });

      const username = cleanPlayerName(input.username ?? player.username);
      const rating = Number(input.rating ?? player.rating);
      if (!username) return json(res, 400, { error: 'O username não pode ficar vazio.' });
      if (username.length > 48) return json(res, 400, { error: 'O username pode ter no máximo 48 caracteres.' });
      if (!Number.isInteger(rating) || rating < 0 || rating > 9999) return json(res, 400, { error: 'O rating deve ser um número entre 0 e 9999.' });

      const conflict = findPlayerByUsername(db, username);
      if (conflict && conflict.id !== player.id) return json(res, 409, { error: 'Já existe outro jogador com esse username.' });

      const oldUsername = player.username;
      player.username = username;
      player.rating = clampRating(rating);
      if (typeof input.friend === 'boolean') player.friend = input.friend;

      if (oldUsername !== username) {
        for (const match of db.matches || []) {
          for (const teamKey of ['ourTeam', 'opponentTeam']) {
            for (const entry of match.scoreboard?.[teamKey] || []) {
              if (entry.playerId === player.id) entry.name = username;
            }
          }
        }
      }

      writeDb(db);
      return json(res, 200, { player: publicPlayer(player, deriveStats(db).rating), dashboard: dashboardPayload(db) });
    } catch (err) {
      return json(res, 400, { error: err.message || 'Não foi possível editar o jogador.' });
    }
  }

  if (apiPlayerId && req.method === 'PUT' && url.pathname.endsWith('/friend')) {
    try {
      const input = await readJsonBody(req, 50_000);
      const db = readDb();
      const player = findPlayerById(db, apiPlayerId);
      if (!player) return json(res, 404, { error: 'Jogador não encontrado.' });
      if (player.isProfilePlayer) return json(res, 400, { error: 'O teu próprio perfil não pode ser adicionado aos amigos.' });
      player.friend = Boolean(input.friend);
      writeDb(db);
      return json(res, 200, { player: publicPlayer(player, deriveStats(db).rating), dashboard: dashboardPayload(db) });
    } catch (err) {
      return json(res, 400, { error: err.message || 'Não foi possível alterar os amigos.' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/matches') {
    try {
      const input = await readJsonBody(req);
      const map = cleanPlayerName(input.map);
      if (!ALLOWED_MAPS.has(map)) {
        return json(res, 400, { error: 'Escolhe um dos 6 mapas disponíveis.' });
      }

      const ourScore = Number(input.ourScore);
      const opponentScore = Number(input.opponentScore);
      if (!Number.isInteger(ourScore) || ourScore < 0 || ourScore > 99 || !Number.isInteger(opponentScore) || opponentScore < 0 || opponentScore > 99) {
        return json(res, 400, { error: 'Indica um resultado válido.' });
      }
      if (ourScore === opponentScore) return json(res, 400, { error: 'O resultado final não pode terminar empatado.' });

      if (!Array.isArray(input.ourTeam) || input.ourTeam.length !== 5 || !Array.isArray(input.opponentTeam) || input.opponentTeam.length !== 5) {
        return json(res, 400, { error: 'A partida tem de ter exatamente 5 jogadores na tua equipa e 5 adversários.' });
      }

      const profilePlayerIndex = Number(input.profilePlayerIndex);
      if (!Number.isInteger(profilePlayerIndex) || profilePlayerIndex < 0 || profilePlayerIndex > 4) {
        return json(res, 400, { error: 'Assinala qual dos 5 jogadores da tua equipa és tu.' });
      }

      const db = readDb();
      const currentStats = deriveStats(db);
      const ourTeamName = cleanTeamName(input.ourTeamName, 'ZYQX');
      const opponentTeamName = cleanTeamName(input.opponentTeamName, 'ENEMY');
      const ourTeam = input.ourTeam.map((player, index) => cleanPlayer(player, index === profilePlayerIndex, db.profile.nickname));
      const opponentTeam = input.opponentTeam.map(player => cleanPlayer(player, false, db.profile.nickname));

      const allNames = [...ourTeam, ...opponentTeam].map(player => normalizeUsername(player.name));
      if (new Set(allNames).size !== 10) return json(res, 400, { error: 'Os 10 jogadores precisam de usernames diferentes.' });

      // Liga cada username a uma conta existente. Se ainda não existir, cria automaticamente
      // um jogador com rating aleatório muito próximo do teu rating atual.
      ourTeam.forEach((entry, index) => {
        const account = index === profilePlayerIndex
          ? findPlayerById(db, db.profile.playerId)
          : ensurePlayerAccount(db, entry.name, currentStats.rating);
        entry.playerId = account.id;
        if (index === profilePlayerIndex) entry.isProfilePlayer = true;
      });
      opponentTeam.forEach(entry => {
        const account = ensurePlayerAccount(db, entry.name, currentStats.rating);
        entry.playerId = account.id;
      });

      const me = ourTeam[profilePlayerIndex];
      const result = ourScore > opponentScore ? 'win' : 'loss';
      const ratingChange = calculateRatingChange({ result });
      const ratingAfter = Math.max(0, currentStats.rating + ratingChange);
      const match = {
        id: `match-${Date.now()}`,
        playedAt: new Date().toISOString(),
        map,
        result,
        ourScore,
        opponentScore,
        totalRounds: ourScore + opponentScore,
        ourTeamName,
        opponentTeamName,
        ratingBefore: currentStats.rating,
        ratingChange,
        ratingAfter,
        playerName: db.profile.nickname,
        playerStats: {
          kills: me.kills,
          deaths: me.deaths,
          assists: null
        },
        scoreboard: { ourTeam, opponentTeam },
        screenshot: null,
        notes: cleanPlayerName(input.notes).slice(0, 500)
      };

      db.matches.push(match);
      const profilePlayer = findPlayerById(db, db.profile.playerId);
      if (profilePlayer) profilePlayer.rating = ratingAfter;
      writeDb(db);
      return json(res, 201, { match, dashboard: dashboardPayload(db) });
    } catch (err) {
      return json(res, 400, { error: err.message || 'Dados inválidos.' });
    }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/matches/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const db = readDb();
    const index = db.matches.findIndex(m => m.id === id);
    if (index === -1) return json(res, 404, { error: 'Partida não encontrada.' });
    if (id === 'match-001') return json(res, 403, { error: 'A partida inicial está protegida.' });

    db.matches.splice(index, 1);
    let rating = clampRating(db.profile.initialRating);
    for (const match of db.matches) {
      match.ratingBefore = rating;
      match.ratingChange = calculateRatingChange(match);
      match.ratingAfter = Math.max(0, rating + match.ratingChange);
      rating = match.ratingAfter;
    }
    const profilePlayer = findPlayerById(db, db.profile.playerId);
    if (profilePlayer) profilePlayer.rating = rating;
    writeDb(db);
    return json(res, 200, { ok: true, dashboard: dashboardPayload(db) });
  }

  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });

  const filePath = safeStaticPath(url.pathname);
  if (!filePath) return json(res, 403, { error: 'Acesso recusado.' });

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallback, (fallbackErr, data) => {
        if (fallbackErr) return json(res, 404, { error: 'Não encontrado.' });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`STRIKEBOARD disponível em http://localhost:${PORT}`);
});
