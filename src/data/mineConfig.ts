// ============================================================
// Mine & Workbench level configs
// ============================================================

export interface MineLevel {
  level: number;
  intervalMs: number;
  storageMax: number;
  upgradeCost: number;
  bonusOres: { grade: number; subGrade: number; chance: number }[];
}

export interface WorkbenchLevel {
  level: number;
  upgradeBonus: number;
  batchSize: number;
  upgradeCost: number;
  autoUnlock: boolean;
  autoCooldownMs: number;
  bufferCapacity: number;
  maxToolLevel: number;
}

// ============================================================
// Mine: 30 levels, interval scales from 5min → 5sec
// ============================================================

function buildMineLevel(level: number): MineLevel {
  const intervalMs = Math.max(5000, Math.floor(300000 * Math.pow(0.80, level - 1)));
  const storageMax = 5 + Math.floor(level * 3.2);
  const upgradeCost = level <= 5
    ? [800, 2000, 6000, 20000, 60000][level - 1]
    : Math.floor(60000 * Math.pow(1.35, level - 5));

  const bonusOres: MineLevel['bonusOres'] = [];
  if (level >= 3) bonusOres.push({ grade: 1, subGrade: 1, chance: Math.min(0.25, 0.008 * level) });
  if (level >= 5) bonusOres.push({ grade: 2, subGrade: 1, chance: Math.min(0.12, 0.004 * level) });
  if (level >= 8) bonusOres.push({ grade: 2, subGrade: 2, chance: Math.min(0.06, 0.002 * level) });
  if (level >= 12) bonusOres.push({ grade: 3, subGrade: 1, chance: Math.min(0.05, 0.0015 * level) });
  if (level >= 16) bonusOres.push({ grade: 3, subGrade: 2, chance: Math.min(0.03, 0.001 * level) });
  if (level >= 20) bonusOres.push({ grade: 4, subGrade: 1, chance: Math.min(0.02, 0.0006 * level) });
  if (level >= 24) bonusOres.push({ grade: 4, subGrade: 2, chance: Math.min(0.01, 0.0004 * level) });
  if (level >= 28) bonusOres.push({ grade: 5, subGrade: 1, chance: Math.min(0.005, 0.0002 * level) });

  return { level, intervalMs, storageMax, upgradeCost, bonusOres };
}

const MINE_LEVEL_COUNT = 30;
export const MINE_LEVELS: MineLevel[] = Array.from({ length: MINE_LEVEL_COUNT }, (_, i) => buildMineLevel(i + 1));

// ============================================================
// Workbench: 5 levels
// ============================================================

export const WORKBENCH_LEVELS: WorkbenchLevel[] = [
  { level: 1, upgradeBonus: 0,  batchSize: 1, upgradeCost: 500,  autoUnlock: false, autoCooldownMs: 0,      bufferCapacity: 5,  maxToolLevel: 0 },
  { level: 2, upgradeBonus: 3,  batchSize: 2, upgradeCost: 2000,  autoUnlock: false, autoCooldownMs: 0,      bufferCapacity: 8,  maxToolLevel: 1 },
  { level: 3, upgradeBonus: 5,  batchSize: 3, upgradeCost: 8000,  autoUnlock: false, autoCooldownMs: 0,      bufferCapacity: 12, maxToolLevel: 2 },
  { level: 4, upgradeBonus: 7,  batchSize: 4, upgradeCost: 25000, autoUnlock: true,  autoCooldownMs: 120000, bufferCapacity: 18, maxToolLevel: 2 },
  { level: 5, upgradeBonus: 10, batchSize: 5, upgradeCost: 80000, autoUnlock: true,  autoCooldownMs: 15000,  bufferCapacity: 25, maxToolLevel: 3 },
];

export const MAX_MINE_LEVEL = MINE_LEVELS.length;
export const MAX_WORKBENCH_LEVEL = WORKBENCH_LEVELS.length;

export function getMineConfig(level: number): MineLevel {
  return MINE_LEVELS[Math.min(Math.max(level, 1), MAX_MINE_LEVEL) - 1] ?? MINE_LEVELS[0];
}

export function getWorkbenchConfig(level: number): WorkbenchLevel {
  return WORKBENCH_LEVELS[Math.min(Math.max(level, 1), MAX_WORKBENCH_LEVEL) - 1] ?? WORKBENCH_LEVELS[0];
}
