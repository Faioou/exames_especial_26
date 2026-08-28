let dashboard = null;

const $ = (sel) => document.querySelector(sel);
const esc = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));

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

function levelForRating(rating) {
  const value = Math.max(0, Number(rating || 0));
  return (LEVELS.find(item => value >= item.min && value <= item.max) || LEVELS[9]).level;
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

function getTeamNames(match) {
  return { ours: match.ourTeamName || 'ZYQX', enemy: match.opponentTeamName || 'ENEMY' };
}

function avatarInitial(username) {
  const cleaned = String(username || '').replace(/^\[[^\]]+\]\s*/, '').trim() || String(username || '');
  return (cleaned.match(/[A-Za-z0-9À-ÿ]/)?.[0] || '?').toUpperCase();
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
  return team.map(player => `
    <span class="mini-level level-${Number(player.rankLevel || 1)}" title="${esc(player.username || player.name)} · Nível ${Number(player.rankLevel || 1)} · ${Number(player.rankRating || 0)} rating">
      ${Number(player.rankLevel || 1)}
    </span>`).join('');
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
  const historicalLevel = levelForRating(historicalRating);
  const change = Number(match.ratingChange || 0);

  return `
    <button class="history-row ${won ? 'history-win' : 'history-loss'}" data-match-id="${esc(match.id)}" type="button" aria-label="Abrir ${esc(match.map)} ${Number(match.ourScore)} a ${Number(match.opponentScore)}">
      <span class="history-result-bar"></span>
      <span class="history-date"><b>${esc(when.date)}</b><small>${esc(when.time)}</small></span>
      <span class="history-score"><span class="history-outcome ${won ? 'win' : 'loss'}">${won ? 'W' : 'L'}</span><b class="${won ? 'win-text' : 'loss-text'}">${Number(match.ourScore)}</b><span>:</span><b>${Number(match.opponentScore)}</b></span>
      <span class="history-rating"><span class="level-ring history-level level-${historicalLevel}">${historicalLevel}</span><b>${historicalRating.toLocaleString('pt-PT')}</b><small class="${change >= 0 ? 'pos' : 'neg'}">${change > 0 ? '↗ +' : change < 0 ? '↘ ' : ''}${change}</small></span>
      <span class="history-frags"><b>${Number(match.playerStats?.kills || 0)} / ${Number(match.playerStats?.deaths || 0)}</b><small>K / D</small></span>
      <span class="history-kd"><b class="kd-pill ${Number(matchKD) >= 1 ? 'good' : 'bad'}">${matchKD}</b></span>
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
  return `
    <div class="player-rank-row">
      <div class="rank-player-cell"><div class="small-avatar">${esc(avatarInitial(player.username))}</div><div><b>${esc(player.username)}</b><span>${player.friend ? 'Amigo' : 'Jogador'}</span></div></div>
      <div class="rank-cell"><span class="level-ring level-${player.level}">${player.level}</span><strong>${player.rating.toLocaleString('pt-PT')}</strong></div>
      <div class="rank-actions"><button class="mini-btn edit-player-btn" data-player-id="${esc(player.id)}">Editar</button><button class="mini-btn danger toggle-friend-btn" data-player-id="${esc(player.id)}" data-friend="false">Remover</button></div>
    </div>`;
}

function knownPlayerRow(player) {
  return `
    <div class="known-player-row">
      <div class="known-name"><span class="small-avatar">${esc(avatarInitial(player.username))}</span><div><b>${esc(player.username)}</b><span>${player.friend ? '★ amigo' : 'conta local'}</span></div></div>
      <div class="known-rank"><span class="level-ring compact-ring level-${player.level}">${player.level}</span><b>${player.rating}</b></div>
      <div class="known-actions"><button class="mini-btn toggle-friend-btn" data-player-id="${esc(player.id)}" data-friend="${player.friend ? 'false' : 'true'}">${player.friend ? 'Remover amigo' : 'Adicionar amigo'}</button><button class="mini-btn edit-player-btn" data-player-id="${esc(player.id)}">Editar rank</button></div>
    </div>`;
}

function renderDashboard(data) {
  dashboard = data;
  const { profile, stats, matches, levels, friends, players } = data;

  $('#nickname').textContent = profile.nickname;
  $('#avatarInitial').textContent = avatarInitial(profile.nickname);
  $('#matchCountMeta').textContent = `${stats.matches} ${stats.matches === 1 ? 'partida' : 'partidas'}`;
  $('#levelNumber').textContent = stats.level;
  $('#ratingValue').textContent = stats.rating;
  $('#levelProgressBar').style.width = `${stats.levelProgress}%`;
  $('#nextLevelText').textContent = stats.nextLevelRating
    ? `${stats.nextLevelRating - stats.rating} pontos para o nível ${stats.level + 1}`
    : 'Nível máximo alcançado';

  $('#statMatches').textContent = stats.matches;
  $('#statWins').textContent = stats.wins;
  $('#statWinRate').textContent = `${stats.winRate}% win rate`;
  $('#statKD').textContent = Number(stats.kd || 0).toFixed(2);
  $('#statKillsDeaths').textContent = `${stats.kills} / ${stats.deaths}`;
  $('#statAvgKills').textContent = Number(stats.avgKills || 0).toFixed(1);

  $('#matchesList').innerHTML = renderMatchHistoryTable(matches, profile);

  $('#friendsList').innerHTML = friends.length
    ? friends.map(friendRow).join('')
    : '<div class="empty friends-empty">Ainda não adicionaste amigos. Os jogadores das partidas já ficam guardados abaixo.</div>';

  const known = players.filter(player => !player.isProfilePlayer);
  $('#knownPlayersCount').textContent = `${known.length} ${known.length === 1 ? 'jogador' : 'jogadores'}`;
  $('#playersList').innerHTML = known.length
    ? known.map(knownPlayerRow).join('')
    : '<div class="empty">Ainda não há outros jogadores registados.</div>';

  $('#levelsList').innerHTML = levels.map(level => {
    const max = level.max == null ? '∞' : level.max;
    return `<div class="level-line ${level.level === stats.level ? 'current' : ''}">
      <span class="level-mini">${level.level}</span><span>Nível ${level.level}</span><span class="level-range">${level.min}–${max}</span>
    </div>`;
  }).join('');

  bindDynamicActions();
}

function scoreboardTable(title, score, team, myName, tone = 'ours', mvp = null) {
  if (!team?.length) return '';
  const orderedTeam = [...team].sort((a, b) => {
    const kdDiff = kdValue(b.kills, b.deaths) - kdValue(a.kills, a.deaths);
    if (Math.abs(kdDiff) > Number.EPSILON) return kdDiff;
    return Number(b.kills || 0) - Number(a.kills || 0);
  });
  const avg = averageRating(team);
  const avgLevel = levelForRating(avg || 0);

  return `<section class="team-scoreboard team-scoreboard-${tone}">
    <div class="team-scoreboard-head">
      <div class="team-scoreboard-title"><strong class="team-final-score">${Number(score)}</strong><span class="team-mark">${esc((title || '?').charAt(0).toUpperCase())}</span><b>${esc(title)}</b></div>
      <div class="team-average"><span>Team avg</span><span class="level-ring table-ring level-${avgLevel}">${avgLevel}</span><b>${avg ? avg.toLocaleString('pt-PT') : '—'}</b></div>
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
          const level = Number(player.rankLevel || 1);
          const rating = Number(player.rankRating || 0);
          const isMvp = playerIsMvp(player, tone, mvp);
          return `<tr class="${isMe ? 'me' : ''} ${isMvp ? 'mvp-row' : ''}">
            <td><div class="table-player"><span class="row-marker">◆</span><span class="tiny-avatar">${esc(avatarInitial(username))}</span><span class="player-name-with-badges"><b>${esc(username)}</b>${player.isFriend ? ' <em class="friend-star">★</em>' : ''}${isMvp ? ' <strong class="mvp-badge"><span>★</span>MVP</strong>' : ''}</span></div></td>
            <td><span class="level-ring table-ring level-${level}">${level}</span></td>
            <td><b>${rating.toLocaleString('pt-PT')}</b></td>
            <td>${kills}</td><td>${deaths}</td><td><b class="kd-cell ${Number(kd) >= 1 ? 'good' : 'bad'}">${kd}</b></td>
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
          <div class="detail-team-line"><b>${esc(teamNames.ours)}</b><span class="detail-team-avatar">${esc((teamNames.ours || '?').charAt(0).toUpperCase())}</span><strong class="${won ? 'score-winner' : 'score-loser'}">${Number(match.ourScore)}</strong></div>
          <div class="detail-team-meta"><span class="level-ring table-ring level-${levelForRating(oursAvg)}">${levelForRating(oursAvg)}</span><span>avg ${oursAvg || '—'}</span></div>
        </div>
        <span class="detail-vs">VS</span>
        <div class="detail-team-block detail-team-right">
          <div class="${won ? 'loser-label' : 'winner-label'}">${won ? 'DEFEAT' : 'WINNER'}</div>
          <div class="detail-team-line"><strong class="${won ? 'score-loser' : 'score-winner'}">${Number(match.opponentScore)}</strong><span class="detail-team-avatar enemy-avatar">${esc((teamNames.enemy || '?').charAt(0).toUpperCase())}</span><b>${esc(teamNames.enemy)}</b></div>
          <div class="detail-team-meta detail-team-meta-right"><span>avg ${enemyAvg || '—'}</span><span class="level-ring table-ring level-${levelForRating(enemyAvg)}">${levelForRating(enemyAvg)}</span></div>
        </div>
      </div>
    </section>

    <div class="detail-summary-strip mvp-summary-strip">
      <span class="mvp-summary-heading"><small>Melhor jogador da partida</small><b><i>★</i> MVP</b></span>
      <span><small>Jogador</small><b>${esc(mvpName)}</b></span>
      <span><small>Equipa</small><b>${esc(mvpTeamName)}</b></span>
      <span><small>K / D</small><b>${mvpKills} / ${mvpDeaths}</b></span>
      <span><small>K/D</small><b>${mvpPlayer ? formatKD(mvpKills, mvpDeaths) : '—'}</b></span>
      <span><small>Rating</small><b>${mvpRating ? mvpRating.toLocaleString('pt-PT') : '—'}</b></span>
      ${match.totalRounds ? `<span><small>Rounds</small><b>${Number(match.totalRounds)}</b></span>` : ''}
    </div>

    <div class="stacked-scoreboards">
      ${match.scoreboard ? scoreboardTable(teamNames.ours, match.ourScore, ours, dashboard.profile.nickname, 'ours', mvp) : ''}
      ${match.scoreboard ? scoreboardTable(teamNames.enemy, match.opponentScore, enemy, dashboard.profile.nickname, 'enemy', mvp) : ''}
    </div>
    ${match.screenshot ? `<details class="original-shot"><summary>Ver screenshot original do scoreboard</summary><img class="scoreboard-img" src="${esc(match.screenshot)}" alt="Screenshot do scoreboard" /></details>` : ''}
    ${match.notes ? `<div class="info-box">${esc(match.notes)}</div>` : ''}`;
  $('#detailsModal').showModal();
}

