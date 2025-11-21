let container;

function ensureContainer() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'killfeed';
  document.body.appendChild(container);
}

function formatPlayerName(id) {
  return `Player ${id}`;
}

export function renderKillfeed(state) {
  ensureContainer();
  if (!state || !state.killfeed) {
    container.innerHTML = '';
    return;
  }

  const now = state.now || Date.now();
  const messages = state.killfeed
    .slice(-5)
    .map((entry) => {
      const age = now - entry.time;
      const opacity = age > 4000 ? 0 : age > 3000 ? 1 - (age - 3000) / 1000 : 1;
      return {
        text: `${formatPlayerName(entry.killerId)} destroyed ${formatPlayerName(entry.victimId)}`,
        opacity: Math.max(0, opacity),
      };
    })
    .filter((entry) => entry.opacity > 0);

  container.innerHTML = messages
    .map((entry) => `<div class="killfeed-entry" style="opacity:${entry.opacity.toFixed(2)}">${entry.text}</div>`)
    .join('');
}
