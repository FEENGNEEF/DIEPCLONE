import Bullet from './Bullet.js';
import { DEFAULT_TANK_ID, getTankById } from '../tanks/index.js';

const ACCELERATION = 900;
const FRICTION = 0.92;
const BASE_MAX_SPEED = 280;
const BASE_FIRE_RATE = 250;
const PLAYER_RADIUS = 20;
const BASE_HP = 100;
const BASE_BULLET_DAMAGE = 20;
const BASE_BULLET_SPEED = 600;
const BASE_REGEN = 2;

const STAT_DEFINITIONS = {
  bulletDamage: { multiplier: 0.12 },
  bulletSpeed: { multiplier: 0.05 },
  reload: { multiplier: 0.07 },
  movementSpeed: { multiplier: 0.05 },
  maxHealth: { multiplier: 0.12 },
  regen: { multiplier: 0.1 },
  penetration: { step: 1 },
  bodyDamage: { multiplier: 0.1 },
};

export default class Player {
  constructor(id, spawn) {
    this.id = id;
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = PLAYER_RADIUS;
    this.flashUntil = 0;
    this.level = 1;
    this.xp = 0;
    this.stats = {
      bulletDamage: 0,
      bulletSpeed: 0,
      reload: 0,
      movementSpeed: 0,
      maxHealth: 0,
      regen: 0,
      penetration: 0,
      bodyDamage: 0,
    };
    this.unspentPoints = 0;
    this.maxHp = BASE_HP;
    this.hp = this.maxHp;
    this.lastShot = 0;
    this.fireRate = BASE_FIRE_RATE;
    this.bulletDamage = BASE_BULLET_DAMAGE;
    this.bulletSpeed = BASE_BULLET_SPEED;
    this.bulletSpread = 0;
    this.movementSpeed = BASE_MAX_SPEED;
    this.regenRate = BASE_REGEN;
    this.penetration = 0;
    this.bodyDamage = 0;
    this.tankId = DEFAULT_TANK_ID;
    this.pendingTankChoices = [];
    this.input = {
      moveX: 0,
      moveY: 0,
      angle: 0,
      shooting: false,
    };

    this.kills = 0;
    this.deaths = 0;
    this.dead = false;
    this.respawnTimer = 0;
    this.lastPolygonCollision = 0;

    this.recalculateDerivedStats(true);
  }

  setTank(tankId) {
    this.tankId = getTankById(tankId)?.id || DEFAULT_TANK_ID;
    this.recalculateDerivedStats();
  }

  setInput(input) {
    this.input = {
      ...this.input,
      ...input,
    };
  }

  update(delta) {
    const { moveX, moveY, angle } = this.input;
    const magnitude = Math.hypot(moveX, moveY) || 1;
    const normX = moveX / magnitude;
    const normY = moveY / magnitude;

    this.vx += normX * ACCELERATION * delta;
    this.vy += normY * ACCELERATION * delta;

    this.vx *= FRICTION;
    this.vy *= FRICTION;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.movementSpeed) {
      const scale = this.movementSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.angle = angle;

    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * delta);
    }
  }

  tryShoot(now) {
    if (!this.input.shooting) return null;
    if (now - this.lastShot < this.fireRate) return null;

    const tank = getTankById(this.tankId);
    const barrels = tank?.barrels?.length ? tank.barrels : [{ offsetX: 0, offsetY: 0, angleOffset: 0, bulletSpeedMul: 1, damageMul: 1 }];
    const baseAngle = this.input.angle;

    this.lastShot = now;
    const bullets = barrels.map((barrel) => {
      const spread = (Math.random() * 2 - 1) * this.bulletSpread;
      const angle = baseAngle + (barrel.angleOffset || 0) + spread;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      const rotatedX = (barrel.offsetX || 0) * Math.cos(baseAngle) - (barrel.offsetY || 0) * Math.sin(baseAngle);
      const rotatedY = (barrel.offsetX || 0) * Math.sin(baseAngle) + (barrel.offsetY || 0) * Math.cos(baseAngle);

      const speed = this.bulletSpeed * (barrel.bulletSpeedMul || 1);
      return new Bullet({
        ownerId: this.id,
        x: this.x + rotatedX + dirX * this.radius,
        y: this.y + rotatedY + dirY * this.radius,
        vx: dirX * speed,
        vy: dirY * speed,
        damage: this.bulletDamage * (barrel.damageMul || 1),
        radius: 6,
        ttl: 2000,
        penetration: this.penetration,
      });
    });

    const recoilFactor = tank?.baseStatsMod?.recoil ?? 1;
    const recoilStrength = 0.5 * recoilFactor;
    this.vx -= Math.cos(baseAngle) * recoilStrength;
    this.vy -= Math.sin(baseAngle) * recoilStrength;

    return bullets;
  }

  addXp(amount) {
    const previousLevel = this.level;
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel()) {
      this.xp -= this.xpToNextLevel();
      this.level += 1;
      this.unspentPoints += 1;
      this.recalculateDerivedStats(true);
    }
    return this.level - previousLevel;
  }

  xpToNextLevel() {
    return 100 + (this.level - 1) * 50;
  }

  respawn(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.flashUntil = 0;
    this.dead = false;
    this.respawnTimer = 0;
    this.hp = this.maxHp;
    this.lastPolygonCollision = 0;
  }

  applyUpgrade(stat) {
    if (!(stat in this.stats)) return false;
    if (this.unspentPoints <= 0) return false;
    this.stats[stat] += 1;
    this.unspentPoints -= 1;
    this.recalculateDerivedStats();
    return true;
  }

  recalculateDerivedStats(resetHealth = false) {
    const maxHpBase = BASE_HP + (this.level - 1) * 10;
    const healthMultiplier = 1 + STAT_DEFINITIONS.maxHealth.multiplier * this.stats.maxHealth;
    this.maxHp = maxHpBase * healthMultiplier;

    this.fireRate = BASE_FIRE_RATE * Math.max(0.35, 1 - STAT_DEFINITIONS.reload.multiplier * this.stats.reload);
    this.bulletDamage = BASE_BULLET_DAMAGE * (1 + STAT_DEFINITIONS.bulletDamage.multiplier * this.stats.bulletDamage);
    this.bulletSpeed = BASE_BULLET_SPEED * (1 + STAT_DEFINITIONS.bulletSpeed.multiplier * this.stats.bulletSpeed);
    const tank = getTankById(this.tankId);
    const reloadMul = tank?.baseStatsMod?.reload ?? 1;
    const bulletSpeedMul = tank?.baseStatsMod?.bulletSpeed ?? 1;
    const damageMul = tank?.baseStatsMod?.damage ?? 1;
    this.bulletSpread = tank?.baseStatsMod?.spread ?? 0;
    this.fireRate *= reloadMul;
    this.bulletDamage *= damageMul;
    this.bulletSpeed *= bulletSpeedMul;
    this.movementSpeed = BASE_MAX_SPEED * (1 + STAT_DEFINITIONS.movementSpeed.multiplier * this.stats.movementSpeed);
    this.regenRate = BASE_REGEN * (1 + STAT_DEFINITIONS.regen.multiplier * this.stats.regen);
    this.penetration = (STAT_DEFINITIONS.penetration.step || 1) * this.stats.penetration;
    this.bodyDamage = 10 * (1 + STAT_DEFINITIONS.bodyDamage.multiplier * this.stats.bodyDamage);

    if (resetHealth) {
      this.hp = this.maxHp;
    } else {
      this.hp = Math.min(this.hp, this.maxHp);
    }
  }
}
