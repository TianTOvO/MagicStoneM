import type { Stone, Tool } from '@/types';
import { getMineConfig, getWorkbenchConfig } from '@/data/mineConfig';
import { rollSubGrade, getStoneDisplayName } from '@/types';

// ============================================================
// Mine production logic
// ============================================================

export interface MineState {
  produced: Stone[];
  countdown: number;
  isFull: boolean;
}

export function calcMineProduction(
  mineLevel: number,
  lastCollect: number,
  existingStoneCount: number,
): MineState {
  const config = getMineConfig(mineLevel);
  const now = Date.now();
  const elapsed = now - lastCollect;
  const maxProduce = Math.min(
    Math.floor(elapsed / config.intervalMs),
    config.storageMax,
  );

  const produced: Stone[] = [];
  let nextStoneTime = lastCollect + config.intervalMs;

  for (let i = 0; i < maxProduce; i++) {
    produced.push(generateMineStone(config, existingStoneCount + i + 1));
  }

  const countdown = Math.max(0, nextStoneTime + maxProduce * config.intervalMs - now);
  const isFull = produced.length >= config.storageMax;

  return { produced, countdown, isFull };
}

function generateMineStone(config: ReturnType<typeof getMineConfig>, nextId: number): Stone {
  const roll = Math.random();

  for (const bonus of [...config.bonusOres].sort((a, b) => b.chance - a.chance)) {
    if (roll < bonus.chance) {
      const subGrade = bonus.grade >= 2 ? rollSubGrade(bonus.grade) : 0;
      return {
        id: Date.now() + nextId,
        grade: bonus.grade,
        subGrade,
        damage: 0,
        damageLimit: 80 + Math.floor(Math.random() * 120),
        mysterious: false,
        isPolishable: true,
        acquiredAt: Date.now(),
      };
    }
  }

  return {
    id: Date.now() + nextId,
    grade: 0,
    subGrade: 0,
    damage: 0,
    damageLimit: 80 + Math.floor(Math.random() * 40),
    mysterious: false,
    isPolishable: true,
    acquiredAt: Date.now(),
  };
}

// ============================================================
// Auto-polish — takes from workbench buffer, batch results to backpack
// ============================================================

export interface AutoPolishResult {
  polished: boolean;
  count: number;
  results: string[];
}

export function calcAutoPolish(
  workbenchLevel: number,
  lastAutoPolish: number,
  buffer: Stone[],
  backpack: Stone[],
  tools: Tool[],
  boundToolId: number | null,
): { result: AutoPolishResult; newLastTime: number; newBuffer: Stone[]; newBackpack: Stone[]; newTools: Tool[] } | null {
  const wb = getWorkbenchConfig(workbenchLevel);
  if (!wb.autoUnlock) return null;

  const now = Date.now();
  if (now - lastAutoPolish < wb.autoCooldownMs) return null;
  if (buffer.length === 0) return null;

  // Use bound tool
  const tool = boundToolId != null ? tools.find(t => t.id === boundToolId) : tools.find(t => t.durability > 0);
  if (!tool || tool.durability <= 0) return null;

  const durPerStone = Math.max(1, Math.floor(5 * tool.durabilityConsumption));
  const batchCount = Math.min(wb.batchSize, buffer.length, Math.floor(tool.durability / durPerStone));
  if (batchCount === 0) return null;

  const newBuffer = [...buffer];
  const newBackpack = [...backpack];
  const newTools = [...tools];
  const toolIdx = newTools.findIndex(t => t.id === tool.id);
  const t = { ...newTools[toolIdx] };
  const results: string[] = [];

  // Take first batchCount stones from buffer
  const toPolish = newBuffer.splice(0, batchCount);

  for (const stone of toPolish) {
    const probs = stone.mysterious
      ? [0.15, 0.25, 0.22, 0.18, 0.12, 0.05, 0.03]
      : [0.35, 0.30, 0.18, 0.10, 0.05, 0.015, 0.005];

    // Tool + workbench level bonus: shift probability to higher grades
    const shift = t.level * 0.01 + wb.upgradeBonus * 0.005;
    for (let i = 0; i < 3; i++) probs[i] = Math.max(0, probs[i] - shift / 3);
    probs[3] += shift * 0.4;
    probs[4] += shift * 0.3;
    probs[5] += shift * 0.2;
    probs[6] += shift * 0.1;

    const roll = Math.random();
    let newGrade = 0;
    let cum = 0;
    for (let g = 0; g < probs.length; g++) {
      cum += probs[g];
      if (roll < cum) { newGrade = g; break; }
    }

    if (newGrade > 0) {
      const newSubGrade = newGrade >= 1 ? rollSubGrade(newGrade) : 0;
      newBackpack.push({
        id: Date.now() + Math.random(),
        grade: newGrade, subGrade: newSubGrade,
        damage: 0, damageLimit: 80 + Math.floor(Math.random() * 120),
        mysterious: false, isPolishable: false, acquiredAt: Date.now(),
      });
      results.push(getStoneDisplayName(newGrade, newSubGrade));
    } else {
      results.push('未发现矿石');
    }

    const durLoss = Math.max(1, Math.floor(5 * t.durabilityConsumption));
    t.durability = Math.max(0, t.durability - durLoss);
  }

  newTools[toolIdx] = t;

  return {
    result: { polished: true, count: batchCount, results },
    newLastTime: now,
    newBuffer,
    newBackpack,
    newTools,
  };
}
