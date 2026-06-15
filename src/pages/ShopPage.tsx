import { useContext, useState, useEffect, useMemo } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { Stone, Tool, STONE_GRADE_COLORS, STONE_GRADE_TEXT_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, getStoneGradeLabel, getStoneDescription } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createRNG, pickN, getShopSeed, getMarketSeed, formatCountdown } from '@/lib/timeRandom';
import { ORE_PRICES, TOOL_PRICES, getOrePrice, getToolPrice, generateMarketPrice, calcStoneSellPrice, calcToolSellPrice } from '@/data/prices';

type StoreTab = 'shop' | 'market';
type ShopSubTab = 'buy' | 'sell';
type MarketSubTab = 'stone' | 'tool';

// ==================== Shop Types ====================

interface ShopBuyItem {
  id: string;
  category: 'stone' | 'tool';
  name: string;
  description: string;
  price: number;
  grade?: number;
  subGrade?: number;
  mysterious?: boolean;
  level?: number;
}

// ==================== Market Types ====================

interface MerchantOffer {
  id: string;
  isBuyOrder: boolean;
  grade?: number;
  subGrade?: number;
  level?: number;
  name: string;
  price: number;
}

// ==================== Shop buy catalog (fixed prices) ====================

function buildShopBuyItems(): ShopBuyItem[] {
  const items: ShopBuyItem[] = [];

  for (const o of ORE_PRICES) {
    const isMysterious = o.name.includes('神秘');
    items.push({
      id: `shop-stone-${o.grade}-${o.subGrade}-${isMysterious ? 'm' : 'n'}`,
      category: 'stone',
      name: o.name,
      description: isMysterious ? '蕴含神秘力量的特殊矿石' : getStoneDescription(o.grade, o.subGrade),
      price: o.shopBuy,
      grade: o.grade,
      subGrade: o.subGrade,
      mysterious: isMysterious,
    });
  }

  for (const t of TOOL_PRICES) {
    items.push({
      id: `shop-tool-${t.level}`,
      category: 'tool',
      name: t.name,
      description: ['能用就行', '"这个就叫专业~"', '每一次打磨都格外自信', '由传奇工匠打造'][t.level],
      price: t.shopBuy,
      level: t.level,
    });
  }

  return items;
}

// ==================== Market generator (60%-200%, independent buy/sell) ====================

function generateMarket(seed: number, tab: MarketSubTab): { buyOrders: MerchantOffer[]; sellOrders: MerchantOffer[] } {
  const rng = createRNG(seed);

  if (tab === 'stone') {
    const picked = pickN(ORE_PRICES.filter(o => !o.name.includes('神秘')), 5, rng);
    const buyOrders: MerchantOffer[] = [];
    const sellOrders: MerchantOffer[] = [];

    for (const o of picked) {
      const buyPrice = generateMarketPrice(o.shopBuy, rng);
      const sellPrice = generateMarketPrice(o.shopBuy, rng);
      buyOrders.push({
        id: `m-buy-${o.grade}-${o.subGrade}`,
        isBuyOrder: true,
        grade: o.grade, subGrade: o.subGrade,
        name: o.name,
        price: buyPrice,
      });
      sellOrders.push({
        id: `m-sell-${o.grade}-${o.subGrade}`,
        isBuyOrder: false,
        grade: o.grade, subGrade: o.subGrade,
        name: o.name,
        price: sellPrice,
      });
    }
    return { buyOrders, sellOrders };
  } else {
    const picked = pickN(TOOL_PRICES, 3, rng);
    const buyOrders: MerchantOffer[] = [];
    const sellOrders: MerchantOffer[] = [];

    for (const t of picked) {
      const buyPrice = generateMarketPrice(t.shopBuy, rng);
      const sellPrice = generateMarketPrice(t.shopBuy, rng);
      buyOrders.push({
        id: `m-buy-tool-${t.level}`,
        isBuyOrder: true,
        level: t.level,
        name: t.name,
        price: buyPrice,
      });
      sellOrders.push({
        id: `m-sell-tool-${t.level}`,
        isBuyOrder: false,
        level: t.level,
        name: t.name,
        price: sellPrice,
      });
    }
    return { buyOrders, sellOrders };
  }
}

