import Bullet from './Bullet.js';

const ACCELERATION = 900;
const FRICTION = 0.85;
const MAX_SPEED = 280;
const BASE_FIRE_RATE = 250;
const PLAYER_RADIUS = 20;
const BASE_HP = 100;

export default class Player {
  constructor(id, spawn) {
    this.id = id;
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = PLAYER_RADIUS;
    this.maxHp = BASE_HP;
    this.hp = this.maxHp;
    this.level = 1;
    this.xp = 0;
    this.stats = {};
    this.lastShot = 0;
    this.fireRate = BASE_FIRE_RATE;
    this.input = {
      moveX: 0,
      moveY: 0,
      angle: 0,
      shooting: false,
    };
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
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.angle = angle;
  }

  tryShoot(now) {
    if (!this.input.shooting) return null;
    if (now - this.lastShot < this.fireRate) return null;

    this.lastShot = now;
    const speed = 600;
    const dirX = Math.cos(this.input.angle);
    const dirY = Math.sin(this.input.angle);
    return new Bullet({
      ownerId: this.id,
      x: this.x + dirX * this.radius,
      y: this.y + dirY * this.radius,
      vx: dirX * speed,
      vy: dirY * speed,
      damage: 20,
      radius: 6,
      ttl: 2000,
    });
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel()) {
      this.xp -= this.xpToNextLevel();
      this.level += 1;
      this.maxHp += 10;
      this.hp = this.maxHp;
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
    this.maxHp = BASE_HP;
    this.hp = this.maxHp;
  }
}
