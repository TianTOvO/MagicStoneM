// ============================================================
// Canonical type definitions for Magic Stone
// Property names match the smart contract interfaces
// ============================================================

// Stone types — matches StoneNFT.sol
export interface Stone {
  id: number;
  grade: number;       // 0:原石 1:水晶 2:琥珀 3:玛瑙 4:玉石 5:翡翠 6:钻石
  subGrade: number;    // 0: none, 1-4: 子等级（仅 grade>=1 有效）
  damage: number;
  damageLimit: number;
  mysterious: boolean;
  isPolishable?: boolean;
  acquiredAt?: number; // Unix timestamp of when this stone was obtained
}

// Tool types — matches ToolNFT.sol
export interface Tool {
  id: number;
  level: number;       // 0: 普通, 1: 专业, 2: 顶级, 3: 传奇
  durability: number;
  durabilityMax: number;
  lossCoeff: number;           // 损耗影响系数
  durabilityConsumption: number; // 耐久消耗系数
}

// Quest types — matches Quest.sol
export interface Quest {
  id: number;
  type: string;         // '日常' | '成就' | '寻宝' | '团队'
  title: string;
  description?: string;
  progress: number;
  target: number;
  reward: number;
  claimed?: boolean;
  isPuzzle?: boolean;
}

// User data aggregate
export interface UserData {
  stones: Stone[];
  tools: Tool[];
  coins: number;
  quests: Quest[];
  /** 永久图鉴解锁记录：key = "grade-subGrade", value = 首次发现时间戳 */
  discoveredOres: Record<string, number>;
  /** 上次日常任务重置时间戳，用于每日 2AM 刷新判断 */
  lastDailyReset: number;
  /** 矿山等级 1-5 */
  mineLevel: number;
  /** 工作台暂存区 — 矿山产出优先放入此处，自动打磨从中取料 */
  workbenchBuffer: Stone[];
  /** 上次领取矿山产出时间戳 */
  mineLastCollect: number;
  /** 工作台等级 1-5 */
  workbenchLevel: number;
  /** 自动打磨：绑定工具 ID（null = 未绑定） */
  workbenchBoundToolId: number | null;
  /** 自动打磨：上次执行时间戳 */
  autoPolishLastTime: number;
  /** 自动打磨：最小等级 */
  autoPolishMinGrade: number;
  /** 自动打磨：最大等级 */
  autoPolishMaxGrade: number;
}

// Market types — matches Market.sol
export interface MarketListing {
  isStone: boolean;
  tokenId: number;
  seller: string;
  price: number;
}

export interface MarketOffer {
  isStone: boolean;
  tokenId: number;
  buyer: string;
  price: number;
  active: boolean;
}

export interface AuctionInfo {
  isStone: boolean;
  tokenId: number;
  seller: string;
  startPrice: number;
  minBidIncrement: number;
  endTime: number;
  highestBidder: string;
  highestBid: number;
  active: boolean;
}

// ============================================================
// Display name mappings
// ============================================================

/** 大等级名称 */
export const STONE_GRADE_NAMES: Record<number, string> = {
  0: '原石',
  1: '水晶',
  2: '琥珀',
  3: '玛瑙',
  4: '玉石',
  5: '翡翠',
  6: '钻石',
};

/** 子等级名称（key 为大等级） */
export const STONE_SUBGRADE_NAMES: Record<number, Record<number, string>> = {
  1: { 1: '白水晶', 2: '紫水晶', 3: '黄水晶', 4: '茶晶' },
  2: { 1: '金珀',   2: '血珀',   3: '蓝珀',   4: '虫珀' },
  3: { 1: '红玛瑙', 2: '绿玛瑙', 3: '蓝玛瑙', 4: '缠丝玛瑙' },
  4: { 1: '青玉',   2: '碧玉',   3: '墨玉',   4: '和田玉' },
  5: { 1: '糯种翡翠', 2: '冰种翡翠', 3: '玻璃种翡翠', 4: '帝王绿翡翠' },
  6: { 1: '普通钻石', 2: '蓝钻',     3: '粉钻',       4: '非洲之心' },
};

/** 等级颜色 */
export const STONE_GRADE_COLORS: Record<number, string> = {
  0: 'bg-stone-500',
  1: 'bg-teal-400',
  2: 'bg-amber-500',
  3: 'bg-orange-600',
  4: 'bg-emerald-600',
  5: 'bg-emerald-400',
  6: 'bg-cyan-400',
};

