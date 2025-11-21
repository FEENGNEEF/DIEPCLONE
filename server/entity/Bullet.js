const BULLET_DECAY = 1000 / 50;

export default class Bullet {
  constructor({ ownerId, x, y, vx, vy, damage = 10, radius = 5, ttl = 2000 }) {
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.ttl = ttl;
  }

  update(deltaMs) {
    this.x += this.vx * (deltaMs / 1000);
    this.y += this.vy * (deltaMs / 1000);
    this.ttl -= deltaMs || BULLET_DECAY;
  }
}
