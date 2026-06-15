import { useContext, useState, useRef, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, STONE_GRADE_TEXT_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, rollSubGrade, isStonePolishable } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolishingPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [selectedStoneId, setSelectedStoneId] = useState<number | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<{ name: string; upgraded: boolean } | null>(null);

  const stoneScrollRef = useRef<HTMLDivElement>(null);
  const toolScrollRef = useRef<HTMLDivElement>(null);

  const polishableStones = userData.stones.filter(s => isStonePolishable(s));
  const usableTools = userData.tools.filter(t => t.durability > 0);

  const selectedStone = polishableStones.find(s => s.id === selectedStoneId) ?? null;
  const selectedTool = usableTools.find(t => t.id === selectedToolId) ?? null;

  // Auto-select first items if none selected
  useEffect(() => {
    if (!selectedStoneId && polishableStones.length > 0) {
      setSelectedStoneId(polishableStones[0].id);
    }
    if (!selectedToolId && usableTools.length > 0) {
      setSelectedToolId(usableTools[0].id);
    }
  }, []);

  // Calculate upgrade chance
  const getUpgradeChance = () => {
    if (!selectedStone || !selectedTool) return 0;
    const baseArr = [50, 30, 15, 5];
    const base = baseArr[Math.min(selectedStone.grade, 3)] ?? 0;
    return Math.min(base + selectedTool.level * 5, 95);
  };

  const upgradeChance = getUpgradeChance();

  const handlePolish = () => {
    if (!selectedStone || !selectedTool) {
      toast.error('请选择矿石和工具');
      return;
    }

    const stoneIdx = userData.stones.findIndex(s => s.id === selectedStone.id);
    const toolIdx = userData.tools.findIndex(t => t.id === selectedTool.id);
    if (stoneIdx === -1 || toolIdx === -1) {
      toast.error('选择有误，请重新选择');
      return;
    }

    setIsPolishing(true);
    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      const stone = userData.stones[stoneIdx];
      const tool = userData.tools[toolIdx];
      const rolled = Math.random() * 100;
      const upgraded = rolled < upgradeChance;

      const newStones = [...userData.stones];
      const newTools = [...userData.tools];

      // Damage increase
      const damageIncrease = tool.level < 3 ? 10 * (4 - tool.level) : 1;
      newStones[stoneIdx] = {
        ...stone,
        damage: Math.min(stone.damage + damageIncrease, stone.damageLimit),
      };

      // Durability loss
      const durabilityLoss = tool.level < 3 ? 5 * (4 - tool.level) : 1;
      newTools[toolIdx] = {
        ...tool,
        durability: Math.max(0, tool.durability - durabilityLoss),
      };

      let resultName: string;

      if (upgraded && stone.grade < 3) {
        const newGrade = stone.grade + 1;
        const newSubGrade = newGrade >= 2 ? rollSubGrade(newGrade) : 0;
        newStones[stoneIdx].grade = newGrade;
        newStones[stoneIdx].subGrade = newSubGrade;
        newStones[stoneIdx].damage = 0;
        newStones[stoneIdx].acquiredAt = Date.now();
        resultName = getStoneDisplayName(newGrade, newSubGrade);
      } else {
        resultName = getStoneDisplayName(stone.grade, stone.subGrade);
      }

      updateUserData({ stones: newStones, tools: newTools });

      // Show success animation
      setUpgradeResult({ name: resultName, upgraded });
      setShowSuccess(true);
      if (navigator.vibrate) {
        navigator.vibrate(upgraded ? [50, 30, 50, 30, 100] : [50]);
      }

      // Reset selection if item was consumed
      const updatedStone = newStones[stoneIdx];
      if (!isStonePolishable(updatedStone)) {
        setSelectedStoneId(null);
      }
      const updatedTool = newTools[toolIdx];
      if (updatedTool.durability <= 0) {
        setSelectedToolId(null);
      }

      setIsPolishing(false);
    }, 1800);
  };

  // If no stones or tools available
  if (polishableStones.length === 0 || usableTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-xl max-w-xs w-full"
        >
          <i className="fas fa-gem text-5xl text-purple-300 mb-4 block" />
          <h2 className="text-lg font-black text-gray-800 mb-2">无法打磨</h2>
          <p className="text-gray-500 text-sm mb-6">
            {polishableStones.length === 0 ? '没有可打磨的矿石了，去商城购买吧！' : '没有可用的工具了，去商城购买吧！'}
          </p>
          <button
            onClick={() => window.location.href = '/shop'}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold active:scale-95 transition-transform"
          >
            前往商城
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Upgrade result overlay */}
      <AnimatePresence>
        {showSuccess && upgradeResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl ${
                upgradeResult.upgraded
                  ? 'bg-gradient-to-br from-amber-400 via-orange-400 to-red-400'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={upgradeResult.upgraded ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.6 }}
              >
                <i className={`fas ${upgradeResult.upgraded ? 'fa-star' : 'fa-hammer'} text-5xl text-white mb-4 block`} />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-1">
                {upgradeResult.upgraded ? '升级成功！' : '打磨完成'}
              </h2>
              <p className="text-white/80 text-sm mb-4">
                {upgradeResult.upgraded
                  ? `矿石升级为 ${upgradeResult.name}`
                  : `本次未触发升级，矿石仍为 ${upgradeResult.name}`}
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="px-8 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold active:scale-95 transition-transform"
              >
                继续
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main stone display */}
      <motion.div
        key={selectedStone?.id ?? 'none'}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col items-center py-4"
      >
        {/* Stone visual */}
        <div className="relative mb-3">
          <motion.div
            animate={isPolishing ? { rotate: [0, 10, -10, 5, -5, 0] } : { rotate: [0, 5, -5, 0] }}
            transition={isPolishing
              ? { duration: 0.8, repeat: Infinity }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }
            className="w-36 h-36 rounded-full flex items-center justify-center relative"
          >
            <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[selectedStone?.grade ?? 0]} opacity-20 blur-2xl`} />
            <div className={`absolute inset-3 rounded-full ${STONE_GRADE_COLORS[selectedStone?.grade ?? 0]} opacity-10 blur-xl`} />
            {isPolishing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              >
                <i className="fas fa-gem text-7xl text-purple-400" />
              </motion.div>
            ) : (
              <i className={`fas fa-gem text-7xl drop-shadow-lg ${STONE_GRADE_TEXT_COLORS[selectedStone?.grade ?? 0]}`} />
            )}
          </motion.div>

          {/* Sparkles during polish */}
          {isPolishing && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.5, x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute top-1/2 left-1/2 w-3 h-3"
                >
                  <i className="fas fa-star text-amber-400 text-xs" />
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Stone info */}
        {selectedStone && (
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-800">
              {getStoneDisplayName(selectedStone.grade, selectedStone.subGrade)}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedStone.damage / selectedStone.damageLimit) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                {selectedStone.damage}/{selectedStone.damageLimit}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Upgrade chance — always visible */}
      {selectedStone && selectedTool && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border border-purple-200 shadow-sm text-center"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600">升级概率</span>
            <span className="text-lg font-black text-purple-600">{upgradeChance}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${upgradeChance}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            基础概率 + 工具{TOOL_LEVEL_NAMES[selectedTool.level]}加成 {selectedTool.level * 5}%
          </p>
        </motion.div>
      )}

      {/* Polish button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handlePolish}
        disabled={!selectedStone || !selectedTool || isPolishing}
        className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
          !selectedStone || !selectedTool || isPolishing
            ? 'bg-gray-200 text-gray-400'
            : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-purple-500/30 active:shadow-md'
        }`}
      >
        {isPolishing ? (
          <span className="flex items-center justify-center gap-2">
            <motion.i
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="fas fa-spinner"
            />
            打磨中...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <i className="fas fa-gem" />
            {!selectedStone ? '请选择矿石' : !selectedTool ? '请选择工具' : '开始打磨'}
          </span>
        )}
      </motion.button>

      {/* Stone selector — horizontal scroll */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 mb-2 px-1">选择矿石</p>
        <div
          ref={stoneScrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
        >
          {polishableStones.map((stone) => (
            <motion.button
              key={stone.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedStoneId(stone.id)}
              className={`flex-shrink-0 w-[72px] rounded-2xl p-2.5 border-2 transition-all ${
                selectedStoneId === stone.id
                  ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="relative h-12 flex items-center justify-center mb-1">
                <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[stone.grade]} ${selectedStoneId === stone.id ? 'opacity-0' : 'opacity-15'} blur-md`} />
                <i className={`fas fa-gem text-2xl ${selectedStoneId === stone.id ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <p className={`text-[10px] font-bold text-center truncate ${selectedStoneId === stone.id ? 'text-white' : 'text-gray-700'}`}>
                {getStoneDisplayName(stone.grade, stone.subGrade)}
              </p>
              <p className={`text-[9px] text-center ${selectedStoneId === stone.id ? 'text-purple-200' : 'text-gray-400'}`}>
                {stone.damage}/{stone.damageLimit}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tool selector — horizontal scroll */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 mb-2 px-1">选择工具</p>
        <div
          ref={toolScrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
        >
          {usableTools.map((tool) => (
            <motion.button
              key={tool.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedToolId(tool.id)}
              className={`flex-shrink-0 w-[72px] rounded-2xl p-2.5 border-2 transition-all ${
                selectedToolId === tool.id
                  ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="relative h-12 flex items-center justify-center mb-1">
                <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} ${selectedToolId === tool.id ? 'opacity-0' : 'opacity-15'} blur-md`} />
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
  );
}
