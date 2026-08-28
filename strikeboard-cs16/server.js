const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data', 'database.json');
const PLAYER_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'players');
const TEAM_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'teams');

const ALLOWED_MAPS = new Set(['de_dust2','de_inferno','de_nuke','de_train','de_tuscan','de_mirage']);

const TEAM_RANKS = [
  { id: 0, name: 'None', iconUrl: '/assets/team-ranks/0.svg' },
  { id: 1, name: 'Silver I', iconUrl: '/assets/team-ranks/1.svg' },
  { id: 2, name: 'Silver II', iconUrl: '/assets/team-ranks/2.svg' },
  { id: 3, name: 'Silver III', iconUrl: '/assets/team-ranks/3.svg' },
  { id: 4, name: 'Silver IV', iconUrl: '/assets/team-ranks/4.svg' },
  { id: 5, name: 'Silver Elite', iconUrl: '/assets/team-ranks/5.svg' },
  { id: 6, name: 'Silver Elite Master', iconUrl: '/assets/team-ranks/6.svg' },
  { id: 7, name: 'Gold Nova I', iconUrl: '/assets/team-ranks/7.svg' },
  { id: 8, name: 'Gold Nova II', iconUrl: '/assets/team-ranks/8.svg' },
  { id: 9, name: 'Gold Nova III', iconUrl: '/assets/team-ranks/9.svg' },
  { id: 10, name: 'Gold Nova Master', iconUrl: '/assets/team-ranks/10.svg' },
  { id: 11, name: 'Master Guardian I', iconUrl: '/assets/team-ranks/11.svg' },
  { id: 12, name: 'Master Guardian II', iconUrl: '/assets/team-ranks/12.svg' },
  { id: 13, name: 'Master Guardian Elite', iconUrl: '/assets/team-ranks/13.svg' },
  { id: 14, name: 'Distinguished Master Guardian', iconUrl: '/assets/team-ranks/14.svg' },
  { id: 15, name: 'Legendary Eagle', iconUrl: '/assets/team-ranks/15.svg' },
  { id: 16, name: 'Legendary Eagle Master', iconUrl: '/assets/team-ranks/16.svg' },
  { id: 17, name: 'Supreme Master First Class', iconUrl: '/assets/team-ranks/17.svg' },
  { id: 18, name: 'The Global Elite', iconUrl: '/assets/team-ranks/18.svg' }
];
function getTeamRank(rankId) {
  const id = Number(rankId);
  return TEAM_RANKS.find(rank => rank.id === id) || TEAM_RANKS[0];
}
function cleanTeamRankId(value) {
  const id = Number(value ?? 0);
  if (!Number.isInteger(id) || !TEAM_RANKS.some(rank => rank.id === id)) throw new Error('Escolhe um rank de equipa válido.');
  return id;
}

const LEVELS = [
  { level: 1, min: 100, max: 500, name: 'Level 1', short: '1' },
  { level: 2, min: 501, max: 750, name: 'Level 2', short: '2' },
  { level: 3, min: 751, max: 900, name: 'Level 3', short: '3' },
  { level: 4, min: 901, max: 1050, name: 'Level 4', short: '4' },
  { level: 5, min: 1051, max: 1200, name: 'Level 5', short: '5' },
  { level: 6, min: 1201, max: 1350, name: 'Level 6', short: '6' },
  { level: 7, min: 1351, max: 1530, name: 'Level 7', short: '7' },
  { level: 8, min: 1531, max: 1750, name: 'Level 8', short: '8' },
  { level: 9, min: 1751, max: 2000, name: 'Level 9', short: '9' },
  { level: 10, min: 2001, max: 2500, name: 'Level 10', short: '10' },
  { level: 11, min: 2501, max: 3000, name: 'Sapphire', short: 'S' },
  { level: 12, min: 3001, max: 3500, name: 'Emerald', short: 'E' },
  { level: 13, min: 3501, max: 4000, name: 'Ruby', short: 'R' },
  { level: 14, min: 4001, max: Infinity, name: 'Diamond', short: 'D' }
];

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function stripManagedPrefix(value) {
  return cleanText(value).replace(/^\[[A-Za-z0-9_-]{1,12}\]\s*/, '').trim();
}

function cleanBaseUsername(value) {
  return stripManagedPrefix(value);
}

function normalizeUsername(value) {
  return cleanBaseUsername(value).toLowerCase();
}

function cleanTeamName(value) {
  const name = cleanText(value);
  if (!name) throw new Error('Escreve o nome da equipa.');
  if (name.length > 40) throw new Error('O nome da equipa pode ter no máximo 40 caracteres.');
  return name;
}

function cleanTeamTag(value) {
  const tag = cleanText(value).replace(/[\[\]]/g, '').replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z0-9_-]{2,8}$/.test(tag)) throw new Error('A sigla deve ter 2 a 8 caracteres: letras, números, _ ou -.');
  return tag;
}

