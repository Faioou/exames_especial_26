let dashboard = null;

const $ = (sel) => document.querySelector(sel);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

const VALID_VIEWS = new Set(['overview', 'matches', 'players', 'friends', 'teams', 'rating']);

function activateView(view, updateHash = false) {
  const target = VALID_VIEWS.has(view) ? view : 'overview';
  document.querySelectorAll('[data-view-section]').forEach(section => {
    section.hidden = section.dataset.viewSection !== target;
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.classList.toggle('active', item.dataset.view === target);
  });
  if (updateHash && location.hash !== `#${target}`) history.pushState(null, '', `#${target}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function initViewNavigation() {
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      activateView(item.dataset.view, true);
    });
  });
  window.addEventListener('hashchange', () => activateView(location.hash.slice(1), false));
  activateView(location.hash.slice(1) || 'overview', false);
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
function teamRankById(rankId) { const id = Number(rankId || 0); return TEAM_RANKS.find(rank => rank.id === id) || TEAM_RANKS[0]; }
function renderTeamRankBadge(team, className = 'team-rank-badge') {
  const rank = teamRankById(team?.rankId);
  return `<span class="${esc(className)}" title="${esc(rank.name)}"><img src="${esc(team?.rankIconUrl || rank.iconUrl)}" alt="${esc(rank.name)}" /><span>${esc(rank.name)}</span></span>`;
}

function rankForRating(rating) {
  const value = Math.max(100, Number(rating || 100));
  return LEVELS.find(item => value >= item.min && value <= item.max) || LEVELS[LEVELS.length - 1];
}

function levelForRating(rating) {
  return rankForRating(rating).level;
}

function rankShortForRating(rating) {
  return rankForRating(rating).short;
}

function rankNameForRating(rating) {
  return rankForRating(rating).name;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

function kdValue(kills, deaths) {
  const k = Number(kills || 0);
  const d = Number(deaths || 0);
  return d ? k / d : k;
}

function formatKD(kills, deaths) {
  return kdValue(kills, deaths).toFixed(2);
}

function kdTone(value) {
  const kd = Number(value || 0);
  if (kd >= 1.80) return 'elite';
  if (kd >= 1.30) return 'great';
  if (kd >= 0.90) return 'neutral';
  return 'low';
}

function kdTitle(value) {
  const kd = Number(value || 0);
  if (kd >= 1.80) return 'Alto impacto · K/D 1.80+';
  if (kd >= 1.30) return 'Excelente · K/D 1.30–1.79';
  if (kd >= 0.90) return 'Equilibrado · K/D 0.90–1.29';
  return 'A melhorar · K/D 0.00–0.89';
}

function getTeamNames(match) {
  return { ours: match.ourTeamName || 'ZYQX', enemy: match.opponentTeamName || 'ENEMY' };
}
let topEloLookup = new Map();

function normalizedPlayerName(value) {
  return String(value || '').trim().replace(/^\[[^\]]+\]\s*/, '').trim().toLowerCase();
}

function buildTopEloLookup(players = []) {
  const sorted = [...players]
    .filter(player => player && (player.id || player.username))
    .sort((a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff) return ratingDiff;
      return String(a.username || '').localeCompare(String(b.username || ''), 'pt');
    })
    .slice(0, 10);

  const lookup = new Map();
  sorted.forEach((player, index) => {
    const entry = {
      position: index + 1,
      tone: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'red',
      rating: Number(player.rating || 0)
    };
    if (player.id) lookup.set(`id:${player.id}`, entry);
    if (player.username) lookup.set(`name:${normalizedPlayerName(player.username)}`, entry);
  });
  return lookup;
}

function getTopEloEntry(player = {}) {
  const keys = [
    player.id ? `id:${player.id}` : '',
    player.playerId ? `id:${player.playerId}` : '',
    player.username ? `name:${normalizedPlayerName(player.username)}` : '',
    player.name ? `name:${normalizedPlayerName(player.name)}` : ''
  ].filter(Boolean);

  for (const key of keys) {
    if (topEloLookup.has(key)) return topEloLookup.get(key);
  }
  return null;
}

function topBadgeAsset(entry) {
  if (!entry) return '';
  if (entry.position === 1) return 'assets/top-badges/top-1-gold.png';
  if (entry.position === 2) return 'assets/top-badges/top-2-silver.png';
  if (entry.position === 3) return 'assets/top-badges/top-3-bronze.png';
  return 'assets/top-badges/top-4-red.png';
}

function topBadgeTitle(entry) {
  if (!entry) return '';
  if (entry.position === 1) return 'Top 1 por Elo';
  if (entry.position === 2) return 'Top 2 por Elo';
  if (entry.position === 3) return 'Top 3 por Elo';
  return `Top ${entry.position} por Elo`;
}

function renderTopBadge(player, compact = false) {
  const entry = getTopEloEntry(player);
  if (!entry) return '';
  const asset = topBadgeAsset(entry);
  const themeClass = `top-pill-${entry.tone}`;
  return `<span class="top-pill ${themeClass} ${compact ? 'top-pill-compact' : ''}" title="${esc(topBadgeTitle(entry))}"><span class="top-pill-number">#${entry.position}</span><span class="top-pill-icon"><img src="${esc(asset)}" alt="" /></span></span>`;
}

function renderRankBadge(player, rating, compact = false, extraClass = '') {
  const top = getTopEloEntry(player);
  if (top) return renderTopBadge(player, compact);
  const rank = rankForRating(rating || 100);
  return `<span class="level-ring ${extraClass} level-${rank.level}" title="${esc(rank.name)}">${esc(rank.short)}</span>`;
}


function avatarInitial(username) {
  const cleaned = String(username || '').replace(/^\[[^\]]+\]\s*/, '').trim() || String(username || '');
  return (cleaned.match(/[A-Za-z0-9À-ÿ]/)?.[0] || '?').toUpperCase();
}

function renderDisplayUsername(player = {}, options = {}) {
  const base = player.username || player.name || '';
  const tag = player.teamTag || '';
  const prefix = tag ? `<strong class="team-prefix">[${esc(tag)}]</strong> ` : '';
  const nameClass = options.nameClass ? ` class="${esc(options.nameClass)}"` : '';
  return `${prefix}<span${nameClass}>${esc(base)}</span>`;
}

function renderAvatar(player = {}, className = 'small-avatar') {
  const username = player.username || player.name || '';
  if (player.avatarUrl) return `<span class="${esc(className)} has-photo"><img src="${esc(player.avatarUrl)}" alt="" /></span>`;
  return `<span class="${esc(className)}">${esc(avatarInitial(username))}</span>`;
}

function renderTeamLogo(url, name, className = 'team-card-logo') {
  if (url) return `<span class="${esc(className)} has-photo"><img src="${esc(url)}" alt="${esc(name || 'Equipa')}" /></span>`;
  return `<span class="${esc(className)}">${esc(avatarInitial(name || 'T'))}</span>`;
}

function averageRating(team = []) {
  if (!team.length) return 0;
  return Math.round(team.reduce((sum, player) => sum + Number(player.rankRating || 0), 0) / team.length);
}

