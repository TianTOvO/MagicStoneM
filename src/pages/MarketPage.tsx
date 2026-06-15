import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { Stone, STONE_GRADE_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, getStoneGradeLabel } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createRNG, pickN, randInt, formatCountdown, getMarketSeed } from '@/lib/timeRandom';

// ---------- Types ----------

interface MerchantOffer {
  id: string;
  isBuyOrder: boolean; // true = merchant buys from player, false = merchant sells to player
  grade?: number;
  subGrade?: number;
  level?: number;
  name: string;
  price: number;
}

interface Merchant {
  offers: MerchantOffer[]; // combined buy + sell orders
}

// ---------- All ores including diamond ----------

const ALL_ORES = [
  { grade: 0, subGrade: 0 },  // 原石
  { grade: 1, subGrade: 0 },  // 玛瑙
  { grade: 2, subGrade: 1 },  // 糯种翡翠
  { grade: 2, subGrade: 2 },  // 冰种翡翠
  { grade: 2, subGrade: 3 },  // 玻璃种翡翠
  { grade: 2, subGrade: 4 },  // 帝王绿翡翠
  { grade: 3, subGrade: 1 },  // 普通钻石
  { grade: 3, subGrade: 2 },  // 蓝钻
  { grade: 3, subGrade: 3 },  // 粉钻
  { grade: 3, subGrade: 4 },  // 非洲之心
];

const ALL_TOOL_LEVELS = [0, 1, 2, 3];

// ---------- Generator ----------

function generateMerchants(seed: number): { stone: Merchant; tool: Merchant } {
  const rng = createRNG(seed);

  function makeOreOffers(): MerchantOffer[] {
    const picked = pickN(ALL_ORES, randInt(3, 6, rng), rng);
    const offers: MerchantOffer[] = [];
    for (const o of picked) {
      const name = getStoneDisplayName(o.grade, o.subGrade);
      const basePrice = [80, 600, 1400, 2000, 3200, 5000, 3500, 5000, 7000, 12000][
        ALL_ORES.findIndex(x => x.grade === o.grade && x.subGrade === o.subGrade)
      ];
      // Merchant buys from player (求购) — lower price
      offers.push({
        id: `buy-ore-${o.grade}-${o.subGrade}`,
        isBuyOrder: true, grade: o.grade, subGrade: o.subGrade,
        name, price: Math.max(10, Math.floor(basePrice * (0.4 + rng() * 0.3))),
      });
      // Merchant sells to player (出售) — higher price
      offers.push({
        id: `sell-ore-${o.grade}-${o.subGrade}`,
        isBuyOrder: false, grade: o.grade, subGrade: o.subGrade,
        name, price: Math.max(20, Math.floor(basePrice * (1.1 + rng() * 0.6))),
      });
    }
    return offers;
  }

  function makeToolOffers(): MerchantOffer[] {
    const picked = pickN(ALL_TOOL_LEVELS, randInt(2, 4, rng), rng);
    const offers: MerchantOffer[] = [];
    for (const lvl of picked) {
      const name = TOOL_LEVEL_NAMES[lvl] + '工具';
      const basePrice = [50, 300, 1200, 2500][lvl];
      offers.push({
        id: `buy-tool-${lvl}`,
        isBuyOrder: true, level: lvl, name,
        price: Math.max(5, Math.floor(basePrice * (0.3 + rng() * 0.3))),
      });
      offers.push({
        id: `sell-tool-${lvl}`,
        isBuyOrder: false, level: lvl, name,
        price: Math.max(10, Math.floor(basePrice * (1.2 + rng() * 0.6))),
      });
    }
    return offers;
  }

  return { stone: { offers: makeOreOffers() }, tool: { offers: makeToolOffers() } };
}

// ---------- Component ----------

