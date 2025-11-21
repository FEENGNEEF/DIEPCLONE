import { getPlayerId } from './network.js';

const MINIMAP_SIZE = 180;
let minimapCanvas;
let minimapCtx;

function ensureMinimap() {
  if (minimapCanvas) return;
  minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = MINIMAP_SIZE;
  minimapCanvas.height = MINIMAP_SIZE;
  minimapCanvas.id = 'minimap';
  minimapCanvas.style.position = 'fixed';
  minimapCanvas.style.right = '20px';
  minimapCanvas.style.bottom = '20px';
  minimapCanvas.style.background = 'rgba(15, 23, 42, 0.8)';
  minimapCanvas.style.border = '1px solid #1f2937';
  minimapCanvas.style.borderRadius = '6px';
  minimapCanvas.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.4)';
  minimapCanvas.style.zIndex = '5';
  document.body.appendChild(minimapCanvas);
  minimapCtx = minimapCanvas.getContext('2d');
}

export function renderMinimap(state) {
  if (!state) return;
  ensureMinimap();

  const worldWidth = state.arena?.width || 1;
  const worldHeight = state.arena?.height || 1;
  const halfWidth = worldWidth / 2;
  const halfHeight = worldHeight / 2;

  minimapCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  minimapCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  minimapCtx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  state.players.forEach((player) => {
    const px = ((player.x + halfWidth) / worldWidth) * MINIMAP_SIZE;
    const py = ((player.y + halfHeight) / worldHeight) * MINIMAP_SIZE;
    if (Number.isNaN(px) || Number.isNaN(py)) return;

    minimapCtx.fillStyle = player.id === getPlayerId() ? '#3b82f6' : '#9ca3af';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 3, 0, Math.PI * 2);
    minimapCtx.fill();
  });
}
