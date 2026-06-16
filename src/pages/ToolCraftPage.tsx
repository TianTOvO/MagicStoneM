import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { TOOL_LEVEL_NAMES, TOOL_LEVEL_COLORS } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { trackToolMastery, trackFirstCraft } from '@/lib/quests';

export default function ToolCraftPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [selected, setSelected] = useState<number[]>([]);

  const toolsByLevel: Record<number, typeof userData.tools> = { 0: [], 1: [], 2: [], 3: [] };
  userData.tools.forEach(t => { if (toolsByLevel[t.level]) toolsByLevel[t.level].push(t); });

  const toggle = (id: number) => {
    if (selected.includes(id)) setSelected(prev => prev.filter(t => t !== id));
    else if (selected.length < 3) setSelected(prev => [...prev, id]);
  };

  const selectedLevel = selected.length === 3
    ? (() => {
        const tools = selected.map(id => userData.tools.find(t => t.id === id)!);
        const levels = new Set(tools.map(t => t.level));
        return levels.size === 1 ? levels.values().next().value! : -1;
      })()
    : null;

  const canCraft = selectedLevel !== null && selectedLevel !== -1 && selectedLevel < 3;

  const handleCraft = () => {
    if (!canCraft || selectedLevel === null) return;
    const newLevel = selectedLevel + 1;
    const newTools = userData.tools.filter(t => !selected.includes(t.id));
    newTools.push({
      id: Date.now(), level: newLevel, durability: 100, durabilityMax: 100,
      lossCoeff: [1, 0.8, 0.5, 0.2][newLevel],
      durabilityConsumption: [1, 0.8, 0.5, 0.2][newLevel],
    });
    updateUserData({ tools: newTools, quests: trackFirstCraft(trackToolMastery(userData.quests, newTools)) });
    toast.success(`合成成功！获得${TOOL_LEVEL_NAMES[newLevel]}工具`);
    setSelected([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-800">
          <i className="fas fa-layer-group text-orange-500 mr-2" />工具合成
        </h2>
        {selected.length > 0 && (
          <span className="text-xs font-bold text-purple-600 bg-purple-50 rounded-full px-3 py-1">
            已选 {selected.length}/3
          </span>
        )}
      </div>

      {/* Rule card */}
      <div className="bg-white rounded-2xl p-4 border border-orange-200 shadow-sm">
        <p className="text-sm font-bold text-gray-700 mb-0.5">合成规则</p>
        <p className="text-xs text-gray-500">3个同等级工具 → 1个更高等级工具（最高可合成至传奇）</p>
      </div>

      {[0, 1, 2, 3].map(level => {
        const tools = toolsByLevel[level];
        if (tools.length === 0) return null;
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${TOOL_LEVEL_COLORS[level]}`} />
              <h4 className="text-xs font-bold text-gray-700">{TOOL_LEVEL_NAMES[level]}工具 · {tools.length}个</h4>
              {level < 3 && tools.length >= 3 && (
                <span className="text-[10px] text-orange-500 font-bold bg-orange-50 rounded-full px-2 py-0.5">可合成</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tools.map(tool => (
                <motion.button
                  key={tool.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggle(tool.id)}
                  className={`rounded-xl p-2.5 border-2 transition-all ${
                    selected.includes(tool.id)
                      ? 'bg-gradient-to-br from-orange-400 to-red-400 border-orange-500 shadow-lg'
                      : 'bg-white border-gray-200 active:border-orange-300'
                  }`}
                >
                  <div className="relative h-14 flex items-center justify-center mb-1">
                    <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} ${selected.includes(tool.id) ? 'opacity-0' : 'opacity-10'} blur-md`} />
                    <i className={`fas fa-wrench text-2xl ${selected.includes(tool.id) ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <p className={`text-[10px] font-bold text-center ${selected.includes(tool.id) ? 'text-white' : 'text-gray-700'}`}>
                    {TOOL_LEVEL_NAMES[tool.level]}
                  </p>
                  <p className={`text-[9px] text-center ${selected.includes(tool.id) ? 'text-orange-100' : 'text-gray-400'}`}>
                    {tool.durability}/{tool.durabilityMax}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}

      {canCraft && selectedLevel !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-300 text-center"
        >
          <p className="text-sm font-bold text-gray-800 mb-1">
            3×{TOOL_LEVEL_NAMES[selectedLevel]} → 1×{TOOL_LEVEL_NAMES[selectedLevel + 1]}
          </p>
          <button
            onClick={handleCraft}
            className="mt-3 w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white font-bold active:scale-95 transition-transform shadow-lg"
          >
            <i className="fas fa-layer-group mr-2" />确认合成
          </button>
        </motion.div>
      )}

      {selected.length === 3 && !canCraft && (
        <p className="text-center text-red-500 text-xs font-bold bg-red-50 rounded-xl py-2">
          <i className="fas fa-exclamation-triangle mr-1" />
          {selectedLevel === -1 ? '所选工具等级不一致，请选择同等级工具' : '传奇工具已是最高等级'}
        </p>
      )}
    </div>
  );
}
