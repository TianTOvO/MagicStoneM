import { UserData } from '@/types';

const now = Date.now();

// 初始数据 — 纯新手状态
export const mockUserData: UserData = {
  stones: [
    { id: 1, grade: 0, subGrade: 0, damage: 0, damageLimit: 100, mysterious: false, isPolishable: true, acquiredAt: now - 60000 },
    { id: 2, grade: 0, subGrade: 0, damage: 0, damageLimit: 110, mysterious: false, isPolishable: true, acquiredAt: now - 30000 },
    { id: 3, grade: 0, subGrade: 0, damage: 0, damageLimit: 95,  mysterious: false, isPolishable: true, acquiredAt: now },
  ],
  tools: [
    { id: 1, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 2, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
  ],
  coins: 2000,
  discoveredOres: {
    '0-0': now,
  },
  quests: [
    { id: 1, type: '日常', title: '打磨3次矿石',   description: '打磨任意矿石3次',           target: 3,  progress: 0, reward: 150 },
    { id: 2, type: '日常', title: '获得2块玛瑙',   description: '通过打磨或购买获得2块玛瑙',   target: 2,  progress: 0, reward: 300 },
    { id: 7, type: '日常', title: '商城购物',      description: '在商城购买任意物品1次',        target: 1,  progress: 0, reward: 100 },
    { id: 8, type: '日常', title: '清理背包',      description: '出售任意物品1次',              target: 1,  progress: 0, reward: 100 },
    { id: 9, type: '日常', title: '初次合成',      description: '合成1次工具',                  target: 1,  progress: 0, reward: 200 },
    { id: 3, type: '成就', title: '首次打磨成功',   description: '成功将原石升级为玛瑙',        target: 1,  progress: 0, reward: 100 },
    { id: 4, type: '成就', title: '工具大师',      description: '拥有3个专业级及以上工具',      target: 3,  progress: 0, reward: 500 },
    { id: 5, type: '寻宝', title: '稀世珍品',      description: '集齐帝王绿翡翠、蓝钻和非洲之心',  target: 1,  progress: 0, reward: 20000 },
  ],
  lastDailyReset: now,
};