// Como neste momento guardamos K e D (mas não ADR/assists/MVPs do CS),
// o MVP da partida é calculado pelo melhor K/D. Em caso de empate,
// vence quem tiver mais kills e depois menos deaths.
function getMatchMvp(match) {
  const candidates = [
    ...(match.scoreboard?.ourTeam || []).map(player => ({ player, tone: 'ours' })),
    ...(match.scoreboard?.opponentTeam || []).map(player => ({ player, tone: 'enemy' }))
  ];
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const kdDiff = kdValue(b.player.kills, b.player.deaths) - kdValue(a.player.kills, a.player.deaths);
    if (Math.abs(kdDiff) > Number.EPSILON) return kdDiff;
    const killsDiff = Number(b.player.kills || 0) - Number(a.player.kills || 0);
    if (killsDiff) return killsDiff;
    const deathsDiff = Number(a.player.deaths || 0) - Number(b.player.deaths || 0);
    if (deathsDiff) return deathsDiff;
    return Number(b.player.rankRating || 0) - Number(a.player.rankRating || 0);
  });
  return candidates[0];
}

function playerIsMvp(player, tone, mvp) {
  if (!mvp || tone !== mvp.tone) return false;
  if (player.playerId && mvp.player.playerId) return player.playerId === mvp.player.playerId;
  const aName = String(player.username || player.name || '');
  const bName = String(mvp.player.username || mvp.player.name || '');
  return aName === bName && Number(player.kills || 0) === Number(mvp.player.kills || 0) && Number(player.deaths || 0) === Number(mvp.player.deaths || 0);
}

function rankDots(team = []) {
  return team.map(player => {
    const rank = rankForRating(player.rankRating || 100);
    return `<span class="mini-level level-${rank.level}" title="${esc(player.username || player.name)} · ${esc(rank.name)} · ${Number(player.rankRating || 0)} Elo">${esc(rank.short)}</span>`;
  }).join('');
}

function formatMatchDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: String(value || '—'), time: '' };
  return {
    date: new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(date)
  };
}

function mapDisplayName(map) {
  const names = {
    de_dust2: 'Dust 2',
    de_inferno: 'Inferno',
    de_nuke: 'Nuke',
    de_train: 'Train',
    de_tuscan: 'Tuscan',
    de_mirage: 'Mirage'
  };
  return names[String(map || '').toLowerCase()] || String(map || '—').replace(/^de_/, '');
}

function renderMatchHistoryRow(match, profile) {
  const won = match.result === 'win';
  const when = formatMatchDate(match.playedAt);
  const matchKD = formatKD(match.playerStats?.kills, match.playerStats?.deaths);
  const historicalRating = Number(match.ratingAfter ?? profile.rating ?? 0);
  const historicalRank = rankForRating(historicalRating);
  const historicalLevel = historicalRank.level;
  const change = Number(match.ratingChange || 0);

  return `
    <button class="history-row ${won ? 'history-win' : 'history-loss'}" data-match-id="${esc(match.id)}" type="button" aria-label="Abrir ${esc(match.map)} ${Number(match.ourScore)} a ${Number(match.opponentScore)}">
      <span class="history-result-bar"></span>
      <span class="history-date"><b>${esc(when.date)}</b><small>${esc(when.time)}</small></span>
      <span class="history-score"><span class="history-outcome ${won ? 'win' : 'loss'}">${won ? 'W' : 'L'}</span><b class="${won ? 'win-text' : 'loss-text'}">${Number(match.ourScore)}</b><span>:</span><b>${Number(match.opponentScore)}</b></span>
      <span class="history-rating">${renderRankBadge({ username: profile.nickname }, historicalRating, true, 'history-level')}<b>${historicalRating.toLocaleString('pt-PT')}</b><small class="${change >= 0 ? 'pos' : 'neg'}">${change > 0 ? '↗ +' : change < 0 ? '↘ ' : ''}${change}</small></span>
      <span class="history-frags"><b>${Number(match.playerStats?.kills || 0)} / ${Number(match.playerStats?.deaths || 0)}</b><small>K / D</small></span>
      <span class="history-kd"><b class="kd-pill ${kdTone(matchKD)}" title="${esc(kdTitle(matchKD))}">${matchKD}</b></span>
      <span class="history-map"><span class="map-glyph map-glyph-${esc(String(match.map || '').replace(/^de_/, ''))}">◆</span><b>${esc(mapDisplayName(match.map))}</b><small>${esc(match.map)}</small></span>
      <span class="history-open">›</span>
    </button>`;
}

function renderMatchHistoryTable(matches, profile) {
  if (!matches.length) return '<div class="empty">Ainda não existem partidas.</div>';
  return `
    <div class="history-table">
      <div class="history-head">
        <span>Date</span><span>Score</span><span>Rating</span><span>K / D</span><span>K/D</span><span>Map</span><span></span>
      </div>
      <div class="history-body">${matches.map(match => renderMatchHistoryRow(match, profile)).join('')}</div>
    </div>`;
}

