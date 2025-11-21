const POLYGON_TYPES = {
  square: { hp: 20, xpValue: 25, radius: 16 },
  triangle: { hp: 15, xpValue: 30, radius: 18 },
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
  }
}

export function randomPolygonType() {
  return Math.random() > 0.5 ? 'square' : 'triangle';
}