// ==================== Modal Data ====================

interface ModalData {
  title: string;
  name: string;
  description?: string;
  unitPrice: number;
  isBuy: boolean; // true = player spends coins, false = player earns coins
  maxQty?: number;
  onConfirm: (qty: number) => void;
}

// ==================== Component ====================

export default function ShopPage() {
  const { userData, updateUserData } = useContext(UserDataContext);

  const [storeTab, setStoreTab] = useState<StoreTab>('shop');
  const [shopSubTab, setShopSubTab] = useState<ShopSubTab>('buy');
  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>('stone');

  // Market seed & countdown
  const [marketSeed, setMarketSeed] = useState(getMarketSeed());
  const [countdown, setCountdown] = useState(formatCountdown(3600000));

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Shop data
  const shopBuyItems = useMemo(() => buildShopBuyItems(), []);

  // Market data
  const market = useMemo(() => generateMarket(marketSeed, marketSubTab), [marketSeed, marketSubTab]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setCountdown(formatCountdown(3600000)), 1000);
    return () => clearInterval(t);
  }, [marketSeed]);

  useEffect(() => {
    const c = setInterval(() => {
      const cur = getMarketSeed();
      if (cur !== marketSeed) setMarketSeed(cur);
    }, 1000);
    return () => clearInterval(c);
  }, [marketSeed]);

  // ==================== Shop: Buy ====================

  const openShopBuy = (item: ShopBuyItem) => {
    setQuantity(1);
    setModalData({
      title: '购买商品',
      name: item.name,
      description: item.description,
      unitPrice: item.price,
      isBuy: true,
      onConfirm: (qty: number) => {
        const total = item.price * qty;
        if (userData.coins < total) { toast.error('游戏币不足'); return; }

        const newStones: Stone[] = [...userData.stones];
        const newTools: Tool[] = [...userData.tools];

        for (let i = 0; i < qty; i++) {
          if (item.category === 'stone') {
            const grade = item.grade ?? 0;
            newStones.push({
              id: Date.now() + i, grade, subGrade: item.subGrade ?? 0, damage: 0,
              damageLimit: 100 + Math.floor(Math.random() * 150),
              mysterious: item.mysterious ?? false, isPolishable: true, acquiredAt: Date.now(),
            });
          } else {
            const tp = getToolPrice(item.level ?? 0);
            newTools.push({
              id: Date.now() + i, level: item.level ?? 0,
              durability: tp?.durabilityMax ?? 100,
              durabilityMax: tp?.durabilityMax ?? 100,
              lossCoeff: tp?.lossCoeff ?? 1,
              durabilityConsumption: tp?.durabilityConsumption ?? 1,
            });
          }
        }

        updateUserData({
          stones: item.category === 'stone' ? newStones : userData.stones,
          tools: item.category === 'tool' ? newTools : userData.tools,
          coins: userData.coins - total,
        });
        toast.success(`购买了 ${qty} 个${item.name}`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  // ==================== Shop: Sell ====================

  interface SellItem {
    type: 'stone' | 'tool';
    id: number;
    name: string;
    grade?: number;
    subGrade?: number;
    level?: number;
    sellPrice: number;
    wearLabel: string;
    disabled: boolean;
  }

  const stoneSellItems: SellItem[] = userData.stones.map(s => {
    const op = getOrePrice(s.grade, s.subGrade);
    const name = op?.name ?? getStoneDisplayName(s.grade, s.subGrade);
    const baseSell = op?.shopSell ?? 0;
    const actual = calcStoneSellPrice(baseSell, s.damage, s.damageLimit);
    return {
      type: 'stone' as const,
      id: s.id,
      name,
      grade: s.grade,
      subGrade: s.subGrade,
      sellPrice: actual,
      wearLabel: `损耗 ${s.damage}/${s.damageLimit}`,
      disabled: false,
    };
  });

  const toolSellItems: SellItem[] = userData.tools.map(t => {
    const tp = getToolPrice(t.level);
    const name = tp?.name ?? (TOOL_LEVEL_NAMES[t.level] + '工具');
    const baseSell = tp?.shopSell ?? 0;
    const actual = calcToolSellPrice(baseSell, t.durability, t.durabilityMax);
    return {
      type: 'tool' as const,
      id: t.id,
      name,
      level: t.level,
      sellPrice: actual,
      wearLabel: `耐久 ${t.durability}/${t.durabilityMax}`,
      disabled: false,
    };
  });

  const sellItems: SellItem[] = [...stoneSellItems, ...toolSellItems];

  const openShopSell = (item: SellItem) => {
    setQuantity(1);
    setModalData({
      title: '出售物品',
      name: item.name,
      description: item.wearLabel,
      unitPrice: item.sellPrice,
      isBuy: false, // player earns coins
      maxQty: 1,
      onConfirm: () => {
        if (item.type === 'stone') {
          updateUserData({
            stones: userData.stones.filter(s => s.id !== item.id),
            coins: userData.coins + item.sellPrice,
          });
        } else {
          updateUserData({
            tools: userData.tools.filter(t => t.id !== item.id),
            coins: userData.coins + item.sellPrice,
          });
        }
        toast.success(`出售 ${item.name}，获得 ${item.sellPrice} 币`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  // ==================== Market handlers ====================

  const openMarketSell = (offer: MerchantOffer) => {
    const owned = marketSubTab === 'stone'
      ? userData.stones.filter(s => s.grade === offer.grade && s.subGrade === offer.subGrade).length
      : userData.tools.filter(t => t.level === offer.level).length;
    if (owned === 0) { toast.error('你没有该物品'); return; }

    // Pick the first matching item
    const match = marketSubTab === 'stone'
      ? userData.stones.find(s => s.grade === offer.grade && s.subGrade === offer.subGrade)
      : userData.tools.find(t => t.level === offer.level);

    setQuantity(1);
    setModalData({
      title: '卖给商人',
      name: offer.name,
      unitPrice: offer.price,
      isBuy: false,
      onConfirm: () => {
        if (marketSubTab === 'stone' && match) {
          updateUserData({
            stones: userData.stones.filter(s => s.id !== match.id),
            coins: userData.coins + offer.price,
          });
        } else if (marketSubTab === 'tool' && match) {
          updateUserData({
            tools: userData.tools.filter(t => t.id !== match.id),
            coins: userData.coins + offer.price,
          });
        }
        toast.success(`卖出 ${offer.name}，获得 ${offer.price} 币`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  const openMarketBuy = (offer: MerchantOffer) => {
    setQuantity(1);
    setModalData({
      title: '从商人购买',
      name: offer.name,
      unitPrice: offer.price,
      isBuy: true,
      onConfirm: () => {
        const total = offer.price;
        if (userData.coins < total) { toast.error('游戏币不足'); return; }

        if (marketSubTab === 'stone') {
          updateUserData({
            stones: [...userData.stones, {
              id: Date.now(), grade: offer.grade ?? 0, subGrade: offer.subGrade ?? 0,
              damage: 0, damageLimit: 100 + Math.floor(Math.random() * 150),
              mysterious: false, isPolishable: true, acquiredAt: Date.now(),
            }],
            coins: userData.coins - total,
          });
        } else {
          const tp = getToolPrice(offer.level ?? 0);
          updateUserData({
            tools: [...userData.tools, {
              id: Date.now(), level: offer.level ?? 0,
              durability: tp?.durabilityMax ?? 100,
              durabilityMax: tp?.durabilityMax ?? 100,
              lossCoeff: tp?.lossCoeff ?? 1,
              durabilityConsumption: tp?.durabilityConsumption ?? 1,
            }],
            coins: userData.coins - total,
          });
        }
        toast.success(`购买 ${offer.name}，花费 ${total} 币`);
        setShowModal(false);
      },
    });
    setShowModal(true);
  };

  // ==================== Render ====================

  return (
    <div className="space-y-4">
      {/* Top tab: 商城 / 黑市 */}
      <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-1 border border-purple-100">
        {([
          { key: 'shop' as StoreTab, label: '商城', icon: 'fa-store', color: 'from-green-500 to-emerald-500' },
          { key: 'market' as StoreTab, label: '黑市', icon: 'fa-mask', color: 'from-purple-500 to-pink-500' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setStoreTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              storeTab === t.key ? `bg-gradient-to-r ${t.color} text-white shadow-md` : 'text-gray-500'
            }`}
          >
            <i className={`fas ${t.icon} text-xs`} />{t.label}
          </button>
        ))}
      </div>

      {/* ==================== SHOP ==================== */}
      {storeTab === 'shop' && (
        <>
          {/* Balance */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-green-200 shadow-sm">
            <div className="flex items-center gap-1.5 bg-yellow-50 rounded-full px-3 py-1.5 border border-yellow-200">
              <i className="fas fa-coins text-yellow-500 text-xs" />
              <span className="text-sm font-bold text-yellow-700">{userData.coins} 币</span>
            </div>
            <span className="text-xs text-gray-400">固定价格</span>
          </div>

          {/* Buy / Sell sub-tab */}
          <div className="flex bg-white/70 rounded-2xl p-1 border border-gray-100">
            <button
              onClick={() => setShopSubTab('buy')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                shopSubTab === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'text-gray-500'
              }`}
            ><i className="fas fa-shopping-cart mr-1 text-xs" />购买</button>
            <button
              onClick={() => setShopSubTab('sell')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                shopSubTab === 'sell' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' : 'text-gray-500'
              }`}
            ><i className="fas fa-tag mr-1 text-xs" />出售</button>
          </div>

          {/* BUY TAB */}
          {shopSubTab === 'buy' && (
            <div className="grid grid-cols-2 gap-3">
              {shopBuyItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openShopBuy(item)}
                  disabled={userData.coins < item.price}
                  className={`rounded-2xl p-3 border-2 text-left active:scale-95 transition-transform disabled:opacity-40 ${
                    item.mysterious
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                      : item.category === 'stone'
                        ? 'bg-white border-gray-200'
                        : 'bg-white border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      item.category === 'stone'
                        ? STONE_GRADE_COLORS[item.grade ?? 0]
                        : TOOL_LEVEL_COLORS[item.level ?? 0]
                    } opacity-15`}>
                      <i className={`fas ${item.category === 'stone' ? 'fa-gem' : 'fa-wrench'} text-sm ${
                        item.category === 'stone' ? STONE_GRADE_TEXT_COLORS[item.grade ?? 0] : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      {item.mysterious && <span className="text-[9px] text-purple-500 font-bold">神秘</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1.5">{item.description}</p>
                  <p className="text-sm font-black text-green-600">{item.price.toLocaleString()} 币</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* SELL TAB */}
          {shopSubTab === 'sell' && (
            <>
              {sellItems.length === 0 ? (
                <div className="text-center py-16">
                  <i className="fas fa-box-open text-4xl text-gray-300 mb-3 block" />
                  <p className="text-gray-500 font-medium text-sm">没有可出售的物品</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sellItems.map((item) => (
                    <motion.button
                      key={`${item.type}-${item.id}`}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openShopSell(item)}
                      className="rounded-xl p-3 border-2 bg-white border-orange-200 active:border-orange-400 text-left transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === 'stone'
                            ? STONE_GRADE_COLORS[item.grade ?? 0]
                            : TOOL_LEVEL_COLORS[item.level ?? 0]
                        } opacity-15`}>
                          <i className={`fas ${item.type === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xs ${
                            item.type === 'stone' ? STONE_GRADE_TEXT_COLORS[item.grade ?? 0] : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[9px] text-gray-400">{item.wearLabel}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-orange-600">{item.sellPrice.toLocaleString()} 币</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ==================== MARKET (黑市) ==================== */}
      {storeTab === 'market' && (
        <>
          {/* Timer */}
          <div className="flex items-center justify-between bg-gray-900 rounded-2xl p-3 border border-purple-500 shadow-sm text-white">
            <div className="flex items-center gap-2">
              <i className="fas fa-mask text-purple-400 text-sm" />
              <span className="text-xs text-gray-400">商人离开</span>
              <span className="text-sm font-black text-purple-300 tabular-nums">{countdown}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50/10 rounded-full px-3 py-1 border border-yellow-500/20">
              <i className="fas fa-coins text-yellow-500 text-xs" />
              <span className="text-sm font-bold text-yellow-400">{userData.coins}</span>
            </div>
          </div>

          {/* Market sub-tab */}
          <div className="flex gap-2">
            {[
              { key: 'stone' as MarketSubTab, label: '💎 矿石' },
              { key: 'tool' as MarketSubTab, label: '🔧 工具' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setMarketSubTab(t.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  marketSubTab === t.key
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
              商人收购 · 区间 60%-200%
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {market.buyOrders.map(o => {
                const owned = marketSubTab === 'stone'
                  ? userData.stones.filter(s => s.grade === o.grade && s.subGrade === o.subGrade).length
                  : userData.tools.filter(t => t.level === o.level).length;
                return (
                  <motion.button
                    key={o.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openMarketSell(o)}
                    disabled={owned === 0}
                    className={`rounded-xl p-3 border-2 text-left transition-all ${
                      owned > 0 ? 'bg-white border-green-300 active:border-green-500' : 'bg-gray-50 border-gray-200 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-full ${
                        marketSubTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]
                      } opacity-15 flex items-center justify-center`}>
                        <i className={`fas ${marketSubTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xs ${
                          marketSubTab === 'stone' ? STONE_GRADE_TEXT_COLORS[o.grade ?? 0] : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{o.name}</p>
                        <p className="text-[10px] text-green-600 font-bold">收购 {o.price.toLocaleString()} 币</p>
                        <p className="text-[10px] text-gray-400">拥有: {owned}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sell Orders (player buys from merchant) */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">出售</span>
              商人出售 · 区间 60%-200%
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {market.sellOrders.map(o => (
                <motion.button
                  key={o.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openMarketBuy(o)}
                  disabled={userData.coins < o.price}
                  className="rounded-xl p-3 border-2 bg-white border-red-200 active:border-red-400 text-left transition-all disabled:opacity-40"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full ${
                      marketSubTab === 'stone' ? STONE_GRADE_COLORS[o.grade ?? 0] : TOOL_LEVEL_COLORS[o.level ?? 0]
                    } opacity-15 flex items-center justify-center`}>
                      <i className={`fas ${marketSubTab === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xs ${
                        marketSubTab === 'stone' ? STONE_GRADE_TEXT_COLORS[o.grade ?? 0] : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{o.name}</p>
                      <p className="text-[10px] text-red-600 font-bold">售价 {o.price.toLocaleString()} 币</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================== Bottom Sheet Modal ==================== */}
      <AnimatePresence>
        {showModal && modalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl p-6 pb-20 w-full max-w-lg max-h-[70vh] overflow-y-auto safe-area-bottom"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-800 mb-1">{modalData.title}</h3>
              <p className="text-sm text-gray-600 mb-1">{modalData.name}</p>
              {modalData.description && <p className="text-xs text-gray-400 mb-3">{modalData.description}</p>}
              <p className="text-sm text-gray-600 mb-4">
                单价：<span className="font-bold text-purple-600">{modalData.unitPrice.toLocaleString()}</span> 币
              </p>

              {/* Quantity (only when buying from shop, max 10) */}
              {modalData.isBuy && modalData.maxQty !== 1 && (
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
              )}

              {/* Total */}
              <div className={`rounded-2xl p-4 mb-4 flex justify-between items-center ${modalData.isBuy ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className="text-sm font-bold text-gray-700">
                  {modalData.isBuy ? '总花费' : '总获得'}
                </span>
                <span className={`text-xl font-black ${modalData.isBuy ? 'text-red-600' : 'text-green-600'}`}>
                  {(modalData.unitPrice * quantity).toLocaleString()} 币
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-2xl font-bold text-gray-600 active:scale-95 transition-transform"
                >取消</button>
                <button
                  onClick={() => modalData.onConfirm(quantity)}
                  disabled={modalData.isBuy && userData.coins < modalData.unitPrice * quantity}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold active:scale-95 transition-transform disabled:opacity-50 ${
                    modalData.isBuy ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'
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