function friendRow(player) {
  const rank = rankForRating(player.rating);
  return `
    <div class="player-rank-row">
      <div class="rank-player-cell">${renderAvatar(player, 'small-avatar')}<div><div class="player-display-name">${renderDisplayUsername(player)}</div><span>${player.teamName ? esc(player.teamName) : (player.friend ? 'Amigo' : 'Jogador')}</span></div></div>
      <div class="rank-cell">${renderRankBadge(player, player.rating, false)}<div class="rank-rating-copy"><strong>${player.rating.toLocaleString('pt-PT')}</strong><small>${getTopEloEntry(player) ? `Top #${getTopEloEntry(player).position}` : esc(rank.name)}</small></div></div>
      <div class="rank-actions"><button class="mini-btn edit-player-btn" data-player-id="${esc(player.id)}">Editar</button><button class="mini-btn danger toggle-friend-btn" data-player-id="${esc(player.id)}" data-friend="false">Remover</button></div>
    </div>`;
}

function knownPlayerRow(player) {
  const rank = rankForRating(player.rating);
  const status = player.isProfilePlayer ? 'O teu perfil' : (player.teamName ? esc(player.teamName) : (player.friend ? '★ amigo' : 'conta local'));
  const deleteControl = player.isProfilePlayer
    ? ''
    : player.canDelete
      ? `<button class="mini-btn danger delete-player-btn" data-player-id="${esc(player.id)}">Eliminar</button>`
      : `<span class="player-delete-lock" title="Este jogador aparece em ${Number(player.matchCount || 0)} partida(s) registada(s)">Em partidas</span>`;
  return `
    <div class="known-player-row ${player.isProfilePlayer ? 'profile-player-row' : ''}">
      <div class="known-name">${renderAvatar(player, 'small-avatar')}<div><div class="player-display-name">${renderDisplayUsername(player)}</div><span>${status}</span></div></div>
      <div class="known-rank">${renderRankBadge(player, player.rating, true, 'compact-ring')}<div class="rank-rating-copy"><b>${player.rating}</b><small>${getTopEloEntry(player) ? `Top #${getTopEloEntry(player).position}` : esc(rank.name)}</small></div></div>
      <div class="known-actions">${player.isProfilePlayer ? '' : `<button class="mini-btn toggle-friend-btn" data-player-id="${esc(player.id)}" data-friend="${player.friend ? 'false' : 'true'}">${player.friend ? 'Remover amigo' : 'Adicionar amigo'}</button>`}<button class="mini-btn edit-player-btn" data-player-id="${esc(player.id)}">Editar</button>${deleteControl}</div>
    </div>`;
}

function renderDashboard(data) {
  dashboard = data;
  const { profile, stats, matches, levels, friends, players, teams = [] } = data;
  topEloLookup = buildTopEloLookup(players);

  const profilePlayer = players.find(player => player.isProfilePlayer) || { username: profile.nickname, rating: stats.rating, avatarUrl: profile.avatarUrl, teamTag: profile.teamTag, teamName: profile.teamName };
  $('#nickname').innerHTML = renderDisplayUsername(profilePlayer);
  $('#avatarInitial').innerHTML = profilePlayer.avatarUrl ? `<img src="${esc(profilePlayer.avatarUrl)}" alt="Foto de ${esc(profile.nickname)}" />` : esc(avatarInitial(profile.nickname));
  $('#avatarInitial').classList.toggle('has-photo', Boolean(profilePlayer.avatarUrl));
  $('#matchCountMeta').textContent = `${stats.matches} ${stats.matches === 1 ? 'partida' : 'partidas'}`;
  const currentRank = rankForRating(stats.rating);
  const profileTop = getTopEloEntry(profilePlayer);
  const profileRankBadge = $('#profileRankBadge');
  if (profileRankBadge) {
    if (profileTop) {
      profileRankBadge.className = 'profile-top-rank-slot';
      profileRankBadge.innerHTML = renderTopBadge(profilePlayer, false);
    } else {
      profileRankBadge.className = `level-badge level-ring profile-rank-badge level-${currentRank.level}`;
      profileRankBadge.innerHTML = `<span id="levelNumber">${esc(currentRank.short)}</span>`;
    }
  }
  const currentRankName = $('#currentRankName');
  if (currentRankName) currentRankName.textContent = profileTop ? `TOP #${profileTop.position}` : currentRank.name.toUpperCase();
  $('#ratingValue').textContent = stats.rating;
  $('#levelProgressBar').style.width = `${stats.levelProgress}%`;
  $('#nextLevelText').textContent = stats.nextLevelRating
    ? `${stats.nextLevelRating - stats.rating} Elo para ${stats.nextRankName || LEVELS[currentRank.level]?.name || 'o próximo rank'}`
    : 'Diamond · rank máximo';

  $('#statMatches').textContent = stats.matches;
  $('#statWins').textContent = stats.wins;
  $('#statWinRate').textContent = `${stats.winRate}% win rate`;
  const profileKD = Number(stats.kd || 0).toFixed(2);
  $('#statKD').textContent = profileKD;
  $('#statKD').className = `profile-kd ${kdTone(profileKD)}`;
  $('#statKD').title = kdTitle(profileKD);
  $('#statKillsDeaths').textContent = `${stats.kills} / ${stats.deaths}`;
  $('#statAvgKills').textContent = Number(stats.avgKills || 0).toFixed(1);

  $('#matchesList').innerHTML = renderMatchHistoryTable(matches, profile);
  const recentMatches = [...matches].sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0)).slice(0, 10);
  if ($('#recentMatchesList')) $('#recentMatchesList').innerHTML = renderMatchHistoryTable(recentMatches, profile);

  $('#friendsList').innerHTML = friends.length
    ? friends.map(friendRow).join('')
    : '<div class="empty friends-empty">Ainda não adicionaste amigos. Os jogadores das partidas já ficam guardados abaixo.</div>';

  const known = players;
  $('#knownPlayersCount').textContent = `${known.length} ${known.length === 1 ? 'jogador' : 'jogadores'}`;
  $('#playersList').innerHTML = known.length
    ? known.map(knownPlayerRow).join('')
    : '<div class="empty">Ainda não há jogadores registados.</div>';

  $('#teamsList').innerHTML = teams.length ? teams.map(team => `
    <article class="team-card">
      <div class="team-card-main">
        ${renderTeamLogo(team.logoUrl, team.name, 'team-card-logo')}
        <div class="team-card-copy"><div class="team-card-title"><b>${esc(team.name)}</b><span class="team-tag-chip">[${esc(team.tag)}]</span></div><div class="team-card-meta"><small>${team.memberIds.length} ${team.memberIds.length === 1 ? 'jogador' : 'jogadores'}</small>${renderTeamRankBadge(team)}</div></div>
      </div>
      <div class="team-card-members">${team.members.length ? team.members.slice(0, 8).map(member => renderAvatar(member, 'team-member-avatar')).join('') : '<span class="muted tiny">Sem jogadores</span>'}</div>
      <button class="mini-btn edit-team-btn" data-team-id="${esc(team.id)}">Editar equipa</button>
    </article>`).join('') : '<div class="empty">Ainda não existem equipas registadas.</div>';

  $('#levelsList').innerHTML = levels.map(level => {
    const max = level.max == null ? '∞' : level.max;
    const label = level.name || (level.level <= 10 ? `Level ${level.level}` : `Rank ${level.level}`);
    const short = level.short || String(level.level);
    return `<div class="level-line ${level.level === stats.level ? 'current' : ''}">
      <span class="level-ring levels-list-badge level-${level.level}" title="${esc(label)}">${esc(short)}</span><span>${esc(label)}</span><span class="level-range">${level.min}–${max}</span>
    </div>`;
  }).join('');

  bindDynamicActions();
}

