import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, STONE_GRADE_TEXT_COLORS, STONE_GRADE_NAMES, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, rollSubGrade, isStonePolishable } from '@/types';
import { toast } from 'sonner';
import { trackPolish, trackFirstUpgrade, trackStoneCollection, trackTreasureHunt } from '@/lib/quests';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorkbenchConfig } from '@/data/mineConfig';

// Probability tables: [grade 0, 1, 2, 3, 4, 5, 6]
const PROB_TABLE: Record<string, number[]> = {
  'normal': [0.35, 0.30, 0.18, 0.10, 0.05, 0.015, 0.005],
  'mystery':[0.15, 0.25, 0.22, 0.18, 0.12, 0.05, 0.03],
};

function getPolishFee(mysterious: boolean): number {
  return mysterious ? 500 : 100;
}

export default function PolishingPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const navigate = useNavigate();
  const [selectedStoneIds, setSelectedStoneIds] = useState<Set<number>>(new Set());
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultNames, setResultNames] = useState<string[]>([]);

  const stoneScrollRef = useRef<HTMLDivElement>(null);
  const toolScrollRef = useRef<HTMLDivElement>(null);

  const polishableStones = userData.stones.filter(s => isStonePolishable(s));
  const usableTools = userData.tools.filter(t => t.durability > 0);

  const selectedTool = usableTools.find(t => t.id === selectedToolId) ?? null;
  const selectedStones = polishableStones.filter(s => selectedStoneIds.has(s.id));

  const wb = getWorkbenchConfig(userData.workbenchLevel);
  const batchSize = wb.batchSize;

  // Total fee
  const totalFee = selectedStones.reduce((sum, s) => sum + getPolishFee(!!s.mysterious), 0);

  // Auto-select first stone
  useEffect(() => {
    if (selectedStoneIds.size === 0 && polishableStones.length > 0) {
      setSelectedStoneIds(new Set([polishableStones[0].id]));
    }
    if (!selectedToolId && usableTools.length > 0) {
      setSelectedToolId(usableTools[0].id);
    }
  }, []);

  const toggleStone = (id: number) => {
    setSelectedStoneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < batchSize) next.add(id);
      return next;
    });
  };

  const canAddMore = selectedStoneIds.size < batchSize;

  /** Generate a random grade weighted by quality + tool + workbench bonus */
  const rollGrade = (mysterious: boolean, toolLevel: number): number => {
    const probs = [...(mysterious ? PROB_TABLE.mystery : PROB_TABLE.normal)];
    const shift = toolLevel * 0.01 + wb.upgradeBonus * 0.005;
    for (let i = 0; i < 3; i++) probs[i] = Math.max(0, probs[i] - shift / 3);
    probs[3] += shift * 0.4;
    probs[4] += shift * 0.3;
    probs[5] += shift * 0.2;
    probs[6] += shift * 0.1;

    const roll = Math.random();
    let cum = 0;
    for (let g = 0; g < probs.length; g++) {
      cum += probs[g];
      if (roll < cum) return g;
    }
    return 0;
  };

  const handlePolish = () => {
    if (selectedStones.length === 0 || !selectedTool) {
      toast.error('请选择原石和工具');
      return;
    }
    if (userData.coins < totalFee) {
      toast.error(`需要 ${totalFee} 币`);
      return;
    }
    const durPerStone = Math.max(1, Math.floor(5 * selectedTool.durabilityConsumption));
    if (selectedTool.durability < selectedStones.length * durPerStone) {
      toast.error('工具耐久不足');
      return;
    }

    setIsPolishing(true);
    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      const newStones = [...userData.stones];
      const newTools = [...userData.tools];
      const toolIdx = newTools.findIndex(t => t.id === selectedTool.id);
      const tool = { ...newTools[toolIdx] };
      const results: string[] = [];

      for (const stone of selectedStones) {
        const stoneIdx = newStones.findIndex(s => s.id === stone.id);
        if (stoneIdx === -1) continue;

        const newGrade = rollGrade(!!stone.mysterious, selectedTool.level);
        const newSubGrade = newGrade >= 1 ? rollSubGrade(newGrade) : 0;

        if (newGrade === 0) {
          // Failed — 原石 is consumed, nothing inside
          newStones.splice(stoneIdx, 1);
          results.push('未发现矿石');
        } else {
          // Success — replace with the new ore
          newStones[stoneIdx] = {
            id: Date.now() + Math.random(),
            grade: newGrade,
            subGrade: newSubGrade,
            damage: 0,
            damageLimit: 80 + Math.floor(Math.random() * 120),
            mysterious: false,
            isPolishable: false,
            acquiredAt: Date.now(),
          };
          results.push(getStoneDisplayName(newGrade, newSubGrade));
        }

        // Tool durability
        const durLoss = Math.max(1, Math.floor(5 * tool.durabilityConsumption));
        tool.durability = Math.max(0, tool.durability - durLoss);
      }

      newTools[toolIdx] = tool;

      // Track quests
      let updatedQuests = userData.quests;
      let anySuccess = false;
      for (let i = 0; i < selectedStones.length; i++) {
        updatedQuests = trackPolish(updatedQuests);
        if (results[i] !== '未发现矿石') anySuccess = true;
      }
      if (anySuccess) {
        updatedQuests = trackFirstUpgrade(updatedQuests);
      }
      updatedQuests = trackStoneCollection(updatedQuests, newStones);
      updatedQuests = trackTreasureHunt(updatedQuests, newStones);

      updateUserData(prev => ({
        stones: newStones, tools: newTools, quests: updatedQuests,
        coins: prev.coins - totalFee,
      }));

      setResultNames(results);
      setShowResult(true);

      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }

      setSelectedStoneIds(new Set());
      if (tool.durability <= 0) setSelectedToolId(null);
      setIsPolishing(false);
    }, 1500);
  };

  // Empty state
  if (polishableStones.length === 0 || usableTools.length === 0) {
    return (
      <>
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowResult(false)}
            >
              <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <i className="fas fa-gem text-5xl text-white mb-4 block" />
                <h2 className="text-xl font-black text-white mb-2">打磨完成！</h2>
                <div className="text-white/90 text-sm space-y-0.5 mb-4">
                  {resultNames.map((n, i) => (
                    <p key={i} className={n === '未发现矿石' ? 'text-white/50 text-xs' : ''}>
                      {n === '未发现矿石' ? '✗ 这块原石内未发现矿石' : `✦ ${n}`}
                    </p>
                  ))}
                </div>
                <button onClick={() => setShowResult(false)}
                  className="px-8 py-2.5 bg-white/20 rounded-xl text-white font-bold active:scale-95">继续</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
          <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-xl max-w-xs w-full">
            <i className="fas fa-gem text-5xl text-purple-300 mb-4 block" />
            <h2 className="text-lg font-black text-gray-800 mb-2">无法打磨</h2>
            <p className="text-gray-500 text-sm mb-6">
              {polishableStones.length === 0 ? '没有原石了，去矿山收集或商城购买吧！' : '没有可用的工具了，去商城购买吧！'}
            </p>
            <button onClick={() => navigate('/shop')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold active:scale-95">前往商城</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <i className="fas fa-gem text-5xl text-white mb-4 block" />
              <h2 className="text-xl font-black text-white mb-2">打磨完成！</h2>
              <div className="text-white/90 text-sm space-y-0.5 mb-4">
                {resultNames.map((n, i) => (
                  <p key={i} className={n === '未发现矿石' ? 'text-white/50 text-xs' : ''}>
                    {n === '未发现矿石' ? '✗ 这块原石内未发现矿石' : `✦ ${n}`}
                  </p>
                ))}
              </div>
              <button onClick={() => setShowResult(false)}
                className="px-8 py-2.5 bg-white/20 rounded-xl text-white font-bold active:scale-95">继续</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <h2 className="text-lg font-black text-gray-800">
            <i className="fas fa-gem text-purple-500 mr-2" />打磨原石
          </h2>
          <p className="text-[10px] text-gray-500">
            选择 {selectedStoneIds.size}/{batchSize} 块原石 · 产出随机矿石
          </p>
        </div>

        {/* Polish button */}
        <motion.button whileTap={{ scale: 0.96 }} onClick={handlePolish}
          disabled={selectedStones.length === 0 || !selectedTool || isPolishing || (totalFee > 0 && userData.coins < totalFee)}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
            selectedStones.length === 0 || !selectedTool || isPolishing || (totalFee > 0 && userData.coins < totalFee)
              ? 'bg-gray-200 text-gray-400'
              : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-purple-500/30'
          }`}
        >
          {isPolishing ? (
            <span className="flex items-center gap-2">
              <motion.i animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="fas fa-spinner" />
              打磨中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-gem" />
              {selectedStones.length === 0 ? '请选择原石' : !selectedTool ? '请选择工具'
                : totalFee > 0 && userData.coins < totalFee ? `游戏币不足（需${totalFee}）`
                : `打磨 ${selectedStones.length} 块 · ${totalFee} 币`}
            </span>
          )}
        </motion.button>

        {/* Stone selector */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 mb-2 px-1">
            选择原石（{selectedStoneIds.size}/{batchSize}）
          </p>
          <div ref={stoneScrollRef} className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {polishableStones.map((stone) => {
              const isSelected = selectedStoneIds.has(stone.id);
              const atLimit = !canAddMore && !isSelected;
              const fee = getPolishFee(!!stone.mysterious);
              return (
                <motion.button key={stone.id} whileTap={{ scale: 0.92 }}
                  onClick={() => toggleStone(stone.id)} disabled={atLimit}
                  className={`flex-shrink-0 w-[80px] rounded-2xl p-2.5 border-2 transition-all ${
                    isSelected ? 'bg-purple-600 border-purple-500 shadow-lg scale-105'
                    : atLimit ? 'bg-gray-50 border-gray-200 opacity-40'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="h-14 flex items-center justify-center mb-1">
                    <i className={`fas fa-gem text-2xl ${isSelected ? 'text-white' : STONE_GRADE_TEXT_COLORS[0]}`} />
                  </div>
                  <p className={`text-[10px] font-bold text-center truncate ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {stone.mysterious ? '神秘原石' : '原石'}
                  </p>
                  <p className={`text-[9px] text-center ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                    {fee > 0 ? `${fee}币` : '免费'}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tool selector */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 mb-2 px-1">选择工具（提高高等级概率）</p>
          <div ref={toolScrollRef} className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {usableTools.map((tool) => (
              <motion.button key={tool.id} whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedToolId(tool.id)}
                className={`flex-shrink-0 w-[80px] rounded-2xl p-2.5 border-2 transition-all ${
                  selectedToolId === tool.id
                    ? 'bg-emerald-500 border-emerald-400 shadow-lg scale-105'
                    : 'bg-white border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="h-14 flex items-center justify-center mb-1">
                  <i className={`fas fa-wrench text-2xl ${selectedToolId === tool.id ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <p className={`text-[10px] font-bold text-center truncate ${selectedToolId === tool.id ? 'text-white' : 'text-gray-700'}`}>
                  {TOOL_LEVEL_NAMES[tool.level]}
                </p>
                <p className={`text-[9px] text-center ${selectedToolId === tool.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {tool.durability}/{tool.durabilityMax}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
