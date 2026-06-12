import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { Stone, Tool, STONE_GRADE_COLORS, TOOL_LEVEL_COLORS } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'stone' | 'tool';
  isSpecial?: boolean;
  grade?: number;
  subGrade?: number;
  mysterious?: boolean;
  damageLimitMin?: number;
  damageLimitMax?: number;
  level?: number;
  durabilityMax?: number;
  lossCoeff?: number;
  durabilityConsumption?: number;
}

const shopItems: ShopItem[] = [
  { id: 'stone-0', name: '原石', description: '未经打磨的原始矿石，一切奇迹的起点', price: 100, category: 'stone', grade: 0, subGrade: 0, mysterious: false, damageLimitMin: 80, damageLimitMax: 120 },
  { id: 'tool-0', name: '普通工具', description: '能用就行', price: 50, category: 'tool', level: 0, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
  { id: 'stone-mystery', name: '神秘原石', description: '蕴含神秘力量的特殊矿石，有更高的升级潜力', price: 500, category: 'stone', grade: 0, subGrade: 0, mysterious: true, damageLimitMin: 120, damageLimitMax: 180, isSpecial: true },
  { id: 'tool-1', name: '专业工具', description: '"这个就叫专业~"', price: 300, category: 'tool', level: 1, durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8 },
  { id: 'stone-1', name: '玛瑙', description: '纹理温润的半宝石，打磨初见成效', price: 800, category: 'stone', grade: 1, subGrade: 0, mysterious: false, damageLimitMin: 150, damageLimitMax: 200 },
  { id: 'stone-2', name: '冰种翡翠', description: '透明度高如冰块，清亮水头足', price: 1500, category: 'stone', grade: 2, subGrade: 2, mysterious: false, damageLimitMin: 180, damageLimitMax: 250, isSpecial: true },
  { id: 'stone-3', name: '蓝钻', description: '含硼元素呈蓝色，极度稀有', price: 3000, category: 'stone', grade: 3, subGrade: 2, mysterious: false, damageLimitMin: 250, damageLimitMax: 350, isSpecial: true },
  { id: 'tool-2', name: '顶级工具', description: '每一次打磨都显得格外自信。', price: 1200, category: 'tool', level: 2, durabilityMax: 100, lossCoeff: 0.5, durabilityConsumption: 0.5 },
  { id: 'tool-3', name: '传奇工具', description: '由传奇工匠打造，它磨的不是石头，是命运。', price: 2500, category: 'tool', level: 3, durabilityMax: 150, lossCoeff: 0.2, durabilityConsumption: 0.2 },
];

export default function ShopPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const buyItem = () => {
    if (!selectedItem) return;
    setIsBuying(true);
    const totalPrice = selectedItem.price * quantity;

    if (userData.coins < totalPrice) {
      toast.error('游戏币不足，无法购买');
      setIsBuying(false);
      return;
    }

    const newStones: Stone[] = [...userData.stones];
    const newTools: Tool[] = [...userData.tools];

    for (let i = 0; i < quantity; i++) {
      if (selectedItem.category === 'stone') {
        const minD = selectedItem.damageLimitMin ?? 80;
        const maxD = selectedItem.damageLimitMax ?? 120;
        const damageLimit = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
        newStones.push({
          id: Date.now() + i,
          grade: selectedItem.grade ?? 0,
          subGrade: selectedItem.subGrade ?? 0,
          damage: 0,
          damageLimit,
          mysterious: selectedItem.mysterious ?? false,
          isPolishable: true,
          acquiredAt: Date.now(),
        });
      } else {
        newTools.push({
          id: Date.now() + i,
          level: selectedItem.level ?? 0,
          durability: selectedItem.durabilityMax ?? 100,
          durabilityMax: selectedItem.durabilityMax ?? 100,
          lossCoeff: selectedItem.lossCoeff ?? 1,
          durabilityConsumption: selectedItem.durabilityConsumption ?? 1,
        });
      }
    }

    updateUserData({
      stones: selectedItem.category === 'stone' ? newStones : userData.stones,
      tools: selectedItem.category === 'tool' ? newTools : userData.tools,
      coins: userData.coins - totalPrice,
    });

    toast.success(`成功购买 ${quantity} 个${selectedItem.name}！`);
    setShowModal(false);
    setSelectedItem(null);
    setQuantity(1);
    setIsBuying(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-green-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-purple-600">🛒 商城</h1>
        <p className="text-gray-700 text-lg font-medium">购买新的矿石和打磨工具</p>
      </motion.div>

      <div className="flex items-center justify-between">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl px-5 py-3 text-lg font-bold flex items-center border-2 border-yellow-300 shadow-md">
          <i className="fas fa-coins text-yellow-500 mr-2 text-xl"></i>
          <span className="text-yellow-700">{userData.coins} 游戏币</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shopItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
            className={`bg-gradient-to-br from-white to-green-50 rounded-2xl p-5 border-2 shadow-lg hover:scale-105 hover:-translate-y-1.5 transition-all duration-150 cursor-pointer ${
              item.isSpecial ? 'border-amber-300 hover:border-amber-400' : 'border-green-200 hover:border-green-400'
            }`}
            onClick={() => { setSelectedItem(item); setShowModal(true); }}
          >
            {item.isSpecial && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                稀有
              </div>
            )}
            <div className="relative h-28 flex items-center justify-center mb-3">
              <div className={`absolute inset-0 rounded-full ${item.category === 'stone' ? STONE_GRADE_COLORS[item.grade ?? 0] : TOOL_LEVEL_COLORS[item.level ?? 0]} opacity-20 blur-xl`} />
              <i className={`fas ${item.category === 'stone' ? 'fa-gem' : 'fa-wrench'} text-5xl text-gray-700 relative`} />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-800">{item.name}</h3>
            <p className="text-xs text-center text-gray-600 mt-1 mb-3">{item.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                {item.category === 'stone' ? item.mysterious ? '神秘矿石' : '常规矿石' : '打磨工具'}
              </span>
              <span className="font-bold text-green-700 text-lg">{item.price} <span className="text-xs text-gray-500">币</span></span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Buy Modal */}
      {showModal && selectedItem && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowModal(false); setSelectedItem(null); }}
        >
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 max-w-md w-full border-2 border-green-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">购买 {selectedItem.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{selectedItem.description}</p>
            <div className="flex justify-between text-lg mb-4">
              <span className="text-gray-700 font-semibold">单价</span>
              <span className="text-green-700 font-bold">{selectedItem.price} 币</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">数量</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-lg">-</button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 bg-gray-200 rounded-lg font-bold text-lg">+</button>
              </div>
            </div>
            <div className="flex justify-between text-lg mb-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <span className="text-gray-700 font-bold">总价</span>
              <span className="text-amber-700 font-black text-xl">{selectedItem.price * quantity} 币</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setSelectedItem(null); }}
                className="flex-1 py-3 bg-gray-300 rounded-xl text-gray-800 font-bold hover:bg-gray-400 transition-all"
              >取消</button>
              <button onClick={buyItem} disabled={isBuying || userData.coins < selectedItem.price * quantity}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
              >{isBuying ? '购买中...' : '确认购买'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