function scoreboardTable(title, score, team, myName, tone = 'ours', mvp = null, teamLogoUrl = null) {
  if (!team?.length) return '';
  const orderedTeam = [...team].sort((a, b) => {
    const kdDiff = kdValue(b.kills, b.deaths) - kdValue(a.kills, a.deaths);
    if (Math.abs(kdDiff) > Number.EPSILON) return kdDiff;
    return Number(b.kills || 0) - Number(a.kills || 0);
  });
  const avg = averageRating(team);
  const avgRank = rankForRating(avg || 100);
  const avgLevel = avgRank.level;

  return `<section class="team-scoreboard team-scoreboard-${tone}">
    <div class="team-scoreboard-head">
      <div class="team-scoreboard-title"><strong class="team-final-score">${Number(score)}</strong>${renderTeamLogo(teamLogoUrl, title, 'team-mark')}<b>${esc(title)}</b></div>
      <div class="team-average"><span>Team avg</span><span class="level-ring table-ring level-${avgLevel}" title="${esc(avgRank.name)}">${esc(avgRank.short)}</span><b>${avg ? avg.toLocaleString('pt-PT') : '—'}</b></div>
    </div>
    <div class="scoreboard-table modern-scoreboard">
      <table>
        <thead><tr><th>Player</th><th>Rank</th><th>Rating</th><th>K</th><th>D</th><th>K/D</th></tr></thead>
        <tbody>${orderedTeam.map(player => {
          const kills = Number(player.kills || 0);
          const deaths = Number(player.deaths || 0);
          const kd = formatKD(kills, deaths);
          const username = player.username || player.name;
          const isMe = player.isProfilePlayer || username === myName || player.name === myName;
          const rating = Number(player.rankRating || 0);
          const rank = rankForRating(rating || 100);
          const level = rank.level;
          const isMvp = playerIsMvp(player, tone, mvp);
          return `<tr class="${isMe ? 'me' : ''} ${isMvp ? 'mvp-row' : ''}">
            <td><div class="table-player"><span class="row-marker">◆</span>${renderAvatar(player, 'tiny-avatar')}<span class="player-name-with-badges">${renderDisplayUsername(player)}${player.isFriend ? ' <em class="friend-star">★</em>' : ''}${isMvp ? ' <strong class="mvp-badge"><span>★</span>MVP</strong>' : ''}</span></div></td>
            <td>${renderRankBadge(player, rating, true, 'table-ring')}</td>
            <td><b>${rating.toLocaleString('pt-PT')}</b></td>
            <td>${kills}</td><td>${deaths}</td><td><b class="kd-cell ${kdTone(kd)}" title="${esc(kdTitle(kd))}">${kd}</b></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </section>`;
}

function openDetails(id) {
  const match = dashboard.matches.find(m => m.id === id);
  if (!match) return;
  const won = match.result === 'win';
  const teamNames = getTeamNames(match);
  const ours = match.scoreboard?.ourTeam || [];
  const enemy = match.scoreboard?.opponentTeam || [];
  const oursAvg = averageRating(ours);
  const enemyAvg = averageRating(enemy);
  const oursAvgRank = rankForRating(oursAvg || 100);
  const enemyAvgRank = rankForRating(enemyAvg || 100);
  const when = formatMatchDate(match.playedAt);
  const mapClass = `map-${String(match.map || '').replace(/[^a-z0-9_-]/gi, '')}`;
  const mvp = getMatchMvp(match);
  const mvpPlayer = mvp?.player || null;
  const mvpName = mvpPlayer ? (mvpPlayer.username || mvpPlayer.name || '—') : '—';
  const mvpTeamName = mvp ? (mvp.tone === 'ours' ? teamNames.ours : teamNames.enemy) : '—';
  const mvpKills = Number(mvpPlayer?.kills || 0);
  const mvpDeaths = Number(mvpPlayer?.deaths || 0);
  const mvpRating = Number(mvpPlayer?.rankRating || 0);

  $('#detailsTitle').textContent = match.map;
  $('#detailsContent').innerHTML = `
    <section class="match-detail-hero ${mapClass}">
      <div class="detail-shade"></div>
      <div class="detail-topline">
        <div><span class="crossed">⚔</span> Matchmaking / EU / Standard Match</div>
        <div class="detail-map-date"><span>◆ ${esc(mapDisplayName(match.map))}</span><span>▣ ${esc(when.date)}</span><span>🇵🇹</span></div>
      </div>
      <div class="detail-matchup">
        <div class="detail-team-block detail-team-left">
          <div class="${won ? 'winner-label' : 'loser-label'}">${won ? 'WINNER' : 'DEFEAT'}</div>
          <div class="detail-team-line"><b>${esc(teamNames.ours)}</b>${renderTeamLogo(match.ourTeamLogoUrl, teamNames.ours, 'detail-team-avatar')}<strong class="${won ? 'score-winner' : 'score-loser'}">${Number(match.ourScore)}</strong></div>
          <div class="detail-team-meta"><span class="level-ring table-ring level-${oursAvgRank.level}" title="${esc(oursAvgRank.name)}">${esc(oursAvgRank.short)}</span><span>avg ${oursAvg || '—'}</span></div>
        </div>
        <span class="detail-vs">VS</span>
        <div class="detail-team-block detail-team-right">
          <div class="${won ? 'loser-label' : 'winner-label'}">${won ? 'DEFEAT' : 'WINNER'}</div>
          <div class="detail-team-line"><strong class="${won ? 'score-loser' : 'score-winner'}">${Number(match.opponentScore)}</strong>${renderTeamLogo(match.opponentTeamLogoUrl, teamNames.enemy, 'detail-team-avatar enemy-avatar')}<b>${esc(teamNames.enemy)}</b></div>
          <div class="detail-team-meta detail-team-meta-right"><span>avg ${enemyAvg || '—'}</span><span class="level-ring table-ring level-${enemyAvgRank.level}" title="${esc(enemyAvgRank.name)}">${esc(enemyAvgRank.short)}</span></div>
        </div>
      </div>
    </section>

    <div class="detail-summary-strip mvp-summary-strip">
      <span class="mvp-summary-heading"><small>Melhor jogador da partida</small><b><i>★</i> MVP</b></span>
      <span><small>Jogador</small><span class="detail-player-with-badge">${mvpPlayer ? renderDisplayUsername(mvpPlayer) : `<b>${esc(mvpName)}</b>`}</span></span>
      <span><small>Equipa</small><b>${esc(mvpTeamName)}</b></span>
      <span><small>K / D</small><b>${mvpKills} / ${mvpDeaths}</b></span>
      <span><small>K/D</small>${mvpPlayer ? `<b class="kd-summary ${kdTone(formatKD(mvpKills, mvpDeaths))}" title="${esc(kdTitle(formatKD(mvpKills, mvpDeaths)))}">${formatKD(mvpKills, mvpDeaths)}</b>` : '<b>—</b>'}</span>
      <span><small>Rating</small><b>${mvpRating ? mvpRating.toLocaleString('pt-PT') : '—'}</b></span>
      ${match.totalRounds ? `<span><small>Rounds</small><b>${Number(match.totalRounds)}</b></span>` : ''}
    </div>

    <div class="stacked-scoreboards">
      ${match.scoreboard ? scoreboardTable(teamNames.ours, match.ourScore, ours, dashboard.profile.nickname, 'ours', mvp, match.ourTeamLogoUrl) : ''}
      ${match.scoreboard ? scoreboardTable(teamNames.enemy, match.opponentScore, enemy, dashboard.profile.nickname, 'enemy', mvp, match.opponentTeamLogoUrl) : ''}
    </div>
    ${match.screenshot ? `<details class="original-shot"><summary>Ver screenshot original do scoreboard</summary><img class="scoreboard-img" src="${esc(match.screenshot)}" alt="Screenshot do scoreboard" /></details>` : ''}
    ${match.notes ? `<div class="info-box">${esc(match.notes)}</div>` : ''}`;
  $('#detailsModal').showModal();
}

function bindDynamicActions() {
  document.querySelectorAll('[data-match-id]').forEach(btn => btn.addEventListener('click', () => openDetails(btn.dataset.matchId)));
  document.querySelectorAll('.toggle-friend-btn').forEach(btn => btn.addEventListener('click', () => toggleFriend(btn.dataset.playerId, btn.dataset.friend === 'true')));
  document.querySelectorAll('.edit-player-btn').forEach(btn => btn.addEventListener('click', () => openPlayerEditor(btn.dataset.playerId)));
  document.querySelectorAll('.delete-player-btn').forEach(btn => btn.addEventListener('click', () => deletePlayer(btn.dataset.playerId)));
  document.querySelectorAll('.edit-team-btn').forEach(btn => btn.addEventListener('click', () => openTeamEditor(btn.dataset.teamId)));
}

async function loadDashboard() {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar os dados');
  renderDashboard(await res.json());
}

function setPhotoPreview(element, src, fallback = '?') {
  if (!element) return;
  if (src) {
    element.innerHTML = `<img src="${esc(src)}" alt="" />`;
    element.classList.add('has-photo');
  } else {
    element.textContent = fallback;
    element.classList.remove('has-photo');
  }
}

function findDashboardPlayerByName(name) {
  const key = normalizedPlayerName(name);
  return dashboard?.players?.find(player => normalizedPlayerName(player.username) === key) || null;
}

function matchPlayerPicker(index, team, { locked = false, player = null } = {}) {
  const display = player?.displayUsername || player?.username || '';
  const id = player?.id || '';
  const lockedClass = locked ? ' locked-player-picker' : '';
  return `<div class="player-picker${lockedClass}">
    <input class="player-name" type="text" maxlength="60" placeholder="Escreve para procurar…" value="${esc(display)}" ${locked ? 'readonly' : 'autocomplete="off"'} required />
    <input class="player-id" type="hidden" value="${esc(id)}" />
    ${locked ? '<span class="locked-player-chip">TU</span>' : '<div class="player-suggestions" hidden></div>'}
  </div>`;
}

function makeOurPlayerRow(index, profilePlayer) {
  const isMe = index === 0;
  return `<div class="player-entry-row our-player-grid" data-team="our" data-index="${index}">
    <span class="me-lock ${isMe ? 'active' : ''}" title="${isMe ? 'Este campo é o teu jogador e está bloqueado' : 'Jogador da tua equipa'}">${isMe ? 'EU' : '•'}</span>
    ${matchPlayerPicker(index, 'our', { locked: isMe, player: isMe ? profilePlayer : null })}
    <input class="player-kills" type="number" min="0" max="999" placeholder="0" required />
    <input class="player-deaths" type="number" min="0" max="999" placeholder="0" required />
  </div>`;
}

function makeEnemyPlayerRow(index) {
  return `<div class="player-entry-row enemy-player-grid" data-team="enemy" data-index="${index}">
    ${matchPlayerPicker(index, 'enemy')}
    <input class="player-kills" type="number" min="0" max="999" placeholder="0" required />
    <input class="player-deaths" type="number" min="0" max="999" placeholder="0" required />
  </div>`;
}

function selectedMatchPlayerIds() {
  return new Set([...document.querySelectorAll('#matchForm .player-id')].map(input => input.value).filter(Boolean));
}

function matchPlayerSearchText(player) {
  return `${player.username || ''} ${player.displayUsername || ''} ${player.teamName || ''} ${player.teamTag || ''}`.toLowerCase();
}

function renderPlayerSuggestions(picker, query) {
  const box = picker.querySelector('.player-suggestions');
  if (!box) return;
  const input = picker.querySelector('.player-name');
  const hidden = picker.querySelector('.player-id');
  const q = String(query || '').trim().toLowerCase();
  const selected = selectedMatchPlayerIds();
  if (hidden.value) selected.delete(hidden.value);
  const profileId = dashboard?.profile?.playerId;
  const candidates = (dashboard?.players || [])
    .filter(player => !player.isProfilePlayer && player.id !== profileId)
    .filter(player => !selected.has(player.id))
    .filter(player => !q || matchPlayerSearchText(player).includes(q))
    .slice(0, 7);

  if (!candidates.length) {
    box.innerHTML = '<div class="player-suggestion-empty">Nenhum jogador registado encontrado</div>';
    box.hidden = false;
    return;
  }

  box.innerHTML = candidates.map(player => `
    <button type="button" class="player-suggestion" data-player-id="${esc(player.id)}">
      ${renderAvatar(player, 'suggestion-avatar')}
      <span class="suggestion-copy"><span class="suggestion-name">${renderDisplayUsername(player)}</span><small>${player.teamName ? esc(player.teamName) : 'Sem equipa'} · ${Number(player.rating || 0)} Elo</small></span>
    </button>`).join('');
  box.hidden = false;

  box.querySelectorAll('.player-suggestion').forEach(button => button.addEventListener('click', () => {
    const player = dashboard.players.find(item => item.id === button.dataset.playerId);
    if (!player) return;
    hidden.value = player.id;
    input.value = player.displayUsername || player.username;
    input.classList.add('player-confirmed');
    box.hidden = true;
    updateAutoTeamPreviews();
  }));
}

function bindMatchPlayerPickers() {
  document.querySelectorAll('#matchForm .player-picker:not(.locked-player-picker)').forEach(picker => {
    const input = picker.querySelector('.player-name');
    const hidden = picker.querySelector('.player-id');
    input.addEventListener('input', () => {
      hidden.value = '';
      input.classList.remove('player-confirmed');
      renderPlayerSuggestions(picker, input.value);
      updateAutoTeamPreviews();
    });
    input.addEventListener('focus', () => renderPlayerSuggestions(picker, input.value));
  });
}

document.addEventListener('click', event => {
  document.querySelectorAll('.player-suggestions').forEach(box => {
    if (!box.closest('.player-picker')?.contains(event.target)) box.hidden = true;
  });
});

function renderPlayerEntryRows() {
  const profilePlayer = dashboard?.players?.find(player => player.isProfilePlayer) || {
    id: dashboard?.profile?.playerId || '',
    username: dashboard?.profile?.nickname || '',
    displayUsername: dashboard?.profile?.displayNickname || dashboard?.profile?.nickname || ''
  };
  $('#ourPlayersRows').innerHTML = Array.from({ length: 5 }, (_, i) => makeOurPlayerRow(i, profilePlayer)).join('');
  $('#enemyPlayersRows').innerHTML = Array.from({ length: 5 }, (_, i) => makeEnemyPlayerRow(i)).join('');
  bindMatchPlayerPickers();
  updateAutoTeamPreviews();
}

function collectTeamRows(selector) {
  return [...document.querySelectorAll(selector)].map(row => ({
    playerId: row.querySelector('.player-id').value,
    name: row.querySelector('.player-name').value.trim(),
    kills: Number(row.querySelector('.player-kills').value),
    deaths: Number(row.querySelector('.player-deaths').value)
  }));
}

function automaticTeamPreview(selector) {
  const rows = [...document.querySelectorAll(`${selector} .player-entry-row`)];
  const ids = rows.map(row => row.querySelector('.player-id')?.value).filter(Boolean);
  if (!ids.length) return 'Será determinado pelos 5 jogadores';
  const accounts = ids.map(id => dashboard?.players?.find(player => player.id === id)).filter(Boolean);
  if (ids.length === 5 && accounts.length === 5) {
    const teamId = accounts[0]?.teamId;
    if (teamId && accounts.every(player => player.teamId === teamId)) {
      const team = dashboard.teams.find(item => item.id === teamId);
      if (team) return team.name;
    }
    return 'Equipa anónima · team_<jogador aleatório>';
  }
  return `${ids.length}/5 jogadores confirmados`;
}

function updateAutoTeamPreviews() {
  const ours = automaticTeamPreview('#ourPlayersRows');
  const enemy = automaticTeamPreview('#enemyPlayersRows');
  if ($('#ourAutoTeamName')) $('#ourAutoTeamName').textContent = ours;
  if ($('#opponentAutoTeamName')) $('#opponentAutoTeamName').textContent = enemy;
  if ($('#ourTeamPreview')) $('#ourTeamPreview').textContent = ours.replace('Equipa anónima · ', '');
  if ($('#opponentTeamPreview')) $('#opponentTeamPreview').textContent = enemy.replace('Equipa anónima · ', '');
}

// ===== Recorte / posicionamento manual de fotos =====
const cropModal = $('#cropModal');
const cropCanvas = $('#cropCanvas');
const cropCtx = cropCanvas?.getContext('2d');
let cropState = null;

function clampCropOffsets() {
  if (!cropState) return;
  const scale = cropState.baseScale * cropState.zoom;
  const dw = cropState.image.width * scale;
  const dh = cropState.image.height * scale;
  const maxX = Math.max(0, (dw - cropCanvas.width) / 2);
  const maxY = Math.max(0, (dh - cropCanvas.height) / 2);
  cropState.offsetX = Math.max(-maxX, Math.min(maxX, cropState.offsetX));
  cropState.offsetY = Math.max(-maxY, Math.min(maxY, cropState.offsetY));
}

function drawCropPreview() {
  if (!cropState || !cropCtx) return;
  clampCropOffsets();
  const { image, baseScale, zoom, offsetX, offsetY } = cropState;
  const scale = baseScale * zoom;
  const dw = image.width * scale;
  const dh = image.height * scale;
  const x = (cropCanvas.width - dw) / 2 + offsetX;
  const y = (cropCanvas.height - dh) / 2 + offsetY;
  cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropCtx.save();
  cropCtx.beginPath();
  cropCtx.arc(cropCanvas.width / 2, cropCanvas.height / 2, cropCanvas.width / 2 - 5, 0, Math.PI * 2);
  cropCtx.clip();
  cropCtx.drawImage(image, x, y, dw, dh);
  cropCtx.restore();
  cropCtx.save();
  cropCtx.strokeStyle = 'rgba(255,255,255,.88)';
  cropCtx.lineWidth = 3;
  cropCtx.beginPath();
  cropCtx.arc(cropCanvas.width / 2, cropCanvas.height / 2, cropCanvas.width / 2 - 6, 0, Math.PI * 2);
  cropCtx.stroke();
  cropCtx.restore();
}

function croppedDataUrl() {
  if (!cropState) return '';
  const out = document.createElement('canvas');
  out.width = 256;
  out.height = 256;
  const ctx = out.getContext('2d');
  const ratio = out.width / cropCanvas.width;
  const scale = cropState.baseScale * cropState.zoom * ratio;
  const dw = cropState.image.width * scale;
  const dh = cropState.image.height * scale;
  const x = (out.width - dw) / 2 + cropState.offsetX * ratio;
  const y = (out.height - dh) / 2 + cropState.offsetY * ratio;
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(128, 128, 127, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(cropState.image, x, y, dw, dh);
  ctx.restore();
  return out.toDataURL('image/png');
}

function openCropperFromFile(file, target) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const baseScale = Math.max(cropCanvas.width / image.width, cropCanvas.height / image.height);
      cropState = { image, baseScale, zoom: 1, offsetX: 0, offsetY: 0, target, dragging: false, lastX: 0, lastY: 0 };
      $('#cropZoom').value = '1';
      drawCropPreview();
      cropModal.showModal();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

cropCanvas?.addEventListener('pointerdown', event => {
  if (!cropState) return;
  cropState.dragging = true;
  cropState.lastX = event.clientX;
  cropState.lastY = event.clientY;
  cropCanvas.setPointerCapture(event.pointerId);
});

cropCanvas?.addEventListener('pointermove', event => {
  if (!cropState?.dragging) return;
  const rect = cropCanvas.getBoundingClientRect();
  const scaleX = cropCanvas.width / Math.max(1, rect.width);
  const scaleY = cropCanvas.height / Math.max(1, rect.height);
  cropState.offsetX += (event.clientX - cropState.lastX) * scaleX;
  cropState.offsetY += (event.clientY - cropState.lastY) * scaleY;
  cropState.lastX = event.clientX;
  cropState.lastY = event.clientY;
  drawCropPreview();
});

cropCanvas?.addEventListener('pointerup', event => {
  if (!cropState) return;
  cropState.dragging = false;
  try { cropCanvas.releasePointerCapture(event.pointerId); } catch {}
});

$('#cropZoom')?.addEventListener('input', event => {
  if (!cropState) return;
  cropState.zoom = Number(event.target.value);
  drawCropPreview();
});

function closeCropper() {
  if (cropModal?.open) cropModal.close();
  cropState = null;
}

$('#closeCropModal')?.addEventListener('click', closeCropper);
$('#cancelCrop')?.addEventListener('click', closeCropper);
$('#confirmCrop')?.addEventListener('click', () => {
  if (!cropState) return;
  const data = croppedDataUrl();
  const { hiddenId, previewId, fallback } = cropState.target;
  const hidden = $(`#${hiddenId}`);
  if (hidden) hidden.value = data;
  setPhotoPreview($(`#${previewId}`), data, fallback || '?');
  if (cropState.target.removeId) $(`#${cropState.target.removeId}`).value = 'false';
  closeCropper();
});