/** 等级文字颜色（用于标签等） */
export const STONE_GRADE_TEXT_COLORS: Record<number, string> = {
  0: 'text-stone-600',
  1: 'text-teal-600',
  2: 'text-amber-600',
  3: 'text-orange-700',
  4: 'text-emerald-700',
  5: 'text-emerald-500',
  6: 'text-cyan-600',
};

/** 等级边框颜色 */
export const STONE_GRADE_BORDER_COLORS: Record<number, string> = {
  0: 'border-stone-400',
  1: 'border-teal-400',
  2: 'border-amber-400',
  3: 'border-orange-500',
  4: 'border-emerald-600',
  5: 'border-emerald-400',
  6: 'border-cyan-400',
};

/** 矿石描述 */
export const STONE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: { 0: '未经打磨的原始矿石，一切奇迹的起点' },
  1: {
    1: '纯净透明，入门级宝石',
    2: '含微量锰元素，神秘紫光',
    3: '铁元素赋色，温暖金黄',
    4: '天然茶色，沉稳内敛',
  },
  2: {
    1: '金黄灿烂，最经典琥珀色',
    2: '深红如血，稀有珍品',
    3: '在紫外线下泛蓝光，极为罕见',
    4: '内含远古昆虫，时光胶囊',
  },
  3: {
    1: '铁元素渲染，热烈红艳',
    2: '铬元素沁染，翠意盎然',
    3: '钴元素沉淀，深邃如海',
    4: '层层叠叠的纹理，天然艺术',
  },
  4: {
    1: '淡雅青绿，君子之选',
    2: '翠绿欲滴，玉中上品',
    3: '漆黑如墨，沉稳大气',
    4: '白如凝脂，温润无瑕，玉中极品',
  },
  5: {
    1: '质地温润如糯米汤，半透明，入门级翡翠',
    2: '透明度高如冰块，清亮水头足',
    3: '完全透明如玻璃，极为纯净',
    4: '浓郁正阳绿，翡翠之王，拍卖级珍品',
  },
  6: {
    1: '标准无色钻石，璀璨夺目',
    2: '含硼元素呈蓝色，极度稀有',
    3: '阿盖尔矿传奇，粉色钻石中的梦幻之选',
    4: '530克拉无瑕巨钻，英国皇室权杖，钻石终极象征',
  },
};

/** 获取矿石完整显示名称 */
export function getStoneDisplayName(grade: number, subGrade: number): string {
  if (subGrade > 0 && STONE_SUBGRADE_NAMES[grade]?.[subGrade]) {
    return STONE_SUBGRADE_NAMES[grade][subGrade];
  }
  return STONE_GRADE_NAMES[grade] ?? '未知';
}

/** 获取等级编码（如 "2-3级"） */
export function getStoneGradeLabel(grade: number, subGrade: number): string {
  if (subGrade === 0) return `${grade}级`;
  return `${grade}-${subGrade}级`;
}

/** 获取矿石描述 */
export function getStoneDescription(grade: number, subGrade: number): string {
  return STONE_DESCRIPTIONS[grade]?.[subGrade] ?? '';
}

// ============================================================
// Collection (图鉴) helpers
// ============================================================

/** 图鉴中每个矿石条目的完整信息 */
export interface CollectionEntry {
  grade: number;
  subGrade: number;
  name: string;
  label: string;
  description: string;
  color: string;
  discovered: boolean;
  acquiredAt?: number; // timestamp of earliest discovery
  count: number;       // how many of this type the player owns
}

/** 所有可能存在子等级的矿石组合 */
export const ALL_ORE_COMBINATIONS: { grade: number; subGrade: number }[] = [
  { grade: 0, subGrade: 0 },
  { grade: 1, subGrade: 1 }, { grade: 1, subGrade: 2 }, { grade: 1, subGrade: 3 }, { grade: 1, subGrade: 4 },
  { grade: 2, subGrade: 1 }, { grade: 2, subGrade: 2 }, { grade: 2, subGrade: 3 }, { grade: 2, subGrade: 4 },
  { grade: 3, subGrade: 1 }, { grade: 3, subGrade: 2 }, { grade: 3, subGrade: 3 }, { grade: 3, subGrade: 4 },
  { grade: 4, subGrade: 1 }, { grade: 4, subGrade: 2 }, { grade: 4, subGrade: 3 }, { grade: 4, subGrade: 4 },
  { grade: 5, subGrade: 1 }, { grade: 5, subGrade: 2 }, { grade: 5, subGrade: 3 }, { grade: 5, subGrade: 4 },
  { grade: 6, subGrade: 1 }, { grade: 6, subGrade: 2 }, { grade: 6, subGrade: 3 }, { grade: 6, subGrade: 4 },
];

