import Bullet from './Bullet.js';

const ACCELERATION = 900;
const FRICTION = 0.85;
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
    this.movementSpeed = BASE_MAX_SPEED;
    this.regenRate = BASE_REGEN;
    this.penetration = 0;
    this.bodyDamage = 0;
    this.input = {
      moveX: 0,
      moveY: 0,
      angle: 0,
      shooting: false,
    };

    this.recalculateDerivedStats(true);
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

    this.lastShot = now;
    const speed = this.bulletSpeed;
    const dirX = Math.cos(this.input.angle);
    const dirY = Math.sin(this.input.angle);
    return new Bullet({
      ownerId: this.id,
      x: this.x + dirX * this.radius,
      y: this.y + dirY * this.radius,
      vx: dirX * speed,
      vy: dirY * speed,
      damage: this.bulletDamage,
      radius: 6,
      ttl: 2000,
      penetration: this.penetration,
    });
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel()) {
      this.xp -= this.xpToNextLevel();
      this.level += 1;
      this.unspentPoints += 1;
      this.recalculateDerivedStats(true);
    }
  }

  xpToNextLevel() {
    return 100 + (this.level - 1) * 50;
  }

  respawn(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
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
    this.recalculateDerivedStats(true);
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
