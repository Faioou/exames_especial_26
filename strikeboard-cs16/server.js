const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data', 'database.json');

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

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

function getLevel(rating) {
  return LEVELS.find(item => rating >= item.min && rating <= item.max) || LEVELS[0];
}

function deriveStats(db) {
  const matches = db.matches || [];
  const last = matches[matches.length - 1];
  const currentRating = last ? last.ratingAfter : db.profile.initialRating;
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

function calculateRatingChange(match) {
  // Sistema local inspirado em ladders competitivas: o resultado da equipa pesa mais.
  // Mantemos a fórmula simples e transparente para ser fácil de ajustar.
  const base = match.result === 'win' ? 25 : -25;
  return base;
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

function safeStaticPath(urlPath) {
  const normalized = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized === '/' ? 'index.html' : normalized);
  return filePath.startsWith(PUBLIC_DIR) ? filePath : null;
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

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    const db = readDb();
    return json(res, 200, { profile: db.profile, stats: deriveStats(db), matches: [...db.matches].reverse(), levels: LEVELS.map(l => ({...l, max: Number.isFinite(l.max) ? l.max : null})) });
  }

  if (req.method === 'GET' && url.pathname === '/api/export') {
    const db = readDb();
    const body = JSON.stringify(db, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="strikeboard-database.json"',
      'Content-Length': Buffer.byteLength(body)
    });
    return res.end(body);
  }

  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100_000) req.destroy();
    });
    req.on('end', () => {
      try {
        const input = JSON.parse(raw || '{}');
        const nickname = String(input.nickname || '').trim();
        if (!nickname) return json(res, 400, { error: 'O nome não pode ficar vazio.' });
        if (nickname.length > 48) return json(res, 400, { error: 'O nome pode ter no máximo 48 caracteres.' });

        const db = readDb();
        const oldNickname = db.profile.nickname;

        for (const match of db.matches || []) {
          const oldMatchName = match.playerName || oldNickname;
          match.playerName = nickname;

          if (match.scoreboard) {
            for (const teamKey of ['ourTeam', 'opponentTeam']) {
              for (const player of match.scoreboard[teamKey] || []) {
                if (player.isProfilePlayer || player.name === oldMatchName || player.name === oldNickname) {
                  player.name = nickname;
                  player.isProfilePlayer = true;
                }
              }
            }
          }
        }

        db.profile.nickname = nickname;
        writeDb(db);
        return json(res, 200, {
          profile: db.profile,
          stats: deriveStats(db),
          matches: [...db.matches].reverse(),
          levels: LEVELS.map(l => ({ ...l, max: Number.isFinite(l.max) ? l.max : null }))
        });
      } catch (err) {
        return json(res, 400, { error: 'Não foi possível alterar o nome.' });
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/matches') {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      try {
        const input = JSON.parse(raw || '{}');
        const ourScore = Number(input.ourScore);
        const opponentScore = Number(input.opponentScore);
        const kills = Number(input.kills);
        const deaths = Number(input.deaths);
        if (!input.map || !Number.isFinite(ourScore) || !Number.isFinite(opponentScore) || !Number.isFinite(kills) || !Number.isFinite(deaths)) {
          return json(res, 400, { error: 'Preencha mapa, resultado, kills e deaths.' });
        }
        if (ourScore === opponentScore) return json(res, 400, { error: 'O resultado não pode terminar empatado.' });

        const db = readDb();
        const stats = deriveStats(db);
        const result = ourScore > opponentScore ? 'win' : 'loss';
        const ratingChange = calculateRatingChange({ result });
        const ratingAfter = Math.max(0, stats.rating + ratingChange);
        const match = {
          id: `match-${Date.now()}`,
          playedAt: input.playedAt || new Date().toISOString(),
          map: String(input.map).trim(),
          result,
          ourScore,
          opponentScore,
          side: input.side || 'Unknown',
          ratingBefore: stats.rating,
          ratingChange,
          ratingAfter,
          playerName: db.profile.nickname,
          playerStats: { kills, deaths, assists: input.assists === '' || input.assists == null ? null : Number(input.assists) },
          scoreboard: null,
          screenshot: null,
          notes: input.notes ? String(input.notes).trim() : ''
        };
        db.matches.push(match);
        writeDb(db);
        return json(res, 201, { match, stats: deriveStats(db) });
      } catch (err) {
        return json(res, 400, { error: 'Dados inválidos.' });
      }
    });
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/matches/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const db = readDb();
    const index = db.matches.findIndex(m => m.id === id);
    if (index === -1) return json(res, 404, { error: 'Partida não encontrada.' });
    if (id === 'match-001') return json(res, 403, { error: 'A partida inicial está protegida neste protótipo.' });
    db.matches.splice(index, 1);

    // Recalcular ratings em sequência, preservando a primeira partida importada.
    let rating = db.profile.initialRating;
    for (const match of db.matches) {
      match.ratingBefore = rating;
      match.ratingChange = calculateRatingChange(match);
      match.ratingAfter = Math.max(0, rating + match.ratingChange);
      rating = match.ratingAfter;
    }
    writeDb(db);
    return json(res, 200, { ok: true, stats: deriveStats(db) });
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
