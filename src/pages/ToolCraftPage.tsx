import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { TOOL_LEVEL_NAMES, TOOL_LEVEL_COLORS } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ToolCraftPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [selectedTools, setSelectedTools] = useState<number[]>([]);

  const toolsByLevel: Record<number, typeof userData.tools> = { 0: [], 1: [], 2: [], 3: [] };
  userData.tools.forEach(t => {
    if (toolsByLevel[t.level]) toolsByLevel[t.level].push(t);
  });

  const toggleTool = (id: number) => {
    if (selectedTools.includes(id)) {
      setSelectedTools(prev => prev.filter(t => t !== id));
    } else if (selectedTools.length < 3) {
      setSelectedTools(prev => [...prev, id]);
    }
  };

  const selectedLevel = selectedTools.length === 3
    ? (() => {
        const tools = selectedTools.map(id => userData.tools.find(t => t.id === id)!);
        const levels = new Set(tools.map(t => t.level));
        return levels.size === 1 ? tools[0].level : -1;
      })()
    : null;

  const canCraft = selectedLevel !== null && selectedLevel !== -1 && selectedLevel < 3;

  const handleCraft = () => {
    if (!canCraft || selectedLevel === null) return;

    const newTools = userData.tools.filter(t => !selectedTools.includes(t.id));
    const newLevel = selectedLevel + 1;

    newTools.push({
      id: Date.now(),
      level: newLevel,
      durability: 100,
      durabilityMax: 100,
      lossCoeff: [1, 0.8, 0.5, 0.2][newLevel],
      durabilityConsumption: [1, 0.8, 0.5, 0.2][newLevel],
    });

    updateUserData({ tools: newTools });
    toast.success(`合成成功！获得了${TOOL_LEVEL_NAMES[newLevel]}工具`);
    setSelectedTools([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-2xl p-8 border-2 border-orange-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">⚒️ 工具合成</h1>
        <p className="text-gray-700 text-lg font-medium">3个同等级工具合成1个更高等级工具</p>
      </motion.div>

      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-300 shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          选择3个<span className="text-orange-600 ml-1">同等级</span>工具进行合成
          {selectedTools.length > 0 && <span className="text-sm font-normal text-gray-500 ml-2">（已选 {selectedTools.length}/3）</span>}
        </h2>

        {[0, 1, 2, 3].map(level => {
          const tools = toolsByLevel[level];
          if (tools.length === 0) return null;
          return (
            <div key={level} className="mb-6">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full ${TOOL_LEVEL_COLORS[level]} mr-2`}></span>
                {TOOL_LEVEL_NAMES[level]}工具 ({tools.length}个)
                {level < 3 && tools.length >= 3 && <span className="text-xs text-orange-500 ml-2">— 可合成</span>}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {tools.map(tool => (
                  <motion.div
                    key={tool.id}
                    variants={itemVariants}
                    onClick={() => toggleTool(tool.id)}
                    className={`rounded-xl p-3 cursor-pointer border-2 transition-all duration-150 hover:scale-105 ${
                      selectedTools.includes(tool.id)
                        ? 'bg-gradient-to-br from-orange-400 to-red-400 border-orange-600 shadow-lg scale-105'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    <div className="relative h-16 flex items-center justify-center mb-2">
                      <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} ${selectedTools.includes(tool.id) ? 'opacity-0' : 'opacity-20'} blur-lg`} />
                      <i className={`fas fa-wrench text-3xl ${selectedTools.includes(tool.id) ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <p className={`text-xs font-bold text-center ${selectedTools.includes(tool.id) ? 'text-white' : 'text-gray-800'}`}>
                      {TOOL_LEVEL_NAMES[tool.level]}
                    </p>
                    <p className={`text-xs text-center ${selectedTools.includes(tool.id) ? 'text-orange-100' : 'text-gray-500'}`}>
                      {tool.durability}/{tool.durabilityMax}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {canCraft && selectedLevel !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-5 border-2 border-orange-400 text-center"
          >
            <p className="text-lg font-bold text-gray-800 mb-2">
              合成 {TOOL_LEVEL_NAMES[selectedLevel + 1]}工具
            </p>
            <p className="text-sm text-gray-600 mb-4">
              消耗 3个{TOOL_LEVEL_NAMES[selectedLevel]}工具 → 1个{TOOL_LEVEL_NAMES[selectedLevel + 1]}工具
            </p>
            <button onClick={handleCraft}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl text-white font-bold hover:scale-105 transition-all shadow-lg"
            >
              <i className="fas fa-layer-group mr-2"></i>确认合成
            </button>
          </motion.div>
        )}

        {selectedTools.length === 3 && !canCraft && (
          <div className="mt-4 text-center text-red-500 font-semibold">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            {selectedLevel === -1 ? '所选工具等级不一致' : '传奇工具已是最高等级，无法继续合成'}
          </div>
        )}
      </motion.div>
    </div>
  );
}