function clampRating(value) {
  const numeric = Number(value);
  return Math.max(100, Math.round(Number.isFinite(numeric) ? numeric : 100));
}

function randomNearbyRating(baseRating) {
  const base = clampRating(baseRating || 1000);
  return clampRating(base + crypto.randomInt(0, 161) - 80);
}

function getLevel(rating) {
  const value = clampRating(rating);
  return LEVELS.find(item => value >= item.min && value <= item.max) || LEVELS[LEVELS.length - 1];
}

function defaultDb() {
  return {
    profile: {
      nickname: 'Cuddlesoks',
      game: 'Counter-Strike 1.6',
      country: 'Portugal',
      initialRating: 1000,
      createdAt: new Date().toISOString().slice(0, 10)
    },
    matches: [],
    players: [],
    teams: []
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

function findPlayerById(db, id) {
  return (db.players || []).find(player => player.id === id) || null;
}

function findPlayerByUsername(db, username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return (db.players || []).find(player => normalizeUsername(player.username) === normalized) || null;
}

function findTeamById(db, id) {
  return (db.teams || []).find(team => team.id === id) || null;
}

function findTeamByTag(db, tag) {
  const normalized = cleanText(tag).toUpperCase();
  return (db.teams || []).find(team => String(team.tag || '').toUpperCase() === normalized) || null;
}

function displayNameForPlayer(db, player) {
  if (!player) return '';
  const base = cleanBaseUsername(player.username);
  const team = player.teamId ? findTeamById(db, player.teamId) : null;
  return team ? `[${team.tag}] ${base}` : base;
}

function playerMatchCount(db, playerId) {
  if (!playerId) return 0;
  let count = 0;
  for (const match of db.matches || []) {
    const entries = [
      ...(match.scoreboard?.ourTeam || []),
      ...(match.scoreboard?.opponentTeam || [])
    ];
    if (entries.some(entry => entry.playerId === playerId)) count += 1;
  }
  return count;
}

function assignPlayerToTeam(db, player, nextTeamId) {
  const targetId = cleanText(nextTeamId || '') || null;
  const currentId = player.teamId || null;
  if (targetId === currentId) return;

  if (targetId) {
    const target = findTeamById(db, targetId);
    if (!target) throw new Error('A equipa selecionada não existe.');
    if (currentId && currentId !== targetId) {
      const current = findTeamById(db, currentId);
      throw new Error(`Este jogador já pertence à equipa ${current?.name || 'atual'}. Remove-o dessa equipa antes de o associar a outra.`);
    }
    player.teamId = target.id;
    player.username = cleanBaseUsername(player.username);
    if (!target.memberIds.includes(player.id)) target.memberIds.push(player.id);
    if (player.isProfilePlayer) db.profile.nickname = player.username;
    return;
  }

  if (currentId) {
    const current = findTeamById(db, currentId);
    if (current) current.memberIds = (current.memberIds || []).filter(id => id !== player.id);
    player.teamId = null;
  }
}

function createPlayerRecord(db, username, rating, options = {}) {
  const record = {
    id: options.id || `player-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    username: cleanBaseUsername(username),
    rating: clampRating(rating),
    friend: Boolean(options.friend),
    isProfilePlayer: Boolean(options.isProfilePlayer),
    teamId: options.teamId || null,
    avatarUrl: options.avatarUrl || null,
    createdAt: new Date().toISOString()
  };
  db.players.push(record);
  return record;
}

function ensurePlayerAccount(db, username, baseRating, options = {}) {
  const cleaned = cleanBaseUsername(username);
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

  const rating = options.explicitRating != null ? clampRating(options.explicitRating) : randomNearbyRating(baseRating);
  return createPlayerRecord(db, cleaned, rating, options);
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
  const currentIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentIndex >= 0 ? (LEVELS[currentIndex + 1] || null) : null;
  let progress = 100;
  if (nextLevel) {
    const span = nextLevel.min - currentLevel.min;
    progress = Math.max(0, Math.min(100, ((currentRating - currentLevel.min) / span) * 100));
  }
  return {
    matches: matches.length, wins, losses,
    winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    kills, deaths,
    kd: deaths ? Number((kills / deaths).toFixed(2)) : kills,
    avgKills: matches.length ? Number((kills / matches.length).toFixed(1)) : 0,
    avgDeaths: matches.length ? Number((deaths / matches.length).toFixed(1)) : 0,
    rating: currentRating,
    level: currentLevel.level,
    rankName: currentLevel.name,
    rankShort: currentLevel.short,
    levelMin: currentLevel.min,
    nextLevelRating: nextLevel ? nextLevel.min : null,
    nextRankName: nextLevel ? nextLevel.name : null,
    nextRankShort: nextLevel ? nextLevel.short : null,
    levelProgress: Number(progress.toFixed(1))
  };
}

function ensureDbShape(db) {
  let changed = false;
  if (!db || typeof db !== 'object') throw new Error('Base de dados inválida.');
  if (!db.profile || typeof db.profile !== 'object') { db.profile = defaultDb().profile; changed = true; }
  if (!Array.isArray(db.matches)) { db.matches = []; changed = true; }
  if (!Array.isArray(db.players)) { db.players = []; changed = true; }
  if (!Array.isArray(db.teams)) { db.teams = []; changed = true; }
  if (!Number.isFinite(Number(db.profile.initialRating))) { db.profile.initialRating = 1000; changed = true; }

  // A partir desta versão o prefixo da equipa é gerido pela equipa, não pelo username guardado.
  const cleanedProfileName = cleanBaseUsername(db.profile.nickname || 'Cuddlesoks') || 'Cuddlesoks';
  if (db.profile.nickname !== cleanedProfileName) { db.profile.nickname = cleanedProfileName; changed = true; }

  for (const team of db.teams) {
    if (!Array.isArray(team.memberIds)) { team.memberIds = []; changed = true; }
    if (!('logoUrl' in team)) { team.logoUrl = null; changed = true; }
    if (!('rankId' in team)) { team.rankId = 0; changed = true; }
    if (!TEAM_RANKS.some(rank => rank.id === Number(team.rankId))) { team.rankId = 0; changed = true; }
    const fixedTag = cleanText(team.tag).replace(/[\[\]]/g, '').replace(/\s+/g, '').toUpperCase();
    if (fixedTag && team.tag !== fixedTag) { team.tag = fixedTag; changed = true; }
  }

  for (const player of db.players) {
    const base = cleanBaseUsername(player.username);
    if (base && player.username !== base) { player.username = base; changed = true; }
    if (!('teamId' in player)) { player.teamId = null; changed = true; }
    if (!('avatarUrl' in player)) { player.avatarUrl = null; changed = true; }
    if (player.teamId && !findTeamById(db, player.teamId)) { player.teamId = null; changed = true; }
  }

  const stats = deriveStats(db);
  let profilePlayer = db.profile.playerId ? findPlayerById(db, db.profile.playerId) : null;
  if (!profilePlayer) profilePlayer = db.players.find(p => p.isProfilePlayer) || null;
  if (!profilePlayer) profilePlayer = findPlayerByUsername(db, db.profile.nickname);
  if (!profilePlayer) {
    profilePlayer = createPlayerRecord(db, db.profile.nickname, stats.rating, { id: 'player-profile', isProfilePlayer: true });
    changed = true;
  }
  if (profilePlayer.username !== db.profile.nickname) { profilePlayer.username = db.profile.nickname; changed = true; }
  if (!profilePlayer.isProfilePlayer) { profilePlayer.isProfilePlayer = true; changed = true; }
  if (profilePlayer.rating !== stats.rating) { profilePlayer.rating = stats.rating; changed = true; }
  if (db.profile.playerId !== profilePlayer.id) { db.profile.playerId = profilePlayer.id; changed = true; }

  // Sincroniza memberIds <-> player.teamId.
  for (const team of db.teams) team.memberIds = team.memberIds.filter(id => Boolean(findPlayerById(db, id)));
  for (const player of db.players) {
    if (!player.teamId) continue;
    const team = findTeamById(db, player.teamId);
    if (team && !team.memberIds.includes(player.id)) { team.memberIds.push(player.id); changed = true; }
  }

  const baseRating = stats.rating;
  for (const match of db.matches) {
    if (!match.ourTeamName) { match.ourTeamName = 'team_unknown'; changed = true; }
    if (!match.opponentTeamName) { match.opponentTeamName = 'team_unknown'; changed = true; }
    if (!match.playerName) { match.playerName = db.profile.nickname; changed = true; }
    if (!match.scoreboard || typeof match.scoreboard !== 'object') continue;
    for (const teamKey of ['ourTeam', 'opponentTeam']) {
      if (!Array.isArray(match.scoreboard[teamKey])) continue;
      for (const entry of match.scoreboard[teamKey]) {
        const entryBase = cleanBaseUsername(entry.name || entry.username);
        const isMe = Boolean(entry.isProfilePlayer) || (entry.playerId && entry.playerId === profilePlayer.id) || normalizeUsername(entryBase) === normalizeUsername(db.profile.nickname);
        const account = isMe ? profilePlayer : ensurePlayerAccount(db, entryBase, baseRating, { id: entry.playerId });
        if (entry.playerId !== account.id) { entry.playerId = account.id; changed = true; }
        if (entry.name !== account.username) { entry.name = account.username; changed = true; }
        if (isMe && !entry.isProfilePlayer) { entry.isProfilePlayer = true; changed = true; }
      }
    }
  }

  // Remove duplicados por base username e preserva referências.
  const seen = new Map();
  for (const player of [...db.players]) {
    const key = normalizeUsername(player.username);
    if (!key) continue;
    if (!seen.has(key)) { seen.set(key, player); continue; }
    let keeper = seen.get(key);
    if (player.id === profilePlayer.id) { keeper = player; seen.set(key, player); }
    const duplicate = keeper.id === player.id ? seen.get(key) : player;
    if (duplicate.id === keeper.id) continue;
    for (const match of db.matches) {
      for (const teamKey of ['ourTeam','opponentTeam']) {
        for (const entry of match.scoreboard?.[teamKey] || []) if (entry.playerId === duplicate.id) entry.playerId = keeper.id;
      }
    }
    for (const team of db.teams) {
      team.memberIds = team.memberIds.map(id => id === duplicate.id ? keeper.id : id).filter((id, i, arr) => arr.indexOf(id) === i);
    }
    if (duplicate.friend) keeper.friend = true;
    if (!keeper.avatarUrl && duplicate.avatarUrl) keeper.avatarUrl = duplicate.avatarUrl;
    if (!keeper.teamId && duplicate.teamId) keeper.teamId = duplicate.teamId;
    db.players = db.players.filter(p => p.id !== duplicate.id);
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
  const name = isProfilePlayer ? cleanBaseUsername(profileNickname) : cleanBaseUsername(raw?.name);
  const playerId = cleanText(raw?.playerId || '');
  const kills = Number(raw?.kills);
  const deaths = Number(raw?.deaths);
  if (!name) throw new Error('Todos os 10 jogadores precisam de nome.');
  if (name.length > 48) throw new Error(`O nome "${name}" é demasiado comprido.`);
  if (!Number.isInteger(kills) || kills < 0 || kills > 999) throw new Error(`Kills inválidas para ${name}.`);
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 999) throw new Error(`Deaths inválidas para ${name}.`);
  return { name, playerId, kills, deaths, ...(isProfilePlayer ? { isProfilePlayer: true } : {}) };
}

function calculateRatingChange(match) {
  return match.result === 'win' ? 25 : -25;
}

function saveDataImage(dataUrl, folder, id) {
  if (!dataUrl) return null;
  const match = String(dataUrl).match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Formato de imagem inválido. Usa PNG, JPG ou WEBP.');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 4_000_000) throw new Error('A imagem é demasiado grande.');
  const dir = folder === 'teams' ? TEAM_UPLOAD_DIR : PLAYER_UPLOAD_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${id}.png`;
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return `/uploads/${folder}/${fileName}?v=${Date.now()}`;
}

function removePublicUpload(urlPath) {
  if (!urlPath || !String(urlPath).startsWith('/uploads/')) return;
  const clean = String(urlPath).split('?')[0];
  const file = path.join(PUBLIC_DIR, clean.replace(/^\//, ''));
  if (file.startsWith(PUBLIC_DIR) && fs.existsSync(file)) {
    try { fs.unlinkSync(file); } catch { /* ignore */ }
  }
}

function publicTeam(db, team) {
  const members = (team.memberIds || []).map(id => findPlayerById(db, id)).filter(Boolean);
  const competitiveRank = getTeamRank(team.rankId);
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    logoUrl: team.logoUrl || null,
    rankId: competitiveRank.id,
    rankName: competitiveRank.name,
    rankIconUrl: competitiveRank.iconUrl,
    memberIds: members.map(p => p.id),
    members: members.map(p => ({ id: p.id, username: p.username, avatarUrl: p.avatarUrl || null, isProfilePlayer: Boolean(p.isProfilePlayer) })),
    createdAt: team.createdAt
  };
}

function publicPlayer(db, player, profileRating) {
  const rating = player.isProfilePlayer ? clampRating(profileRating) : clampRating(player.rating);
  const rank = getLevel(rating);
  const team = player.teamId ? findTeamById(db, player.teamId) : null;
  const matchCount = playerMatchCount(db, player.id);
  return {
    id: player.id,
    username: player.username,
    displayUsername: displayNameForPlayer(db, player),
    rating,
    level: rank.level,
    rankName: rank.name,
    rankShort: rank.short,
    friend: Boolean(player.friend),
    isProfilePlayer: Boolean(player.isProfilePlayer),
    avatarUrl: player.avatarUrl || null,
    teamId: team?.id || null,
    teamName: team?.name || null,
    teamTag: team?.tag || null,
    teamLogoUrl: team?.logoUrl || null,
    matchCount,
    canDelete: !player.isProfilePlayer && matchCount === 0
  };
}

function enrichScoreboardEntry(db, entry, profileRating) {
  let account = entry.playerId ? findPlayerById(db, entry.playerId) : null;
  if (!account) account = findPlayerByUsername(db, entry.name);
  const rating = account ? (account.isProfilePlayer ? profileRating : account.rating) : profileRating;
  const team = account?.teamId ? findTeamById(db, account.teamId) : null;
  const rank = getLevel(rating);
  return {
    ...entry,
    name: account?.username || cleanBaseUsername(entry.name),
    username: account?.username || cleanBaseUsername(entry.name),
    displayUsername: account ? displayNameForPlayer(db, account) : cleanBaseUsername(entry.name),
    playerId: account?.id || entry.playerId || null,
    rankRating: clampRating(rating),
    rankLevel: rank.level,
    rankName: rank.name,
    rankShort: rank.short,
    isFriend: Boolean(account?.friend),
    avatarUrl: account?.avatarUrl || null,
    teamId: team?.id || null,
    teamName: team?.name || null,
    teamTag: team?.tag || null,
    teamLogoUrl: team?.logoUrl || null
  };
}

function resolvedMatchTeam(db, match, side) {
  const id = side === 'ours' ? match.ourTeamId : match.opponentTeamId;
  const fallbackName = side === 'ours' ? match.ourTeamName : match.opponentTeamName;
  const team = id ? findTeamById(db, id) : null;
  return {
    id: team?.id || null,
    name: team?.name || fallbackName || 'team_unknown',
    tag: team?.tag || null,
    logoUrl: team?.logoUrl || null
  };
}

function dashboardPayload(db) {
  const stats = deriveStats(db);
  const profilePlayer = findPlayerById(db, db.profile.playerId);
  const profilePublic = profilePlayer ? publicPlayer(db, profilePlayer, stats.rating) : null;
  const matches = [...(db.matches || [])]
    .sort((a, b) => {
      const kdDiff = matchKd(b) - matchKd(a);
      if (Math.abs(kdDiff) > Number.EPSILON) return kdDiff;
      return new Date(b.playedAt || 0) - new Date(a.playedAt || 0);
    })
    .map(match => {
      const oursMeta = resolvedMatchTeam(db, match, 'ours');
      const enemyMeta = resolvedMatchTeam(db, match, 'enemy');
      return {
        ...match,
        ourTeamName: oursMeta.name,
        opponentTeamName: enemyMeta.name,
        ourTeamId: oursMeta.id,
        opponentTeamId: enemyMeta.id,
        ourTeamLogoUrl: oursMeta.logoUrl,
        opponentTeamLogoUrl: enemyMeta.logoUrl,
        playerName: profilePublic?.displayUsername || db.profile.nickname,
        scoreboard: match.scoreboard ? {
          ourTeam: (match.scoreboard.ourTeam || []).map(p => enrichScoreboardEntry(db, p, stats.rating)),
          opponentTeam: (match.scoreboard.opponentTeam || []).map(p => enrichScoreboardEntry(db, p, stats.rating))
        } : null
      };
    });

  const players = (db.players || []).map(player => publicPlayer(db, player, stats.rating)).sort((a, b) => {
    if (a.isProfilePlayer !== b.isProfilePlayer) return a.isProfilePlayer ? -1 : 1;
    if (a.friend !== b.friend) return a.friend ? -1 : 1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.username.localeCompare(b.username, 'pt');
  });

  const teams = (db.teams || []).map(team => publicTeam(db, team)).sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  return {
    profile: {
      ...db.profile,
      nickname: profilePlayer?.username || db.profile.nickname,
      displayNickname: profilePublic?.displayUsername || db.profile.nickname,
      avatarUrl: profilePublic?.avatarUrl || null,
      teamId: profilePublic?.teamId || null,
      teamName: profilePublic?.teamName || null,
      teamTag: profilePublic?.teamTag || null
    },
    stats,
    matches,
    players,
    friends: players.filter(player => player.friend && !player.isProfilePlayer),
    teams,
    matchHistorySort: 'kd-desc',
    levels: LEVELS.map(l => ({ ...l, max: Number.isFinite(l.max) ? l.max : null }))
  };
}

function resolveMatchTeam(db, accounts) {
  const ids = accounts.map(a => a.teamId || null);
  const first = ids[0];
  if (first && ids.every(id => id === first)) {
    const team = findTeamById(db, first);
    if (team) return { id: team.id, name: team.name };
  }
  const pick = accounts[crypto.randomInt(0, accounts.length)];
  const safe = cleanBaseUsername(pick.username).replace(/\s+/g, '_').replace(/[^A-Za-z0-9À-ÿ_.-]/g, '').slice(0, 28) || 'unknown';
  return { id: null, name: `team_${safe}` };
}

function applyTeamMembers(db, team, memberIds) {
  const selected = [...new Set(memberIds || [])].filter(id => Boolean(findPlayerById(db, id)));
  const previous = new Set(team.memberIds || []);

  // Valida tudo antes de alterar qualquer associação. Um jogador nunca é transferido
  // diretamente de uma equipa para outra.
  for (const id of selected) {
    const player = findPlayerById(db, id);
    if (player?.teamId && player.teamId !== team.id) {
      const other = findTeamById(db, player.teamId);
      throw new Error(`${displayNameForPlayer(db, player)} já pertence à equipa ${other?.name || 'atual'}.`);
    }
  }

  for (const id of previous) {
    if (!selected.includes(id)) {
      const player = findPlayerById(db, id);
      if (player?.teamId === team.id) player.teamId = null;
    }
  }

  for (const id of selected) {
    const player = findPlayerById(db, id);
    if (!player) continue;
    player.teamId = team.id;
    player.username = cleanBaseUsername(player.username);
    if (player.isProfilePlayer) db.profile.nickname = player.username;
  }
  team.memberIds = selected;
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

function readJsonBody(req, maxBytes = 6_000_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBytes) { tooLarge = true; reject(new Error('Pedido demasiado grande.')); }
    });
    req.on('end', () => {
      if (tooLarge) return;
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function safeStaticPath(urlPath) {
  const normalized = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized === '/' ? 'index.html' : normalized);
  return filePath.startsWith(PUBLIC_DIR) ? filePath : null;
}

function routeId(pathname, resource) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'api' && parts[1] === resource && parts[2] ? decodeURIComponent(parts[2]) : null;
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/dashboard') return json(res, 200, dashboardPayload(readDb()));

  if (req.method === 'GET' && url.pathname === '/api/export') {
    const body = JSON.stringify(readDb(), null, 2);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="strikeboard-database.json"', 'Content-Length': Buffer.byteLength(body) });
    return res.end(body);
  }

  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    try {
      const input = await readJsonBody(req);
      const nickname = cleanBaseUsername(input.nickname);
      if (!nickname) return json(res, 400, { error: 'O nome não pode ficar vazio.' });
      if (nickname.length > 48) return json(res, 400, { error: 'O nome pode ter no máximo 48 caracteres.' });
      const db = readDb();
      const profilePlayer = findPlayerById(db, db.profile.playerId);
      const conflict = findPlayerByUsername(db, nickname);
      if (conflict && conflict.id !== profilePlayer?.id) return json(res, 409, { error: 'Já existe outro jogador com esse username.' });
      if (profilePlayer) {
        profilePlayer.username = nickname;
        if (input.avatarData) profilePlayer.avatarUrl = saveDataImage(input.avatarData, 'players', profilePlayer.id);
        if (input.removeAvatar) { removePublicUpload(profilePlayer.avatarUrl); profilePlayer.avatarUrl = null; }
      }
      db.profile.nickname = nickname;
      writeDb(db);
      return json(res, 200, dashboardPayload(db));
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível alterar o perfil.' }); }
  }

  if (req.method === 'POST' && url.pathname === '/api/players') {
    try {
      const input = await readJsonBody(req);
      const username = cleanBaseUsername(input.username);
      const rating = Number(input.rating);
      if (!username) return json(res, 400, { error: 'Escreve um username.' });
      if (username.length > 48) return json(res, 400, { error: 'O username pode ter no máximo 48 caracteres.' });
      if (!Number.isInteger(rating) || rating < 100) return json(res, 400, { error: 'O rating deve ser um inteiro igual ou superior a 100.' });
      const db = readDb();
      if (findPlayerByUsername(db, username)) return json(res, 409, { error: 'Esse username já existe.' });
      const player = createPlayerRecord(db, username, rating, { friend: Boolean(input.friend) });
      if (input.teamId) assignPlayerToTeam(db, player, input.teamId);
      if (input.avatarData) player.avatarUrl = saveDataImage(input.avatarData, 'players', player.id);
      writeDb(db);
      return json(res, 201, { player: publicPlayer(db, player, deriveStats(db).rating), dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível criar o jogador.' }); }
  }

  const playerId = routeId(url.pathname, 'players');
  if (playerId && req.method === 'PUT' && /^\/api\/players\/[^/]+$/.test(url.pathname)) {
    try {
      const input = await readJsonBody(req);
      const db = readDb();
      const player = findPlayerById(db, playerId);
      if (!player) return json(res, 404, { error: 'Jogador não encontrado.' });
      const username = cleanBaseUsername(input.username ?? player.username);
      const rating = Number(input.rating ?? player.rating);
      if (!username) return json(res, 400, { error: 'O username não pode ficar vazio.' });
      if (!Number.isInteger(rating) || rating < 100) return json(res, 400, { error: 'Rating inválido.' });
      const conflict = findPlayerByUsername(db, username);
      if (conflict && conflict.id !== player.id) return json(res, 409, { error: 'Já existe outro jogador com esse username.' });
      player.username = username;
      player.rating = clampRating(rating);
      if (typeof input.friend === 'boolean') player.friend = input.friend;
      if ('teamId' in input) assignPlayerToTeam(db, player, input.teamId);
      if (input.avatarData) player.avatarUrl = saveDataImage(input.avatarData, 'players', player.id);
      if (input.removeAvatar) { removePublicUpload(player.avatarUrl); player.avatarUrl = null; }
      if (player.isProfilePlayer) db.profile.nickname = username;
      writeDb(db);
      return json(res, 200, { player: publicPlayer(db, player, deriveStats(db).rating), dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível editar o jogador.' }); }
  }

  if (playerId && req.method === 'DELETE' && /^\/api\/players\/[^/]+$/.test(url.pathname)) {
    const db = readDb();
    const player = findPlayerById(db, playerId);
    if (!player) return json(res, 404, { error: 'Jogador não encontrado.' });
    if (player.isProfilePlayer || player.id === db.profile.playerId) return json(res, 400, { error: 'Não podes eliminar o teu próprio perfil.' });
    const matchCount = playerMatchCount(db, player.id);
    if (matchCount > 0) return json(res, 409, { error: `Este jogador aparece em ${matchCount} ${matchCount === 1 ? 'partida registada' : 'partidas registadas'} e não pode ser eliminado.` });
    if (player.teamId) {
      const team = findTeamById(db, player.teamId);
      if (team) team.memberIds = (team.memberIds || []).filter(id => id !== player.id);
    }
    removePublicUpload(player.avatarUrl);
    db.players = db.players.filter(item => item.id !== player.id);
    writeDb(db);
    return json(res, 200, { ok: true, dashboard: dashboardPayload(db) });
  }

  if (playerId && req.method === 'PUT' && url.pathname.endsWith('/friend')) {
    try {
      const input = await readJsonBody(req, 100_000);
      const db = readDb();
      const player = findPlayerById(db, playerId);
      if (!player) return json(res, 404, { error: 'Jogador não encontrado.' });
      if (player.isProfilePlayer) return json(res, 400, { error: 'O teu próprio perfil não pode ser adicionado aos amigos.' });
      player.friend = Boolean(input.friend);
      writeDb(db);
      return json(res, 200, { dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível alterar os amigos.' }); }
  }

  if (req.method === 'POST' && url.pathname === '/api/teams') {
    try {
      const input = await readJsonBody(req);
      const db = readDb();
      const name = cleanTeamName(input.name);
      const tag = cleanTeamTag(input.tag);
      if (findTeamByTag(db, tag)) return json(res, 409, { error: 'Já existe uma equipa com essa sigla.' });
      const rankId = cleanTeamRankId(input.rankId ?? 0);
      const id = `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const team = { id, name, tag, logoUrl: null, rankId, memberIds: [], createdAt: new Date().toISOString() };
      db.teams.push(team);
      if (input.logoData) team.logoUrl = saveDataImage(input.logoData, 'teams', team.id);
      applyTeamMembers(db, team, Array.isArray(input.memberIds) ? input.memberIds : []);
      writeDb(db);
      return json(res, 201, { team: publicTeam(db, team), dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível criar a equipa.' }); }
  }

  const teamId = routeId(url.pathname, 'teams');
  if (teamId && req.method === 'PUT' && /^\/api\/teams\/[^/]+$/.test(url.pathname)) {
    try {
      const input = await readJsonBody(req);
      const db = readDb();
      const team = findTeamById(db, teamId);
      if (!team) return json(res, 404, { error: 'Equipa não encontrada.' });
      const name = cleanTeamName(input.name ?? team.name);
      const tag = cleanTeamTag(input.tag ?? team.tag);
      const conflict = findTeamByTag(db, tag);
      if (conflict && conflict.id !== team.id) return json(res, 409, { error: 'Já existe outra equipa com essa sigla.' });
      team.name = name;
      team.tag = tag;
      team.rankId = cleanTeamRankId(input.rankId ?? team.rankId ?? 0);
      if (input.logoData) team.logoUrl = saveDataImage(input.logoData, 'teams', team.id);
      if (input.removeLogo) { removePublicUpload(team.logoUrl); team.logoUrl = null; }
      applyTeamMembers(db, team, Array.isArray(input.memberIds) ? input.memberIds : team.memberIds);
      writeDb(db);
      return json(res, 200, { team: publicTeam(db, team), dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Não foi possível editar a equipa.' }); }
  }

  if (teamId && req.method === 'DELETE' && /^\/api\/teams\/[^/]+$/.test(url.pathname)) {
    const db = readDb();
    const team = findTeamById(db, teamId);
    if (!team) return json(res, 404, { error: 'Equipa não encontrada.' });
    for (const player of db.players) if (player.teamId === team.id) player.teamId = null;
    removePublicUpload(team.logoUrl);
    db.teams = db.teams.filter(item => item.id !== team.id);
    writeDb(db);
    return json(res, 200, { dashboard: dashboardPayload(db) });
  }

  if (req.method === 'POST' && url.pathname === '/api/matches') {
    try {
      const input = await readJsonBody(req);
      const map = cleanText(input.map);
      if (!ALLOWED_MAPS.has(map)) return json(res, 400, { error: 'Escolhe um dos 6 mapas disponíveis.' });
      const ourScore = Number(input.ourScore);
      const opponentScore = Number(input.opponentScore);
      if (!Number.isInteger(ourScore) || ourScore < 0 || ourScore > 99 || !Number.isInteger(opponentScore) || opponentScore < 0 || opponentScore > 99) return json(res, 400, { error: 'Indica um resultado válido.' });
      if (ourScore === opponentScore) return json(res, 400, { error: 'O resultado final não pode terminar empatado.' });
      if (!Array.isArray(input.ourTeam) || input.ourTeam.length !== 5 || !Array.isArray(input.opponentTeam) || input.opponentTeam.length !== 5) return json(res, 400, { error: 'A partida tem de ter exatamente 5 jogadores de cada lado.' });
      const profilePlayerIndex = Number(input.profilePlayerIndex);
      if (profilePlayerIndex !== 0) return json(res, 400, { error: 'O teu jogador tem de permanecer no primeiro lugar da tua equipa.' });

      const db = readDb();
      const currentStats = deriveStats(db);
      const profilePlayer = findPlayerById(db, db.profile.playerId);
      if (!profilePlayer) return json(res, 400, { error: 'O teu jogador de perfil não existe na base de dados.' });

      const ourTeam = input.ourTeam.map((player, index) => cleanPlayer(player, index === 0, db.profile.nickname));
      const opponentTeam = input.opponentTeam.map(player => cleanPlayer(player, false, db.profile.nickname));
      if (ourTeam[0].playerId !== profilePlayer.id) return json(res, 400, { error: 'O primeiro jogador da tua equipa tem de ser o teu perfil e não pode ser alterado.' });

      const allEntries = [...ourTeam, ...opponentTeam];
      if (allEntries.some(entry => !entry.playerId)) return json(res, 400, { error: 'Todos os jogadores têm de ser selecionados a partir da base de dados.' });
      const allIds = allEntries.map(entry => entry.playerId);
      if (new Set(allIds).size !== 10) return json(res, 400, { error: 'Os 10 jogadores têm de ser contas diferentes da base de dados.' });

      const ourAccounts = ourTeam.map((entry, index) => {
        const account = findPlayerById(db, entry.playerId);
        if (!account) throw new Error(`O jogador selecionado para a tua equipa já não existe na base de dados.`);
        if (index === 0 && !account.isProfilePlayer) throw new Error('O primeiro jogador tem de ser o teu perfil.');
        entry.playerId = account.id;
        entry.name = account.username;
        if (index === 0) entry.isProfilePlayer = true;
        return account;
      });
      const enemyAccounts = opponentTeam.map(entry => {
        const account = findPlayerById(db, entry.playerId);
        if (!account) throw new Error('Um dos adversários selecionados já não existe na base de dados.');
        if (account.isProfilePlayer) throw new Error('O teu jogador não pode aparecer também na equipa adversária.');
        entry.playerId = account.id;
        entry.name = account.username;
        return account;
      });

      const oursIdentity = resolveMatchTeam(db, ourAccounts);
      const enemyIdentity = resolveMatchTeam(db, enemyAccounts);
      const me = ourTeam[profilePlayerIndex];
      const result = ourScore > opponentScore ? 'win' : 'loss';
      const ratingChange = calculateRatingChange({ result });
      const ratingAfter = clampRating(currentStats.rating + ratingChange);
      const match = {
        id: `match-${Date.now()}`,
        playedAt: new Date().toISOString(),
        map, result, ourScore, opponentScore, totalRounds: ourScore + opponentScore,
        ourTeamName: oursIdentity.name,
        opponentTeamName: enemyIdentity.name,
        ourTeamId: oursIdentity.id,
        opponentTeamId: enemyIdentity.id,
        ratingBefore: currentStats.rating,
        ratingChange,
        ratingAfter,
        playerName: db.profile.nickname,
        playerStats: { kills: me.kills, deaths: me.deaths, assists: null },
        scoreboard: { ourTeam, opponentTeam },
        screenshot: null,
        notes: cleanText(input.notes).slice(0, 500)
      };
      db.matches.push(match);
      if (profilePlayer) profilePlayer.rating = ratingAfter;
      writeDb(db);
      return json(res, 201, { match, dashboard: dashboardPayload(db) });
    } catch (err) { return json(res, 400, { error: err.message || 'Dados inválidos.' }); }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/matches/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const db = readDb();
    const index = db.matches.findIndex(m => m.id === id);
    if (index === -1) return json(res, 404, { error: 'Partida não encontrada.' });
    db.matches.splice(index, 1);
    let rating = clampRating(db.profile.initialRating);
    for (const match of db.matches) {
      match.ratingBefore = rating;
      match.ratingChange = calculateRatingChange(match);
      match.ratingAfter = clampRating(rating + match.ratingChange);
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

server.listen(PORT, () => console.log(`STRIKEBOARD disponível em http://localhost:${PORT}`));
