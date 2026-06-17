// ============================================================
// Centralized price catalog for shop, market, and reference
// ============================================================

export interface OrePrice {
  grade: number;
  subGrade: number;
  name: string;
  shopBuy: number;   // 商城购买价
  shopSell: number;  // 商城出售价（买价的 70%）
}

export interface ToolPrice {
  level: number;
  name: string;
  shopBuy: number;
  shopSell: number;
  durabilityMax: number;
  lossCoeff: number;
  durabilityConsumption: number;
}

/** 所有矿石的商城定价 */
export const ORE_PRICES: OrePrice[] = [
  // Grade 0: 原石
  { grade: 0, subGrade: 0, name: '原石',       shopBuy: 100,  shopSell: 70 },
  // Grade 1: 水晶
  { grade: 1, subGrade: 1, name: '白水晶',     shopBuy: 400,   shopSell: 280 },
  { grade: 1, subGrade: 2, name: '紫水晶',     shopBuy: 700,   shopSell: 490 },
  { grade: 1, subGrade: 3, name: '黄水晶',     shopBuy: 1000,  shopSell: 700 },
  { grade: 1, subGrade: 4, name: '茶晶',       shopBuy: 1500,  shopSell: 1050 },
  // Grade 2: 琥珀
  { grade: 2, subGrade: 1, name: '金珀',       shopBuy: 2500,  shopSell: 1750 },
  { grade: 2, subGrade: 2, name: '血珀',       shopBuy: 4000,  shopSell: 2800 },
  { grade: 2, subGrade: 3, name: '蓝珀',       shopBuy: 6000,  shopSell: 4200 },
  { grade: 2, subGrade: 4, name: '虫珀',       shopBuy: 13000, shopSell: 9100 },
  // Grade 3: 玛瑙
  { grade: 3, subGrade: 1, name: '红玛瑙',     shopBuy: 8000,  shopSell: 5600 },
  { grade: 3, subGrade: 2, name: '绿玛瑙',     shopBuy: 14000, shopSell: 9800 },
  { grade: 3, subGrade: 3, name: '蓝玛瑙',     shopBuy: 22000, shopSell: 15400 },
  { grade: 3, subGrade: 4, name: '缠丝玛瑙',   shopBuy: 50000, shopSell: 35000 },
  // Grade 4: 玉石
  { grade: 4, subGrade: 1, name: '青玉',       shopBuy: 30000, shopSell: 21000 },
  { grade: 4, subGrade: 2, name: '碧玉',       shopBuy: 45000, shopSell: 31500 },
  { grade: 4, subGrade: 3, name: '墨玉',       shopBuy: 65000, shopSell: 45500 },
  { grade: 4, subGrade: 4, name: '和田玉',     shopBuy: 120000,shopSell: 84000 },
  // Grade 5: 翡翠
  { grade: 5, subGrade: 1, name: '糯种翡翠',    shopBuy: 65000, shopSell: 45500 },
  { grade: 5, subGrade: 2, name: '冰种翡翠',    shopBuy: 90000, shopSell: 63000 },
  { grade: 5, subGrade: 3, name: '玻璃种翡翠',  shopBuy: 120000,shopSell: 84000 },
  { grade: 5, subGrade: 4, name: '帝王绿翡翠',  shopBuy: 160000,shopSell: 112000 },
  // Grade 6: 钻石
  { grade: 6, subGrade: 1, name: '普通钻石',    shopBuy: 150000,shopSell: 105000 },
  { grade: 6, subGrade: 2, name: '蓝钻',       shopBuy: 200000,shopSell: 140000 },
  { grade: 6, subGrade: 3, name: '粉钻',       shopBuy: 260000,shopSell: 182000 },
  { grade: 6, subGrade: 4, name: '非洲之心',    shopBuy: 330000,shopSell: 231000 },
];

/** 所有工具的商城定价 */
export const TOOL_PRICES: ToolPrice[] = [
  { level: 0, name: '普通工具', shopBuy: 50,   shopSell: 35,   durabilityMax: 100, lossCoeff: 1,   durabilityConsumption: 1 },
  { level: 1, name: '专业工具', shopBuy: 300,  shopSell: 210,  durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8 },
  { level: 2, name: '顶级工具', shopBuy: 1200, shopSell: 840,  durabilityMax: 100, lossCoeff: 0.5, durabilityConsumption: 0.5 },
  { level: 3, name: '传奇工具', shopBuy: 2500, shopSell: 1750, durabilityMax: 150, lossCoeff: 0.2, durabilityConsumption: 0.2 },
];

/** 根据等级查找矿石定价 */
export function getOrePrice(grade: number, subGrade: number): OrePrice | undefined {
  return ORE_PRICES.find(o => o.grade === grade && o.subGrade === subGrade);
}

/** 根据等级查找工具定价 */
export function getToolPrice(level: number): ToolPrice | undefined {
  return TOOL_PRICES.find(t => t.level === level);
}

// ============================================================
// Market price range (黑市)
// ============================================================

/** 黑市价格倍率范围 */
export const MARKET_MIN_MULTIPLIER = 0.6;  // 60%
export const MARKET_MAX_MULTIPLIER = 2.0;  // 200%

/** 黑市价格 = 商城买价 × 随机倍率 */
export function generateMarketPrice(shopBuyPrice: number, rng: () => number): number {
  const multiplier = MARKET_MIN_MULTIPLIER + rng() * (MARKET_MAX_MULTIPLIER - MARKET_MIN_MULTIPLIER);
  return Math.max(1, Math.floor(shopBuyPrice * multiplier));
}

// ============================================================
// Shop sell price with wear
// ============================================================

/**
 * 矿石出售实际价格（受损耗影响）
 * 出售价 = 基础卖价 × (1 - 损耗/损耗上限 × 0.5)
 */
export function calcStoneSellPrice(baseSellPrice: number, damage: number, damageLimit: number): number {
  if (damageLimit <= 0) return baseSellPrice;
  const wearRatio = damage / damageLimit;
  return Math.max(1, Math.floor(baseSellPrice * (1 - wearRatio * 0.5)));
}

/**
 * 工具出售实际价格（受耐久影响）
 * 出售价 = 基础卖价 × (耐久/耐久上限)
 */
export function calcToolSellPrice(baseSellPrice: number, durability: number, durabilityMax: number): number {
  if (durabilityMax <= 0) return baseSellPrice;
  return Math.max(1, Math.floor(baseSellPrice * (durability / durabilityMax)));
}
