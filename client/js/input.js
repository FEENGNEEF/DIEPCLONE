const inputState = {
  moveX: 0,
  moveY: 0,
  angle: 0,
  shooting: false,
};

const keys = new Set();

function updateMovement() {
  const left = keys.has('ArrowLeft') || keys.has('a');
  const right = keys.has('ArrowRight') || keys.has('d');
  const up = keys.has('ArrowUp') || keys.has('w');
  const down = keys.has('ArrowDown') || keys.has('s');

  inputState.moveX = (right ? 1 : 0) - (left ? 1 : 0);
  inputState.moveY = (down ? 1 : 0) - (up ? 1 : 0);
}

export function setupInput(canvas) {
  window.addEventListener('keydown', (e) => {
    keys.add(e.key);
    updateMovement();
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
    updateMovement();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    inputState.angle = Math.atan2(e.clientY - cy, e.clientX - cx);
  });

  canvas.addEventListener('mousedown', () => {
    inputState.shooting = true;
  });
  window.addEventListener('mouseup', () => {
    inputState.shooting = false;
  });
}

export function getInputState() {
  return { ...inputState };
}
