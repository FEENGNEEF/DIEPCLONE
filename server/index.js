import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import GameLoop from './game/GameLoop.js';
import WebSocketManager from './network/WebSocketManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const gameLoop = new GameLoop();
const websocketManager = new WebSocketManager(server, gameLoop);
gameLoop.setNetworkManager(websocketManager);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
