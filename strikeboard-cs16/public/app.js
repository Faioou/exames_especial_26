let dashboard = null;

const $ = (sel) => document.querySelector(sel);
const esc = (value='') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch { return value; }
}

function renderDashboard(data) {
  dashboard = data;
  const { profile, stats, matches, levels } = data;
  $('#nickname').textContent = profile.nickname;
  const visibleName = profile.nickname.replace(/^\[[^\]]+\]\s*/, '').trim() || profile.nickname;
  $('#avatarInitial').textContent = (visibleName.match(/[A-Za-z0-9À-ÿ]/)?.[0] || '?').toUpperCase();
  $('#matchCountMeta').textContent = `${stats.matches} ${stats.matches === 1 ? 'partida' : 'partidas'}`;
  $('#levelNumber').textContent = stats.level;
  $('#ratingValue').textContent = stats.rating;
  $('#levelProgressBar').style.width = `${stats.levelProgress}%`;
  $('#nextLevelText').textContent = stats.nextLevelRating ? `${stats.nextLevelRating - stats.rating} pontos para o nível ${stats.level + 1}` : 'Nível máximo alcançado';

  $('#statMatches').textContent = stats.matches;
  $('#statWins').textContent = stats.wins;
  $('#statWinRate').textContent = `${stats.winRate}% win rate`;
  $('#statKD').textContent = stats.kd.toFixed(2);
  $('#statKillsDeaths').textContent = `${stats.kills} / ${stats.deaths}`;
  $('#statAvgKills').textContent = stats.avgKills.toFixed(1);

  $('#matchesList').innerHTML = matches.length ? matches.map(match => {
    const won = match.result === 'win';
    return `
      <article class="match-row">
        <div class="map-thumb">
          ${match.screenshot ? `<img src="${esc(match.screenshot)}" alt="Scoreboard de ${esc(match.map)}" />` : ''}
          <span>${esc(match.map)}</span>
        </div>
        <div>
          <div class="match-title"><span>${esc(match.map)}</span><span class="result-tag ${match.result}">${won ? 'VITÓRIA' : 'DERROTA'}</span></div>
          <div class="match-sub"><span class="history-player">${esc(match.playerName || profile.nickname)}</span> · ${formatDate(match.playedAt)} · ${match.playerStats.kills} K / ${match.playerStats.deaths} D · rating ${match.ratingAfter}</div>
        </div>
        <div class="score"><span class="${won ? 'ours-win' : 'ours-loss'}">${match.ourScore}</span><span class="score-sep">:</span>${match.opponentScore}</div>
        <div>
          <div class="rating-change ${match.ratingChange >= 0 ? 'pos' : 'neg'}">${match.ratingChange > 0 ? '+' : ''}${match.ratingChange}</div>
          <div class="match-actions"><button class="details-btn" data-match-id="${esc(match.id)}">Detalhes</button></div>
        </div>
      </article>`;
  }).join('') : '<div class="empty">Ainda não existem partidas.</div>';

  $('#levelsList').innerHTML = levels.map(level => {
    const max = level.max == null ? '∞' : level.max;
    return `<div class="level-line ${level.level === stats.level ? 'current' : ''}">
      <span class="level-mini">${level.level}</span>
      <span>Nível ${level.level}</span>
      <span class="level-range">${level.min}–${max}</span>
    </div>`;
  }).join('');

  document.querySelectorAll('[data-match-id]').forEach(btn => btn.addEventListener('click', () => openDetails(btn.dataset.matchId)));
}

function scoreboardTable(title, team, myName) {
  if (!team?.length) return '';
  return `<div class="scoreboard-table"><h3>${esc(title)}</h3><table><thead><tr><th>Jogador</th><th>K</th><th>D</th><th>K/D</th></tr></thead><tbody>${team.map(p => {
    const kd = p.deaths ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2);
    return `<tr class="${p.isProfilePlayer || p.name === myName ? 'me' : ''}"><td>${esc(p.name)}</td><td>${p.kills}</td><td>${p.deaths}</td><td>${kd}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function openDetails(id) {
  const match = dashboard.matches.find(m => m.id === id);
  if (!match) return;
  const won = match.result === 'win';
  $('#detailsTitle').textContent = match.map;
  $('#detailsContent').innerHTML = `
    <div class="details-hero">
      <div>
        <div class="result-tag ${match.result}" style="display:inline-block">${won ? 'VITÓRIA' : 'DERROTA'}</div>
        <div class="details-kpis"><span><strong>${formatDate(match.playedAt)}</strong></span><span>${esc(match.side || '')}</span><span>Rating <strong>${match.ratingBefore} → ${match.ratingAfter}</strong></span></div>
      </div>
      <div class="details-score ${match.result}">${match.ourScore} : ${match.opponentScore}</div>
    </div>
    <div class="details-kpis" style="margin:14px 2px 0"><span>Jogador <strong>${esc(match.playerName || dashboard.profile.nickname)}</strong></span><span>Kills <strong>${match.playerStats.kills}</strong></span><span>Deaths <strong>${match.playerStats.deaths}</strong></span><span>K/D <strong>${match.playerStats.deaths ? (match.playerStats.kills / match.playerStats.deaths).toFixed(2) : match.playerStats.kills.toFixed(2)}</strong></span><span>Rating <strong>${match.ratingChange > 0 ? '+' : ''}${match.ratingChange}</strong></span></div>
    ${match.screenshot ? `<img class="scoreboard-img" src="${esc(match.screenshot)}" alt="Screenshot do scoreboard da partida" />` : ''}
    ${match.scoreboard ? `<div class="scoreboards">${scoreboardTable('A tua equipa', match.scoreboard.ourTeam, dashboard.profile.nickname)}${scoreboardTable('Adversários', match.scoreboard.opponentTeam, dashboard.profile.nickname)}</div>` : ''}
    ${match.notes ? `<div class="info-box">${esc(match.notes)}</div>` : ''}
  `;
  $('#detailsModal').showModal();
}

async function loadDashboard() {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar os dados');
  renderDashboard(await res.json());
}

const profileModal = $('#profileModal');
$('#openProfileModal').addEventListener('click', () => {
  $('#profileNicknameInput').value = dashboard?.profile?.nickname || '';
  $('#profileMessage').textContent = '';
  profileModal.showModal();
  setTimeout(() => $('#profileNicknameInput').focus(), 0);
});
$('#closeProfileModal').addEventListener('click', () => profileModal.close());
$('#cancelProfileEdit').addEventListener('click', () => profileModal.close());

$('#profileForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const nickname = $('#profileNicknameInput').value.trim();
  $('#profileMessage').textContent = 'A guardar…';
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível alterar o nome.');
    renderDashboard(data);
    $('#profileMessage').textContent = '';
    profileModal.close();
  } catch (err) {
    $('#profileMessage').textContent = err.message;
  }
});

const modal = $('#matchModal');
$('#openMatchModal').addEventListener('click', () => modal.showModal());
$('#closeMatchModal').addEventListener('click', () => modal.close());
$('#cancelMatch').addEventListener('click', () => modal.close());
$('#closeDetailsModal').addEventListener('click', () => $('#detailsModal').close());

$('#matchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  $('#formMessage').textContent = 'A guardar…';
  try {
    const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
    form.reset();
    $('#formMessage').textContent = '';
    modal.close();
    await loadDashboard();
  } catch (err) {
    $('#formMessage').textContent = err.message;
  }
});

loadDashboard().catch(err => {
  $('#matchesList').innerHTML = `<div class="empty">${esc(err.message)}. Confirme se iniciou o server.js.</div>`;
});
