import { getLatestState, getPlayerId } from './network.js';
import { updateCamera, worldToScreen } from './camera.js';

const COLORS = {
  background: '#1f2937',
  arena: '#374151',
  player: '#60a5fa',
  localPlayer: '#fbbf24',
  bullet: '#f87171',
  square: '#34d399',
  triangle: '#a78bfa',
  grid: '#4b5563',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 1;
  ctx.imageSmoothingEnabled = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function drawGrid(camera) {
    const gridSize = 100;
    const left = camera.x - canvas.width / 2;
    const right = camera.x + canvas.width / 2;
    const top = camera.y - canvas.height / 2;
    const bottom = camera.y + canvas.height / 2;

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;

    const startX = Math.floor(left / gridSize) * gridSize;
    for (let x = startX; x <= right; x += gridSize) {
      const screenX = worldToScreen(x, 0).x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();
    }

    const startY = Math.floor(top / gridSize) * gridSize;
    for (let y = startY; y <= bottom; y += gridSize) {
      const screenY = worldToScreen(0, y).y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }
  }

  function drawPlayer(player) {
    const { x, y } = worldToScreen(player.x, player.y);
    ctx.fillStyle = player.id === getPlayerId() ? COLORS.localPlayer : COLORS.player;
    ctx.beginPath();
    ctx.arc(x, y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(player.angle) * player.radius * 1.5, y + Math.sin(player.angle) * player.radius * 1.5);
    ctx.stroke();
  }

  function drawPolygon(poly) {
    const { x, y } = worldToScreen(poly.x, poly.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = poly.type === 'square' ? COLORS.square : COLORS.triangle;
    ctx.beginPath();
    if (poly.type === 'square') {
      const size = poly.radius * Math.SQRT1_2;
      ctx.rect(-size, -size, size * 2, size * 2);
    } else {
      ctx.moveTo(0, -poly.radius);
      ctx.lineTo(poly.radius, poly.radius);
      ctx.lineTo(-poly.radius, poly.radius);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }

  function drawBullet(bullet) {
    const { x, y } = worldToScreen(bullet.x, bullet.y);
    ctx.fillStyle = COLORS.bullet;
    ctx.beginPath();
    ctx.arc(x, y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawUi(localPlayer) {
    if (!localPlayer) return;
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${localPlayer.level}`, 20, 30);
    ctx.fillText(`XP: ${Math.floor(localPlayer.xp)}`, 20, 50);
  }

  function draw() {
    const state = getLatestState();
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!state) {
      requestAnimationFrame(draw);
      return;
    }

    const localPlayer = state.players.find((p) => p.id === getPlayerId());
    const camera = updateCamera(localPlayer || { x: 0, y: 0 });

    drawGrid(camera);

    const arenaTopLeft = worldToScreen(-state.arena.width / 2, -state.arena.height / 2);
    ctx.save();
    ctx.strokeStyle = COLORS.arena;
    ctx.lineWidth = 4;
    ctx.strokeRect(arenaTopLeft.x, arenaTopLeft.y, state.arena.width, state.arena.height);
    ctx.restore();

    state.polygons.forEach((poly) => drawPolygon(poly));
    state.bullets.forEach((bullet) => drawBullet(bullet));
    state.players.forEach((player) => drawPlayer(player));

    drawUi(localPlayer);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