function bindDynamicActions() {
  document.querySelectorAll('[data-match-id]').forEach(btn => btn.addEventListener('click', () => openDetails(btn.dataset.matchId)));
  document.querySelectorAll('.toggle-friend-btn').forEach(btn => btn.addEventListener('click', () => toggleFriend(btn.dataset.playerId, btn.dataset.friend === 'true')));
  document.querySelectorAll('.edit-player-btn').forEach(btn => btn.addEventListener('click', () => openPlayerEditor(btn.dataset.playerId)));
}

async function loadDashboard() {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar os dados');
  renderDashboard(await res.json());
}

function makeOurPlayerRow(index, nickname) {
  return `<div class="player-entry-row our-player-grid" data-team="our" data-index="${index}">
    <label class="me-radio" title="Este sou eu"><input type="radio" name="profilePlayerIndex" value="${index}" ${index === 0 ? 'checked' : ''} /><span></span></label>
    <input class="player-name" type="text" maxlength="48" placeholder="Nickname" value="${index === 0 ? esc(nickname) : ''}" required />
    <input class="player-kills" type="number" min="0" max="999" placeholder="0" required />
    <input class="player-deaths" type="number" min="0" max="999" placeholder="0" required />
  </div>`;
}

function makeEnemyPlayerRow(index) {
  return `<div class="player-entry-row enemy-player-grid" data-team="enemy" data-index="${index}">
    <input class="player-name" type="text" maxlength="48" placeholder="Nickname" required />
    <input class="player-kills" type="number" min="0" max="999" placeholder="0" required />
    <input class="player-deaths" type="number" min="0" max="999" placeholder="0" required />
  </div>`;
}

