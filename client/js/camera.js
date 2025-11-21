let cameraX = 0;
let cameraY = 0;
let initialized = false;

export function updateCamera(localPlayer) {
  if (!localPlayer) return { x: cameraX, y: cameraY };

  if (!initialized) {
    cameraX = localPlayer.x;
    cameraY = localPlayer.y;
    initialized = true;
  }

  const speed = Math.hypot(localPlayer.vx || 0, localPlayer.vy || 0);
  const factor = 0.08 + Math.min(speed / 20, 0.05);

  cameraX += (localPlayer.x - cameraX) * factor;
  cameraY += (localPlayer.y - cameraY) * factor;

  return { x: cameraX, y: cameraY };
}

export function worldToScreen(x, y) {
  return {
    x: window.innerWidth / 2 + (x - cameraX),
    y: window.innerHeight / 2 + (y - cameraY),
  };
}
