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

  cameraX += (localPlayer.x - cameraX) * 0.1;
  cameraY += (localPlayer.y - cameraY) * 0.1;

  return { x: cameraX, y: cameraY };
}

export function worldToScreen(x, y) {
  return {
    x: window.innerWidth / 2 + (x - cameraX),
    y: window.innerHeight / 2 + (y - cameraY),
  };
}
