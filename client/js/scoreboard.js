const SCOREBOARD_TITLE = 'SCOREBOARD';
let container;

function ensureContainer() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'scoreboard';
  container.innerHTML = `<h4>${SCOREBOARD_TITLE}</h4><div id="scoreboard-rows"></div>`;
  document.body.appendChild(container);
}

export function renderScoreboard(state) {
  ensureContainer();
  const rows = container.querySelector('#scoreboard-rows');

  if (!state || !state.players) {
    rows.innerHTML = '';
    return;
  }

  const players = [...state.players].sort((a, b) => b.level - a.level);

  rows.innerHTML = players
    .map(
      (player) =>
        `<div class="scoreboard-row"><span class="score-level">Lv ${player.level}</span><span class="score-kills">${player.kills || 0} K</span><span class="score-class">${player.classId || player.tankId || 'N/A'}</span></div>`,
    )
    .join('');
}
