let socket;
let latestServerState = null;
let localState = null;
let playerId = null;
let inputProvider = null;
let inputInterval;

function getWsUrl() {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_WS_URL : null;
  const windowUrl = typeof window !== 'undefined' ? window.VITE_WS_URL : null;
  return viteUrl || windowUrl || 'ws://localhost:3000';
}

function cloneState(state) {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player })),
    bullets: state.bullets.map((bullet) => ({ ...bullet })),
    polygons: state.polygons.map((polygon) => ({ ...polygon })),
    killfeed: state.killfeed ? state.killfeed.map((entry) => ({ ...entry })) : [],
  };
}

function correctLocalState(serverState) {
  if (!localState) {
    localState = cloneState(serverState);
    return;
  }

  localState.now = serverState.now;
  localState.arena = serverState.arena;
  localState.killfeed = serverState.killfeed ? serverState.killfeed.map((entry) => ({ ...entry })) : [];

  const serverPlayers = new Map(serverState.players.map((player) => [player.id, player]));
  localState.players = localState.players.filter((player) => serverPlayers.has(player.id));

  serverState.players.forEach((serverPlayer) => {
    const localPlayer = localState.players.find((p) => p.id === serverPlayer.id);
    if (localPlayer) {
      localPlayer.x = localPlayer.x * 0.8 + serverPlayer.x * 0.2;
      localPlayer.y = localPlayer.y * 0.8 + serverPlayer.y * 0.2;
      localPlayer.vx = (localPlayer.vx || 0) * 0.8 + (serverPlayer.vx || 0) * 0.2;
      localPlayer.vy = (localPlayer.vy || 0) * 0.8 + (serverPlayer.vy || 0) * 0.2;
      localPlayer.angle = localPlayer.angle * 0.8 + serverPlayer.angle * 0.2;
      localPlayer.hp = serverPlayer.hp;
      localPlayer.maxHp = serverPlayer.maxHp;
      localPlayer.level = serverPlayer.level;
      localPlayer.xp = serverPlayer.xp;
      localPlayer.kills = serverPlayer.kills;
      localPlayer.deaths = serverPlayer.deaths;
      localPlayer.dead = serverPlayer.dead;
      localPlayer.respawnTimer = serverPlayer.respawnTimer;
      localPlayer.stats = serverPlayer.stats;
      localPlayer.unspentPoints = serverPlayer.unspentPoints;
      localPlayer.radius = serverPlayer.radius;
      localPlayer.tankId = serverPlayer.tankId;
      localPlayer.classId = serverPlayer.classId;
      localPlayer.lastShot = serverPlayer.lastShot;
      localPlayer.flashUntil = serverPlayer.flashUntil;
      localPlayer.movementSpeed = serverPlayer.movementSpeed;
    } else {
      localState.players.push({ ...serverPlayer });
    }
  });

  localState.bullets = serverState.bullets.map((bullet) => ({ ...bullet }));
  localState.polygons = serverState.polygons.map((polygon) => ({ ...polygon }));
}

export function setupNetwork(provideInput) {
  inputProvider = provideInput;
  const url = getWsUrl();
  socket = new WebSocket(url);

  socket.addEventListener('open', () => {
    inputInterval = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const input = inputProvider ? inputProvider() : {};
      socket.send(
        JSON.stringify({
          type: 'input',
          ...input,
        }),
      );
    }, 50);
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'welcome') {
      playerId = message.id;
    }
    if (message.type === 'state') {
      latestServerState = message;
      correctLocalState(message);
    }
  });

  socket.addEventListener('close', () => {
    clearInterval(inputInterval);
  });
}

export function getLatestState() {
  return localState || latestServerState;
}

export function getPlayerId() {
  return playerId;
}

export function applyLocalInput(input, delta) {
  if (!localState || !playerId) return;
  const player = localState.players.find((p) => p.id === playerId);
  if (!player || player.dead) return;

  const accel = 900;
  const friction = 0.92;
  const maxSpeed = player.movementSpeed || 280;

  const magnitude = Math.hypot(input.moveX, input.moveY) || 1;
  const normX = input.moveX / magnitude;
  const normY = input.moveY / magnitude;

  player.vx = (player.vx || 0) + normX * accel * delta;
  player.vy = (player.vy || 0) + normY * accel * delta;

  player.vx *= friction;
  player.vy *= friction;

  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    player.vx *= scale;
    player.vy *= scale;
  }

  player.x += player.vx * delta;
  player.y += player.vy * delta;
  player.angle = input.angle;

  localState.now = Date.now();
}

export function sendUpgrade(stat) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(
    JSON.stringify({
      type: 'upgrade',
      stat,
    }),
  );
}

export function sendTankChoice(tankId) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(
    JSON.stringify({
      type: 'chooseTank',
      tankId,
    }),
  );
}