function wirePhotoPicker(buttonId, inputId, target) {
  $(`#${buttonId}`)?.addEventListener('click', () => $(`#${inputId}`)?.click());
  $(`#${inputId}`)?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) openCropperFromFile(file, target());
    event.target.value = '';
  });
}

wirePhotoPicker('chooseProfilePhoto', 'profilePhotoInput', () => ({ hiddenId: 'profileAvatarData', previewId: 'profilePhotoPreview', removeId: 'profileRemoveAvatar', fallback: avatarInitial(dashboard?.profile?.nickname) }));
wirePhotoPicker('choosePlayerPhoto', 'playerPhotoInput', () => ({ hiddenId: 'playerAvatarData', previewId: 'playerPhotoPreview', removeId: 'playerRemoveAvatar', fallback: avatarInitial($('#playerUsernameInput').value) }));
wirePhotoPicker('chooseTeamPhoto', 'teamPhotoInput', () => ({ hiddenId: 'teamLogoData', previewId: 'teamPhotoPreview', removeId: 'teamRemoveLogo', fallback: avatarInitial($('#teamNameInput').value || 'T') }));

$('#removeProfilePhoto')?.addEventListener('click', () => {
  $('#profileAvatarData').value = '';
  $('#profileRemoveAvatar').value = 'true';
  setPhotoPreview($('#profilePhotoPreview'), null, avatarInitial(dashboard?.profile?.nickname));
});
$('#removePlayerPhoto')?.addEventListener('click', () => {
  $('#playerAvatarData').value = '';
  $('#playerRemoveAvatar').value = 'true';
  setPhotoPreview($('#playerPhotoPreview'), null, avatarInitial($('#playerUsernameInput').value));
});
$('#removeTeamPhoto')?.addEventListener('click', () => {
  $('#teamLogoData').value = '';
  $('#teamRemoveLogo').value = 'true';
  setPhotoPreview($('#teamPhotoPreview'), null, avatarInitial($('#teamNameInput').value || 'T'));
});

