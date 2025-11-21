import { getLatestState, getPlayerId } from './network.js';

const COLORS = {
  background: '#1f2937',
  arena: '#374151',
  player: '#60a5fa',
  localPlayer: '#fbbf24',
  bullet: '#f87171',
  square: '#34d399',
  triangle: '#a78bfa',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function drawPlayer(player, camera) {
    const x = canvas.width / 2 + (player.x - camera.x);
    const y = canvas.height / 2 + (player.y - camera.y);
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

  function drawPolygon(poly, camera) {
    const x = canvas.width / 2 + (poly.x - camera.x);
    const y = canvas.height / 2 + (poly.y - camera.y);
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

  function drawBullet(bullet, camera) {
    const x = canvas.width / 2 + (bullet.x - camera.x);
    const y = canvas.height / 2 + (bullet.y - camera.y);
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
    const camera = {
      x: localPlayer ? localPlayer.x : 0,
      y: localPlayer ? localPlayer.y : 0,
    };

    const arenaX = canvas.width / 2 - state.arena.width / 2 - camera.x;
    const arenaY = canvas.height / 2 - state.arena.height / 2 - camera.y;
    ctx.strokeStyle = COLORS.arena;
    ctx.lineWidth = 4;
    ctx.strokeRect(arenaX, arenaY, state.arena.width, state.arena.height);

    state.polygons.forEach((poly) => drawPolygon(poly, camera));
    state.bullets.forEach((bullet) => drawBullet(bullet, camera));
    state.players.forEach((player) => drawPlayer(player, camera));

    drawUi(localPlayer);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
