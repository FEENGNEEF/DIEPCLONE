import { WebSocketServer } from 'ws';

export default class WebSocketManager {
  constructor(server, gameLoop) {
    this.gameLoop = gameLoop;
    this.clients = new Map();
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => this.handleConnection(ws));
  }

  handleConnection(ws) {
    const player = this.gameLoop.spawnPlayer();
    this.clients.set(ws, player.id);
    ws.send(JSON.stringify({ type: 'welcome', id: player.id }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'input') {
          this.gameLoop.updatePlayerInput(player.id, {
            moveX: message.moveX || 0,
            moveY: message.moveY || 0,
            angle: message.angle || 0,
            shooting: Boolean(message.shooting),
          });
        }
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    });

    ws.on('close', () => {
      this.gameLoop.removePlayer(player.id);
      this.clients.delete(ws);
    });
  }

  broadcastState(state) {
    const payload = JSON.stringify(state);
    for (const ws of this.clients.keys()) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  }
}