// ===== Perfil =====
const profileModal = $('#profileModal');
$('#openProfileModal').addEventListener('click', () => {
  $('#profileNicknameInput').value = dashboard?.profile?.nickname || '';
  $('#profileAvatarData').value = '';
  $('#profileRemoveAvatar').value = 'false';
  $('#profileTeamPrefixHint').textContent = dashboard?.profile?.teamTag ? `[${dashboard.profile.teamTag}]` : 'sem prefixo enquanto não pertenceres a uma equipa';
  setPhotoPreview($('#profilePhotoPreview'), dashboard?.profile?.avatarUrl, avatarInitial(dashboard?.profile?.nickname));
  $('#profileMessage').textContent = '';
  profileModal.showModal();
});
$('#closeProfileModal').addEventListener('click', () => profileModal.close());
$('#cancelProfileEdit').addEventListener('click', () => profileModal.close());

$('#profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  $('#profileMessage').textContent = 'A guardar…';
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: $('#profileNicknameInput').value.trim(),
        avatarData: $('#profileAvatarData').value || null,
        removeAvatar: $('#profileRemoveAvatar').value === 'true'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível alterar o perfil.');
    renderDashboard(data);
    profileModal.close();
  } catch (err) { $('#profileMessage').textContent = err.message; }
});

