# DIEPCLONE

A browser-based diep.io-style multiplayer prototype with an Express/WebSocket server and a canvas client.

## Features

- Real-time player movement and shooting over WebSockets.
- Server-authoritative gameplay loop for players, bullets, polygons, XP, and leveling.
- Camera smoothing, world grid rendering, minimap, scoreboard, respawn state, and killfeed UI.
- Tank stat upgrades and tier-based tank class choices.
- Periodic boss spawns with stronger polygon enemies.

## Controls

- Move: `WASD` or arrow keys.
- Aim: move the mouse around the game canvas.
- Shoot: hold the left mouse button.
- Upgrade stats/classes: use the upgrade panel when points or class choices are available.

## Local Development

Install dependencies from the repository root:

```bash
npm install
```

Start the server and static client:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The server also exposes a simple health check at:

```text
http://localhost:3000/health
```

For Vite-only client work, install and run the client package separately:

```bash
cd client
npm install
npm run dev
```

## Project Structure

- `client/`: Browser client, canvas rendering, input handling, and UI overlays.
- `server/`: Express server, WebSocket networking, entities, and the game loop.
- `package.json`: Root server scripts and runtime dependencies.
- `client/package.json`: Vite client scripts.
- `.gitignore`: Standard Node.js ignore rules.
