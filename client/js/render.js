import { getLatestState, getPlayerId } from './network.js';
import { updateCamera, worldToScreen } from './camera.js';
import { renderMinimap } from './minimap.js';
import { renderScoreboard } from './scoreboard.js';
import { renderRespawnOverlay } from './respawn-ui.js';
import { renderKillfeed } from './killfeed.js';

const COLORS = {
  background: '#1f2937',
  arena: '#374151',
  player: '#60a5fa',
  localPlayer: '#fbbf24',
  bullet: '#f87171',
  square: '#34d399',
  triangle: '#a78bfa',
  pentagon: '#f97316',
  octagon: '#c084fc',
  boss_octagon: '#a855f7',
  gridLight: '#2f3b55',
  gridDark: '#0f172a',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 1;
  ctx.imageSmoothingEnabled = false;

  const renderPositions = new Map();

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function drawGrid(camera) {
    const lightGridSize = 50;
    const darkGridSize = 250;
    const left = camera.x - canvas.width / 2;
    const right = camera.x + canvas.width / 2;
    const top = camera.y - canvas.height / 2;
    const bottom = camera.y + canvas.height / 2;

    const startLightX = Math.floor(left / lightGridSize) * lightGridSize;
    ctx.strokeStyle = COLORS.gridLight;
    ctx.lineWidth = 1;
    for (let x = startLightX; x <= right; x += lightGridSize) {
      const screenX = worldToScreen(x, 0).x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();
    }

    const startLightY = Math.floor(top / lightGridSize) * lightGridSize;
    for (let y = startLightY; y <= bottom; y += lightGridSize) {
      const screenY = worldToScreen(0, y).y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }

    const startDarkX = Math.floor(left / darkGridSize) * darkGridSize;
    ctx.strokeStyle = COLORS.gridDark;
    for (let x = startDarkX; x <= right; x += darkGridSize) {
      const screenX = worldToScreen(x, 0).x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();
    }

    const startDarkY = Math.floor(top / darkGridSize) * darkGridSize;
    for (let y = startDarkY; y <= bottom; y += darkGridSize) {
      const screenY = worldToScreen(0, y).y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }
  }

  function getRenderPosition(player) {
    const previous = renderPositions.get(player.id) || { x: player.x, y: player.y };
    if (player.id === getPlayerId()) {
      renderPositions.set(player.id, { x: player.x, y: player.y });
      return { x: player.x, y: player.y };
    }

    const lerpFactor = 0.2;
    const x = previous.x + (player.x - previous.x) * lerpFactor;
    const y = previous.y + (player.y - previous.y) * lerpFactor;
    renderPositions.set(player.id, { x, y });
    return { x, y };
  }

  function drawPlayer(player, renderPos, now) {
    const { x, y } = worldToScreen(renderPos.x, renderPos.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.angle);

    const barrelLength = player.radius * 1.7;
    const barrelThickness = 8;
    const barrelOffsets = player.tankId === 'twin' ? [-10, 10] : [0];

    ctx.fillStyle = '#0f172a';
    barrelOffsets.forEach((offsetY) => {
      ctx.fillRect(0, -barrelThickness / 2 + offsetY, barrelLength, barrelThickness);
    });

    const muzzleDuration = 50;
    const timeSinceShot = now && player.lastShot ? now - player.lastShot : Number.POSITIVE_INFINITY;
    if (timeSinceShot < muzzleDuration) {
      const alpha = 1 - timeSinceShot / muzzleDuration;
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      barrelOffsets.forEach((offsetY) => {
        ctx.beginPath();
        ctx.arc(barrelLength, offsetY, 8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.rotate(-player.angle);
    ctx.translate(-x, -y);

    ctx.fillStyle = player.id === getPlayerId() ? COLORS.localPlayer : COLORS.player;
    ctx.beginPath();
    ctx.arc(x, y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    const flashActive = player.flashUntil && now && now < player.flashUntil;
    if (flashActive) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const barWidth = player.radius * 2;
    const barHeight = 6;
    const barX = x - barWidth / 2;
    const barY = y + player.radius + 8;
    const hpRatio = Math.max(0, Math.min(1, player.hp / (player.maxHp || 1)));
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.restore();
  }

  function drawPolygon(poly, now) {
    const { x, y } = worldToScreen(poly.x, poly.y);
    ctx.save();
    ctx.translate(x, y);

    const color = COLORS[poly.type] || COLORS.square;
    ctx.fillStyle = color;
    ctx.beginPath();

    const sides = Math.max(3, poly.sides || 4);
    for (let i = 0; i < sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * poly.radius;
      const py = Math.sin(angle) * poly.radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();

    if (poly.isBoss) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();
    }

    const flashActive = poly.flashUntil && now && now < poly.flashUntil;
    if (flashActive) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    }
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
    const localPlayer = state?.players?.find((p) => p.id === getPlayerId());

    renderMinimap(state);
    renderScoreboard(state);
    renderKillfeed(state);
    renderRespawnOverlay(localPlayer);

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!state) {
      requestAnimationFrame(draw);
      return;
    }

    const camera = updateCamera(localPlayer || { x: 0, y: 0, vx: 0, vy: 0 });
    const currentTime = state.now;

    const playerIds = new Set(state.players.map((p) => p.id));
    for (const id of renderPositions.keys()) {
      if (!playerIds.has(id)) {
        renderPositions.delete(id);
      }
    }

    drawGrid(camera);

    const arenaTopLeft = worldToScreen(-state.arena.width / 2, -state.arena.height / 2);
    ctx.save();
    ctx.strokeStyle = COLORS.arena;
    ctx.lineWidth = 4;
    ctx.strokeRect(arenaTopLeft.x, arenaTopLeft.y, state.arena.width, state.arena.height);
    ctx.restore();

    state.polygons.forEach((poly) => drawPolygon(poly, currentTime));
    state.bullets.forEach((bullet) => drawBullet(bullet));
    state.players.forEach((player) => {
      const renderPos = getRenderPosition(player);
      drawPlayer(player, renderPos, currentTime);
    });

    drawUi(localPlayer);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