// ===== Jogadores =====
const playerModal = $('#playerModal');
function updatePlayerRankPreview() {
  const rating = Math.max(100, Number($('#playerRatingInput').value || 100));
  const rank = rankForRating(rating);
  $('#playerLevelPreview').textContent = rank.short;
  $('#playerLevelPreview').className = `level-ring level-${rank.level}`;
  $('#playerLevelPreview').title = rank.name;
  $('#playerRatingPreview').textContent = rating.toLocaleString('pt-PT');
  const label = $('#playerRankNamePreview');
  if (label) label.textContent = `${rank.name} · calculado automaticamente`;
}

function renderPlayerTeamOptions(player = null) {
  const select = $('#playerTeamInput');
  if (!select) return;
  const currentTeamId = player?.teamId || '';
  let options = '<option value="">Sem equipa</option>';
  const availableTeams = currentTeamId
    ? dashboard.teams.filter(team => team.id === currentTeamId)
    : dashboard.teams;
  options += availableTeams.map(team => `<option value="${esc(team.id)}">[${esc(team.tag)}] ${esc(team.name)}</option>`).join('');
  select.innerHTML = options;
  select.value = currentTeamId;
  const help = $('#playerTeamHelp');
  if (help) help.textContent = currentTeamId
    ? 'Este jogador já pertence a uma equipa. Podes mantê-la ou escolher “Sem equipa”; não pode ser transferido diretamente para outra.'
    : (dashboard.teams.length ? 'Podes associar o jogador diretamente a uma equipa existente.' : 'Ainda não existem equipas registadas.');
}

function openNewPlayerModal() {
  $('#playerForm').reset();
  $('#playerIdInput').value = '';
  $('#playerAvatarData').value = '';
  $('#playerRemoveAvatar').value = 'false';
  $('#playerModalTitle').textContent = 'Criar jogador';
  $('#savePlayerButton').textContent = 'Criar jogador';
  $('#playerRatingInput').value = dashboard?.stats?.rating || 1000;
  $('#playerFriendInput').checked = true;
  $('#playerMessage').textContent = '';
  $('#deletePlayerButton').hidden = true;
  $('#deletePlayerButton').disabled = false;
  renderPlayerTeamOptions(null);
  setPhotoPreview($('#playerPhotoPreview'), null, '?');
  updatePlayerRankPreview();
  playerModal.showModal();
}

function openPlayerEditor(id) {
  const player = dashboard.players.find(p => p.id === id);
  if (!player) return;
  if (player.isProfilePlayer) {
    $('#openProfileModal').click();
    return;
  }
  $('#playerForm').reset();
  $('#playerIdInput').value = player.id;
  $('#playerUsernameInput').value = player.username;
  $('#playerRatingInput').value = player.rating;
  $('#playerFriendInput').checked = Boolean(player.friend);
  $('#playerAvatarData').value = '';
  $('#playerRemoveAvatar').value = 'false';
  $('#playerModalTitle').textContent = 'Editar jogador';
  $('#savePlayerButton').textContent = 'Guardar alterações';
  $('#playerMessage').textContent = '';
  renderPlayerTeamOptions(player);
  const deleteButton = $('#deletePlayerButton');
  deleteButton.hidden = false;
  deleteButton.disabled = !player.canDelete;
  deleteButton.title = player.canDelete ? 'Eliminar este jogador da base de dados' : `Não pode ser eliminado porque aparece em ${Number(player.matchCount || 0)} partida(s).`;
  setPhotoPreview($('#playerPhotoPreview'), player.avatarUrl, avatarInitial(player.username));
  updatePlayerRankPreview();
  playerModal.showModal();
}

$('#openPlayerModal').addEventListener('click', openNewPlayerModal);
$('#openPlayerModalPlayers')?.addEventListener('click', openNewPlayerModal);
$('#openPlayerModalFriends').addEventListener('click', openNewPlayerModal);
$('#closePlayerModal').addEventListener('click', () => playerModal.close());
$('#cancelPlayerEdit').addEventListener('click', () => playerModal.close());
$('#playerRatingInput').addEventListener('input', updatePlayerRankPreview);
$('#playerUsernameInput').addEventListener('input', () => {
  if (!$('#playerPhotoPreview').classList.contains('has-photo')) $('#playerPhotoPreview').textContent = avatarInitial($('#playerUsernameInput').value);
});

$('#playerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#playerIdInput').value;
  const payload = {
    username: $('#playerUsernameInput').value.trim(),
    rating: Number($('#playerRatingInput').value),
    friend: $('#playerFriendInput').checked,
    teamId: $('#playerTeamInput').value || null,
    avatarData: $('#playerAvatarData').value || null,
    removeAvatar: $('#playerRemoveAvatar').value === 'true'
  };
  $('#playerMessage').textContent = 'A guardar…';
  try {
    const res = await fetch(id ? `/api/players/${encodeURIComponent(id)}` : '/api/players', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível guardar o jogador.');
    renderDashboard(data.dashboard);
    playerModal.close();
  } catch (err) { $('#playerMessage').textContent = err.message; }
});

async function deletePlayer(id) {
  const player = dashboard?.players?.find(item => item.id === id);
  if (!player || player.isProfilePlayer) return;
  if (!player.canDelete) {
    alert(`Este jogador aparece em ${Number(player.matchCount || 0)} partida(s) registada(s) e não pode ser eliminado.`);
    return;
  }
  if (!confirm(`Eliminar ${player.displayUsername || player.username} da base de dados?`)) return;
  try {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível eliminar o jogador.');
    renderDashboard(data.dashboard);
    if (playerModal.open) playerModal.close();
  } catch (err) { alert(err.message); }
}

$('#deletePlayerButton')?.addEventListener('click', () => deletePlayer($('#playerIdInput').value));