/** 黑市参考价（商城卖价，仅供参考） */
export const MARKET_REFERENCE_PRICE: Record<string, number> = {
  '0-0': 70,
  '1-1': 280,  '1-2': 490,  '1-3': 700,  '1-4': 1050,
  '2-1': 1750, '2-2': 2800, '2-3': 4200, '2-4': 9100,
  '3-1': 5600, '3-2': 9800, '3-3': 15400,'3-4': 35000,
  '4-1': 21000,'4-2': 31500,'4-3': 45500,'4-4': 84000,
  '5-1': 45500,'5-2': 63000,'5-3': 84000,'5-4': 112000,
  '6-1': 105000,'6-2': 140000,'6-3': 182000,'6-4': 231000,
};

/** 获取矿石的市场参考价 */
export function getMarketReferencePrice(grade: number, subGrade: number): number {
  return MARKET_REFERENCE_PRICE[`${grade}-${subGrade}`] ?? 0;
}
export function buildCollection(stones: Stone[], discoveredOres: Record<string, number> = {}): CollectionEntry[] {
  // Group current stones by grade+subGrade
  const groups: Record<string, { count: number; earliestAt?: number }> = {};
  for (const s of stones) {
    const key = `${s.grade}-${s.subGrade}`;
    if (!groups[key]) {
      groups[key] = { count: 0, earliestAt: undefined };
    }
    groups[key].count++;
    if (s.acquiredAt !== undefined) {
      if (groups[key].earliestAt === undefined || s.acquiredAt < groups[key].earliestAt!) {
        groups[key].earliestAt = s.acquiredAt;
      }
    }
  }

  return ALL_ORE_COMBINATIONS.map(({ grade, subGrade }) => {
    const key = `${grade}-${subGrade}`;
    const group = groups[key];
    const permanent = discoveredOres[key];

    // Discovered if currently owned OR permanently unlocked
    const discovered = group !== undefined || permanent !== undefined;

    // Use earliest timestamp from current stones or permanent record
    const acquiredAt = group?.earliestAt ?? permanent;

    return {
      grade,
      subGrade,
      name: getStoneDisplayName(grade, subGrade),
      label: getStoneGradeLabel(grade, subGrade),
      description: getStoneDescription(grade, subGrade),
      color: STONE_GRADE_COLORS[grade],
      discovered,
      acquiredAt,
      count: group?.count ?? 0,
    };
  });
}

/** 判断矿石是否可打磨（仅 grade 0 原石系列） */
export function isStonePolishable(stone: Stone): boolean {
  return stone.grade === 0;
}

// ============================================================
// Sub-grade probability (shared between contract & frontend)
// ============================================================

export const SUBGRADE_PROBABILITIES: { subGrade: number; chance: number; label: string }[] = [
  { subGrade: 1, chance: 40, label: '40%' },
  { subGrade: 2, chance: 28, label: '28%' },
  { subGrade: 3, chance: 18, label: '18%' },
  { subGrade: 4, chance: 14, label: '14%' },
];

/** 前端模拟子等级随机 */
export function rollSubGrade(grade: number): number {
  if (grade < 1) return 0;
  const rand = Math.random() * 100;
  if (rand < 40) return 1;
  if (rand < 68) return 2;
  if (rand < 86) return 3;
  return 4;
}

export const TOOL_LEVEL_NAMES: Record<number, string> = {
  0: '普通',
  1: '专业',
  2: '顶级',
  3: '传奇',
};

export const TOOL_LEVEL_COLORS: Record<number, string> = {
  0: 'bg-gray-500',
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-purple-500',
};

export const QUEST_TYPE_INFO: Record<string, { color: string; icon: string }> = {
  '日常':   { color: 'bg-blue-600',   icon: 'calendar-day' },
  '成就':   { color: 'bg-amber-600',  icon: 'trophy' },
  '寻宝':   { color: 'bg-purple-600', icon: 'map-marked-alt' },
  '团队':   { color: 'bg-green-600',  icon: 'users' },
};
