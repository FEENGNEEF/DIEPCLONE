const POLYGON_TYPES = {
  square: { hp: 20, xpValue: 25, radius: 16, collisionDamage: 6, sides: 4 },
  triangle: { hp: 18, xpValue: 30, radius: 18, collisionDamage: 7, sides: 3 },
  pentagon: { hp: 45, xpValue: 80, radius: 22, collisionDamage: 9, sides: 5 },
  octagon: { hp: 90, xpValue: 140, radius: 28, collisionDamage: 12, sides: 8 },
  boss_octagon: { hp: 5000, xpValue: 5000, radius: 120, collisionDamage: 28, sides: 8, isBoss: true },
};

export default class Polygon {
  constructor(id, type, position) {
    const config = POLYGON_TYPES[type];
    this.id = id;
    this.type = type;
    this.x = position.x;
    this.y = position.y;
    this.hp = config.hp;
    this.xpValue = config.xpValue;
    this.radius = config.radius;
    this.flashUntil = 0;
    this.collisionDamage = config.collisionDamage || 5;
    this.sides = config.sides || 4;
    this.isBoss = Boolean(config.isBoss);
  }
}

export function randomPolygonType() {
  const roll = Math.random();
  if (roll > 0.95) return 'octagon';
  if (roll > 0.7) return 'pentagon';
  return roll > 0.35 ? 'square' : 'triangle';
}

export { POLYGON_TYPES };
