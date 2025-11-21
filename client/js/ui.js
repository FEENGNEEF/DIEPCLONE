import { getLatestState, getPlayerId, sendUpgrade } from './network.js';

const STAT_BUTTONS = [
  { key: 'bulletDamage', label: 'Bullet Damage' },
  { key: 'bulletSpeed', label: 'Bullet Speed' },
  { key: 'reload', label: 'Reload' },
  { key: 'movementSpeed', label: 'Movement Speed' },
  { key: 'maxHealth', label: 'Max Health' },
  { key: 'regen', label: 'Regen' },
  { key: 'penetration', label: 'Penetration' },
  { key: 'bodyDamage', label: 'Body Damage' },
];

export function setupUi() {
  const panel = document.createElement('aside');
  panel.id = 'upgrade-panel';

  const header = document.createElement('div');
  header.className = 'upgrade-panel__header';

  const title = document.createElement('h3');
  title.textContent = 'Upgrades';

  const indicator = document.createElement('div');
  indicator.id = 'upgrade-indicator';
  indicator.textContent = 'UPGRADES AVAILABLE: 0';

  header.appendChild(title);
  header.appendChild(indicator);

  const buttons = new Map();
  const buttonGrid = document.createElement('div');
  buttonGrid.className = 'upgrade-panel__buttons';

  STAT_BUTTONS.forEach((stat) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = stat.label;
    button.addEventListener('click', () => sendUpgrade(stat.key));
    buttonGrid.appendChild(button);
    buttons.set(stat.key, button);
  });

  panel.appendChild(header);
  panel.appendChild(buttonGrid);

  document.body.appendChild(panel);

  function update() {
    const state = getLatestState();
    const player = state?.players?.find((p) => p.id === getPlayerId());
    const unspent = player?.unspentPoints ?? 0;

    indicator.textContent = `UPGRADES AVAILABLE: ${unspent}`;

    if (player && player.level > 0) {
      panel.style.display = 'flex';
      STAT_BUTTONS.forEach((stat) => {
        const value = player.stats?.[stat.key] ?? 0;
        const button = buttons.get(stat.key);
        button.textContent = `${stat.label} (${value})`;
        button.disabled = unspent <= 0;
      });
    } else {
      panel.style.display = 'none';
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