function renderPlayerEntryRows() {
  const nickname = dashboard?.profile?.nickname || '';
  $('#ourPlayersRows').innerHTML = Array.from({ length: 5 }, (_, i) => makeOurPlayerRow(i, nickname)).join('');
  $('#enemyPlayersRows').innerHTML = Array.from({ length: 5 }, (_, i) => makeEnemyPlayerRow(i)).join('');
}

function collectTeamRows(selector) {
  return [...document.querySelectorAll(selector)].map(row => ({
    name: row.querySelector('.player-name').value.trim(),
    kills: Number(row.querySelector('.player-kills').value),
    deaths: Number(row.querySelector('.player-deaths').value)
  }));
}

const profileModal = $('#profileModal');
$('#openProfileModal').addEventListener('click', () => {
  $('#profileNicknameInput').value = dashboard?.profile?.nickname || '';
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
      body: JSON.stringify({ nickname: $('#profileNicknameInput').value.trim() })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível alterar o nome.');
    renderDashboard(data);
    profileModal.close();
  } catch (err) { $('#profileMessage').textContent = err.message; }
});

const playerModal = $('#playerModal');
function updatePlayerRankPreview() {
  const rating = Math.max(0, Number($('#playerRatingInput').value || 0));
  const level = levelForRating(rating);
  $('#playerLevelPreview').textContent = level;
  $('#playerLevelPreview').className = `level-ring level-${level}`;
  $('#playerRatingPreview').textContent = rating.toLocaleString('pt-PT');
}

