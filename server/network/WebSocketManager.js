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
        if (message.type === 'upgrade' && typeof message.stat === 'string') {
          this.gameLoop.upgradePlayerStat(player.id, message.stat);
        }
        if (message.type === 'chooseTank' && typeof message.tankId === 'string') {
          const tankChoices = player.pendingTankChoices || [];
          const allowed = tankChoices.find((choice) => choice.id === message.tankId);
          if (allowed) {
            player.setTank(message.tankId);
            player.pendingTankChoices = [];
          }
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

  broadcastState(now) {
    for (const [ws, playerId] of this.clients.entries()) {
      if (ws.readyState !== ws.OPEN) continue;
      const state = this.gameLoop.serializeState(now, playerId);
      ws.send(JSON.stringify(state));
    }
  }
}
