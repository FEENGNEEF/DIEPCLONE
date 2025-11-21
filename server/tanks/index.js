export const DEFAULT_TANK_ID = 'basic';

export const TANK_DEFINITIONS = [
  {
    id: 'basic',
    name: 'Basic',
    tier: 1,
    baseStatsMod: {
      reload: 1,
      bulletSpeed: 1,
      damage: 1,
      spread: 0,
    },
    barrels: [
      { offsetX: 0, offsetY: 0, angleOffset: 0, bulletSpeedMul: 1, damageMul: 1 },
    ],
  },
  {
    id: 'twin',
    name: 'Twin',
    tier: 1,
    baseStatsMod: {
      reload: 1,
      bulletSpeed: 1,
      damage: 1,
      spread: 0,
    },
    barrels: [
      { offsetX: 0, offsetY: 8, angleOffset: 0, bulletSpeedMul: 1, damageMul: 0.8 },
      { offsetX: 0, offsetY: -8, angleOffset: 0, bulletSpeedMul: 1, damageMul: 0.8 },
    ],
  },
  {
    id: 'sniper',
    name: 'Sniper',
    tier: 1,
    baseStatsMod: {
      reload: 1.6,
      bulletSpeed: 1.8,
      damage: 1.8,
      spread: 0,
    },
    barrels: [
      { offsetX: 0, offsetY: 0, angleOffset: 0, bulletSpeedMul: 1, damageMul: 1 },
    ],
  },
  {
    id: 'machinegun',
    name: 'Machine Gun',
    tier: 1,
    baseStatsMod: {
      reload: 0.5,
      bulletSpeed: 1,
      damage: 0.6,
      spread: 0.06,
    },
    barrels: [
      { offsetX: 0, offsetY: 0, angleOffset: 0, bulletSpeedMul: 1, damageMul: 1 },
    ],
  },
];

export function getTankById(id) {
  return TANK_DEFINITIONS.find((tank) => tank.id === id) || TANK_DEFINITIONS.find((tank) => tank.id === DEFAULT_TANK_ID);
}

export function getTanksByTier(tier) {
  return TANK_DEFINITIONS.filter((tank) => tank.tier === tier);
}