async function toggleFriend(id, friend) {
  try {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}/friend`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friend })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível alterar os amigos.');
    renderDashboard(data.dashboard);
  } catch (err) { alert(err.message); }
}

// ===== Equipas =====
const teamModal = $('#teamModal');

function renderTeamMemberPicker(teamId = '') {
  const currentTeam = teamId ? dashboard.teams.find(team => team.id === teamId) : null;
  const selected = new Set(currentTeam?.memberIds || []);
  const players = [...dashboard.players]
    .filter(player => !player.teamId || player.teamId === teamId)
    .sort((a, b) => {
      if (a.isProfilePlayer !== b.isProfilePlayer) return a.isProfilePlayer ? -1 : 1;
      return a.username.localeCompare(b.username, 'pt');
    });

  $('#teamMembersList').innerHTML = players.length ? players.map(player => `
    <label class="team-member-option ${selected.has(player.id) ? 'selected' : ''}">
      <input type="checkbox" value="${esc(player.id)}" ${selected.has(player.id) ? 'checked' : ''} />
      ${renderAvatar(player, 'team-member-picker-avatar')}
      <span class="team-member-picker-copy"><b>${renderDisplayUsername(player)}</b><small>${player.isProfilePlayer ? 'O teu perfil' : `${player.rating} Elo`}</small></span>
    </label>`).join('') : '<div class="empty compact-empty">Não existem jogadores livres para associar a esta equipa.</div>';
}

function renderTeamRankPicker(selectedId = 0) {
  const selected = teamRankById(selectedId).id;
  $('#teamRankInput').value = String(selected);
  $('#teamRankPicker').innerHTML = TEAM_RANKS.map(rank => `
    <button type="button" class="team-rank-option ${rank.id === selected ? 'selected' : ''}" data-team-rank-id="${rank.id}" title="${esc(rank.name)}">
      <img src="${esc(rank.iconUrl)}" alt="${esc(rank.name)}" />
      <span>${esc(rank.name)}</span>
    </button>`).join('');
}

function openNewTeamModal() {
  $('#teamForm').reset();
  $('#teamIdInput').value = '';
  $('#teamLogoData').value = '';
  $('#teamRemoveLogo').value = 'false';
  $('#teamModalTitle').textContent = 'Criar equipa';
  $('#saveTeamButton').textContent = 'Criar equipa';
  $('#deleteTeamButton').hidden = true;
  $('#teamMessage').textContent = '';
  setPhotoPreview($('#teamPhotoPreview'), null, 'T');
  renderTeamRankPicker(0);
  renderTeamMemberPicker('');
  teamModal.showModal();
}

function openTeamEditor(id) {
  const team = dashboard.teams.find(item => item.id === id);
  if (!team) return;
  $('#teamForm').reset();
  $('#teamIdInput').value = team.id;
  $('#teamNameInput').value = team.name;
  $('#teamTagInput').value = team.tag;
  $('#teamLogoData').value = '';
  $('#teamRemoveLogo').value = 'false';
  $('#teamModalTitle').textContent = 'Editar equipa';
  $('#saveTeamButton').textContent = 'Guardar equipa';
  $('#deleteTeamButton').hidden = false;
  $('#teamMessage').textContent = '';
  setPhotoPreview($('#teamPhotoPreview'), team.logoUrl, avatarInitial(team.name));
  renderTeamRankPicker(team.rankId || 0);
  renderTeamMemberPicker(team.id);
  teamModal.showModal();
}

$('#openTeamModal')?.addEventListener('click', openNewTeamModal);
$('#openTeamModalSection')?.addEventListener('click', openNewTeamModal);
$('#closeTeamModal')?.addEventListener('click', () => teamModal.close());
$('#cancelTeamEdit')?.addEventListener('click', () => teamModal.close());
$('#teamNameInput')?.addEventListener('input', () => {
  if (!$('#teamPhotoPreview').classList.contains('has-photo')) $('#teamPhotoPreview').textContent = avatarInitial($('#teamNameInput').value || 'T');
});
$('#teamTagInput')?.addEventListener('input', event => { event.target.value = event.target.value.replace(/[\[\]\s]/g, '').toUpperCase(); });
$('#teamMembersList')?.addEventListener('change', event => event.target.closest('.team-member-option')?.classList.toggle('selected', event.target.checked));
$('#teamRankPicker')?.addEventListener('click', event => {
  const option = event.target.closest('.team-rank-option');
  if (!option) return;
  $('#teamRankInput').value = String(Number(option.dataset.teamRankId || 0));
  document.querySelectorAll('#teamRankPicker .team-rank-option').forEach(button => button.classList.toggle('selected', button === option));
});

$('#teamForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#teamIdInput').value;
  const memberIds = [...document.querySelectorAll('#teamMembersList input[type="checkbox"]:checked')].map(input => input.value);
  const payload = {
    name: $('#teamNameInput').value.trim(),
    tag: $('#teamTagInput').value.trim(),
    rankId: Number($('#teamRankInput').value || 0),
    memberIds,
    logoData: $('#teamLogoData').value || null,
    removeLogo: $('#teamRemoveLogo').value === 'true'
  };
  $('#teamMessage').textContent = 'A guardar…';
  try {
    const res = await fetch(id ? `/api/teams/${encodeURIComponent(id)}` : '/api/teams', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível guardar a equipa.');
    renderDashboard(data.dashboard);
    teamModal.close();
  } catch (err) { $('#teamMessage').textContent = err.message; }
});

$('#deleteTeamButton')?.addEventListener('click', async () => {
  const id = $('#teamIdInput').value;
  if (!id || !confirm('Eliminar esta equipa? Os jogadores deixam de ter o prefixo, mas as partidas continuam guardadas.')) return;
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível eliminar a equipa.');
    renderDashboard(data.dashboard);
    teamModal.close();
  } catch (err) { $('#teamMessage').textContent = err.message; }
});

// ===== Partidas =====
const matchModal = $('#matchModal');
$('#openMatchModal').addEventListener('click', () => {
  $('#matchForm').reset();
  renderPlayerEntryRows();
  $('#formMessage').textContent = '';
  matchModal.showModal();
});
$('#closeMatchModal').addEventListener('click', () => matchModal.close());
$('#cancelMatch').addEventListener('click', () => matchModal.close());
$('#closeDetailsModal').addEventListener('click', () => $('#detailsModal').close());
$('#matchForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const ourTeam = collectTeamRows('#ourPlayersRows .player-entry-row');
  const opponentTeam = collectTeamRows('#enemyPlayersRows .player-entry-row');
  const allPlayers = [...ourTeam, ...opponentTeam];
  const missingSelection = allPlayers.find(player => !player.playerId);
  if (missingSelection) {
    $('#formMessage').textContent = `Seleciona "${missingSelection.name || 'o jogador'}" a partir das sugestões da base de dados.`;
    return;
  }
  const ids = allPlayers.map(player => player.playerId);
  if (new Set(ids).size !== 10) {
    $('#formMessage').textContent = 'Cada um dos 10 lugares tem de ter um jogador diferente.';
    return;
  }

  const payload = {
    map: form.elements.map.value,
    ourScore: Number(form.elements.ourScore.value),
    opponentScore: Number(form.elements.opponentScore.value),
    profilePlayerIndex: 0,
    ourTeam,
    opponentTeam,
    notes: form.elements.notes.value.trim()
  };

  $('#formMessage').textContent = 'A guardar…';
  try {
    const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
    renderDashboard(data.dashboard);
    matchModal.close();
  } catch (err) { $('#formMessage').textContent = err.message; }
});

$('#openFullMatchHistory')?.addEventListener('click', () => activateView('matches', true));

initViewNavigation();

loadDashboard().catch(err => {
  $('#matchesList').innerHTML = `<div class="empty">${esc(err.message)}. Confirma se iniciaste o server.js.</div>`;
});
