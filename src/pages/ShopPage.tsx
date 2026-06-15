import { useContext, useState, useEffect, useMemo } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { Stone, Tool, STONE_GRADE_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, getStoneGradeLabel, getStoneDescription } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createRNG, pickN, randInt, getShopSeed, getMarketSeed, formatCountdown } from '@/lib/timeRandom';

// ==================== Shop (商城) Types & Generator ====================

interface ShopItemDef {
  category: 'stone' | 'tool';
  grade?: number;
  subGrade?: number;
  level?: number;
  mysterious?: boolean;
  basePrice: number;
}

interface ShopItem {
  id: string;
  def: ShopItemDef;
  name: string;
  description: string;
  price: number;
  damageLimitMin: number;
  damageLimitMax: number;
  durabilityMax: number;
}

const ORE_CATALOG: ShopItemDef[] = [
  { category: 'stone', grade: 0, subGrade: 0, mysterious: false, basePrice: 80 },
  { category: 'stone', grade: 0, subGrade: 0, mysterious: true,  basePrice: 400 },
  { category: 'stone', grade: 1, subGrade: 0, mysterious: false, basePrice: 600 },
  { category: 'stone', grade: 1, subGrade: 0, mysterious: true,  basePrice: 1200 },
  { category: 'stone', grade: 2, subGrade: 1, mysterious: false, basePrice: 1400 },
  { category: 'stone', grade: 2, subGrade: 2, mysterious: false, basePrice: 2000 },
  { category: 'stone', grade: 2, subGrade: 3, mysterious: false, basePrice: 3200 },
  { category: 'stone', grade: 2, subGrade: 4, mysterious: false, basePrice: 5000 },
];

const TOOL_CATALOG: ShopItemDef[] = [
  { category: 'tool', level: 0, basePrice: 50 },
  { category: 'tool', level: 1, basePrice: 300 },
  { category: 'tool', level: 2, basePrice: 1200 },
  { category: 'tool', level: 3, basePrice: 2500 },
];

function generateShop(seed: number): ShopItem[] {
  const rng = createRNG(seed);
  const items: ShopItem[] = [];

  const ores = pickN(ORE_CATALOG, randInt(3, 5, rng), rng);
  for (const def of ores) {
    const grade = def.grade ?? 0;
    const subGrade = def.subGrade ?? 0;
    const name = def.mysterious ? '神秘原石' : getStoneDisplayName(grade, subGrade);
    const desc = def.mysterious ? '蕴含神秘力量的特殊矿石' : getStoneDescription(grade, subGrade);
    items.push({
      id: `shop-${def.category}-${grade}-${subGrade}-${def.mysterious ? 'm' : 'n'}`,
      def, name,
      description: desc || name,
      price: Math.max(10, def.basePrice + randInt(-30, 50, rng)),
      damageLimitMin: grade === 0 ? 80 : grade === 1 ? 150 : 180,
      damageLimitMax: grade === 0 ? 120 : grade === 1 ? 200 : 280,
      durabilityMax: 100,
    });
  }

  const tools = pickN(TOOL_CATALOG, randInt(2, 3, rng), rng);
  for (const def of tools) {
    const level = def.level ?? 0;
    items.push({
      id: `shop-${def.category}-${level}`,
      def,
      name: TOOL_LEVEL_NAMES[level] + '工具',
      description: ['能用就行', '"这个就叫专业~"', '每一次打磨都格外自信', '由传奇工匠打造'][level],
      price: Math.max(10, def.basePrice + randInt(-10, 30, rng)),
      damageLimitMin: 80, damageLimitMax: 120, durabilityMax: 100,
    });
  }

  return items;
}

// ==================== Market (黑市) Types & Generator ====================

interface MerchantOffer {
  id: string;
  isBuyOrder: boolean;
  grade?: number;
  subGrade?: number;
  level?: number;
  name: string;
  price: number;
}

