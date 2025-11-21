import Player from '../entity/Player.js';
import Polygon, { randomPolygonType } from '../entity/Polygon.js';

const TICK_RATE = 50;
const ARENA = { width: 2400, height: 2400 };
const MIN_POLYGONS = 50;

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function randomPosition() {
  return {
    x: (Math.random() - 0.5) * (ARENA.width - 200),
    y: (Math.random() - 0.5) * (ARENA.height - 200),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circleIntersect(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distanceSq = dx * dx + dy * dy;
  const radii = (a.radius || 0) + (b.radius || 0);
  return distanceSq <= radii * radii;
}

export default class GameLoop {
  constructor() {
    this.players = new Map();
    this.bullets = [];
    this.polygons = [];
    this.network = null;
    this.lastTick = Date.now();
    this.interval = null;
    this.fillPolygons();
    this.start();
  }

  setNetworkManager(manager) {
    this.network = manager;
  }

  start() {
    this.interval = setInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  stop() {
    clearInterval(this.interval);
  }

  spawnPlayer() {
    const id = randomId();
    const player = new Player(id, randomPosition());
    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  updatePlayerInput(id, input) {
    const player = this.players.get(id);
    if (!player) return;
    player.setInput(input);
  }

  fillPolygons() {
    while (this.polygons.length < MIN_POLYGONS) {
      this.spawnPolygon();
    }
  }

  spawnPolygon() {
    const polygon = new Polygon(randomId(), randomPolygonType(), randomPosition());
    this.polygons.push(polygon);
  }

  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTick;
    const delta = deltaMs / 1000;
    this.lastTick = now;

    this.fillPolygons();
    this.updatePlayers(delta, now);
    this.updateBullets(deltaMs);
    this.handleBulletPolygonCollisions();
    this.handleBulletPlayerCollisions();

    if (this.network) {
      this.network.broadcastState(this.serializeState(now));
    }
  }

  updatePlayers(delta, now) {
    for (const player of this.players.values()) {
      player.update(delta);
      player.x = clamp(player.x, -ARENA.width / 2, ARENA.width / 2);
      player.y = clamp(player.y, -ARENA.height / 2, ARENA.height / 2);

      const bullet = player.tryShoot(now);
      if (bullet) this.bullets.push(bullet);
    }
  }

  updateBullets(deltaMs) {
    for (const bullet of this.bullets) {
      bullet.update(deltaMs);
    }
    this.bullets = this.bullets.filter((bullet) => bullet.ttl > 0);
  }

  handleBulletPolygonCollisions() {
    for (let b = this.bullets.length - 1; b >= 0; b -= 1) {
      const bullet = this.bullets[b];
      let hit = false;
      for (let p = this.polygons.length - 1; p >= 0; p -= 1) {
        const polygon = this.polygons[p];
        if (circleIntersect(bullet, polygon)) {
          polygon.hp -= bullet.damage;
          this.bullets.splice(b, 1);
          hit = true;
          if (polygon.hp <= 0) {
            this.polygons.splice(p, 1);
            const owner = this.players.get(bullet.ownerId);
            if (owner) owner.addXp(polygon.xpValue);
          }
          break;
        }
      }
      if (hit) continue;
    }
  }

  handleBulletPlayerCollisions() {
    for (let b = this.bullets.length - 1; b >= 0; b -= 1) {
      const bullet = this.bullets[b];
      for (const player of this.players.values()) {
        if (player.id === bullet.ownerId) continue;
        if (circleIntersect(bullet, player)) {
          player.hp -= bullet.damage;
          this.bullets.splice(b, 1);
          if (player.hp <= 0) {
            player.respawn(randomPosition());
          }
          break;
        }
      }
    }
  }

  serializeState(now) {
    return {
      type: 'state',
      now,
      arena: ARENA,
      players: Array.from(this.players.values()).map((player) => ({
        id: player.id,
        x: player.x,
        y: player.y,
        angle: player.angle,
        hp: player.hp,
        maxHp: player.maxHp,
        level: player.level,
        xp: player.xp,
        radius: player.radius,
      })),
      bullets: this.bullets.map((bullet) => ({
        x: bullet.x,
        y: bullet.y,
        radius: bullet.radius,
      })),
      polygons: this.polygons.map((polygon) => ({
        id: polygon.id,
        type: polygon.type,
        x: polygon.x,
        y: polygon.y,
        radius: polygon.radius,
      })),
    };
  }
}