function openNewPlayerModal() {
  $('#playerForm').reset();
  $('#playerIdInput').value = '';
  $('#playerModalTitle').textContent = 'Criar jogador';
  $('#savePlayerButton').textContent = 'Criar jogador';
  $('#playerRatingInput').value = dashboard?.stats?.rating || 1000;
  $('#playerFriendInput').checked = true;
  $('#playerMessage').textContent = '';
  updatePlayerRankPreview();
  playerModal.showModal();
}

function openPlayerEditor(id) {
  const player = dashboard.players.find(p => p.id === id);
  if (!player || player.isProfilePlayer) return;
  $('#playerIdInput').value = player.id;
  $('#playerUsernameInput').value = player.username;
  $('#playerRatingInput').value = player.rating;
  $('#playerFriendInput').checked = Boolean(player.friend);
  $('#playerModalTitle').textContent = 'Editar jogador';
  $('#savePlayerButton').textContent = 'Guardar alterações';
  $('#playerMessage').textContent = '';
  updatePlayerRankPreview();
  playerModal.showModal();
}

$('#openPlayerModal').addEventListener('click', openNewPlayerModal);
$('#openPlayerModalFriends').addEventListener('click', openNewPlayerModal);
$('#closePlayerModal').addEventListener('click', () => playerModal.close());
$('#cancelPlayerEdit').addEventListener('click', () => playerModal.close());
$('#playerRatingInput').addEventListener('input', updatePlayerRankPreview);

$('#playerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#playerIdInput').value;
  const payload = {
    username: $('#playerUsernameInput').value.trim(),
    rating: Number($('#playerRatingInput').value),
    friend: $('#playerFriendInput').checked
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

const matchModal = $('#matchModal');
$('#openMatchModal').addEventListener('click', () => {
  $('#matchForm').reset();
  renderPlayerEntryRows();
  $('#ourTeamName').value = 'ZYQX';
  $('#opponentTeamName').value = 'ENEMY';
  $('#ourTeamPreview').textContent = 'ZYQX';
  $('#opponentTeamPreview').textContent = 'ENEMY';
  $('#formMessage').textContent = '';
  matchModal.showModal();
});
$('#closeMatchModal').addEventListener('click', () => matchModal.close());
$('#cancelMatch').addEventListener('click', () => matchModal.close());
$('#closeDetailsModal').addEventListener('click', () => $('#detailsModal').close());
$('#ourTeamName').addEventListener('input', event => { $('#ourTeamPreview').textContent = event.target.value.trim() || 'ZYQX'; });
$('#opponentTeamName').addEventListener('input', event => { $('#opponentTeamPreview').textContent = event.target.value.trim() || 'ENEMY'; });

$('#matchForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const selectedMe = form.querySelector('input[name="profilePlayerIndex"]:checked');
  if (!selectedMe) { $('#formMessage').textContent = 'Assinala qual dos 5 jogadores da tua equipa és tu.'; return; }

  const payload = {
    map: form.elements.map.value,
    ourTeamName: form.elements.ourTeamName.value.trim(),
    opponentTeamName: form.elements.opponentTeamName.value.trim(),
    ourScore: Number(form.elements.ourScore.value),
    opponentScore: Number(form.elements.opponentScore.value),
    profilePlayerIndex: Number(selectedMe.value),
    ourTeam: collectTeamRows('#ourPlayersRows .player-entry-row'),
    opponentTeam: collectTeamRows('#enemyPlayersRows .player-entry-row'),
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

loadDashboard().catch(err => {
  $('#matchesList').innerHTML = `<div class="empty">${esc(err.message)}. Confirma se iniciaste o server.js.</div>`;
});