const ALL_ORES = [
  { grade: 0, subGrade: 0 }, { grade: 1, subGrade: 0 },
  { grade: 2, subGrade: 1 }, { grade: 2, subGrade: 2 },
  { grade: 2, subGrade: 3 }, { grade: 2, subGrade: 4 },
  { grade: 3, subGrade: 1 }, { grade: 3, subGrade: 2 },
  { grade: 3, subGrade: 3 }, { grade: 3, subGrade: 4 },
];
const ALL_TOOL_LEVELS = [0, 1, 2, 3];

function generateMerchants(seed: number): { stone: { offers: MerchantOffer[] }; tool: { offers: MerchantOffer[] } } {
  const rng = createRNG(seed);

  function makeOreOffers(): MerchantOffer[] {
    const picked = pickN(ALL_ORES, randInt(3, 6, rng), rng);
    const offers: MerchantOffer[] = [];
    for (const o of picked) {
      const name = getStoneDisplayName(o.grade, o.subGrade);
      const basePrice = [80, 600, 1400, 2000, 3200, 5000, 3500, 5000, 7000, 12000][
        ALL_ORES.findIndex(x => x.grade === o.grade && x.subGrade === o.subGrade)
      ];
      offers.push({
        id: `buy-ore-${o.grade}-${o.subGrade}`, isBuyOrder: true,
        grade: o.grade, subGrade: o.subGrade, name,
        price: Math.max(10, Math.floor(basePrice * (0.4 + rng() * 0.3))),
      });
      offers.push({
        id: `sell-ore-${o.grade}-${o.subGrade}`, isBuyOrder: false,
        grade: o.grade, subGrade: o.subGrade, name,
        price: Math.max(20, Math.floor(basePrice * (1.1 + rng() * 0.6))),
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
        id: `buy-tool-${lvl}`, isBuyOrder: true, level: lvl, name,
        price: Math.max(5, Math.floor(basePrice * (0.3 + rng() * 0.3))),
      });
      offers.push({
        id: `sell-tool-${lvl}`, isBuyOrder: false, level: lvl, name,
        price: Math.max(10, Math.floor(basePrice * (1.2 + rng() * 0.6))),
      });
    }
    return offers;
  }

  return { stone: { offers: makeOreOffers() }, tool: { offers: makeToolOffers() } };
}

// ==================== Main Page ====================

type StoreTab = 'shop' | 'market';