export default function MarketPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [marketSeed, setMarketSeed] = useState(getMarketSeed());
  const [countdown, setCountdown] = useState(formatCountdown(3600000));
  const [activeTab, setActiveTab] = useState<'stone' | 'tool'>('stone');
  const [selectedOffer, setSelectedOffer] = useState<MerchantOffer | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const merchants = useMemo(() => generateMerchants(marketSeed), [marketSeed]);
  const merchant = activeTab === 'stone' ? merchants.stone : merchants.tool;
  const buyOrders = merchant.offers.filter(o => o.isBuyOrder);
  const sellOrders = merchant.offers.filter(o => !o.isBuyOrder);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(3600000)), 1000);
    return () => clearInterval(timer);
  }, [marketSeed]);

  useEffect(() => {
    const check = setInterval(() => {
      const cur = getMarketSeed();
      if (cur !== marketSeed) setMarketSeed(cur);
    }, 1000);
    return () => clearInterval(check);
  }, [marketSeed]);

  // Player sells to merchant (求购)
  const handleSellToMerchant = useCallback(() => {
    if (!selectedOffer || !selectedOffer.isBuyOrder) return;
    if (activeTab === 'stone') {
      const owned = userData.stones.filter(s => s.grade === selectedOffer.grade && s.subGrade === selectedOffer.subGrade);
      if (owned.length < quantity) { toast.error('你没有足够数量的该矿石'); return; }
      const toRemove = new Set(owned.slice(0, quantity).map(s => s.id));
      updateUserData({
        stones: userData.stones.filter(s => !toRemove.has(s.id)),
        coins: userData.coins + selectedOffer.price * quantity,
      });
    } else {
      const owned = userData.tools.filter(t => t.level === selectedOffer.level);
      if (owned.length < quantity) { toast.error('你没有足够数量的该工具'); return; }
      const toRemove = new Set(owned.slice(0, quantity).map(t => t.id));
      updateUserData({
        tools: userData.tools.filter(t => !toRemove.has(t.id)),
        coins: userData.coins + selectedOffer.price * quantity,
      });
    }
    toast.success(`卖出 ${quantity} 个${selectedOffer.name}，获得 ${selectedOffer.price * quantity} 币`);
    setShowConfirm(false); setSelectedOffer(null); setQuantity(1);
  }, [selectedOffer, quantity, activeTab, userData, updateUserData]);

  // Player buys from merchant (出售)
  const handleBuyFromMerchant = useCallback(() => {
    if (!selectedOffer || selectedOffer.isBuyOrder) return;
    const total = selectedOffer.price * quantity;
    if (userData.coins < total) { toast.error('游戏币不足'); return; }
    if (activeTab === 'stone') {
      const newStones: Stone[] = [...userData.stones];
      for (let i = 0; i < quantity; i++) {
        newStones.push({
          id: Date.now() + i, grade: selectedOffer.grade ?? 0, subGrade: selectedOffer.subGrade ?? 0,
          damage: 0, damageLimit: 100 + Math.floor(Math.random() * 150),
          mysterious: false, isPolishable: true, acquiredAt: Date.now(),
        });
      }
      updateUserData({ stones: newStones, coins: userData.coins - total });
    } else {
      const newTools = userData.tools.slice();
      for (let i = 0; i < quantity; i++) {
        newTools.push({
          id: Date.now() + i, level: selectedOffer.level ?? 0,
          durability: 100, durabilityMax: 100,
          lossCoeff: [1, 0.8, 0.5, 0.2][selectedOffer.level ?? 0],
          durabilityConsumption: [1, 0.8, 0.5, 0.2][selectedOffer.level ?? 0],
        });
      }
      updateUserData({ tools: newTools, coins: userData.coins - total });
    }
    toast.success(`购买 ${quantity} 个${selectedOffer.name}，花费 ${total} 币`);
    setShowConfirm(false); setSelectedOffer(null); setQuantity(1);
  }, [selectedOffer, quantity, activeTab, userData, updateUserData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-gray-800 via-purple-900 to-gray-800 rounded-2xl p-6 border-2 border-purple-500 shadow-xl text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-1 text-purple-200">
              <i className="fas fa-mask mr-2"></i>黑市商人
            </h1>
            <p className="text-purple-300 text-sm">神秘商人出没 · 价格浮动 · 每1小时刷新</p>
          </div>
          <div className="text-center bg-purple-800/50 rounded-xl px-4 py-2 border border-purple-500">
            <p className="text-xs text-purple-400">商人离开倒计时</p>
            <p className="text-xl font-black text-purple-300 tabular-nums">{countdown}</p>
          </div>
        </div>
      </motion.div>

      {/* Tab */}
      <div className="flex gap-2">
        {([
          { key: 'stone' as const, label: '💎 矿石商人', icon: 'fa-gem' },
          { key: 'tool' as const, label: '🔧 工具商人', icon: 'fa-wrench' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 flex-1 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Sell to merchant (求购) */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center">
          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full mr-2">求购</span>
          商人想从你这里买
        </h2>
        {buyOrders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {buyOrders.map(o => {
              const owned = activeTab === 'stone'
                ? userData.stones.filter(s => s.grade === o.grade && s.subGrade === o.subGrade).length
                : userData.tools.filter(t => t.level === o.level).length;
              return (
                <motion.div key={o.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (owned > 0) { setSelectedOffer(o); setQuantity(1); setShowConfirm(true); } }}
                  className={`rounded-xl p-4 border-2 shadow-md transition-all ${
                    owned > 0
                      ? 'bg-white border-green-300 hover:border-green-500 hover:scale-105 cursor-pointer'
                      : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="relative h-16 flex items-center justify-center mb-2">
                    <div className={`absolute inset-0 rounded-full ${
                      activeTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]
                    } opacity-20 blur-lg`} />
                    <i className={`fas ${activeTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-3xl text-gray-600 relative`} />
                  </div>
                  <h3 className="text-sm font-bold text-center text-gray-800">{o.name}</h3>
                  <p className="text-xs text-center text-gray-500 mt-0.5">
                    {activeTab === 'stone' ? getStoneGradeLabel(o.grade ?? 0, o.subGrade ?? 0) : TOOL_LEVEL_NAMES[o.level ?? 0]}
                  </p>
                  <p className="text-center font-bold text-green-600 text-sm mt-2">
                    收购价 {o.price} 币
                  </p>
                  <p className="text-xs text-center text-gray-400 mt-0.5">你拥有: {owned}</p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">商人今日没有求购需求</p>
        )}
      </div>

      {/* Buy from merchant (出售) */}
      <div>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center">
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-2">出售</span>
          商人卖给你的
        </h2>
        {sellOrders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sellOrders.map(o => (
              <motion.div key={o.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedOffer(o); setQuantity(1); setShowConfirm(true); }}
                className="rounded-xl p-4 border-2 shadow-md bg-white border-red-200 hover:border-red-400 hover:scale-105 cursor-pointer transition-all"
              >
                <div className="relative h-16 flex items-center justify-center mb-2">
                  <div className={`absolute inset-0 rounded-full ${
                    activeTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]
                  } opacity-20 blur-lg`} />
                  <i className={`fas ${activeTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-3xl text-gray-600 relative`} />
                </div>
                <h3 className="text-sm font-bold text-center text-gray-800">{o.name}</h3>
                <p className="text-xs text-center text-gray-500 mt-0.5">
                  {activeTab === 'stone' ? getStoneGradeLabel(o.grade ?? 0, o.subGrade ?? 0) : TOOL_LEVEL_NAMES[o.level ?? 0]}
                </p>
                <p className="text-center font-bold text-red-600 text-sm mt-2">
                  售价 {o.price} 币
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">商人今日没有出售物品</p>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && selectedOffer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowConfirm(false); setSelectedOffer(null); }}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-purple-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {selectedOffer.isBuyOrder ? '卖给商人' : '从商人购买'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedOffer.name} · 单价 {selectedOffer.price} 币
            </p>
            {selectedOffer.isBuyOrder && (
              <p className="text-xs text-gray-400 mb-3">
                可出售数量: {activeTab === 'stone'
                  ? userData.stones.filter(s => s.grade === selectedOffer.grade && s.subGrade === selectedOffer.subGrade).length
                  : userData.tools.filter(t => t.level === selectedOffer.level).length}
              </p>
            )}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-700 mb-1 block">数量</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 bg-gray-200 rounded-lg font-bold">-</button>
                <span className="text-lg font-bold w-10 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-8 h-8 bg-gray-200 rounded-lg font-bold">+</button>
              </div>
            </div>
            <div className="flex justify-between text-lg mb-4 bg-purple-50 rounded-lg p-3">
              <span className="font-bold">{selectedOffer.isBuyOrder ? '获得' : '花费'}</span>
              <span className={`font-black text-xl ${selectedOffer.isBuyOrder ? 'text-green-600' : 'text-red-600'}`}>
                {selectedOffer.price * quantity} 币
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setSelectedOffer(null); }}
                className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button
                onClick={selectedOffer.isBuyOrder ? handleSellToMerchant : handleBuyFromMerchant}
                disabled={selectedOffer.isBuyOrder ? false : userData.coins < selectedOffer.price * quantity}
                className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg disabled:opacity-50 ${
                  selectedOffer.isBuyOrder
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
              >确认</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
