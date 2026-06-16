import type { Quest } from '@/types';

// ============================================================
// Quest progress helpers
// Called from pages when relevant actions occur
// ============================================================

/** Increment quest 1 "打磨5次矿石" by 1 */
export function trackPolish(quests: Quest[]): Quest[] {
  return quests.map(q =>
    q.id === 1 && !q.claimed && q.progress < q.target
      ? { ...q, progress: q.progress + 1 }
      : q
  );
}

/** Mark quest 3 "首次打磨成功" as complete when upgrading to agate (grade 1) */
export function trackFirstUpgrade(quests: Quest[]): Quest[] {
  return quests.map(q =>
    q.id === 3 && !q.claimed
      ? { ...q, progress: q.target }
      : q
  );
}

/** Check quest 2 "收集3块玛瑙" based on current stone counts */
export function trackStoneCollection(quests: Quest[], stones: { grade: number }[]): Quest[] {
  const agateCount = stones.filter(s => s.grade === 1).length;
  return quests.map(q =>
    q.id === 2 && !q.claimed
      ? { ...q, progress: Math.min(agateCount, q.target) }
      : q
  );
}

/** Check quest 4 "工具大师" based on current tool counts */
export function trackToolMastery(quests: Quest[], tools: { level: number }[]): Quest[] {
  const profCount = tools.filter(t => t.level >= 1).length;
  return quests.map(q =>
    q.id === 4 && !q.claimed
      ? { ...q, progress: Math.min(profCount, q.target) }
      : q
  );
}

/** Complete quest 7 "商城购物" */
export function trackShopBuy(quests: Quest[]): Quest[] {
  return quests.map(q =>
    q.id === 7 && !q.claimed
      ? { ...q, progress: q.target }
      : q
  );
}

/** Complete quest 8 "清理背包" */
export function trackShopSell(quests: Quest[]): Quest[] {
  return quests.map(q =>
    q.id === 8 && !q.claimed
      ? { ...q, progress: q.target }
      : q
  );
}

/** Complete quest 9 "初次合成" */
export function trackFirstCraft(quests: Quest[]): Quest[] {
  return quests.map(q =>
    q.id === 9 && !q.claimed
      ? { ...q, progress: q.target }
      : q
  );
}

/** Check quest 5 "稀世珍品" — must own ALL three: 帝王绿(2-4), 蓝钻(3-2), 非洲之心(3-4) */
export function trackTreasureHunt(quests: Quest[], stones: { grade: number; subGrade: number }[]): Quest[] {
  const hasAll =
    stones.some(s => s.grade === 2 && s.subGrade === 4) &&
    stones.some(s => s.grade === 3 && s.subGrade === 2) &&
    stones.some(s => s.grade === 3 && s.subGrade === 4);
  return quests.map(q =>
    q.id === 5 && !q.claimed && hasAll
      ? { ...q, progress: q.target }
      : q
  );
}