export default function ShopPage() {
  const { userData, updateUserData } = useContext(UserDataContext);

  // Sub-tab
  const [storeTab, setStoreTab] = useState<StoreTab>('shop');

  // Shop state
  const [shopSeed, setShopSeed] = useState(getShopSeed());
  const [shopCountdown, setShopCountdown] = useState(formatCountdown(600000));

  // Market state
  const [marketSeed, setMarketSeed] = useState(getMarketSeed());
  const [marketCountdown, setMarketCountdown] = useState(formatCountdown(3600000));
  const [marketTab, setMarketTab] = useState<'stone' | 'tool'>('stone');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    name: string;
    description?: string;
    price: number;
    isBuy: boolean; // true = player buys, false = player sells
    onConfirm: (qty: number) => void;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Generated data
  const shopItems = useMemo(() => generateShop(shopSeed), [shopSeed]);
  const merchants = useMemo(() => generateMerchants(marketSeed), [marketSeed]);
  const marketMerchant = marketTab === 'stone' ? merchants.stone : merchants.tool;
  const buyOrders = marketMerchant.offers.filter(o => o.isBuyOrder);
  const sellOrders = marketMerchant.offers.filter(o => !o.isBuyOrder);

  // Timers
  useEffect(() => {
    const timer = setInterval(() => setShopCountdown(formatCountdown(600000)), 1000);
    return () => clearInterval(timer);
  }, [shopSeed]);

  useEffect(() => {
    const check = setInterval(() => {
      const cur = getShopSeed();
      if (cur !== shopSeed) setShopSeed(cur);
    }, 1000);
    return () => clearInterval(check);
  }, [shopSeed]);

  useEffect(() => {
    const timer = setInterval(() => setMarketCountdown(formatCountdown(3600000)), 1000);
    return () => clearInterval(timer);
  }, [marketSeed]);

  useEffect(() => {
    const check = setInterval(() => {
      const cur = getMarketSeed();
      if (cur !== marketSeed) setMarketSeed(cur);
    }, 1000);
    return () => clearInterval(check);
  }, [marketSeed]);

  // Shop: buy item
  const openShopBuyModal = (item: ShopItem) => {
    setQuantity(1);
    setModalData({
      title: '购买商品',
      name: item.name,
      description: item.description,
      price: item.price,
      isBuy: true,
      onConfirm: (qty: number) => {
        const total = item.price * qty;
        if (userData.coins < total) { toast.error('游戏币不足'); return; }
        const def = item.def;
        const newStones: Stone[] = [...userData.stones];
        const newTools: Tool[] = [...userData.tools];

        for (let i = 0; i < qty; i++) {
          if (def.category === 'stone') {
            const minD = item.damageLimitMin, maxD = item.damageLimitMax;
            newStones.push({
              id: Date.now() + i, grade: def.grade ?? 0, subGrade: def.subGrade ?? 0, damage: 0,
              damageLimit: Math.floor(Math.random() * (maxD - minD + 1)) + minD,
              mysterious: def.mysterious ?? false, isPolishable: true, acquiredAt: Date.now(),
            });
          } else {
            newTools.push({
              id: Date.now() + i, level: def.level ?? 0, durability: item.durabilityMax,
              durabilityMax: item.durabilityMax,
              lossCoeff: [1, 0.8, 0.5, 0.2][def.level ?? 0],
              durabilityConsumption: [1, 0.8, 0.5, 0.2][def.level ?? 0],
            });
          }
        }

        updateUserData({
          stones: def.category === 'stone' ? newStones : userData.stones,
          tools: def.category === 'tool' ? newTools : userData.tools,
          coins: userData.coins - total,
        });
        toast.success(`购买了 ${qty} 个${item.name}`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  // Market: sell to merchant
  const openMarketSellModal = (offer: MerchantOffer) => {
    const owned = marketTab === 'stone'
      ? userData.stones.filter(s => s.grade === offer.grade && s.subGrade === offer.subGrade).length
      : userData.tools.filter(t => t.level === offer.level).length;
    if (owned === 0) { toast.error('你没有足够的数量'); return; }
    setQuantity(1);
    setModalData({
      title: '卖给商人',
      name: offer.name,
      price: offer.price,
      isBuy: false,
      onConfirm: (qty: number) => {
        if (marketTab === 'stone') {
          const ownedList = userData.stones.filter(s => s.grade === offer.grade && s.subGrade === offer.subGrade);
          if (ownedList.length < qty) { toast.error('你没有足够数量的该矿石'); return; }
          const toRemove = new Set(ownedList.slice(0, qty).map(s => s.id));
          updateUserData({
            stones: userData.stones.filter(s => !toRemove.has(s.id)),
            coins: userData.coins + offer.price * qty,
          });
        } else {
          const ownedList = userData.tools.filter(t => t.level === offer.level);
          if (ownedList.length < qty) { toast.error('你没有足够数量的该工具'); return; }
          const toRemove = new Set(ownedList.slice(0, qty).map(t => t.id));
          updateUserData({
            tools: userData.tools.filter(t => !toRemove.has(t.id)),
            coins: userData.coins + offer.price * qty,
          });
        }
        toast.success(`卖出 ${qty} 个${offer.name}，获得 ${offer.price * qty} 币`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  // Market: buy from merchant
  const openMarketBuyModal = (offer: MerchantOffer) => {
    setQuantity(1);
    setModalData({
      title: '从商人购买',
      name: offer.name,
      price: offer.price,
      isBuy: true,
      onConfirm: (qty: number) => {
        const total = offer.price * qty;
        if (userData.coins < total) { toast.error('游戏币不足'); return; }
        if (marketTab === 'stone') {
          const newStones: Stone[] = [...userData.stones];
          for (let i = 0; i < qty; i++) {
            newStones.push({
              id: Date.now() + i, grade: offer.grade ?? 0, subGrade: offer.subGrade ?? 0,
              damage: 0, damageLimit: 100 + Math.floor(Math.random() * 150),
              mysterious: false, isPolishable: true, acquiredAt: Date.now(),
            });
          }
          updateUserData({ stones: newStones, coins: userData.coins - total });
        } else {
          const newTools = userData.tools.slice();
          for (let i = 0; i < qty; i++) {
            newTools.push({
              id: Date.now() + i, level: offer.level ?? 0,
              durability: 100, durabilityMax: 100,
              lossCoeff: [1, 0.8, 0.5, 0.2][offer.level ?? 0],
              durabilityConsumption: [1, 0.8, 0.5, 0.2][offer.level ?? 0],
            });
          }
          updateUserData({ tools: newTools, coins: userData.coins - total });
        }
        toast.success(`购买 ${qty} 个${offer.name}，花费 ${total} 币`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab: 商城 / 黑市 */}
      <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-1 border border-purple-100">
        {([
          { key: 'shop' as StoreTab, label: '商城', icon: 'fa-store', color: 'from-green-500 to-emerald-500' },
          { key: 'market' as StoreTab, label: '黑市', icon: 'fa-mask', color: 'from-purple-500 to-pink-500' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setStoreTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              storeTab === t.key
                ? `bg-gradient-to-r ${t.color} text-white shadow-md`
                : 'text-gray-500'
            }`}
          >
            <i className={`fas ${t.icon} text-xs`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== SHOP VIEW ==================== */}
      {storeTab === 'shop' && (
        <>
          {/* Timer + Balance */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2">
              <i className="fas fa-clock text-green-500 text-xs" />
              <span className="text-xs text-gray-500">刷新</span>
              <span className="text-sm font-black text-green-600 tabular-nums">{shopCountdown}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50 rounded-full px-3 py-1 border border-yellow-200">
              <i className="fas fa-coins text-yellow-500 text-xs" />
              <span className="text-sm font-bold text-yellow-700">{userData.coins}</span>
            </div>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-2 gap-3">
            {shopItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openShopBuyModal(item)}
                className={`rounded-2xl p-4 border-2 shadow-sm active:scale-95 transition-transform text-left ${
                  item.def.mysterious
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="relative h-20 flex items-center justify-center mb-2">
                  <div className={`absolute inset-0 rounded-full ${
                    item.def.category === 'stone' ? STONE_GRADE_COLORS[item.def.grade ?? 0] : TOOL_LEVEL_COLORS[item.def.level ?? 0]
                  } opacity-20 blur-xl`} />
                  <i className={`fas ${item.def.category === 'stone' ? 'fa-gem' : 'fa-wrench'} text-4xl text-gray-700`} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 text-center truncate">{item.name}</h3>
                <p className="text-[10px] text-gray-500 text-center mt-0.5 mb-2 truncate">{item.description}</p>
                <p className="text-center font-bold text-green-600 text-sm">{item.price} 币</p>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* ==================== MARKET VIEW ==================== */}
      {storeTab === 'market' && (
        <>
          {/* Timer */}
          <div className="flex items-center justify-between bg-gray-900 rounded-2xl p-3 border border-purple-500 shadow-sm text-white">
            <div className="flex items-center gap-2">
              <i className="fas fa-mask text-purple-400 text-sm" />
              <span className="text-xs text-gray-400">商人离开</span>
              <span className="text-sm font-black text-purple-300 tabular-nums">{marketCountdown}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50/10 rounded-full px-3 py-1 border border-yellow-500/20">
              <i className="fas fa-coins text-yellow-500 text-xs" />
              <span className="text-sm font-bold text-yellow-400">{userData.coins}</span>
            </div>
          </div>

          {/* Market sub-tab */}
          <div className="flex gap-2">
            {[
              { key: 'stone' as const, label: '💎 矿石', icon: 'fa-gem' },
              { key: 'tool' as const, label: '🔧 工具', icon: 'fa-wrench' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setMarketTab(t.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  marketTab === t.key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >{t.label}</button>
            ))}
          </div>

          {/* Buy Orders (player sells to merchant) */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">求购</span>
              商人收购
            </h3>
            {buyOrders.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {buyOrders.map(o => {
                  const owned = marketTab === 'stone'
                    ? userData.stones.filter(s => s.grade === o.grade && s.subGrade === o.subGrade).length
                    : userData.tools.filter(t => t.level === o.level).length;
                  return (
                    <motion.button
                      key={o.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openMarketSellModal(o)}
                      disabled={owned === 0}
                      className={`rounded-xl p-3 border-2 text-left transition-all ${
                        owned > 0
                          ? 'bg-white border-green-300 active:border-green-500'
                          : 'bg-gray-50 border-gray-200 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-full ${marketTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]} opacity-15 flex items-center justify-center`}>
                          <i className={`fas ${marketTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xs text-gray-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{o.name}</p>
                          <p className="text-[10px] text-green-600 font-bold">收购 {o.price} 币</p>
                          <p className="text-[10px] text-gray-400">拥有: {owned}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4">商人暂无求购</p>
            )}
          </div>

          {/* Sell Orders (player buys from merchant) */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">出售</span>
              商人出售
            </h3>
            {sellOrders.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {sellOrders.map(o => (
                  <motion.button
                    key={o.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openMarketBuyModal(o)}
                    className="rounded-xl p-3 border-2 bg-white border-red-200 active:border-red-400 text-left transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-full ${marketTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]} opacity-15 flex items-center justify-center`}>
                        <i className={`fas ${marketTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xs text-gray-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{o.name}</p>
                        <p className="text-[10px] text-red-600 font-bold">售价 {o.price} 币</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4">商人暂无出售</p>
            )}
          </div>
        </>
      )}

      {/* ==================== Bottom Sheet Modal ==================== */}
      <AnimatePresence>
        {showModal && modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl p-6 pb-20 w-full max-w-lg max-h-[70vh] overflow-y-auto safe-area-bottom"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              <h3 className="text-lg font-black text-gray-800 mb-1">{modalData.title}</h3>
              <p className="text-sm text-gray-600 mb-1">{modalData.name}</p>
              {modalData.description && (
                <p className="text-xs text-gray-400 mb-3">{modalData.description}</p>
              )}
              <p className="text-sm text-gray-600 mb-4">
                {modalData.isBuy ? '单价' : '收购单价'}：<span className="font-bold text-purple-600">{modalData.price}</span> 币
              </p>

              {/* Quantity selector */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-2">数量</p>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-gray-600 disabled:opacity-30 active:scale-90 transition-transform"
                  >−</button>
                  <span className="text-xl font-black w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                    className="w-10 h-10 bg-gray-100 rounded-xl font-bold text-gray-600 disabled:opacity-30 active:scale-90 transition-transform"
                  >+</button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-purple-50 rounded-2xl p-4 mb-4 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">
                  {modalData.isBuy ? '总花费' : '总获得'}
                </span>
                <span className={`text-xl font-black ${modalData.isBuy ? 'text-red-600' : 'text-green-600'}`}>
                  {modalData.price * quantity} 币
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-2xl font-bold text-gray-600 active:scale-95 transition-transform"
                >取消</button>
                <button
                  onClick={() => modalData.onConfirm(quantity)}
                  disabled={modalData.isBuy && userData.coins < modalData.price * quantity}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold active:scale-95 transition-transform disabled:opacity-50 ${
                    modalData.isBuy
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600'
                  }`}
                >确认</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
