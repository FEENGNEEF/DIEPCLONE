let overlay;
let message;

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'respawn-overlay';
  message = document.createElement('div');
  message.id = 'respawn-message';
  overlay.appendChild(message);
  document.body.appendChild(overlay);
}

export function renderRespawnOverlay(localPlayer) {
  ensureOverlay();
  if (!localPlayer || !localPlayer.dead) {
    overlay.style.display = 'none';
    return;
  }

  overlay.style.display = 'flex';
  const seconds = Math.max(0, Math.ceil((localPlayer.respawnTimer || 0) / 1000));
  message.textContent = `You were destroyed! Respawning in ${seconds} seconds…`;
}
