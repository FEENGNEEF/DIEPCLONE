import Player from '../entity/Player.js';
import Polygon, { randomPolygonType } from '../entity/Polygon.js';
import { getTankById, getTanksByTier } from '../tanks/index.js';

const TICK_RATE = 50;
const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 10000;
const ARENA = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
const MIN_POLYGONS = 50;
const FIRST_TANK_SELECTION_LEVEL = 15;
const SECOND_TANK_SELECTION_LEVEL = 30;

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function randomPosition() {
  return {
    x: (Math.random() - 0.5) * (WORLD_WIDTH - 200),
    y: (Math.random() - 0.5) * (WORLD_HEIGHT - 200),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampToWorld(entity) {
  const halfWidth = WORLD_WIDTH / 2;
  const halfHeight = WORLD_HEIGHT / 2;
  const radius = entity.radius || 0;
  entity.x = clamp(entity.x, -halfWidth + radius, halfWidth - radius);
  entity.y = clamp(entity.y, -halfHeight + radius, halfHeight - radius);
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

  upgradePlayerStat(id, stat) {
    const player = this.players.get(id);
    if (!player) return false;
    return player.applyUpgrade(stat);
  }

  fillPolygons() {
    while (this.polygons.length < MIN_POLYGONS) {
      this.spawnPolygon();
    }
  }

  spawnPolygon() {
    const polygon = new Polygon(randomId(), randomPolygonType(), randomPosition());
    clampToWorld(polygon);
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
      this.network.broadcastState(now);
    }
  }

  updatePlayers(delta, now) {
    for (const player of this.players.values()) {
      player.update(delta);
      clampToWorld(player);

      const bullets = player.tryShoot(now);
      if (Array.isArray(bullets)) this.bullets.push(...bullets);
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
          if (bullet.penetration > 0) {
            bullet.penetration -= 1;
          } else {
            this.bullets.splice(b, 1);
          }
          hit = true;
          if (polygon.hp <= 0) {
            this.polygons.splice(p, 1);
            const owner = this.players.get(bullet.ownerId);
            if (owner) {
              const previousLevel = owner.level;
              const levelsGained = owner.addXp(polygon.xpValue);
              if (levelsGained > 0) {
                this.handleTankUpgradeChoices(owner, previousLevel);
              }
            }
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
          if (bullet.penetration > 0) {
            bullet.penetration -= 1;
          } else {
            this.bullets.splice(b, 1);
          }
          if (player.hp <= 0) {
            player.respawn(randomPosition());
          }
          break;
        }
      }
    }
  }

  handleTankUpgradeChoices(player, previousLevel) {
    if (!player || player.pendingTankChoices.length > 0) return;

    const currentTank = getTankById(player.tankId);
    const thresholds = [
      { level: FIRST_TANK_SELECTION_LEVEL, tier: 1 },
      { level: SECOND_TANK_SELECTION_LEVEL, tier: 2 },
    ];

    for (const threshold of thresholds) {
      if (previousLevel < threshold.level && player.level >= threshold.level) {
        if (threshold.tier > 1 && (currentTank?.tier ?? 1) >= threshold.tier) continue;

        const choices = getTanksByTier(threshold.tier).filter((tank) => tank.id !== player.tankId);
        if (choices.length > 0) {
          player.pendingTankChoices = choices.map(({ id, name, tier }) => ({ id, name, tier }));
          break;
        }
      }
    }
  }

  serializeState(now, viewerId) {
    return {
      type: 'state',
      now,
      arena: ARENA,
      players: Array.from(this.players.values()).map((player) => {
        const serialized = {
          id: player.id,
          x: player.x,
          y: player.y,
          angle: player.angle,
          hp: player.hp,
          maxHp: player.maxHp,
          level: player.level,
          xp: player.xp,
          stats: player.stats,
          unspentPoints: player.unspentPoints,
          radius: player.radius,
          tankId: player.tankId,
        };

        if (viewerId === player.id && player.pendingTankChoices.length > 0) {
          serialized.pendingTankChoices = player.pendingTankChoices;
        }

        return serialized;
      }),
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
