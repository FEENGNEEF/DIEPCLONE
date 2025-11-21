let socket;
let latestState = null;
let playerId = null;
let inputProvider = null;
let inputInterval;

function getWsUrl() {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_WS_URL : null;
  const windowUrl = typeof window !== 'undefined' ? window.VITE_WS_URL : null;
  return viteUrl || windowUrl || 'ws://localhost:3000';
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
      latestState = message;
    }
  });

  socket.addEventListener('close', () => {
    clearInterval(inputInterval);
  });
}

export function getLatestState() {
  return latestState;
}

export function getPlayerId() {
  return playerId;
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
