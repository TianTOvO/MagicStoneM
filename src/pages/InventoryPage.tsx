import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, STONE_GRADE_NAMES, STONE_GRADE_TEXT_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, getStoneGradeLabel } from '@/types';
import { motion } from 'framer-motion';

export default function InventoryPage() {
  const { userData } = useContext(UserDataContext);
  const [tab, setTab] = useState<'stones' | 'tools'>('stones');

  // Grade distribution
  const gradeCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  userData.stones.forEach(s => { gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1; });
  const maxGrade = Math.max(...Object.values(gradeCounts), 1);

  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  userData.tools.forEach(t => { levelCounts[t.level] = (levelCounts[t.level] || 0) + 1; });
  const maxLevel = Math.max(...Object.values(levelCounts), 1);

  const polishableStones = userData.stones.filter(
    s => (s.damage ?? 0) < (s.damageLimit ?? 1) && s.grade < 3
  ).length;
  const usableTools = userData.tools.filter(t => t.durability > 0).length;

  return (
    <div className="space-y-4">
      {/* Segment control */}
      <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-1 border border-purple-100">
        <button
          onClick={() => setTab('stones')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'stones'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'text-gray-500'
          }`}
        >
          <i className="fas fa-gem text-xs" />
          矿石 · {userData.stones.length}
        </button>
        <button
          onClick={() => setTab('tools')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'tools'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
              : 'text-gray-500'
          }`}
        >
          <i className="fas fa-wrench text-xs" />
          工具 · {userData.tools.length}
        </button>
      </div>

      {/* Distribution bar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 mb-3">等级分布</h3>
        <div className="grid grid-cols-4 gap-2">
          {(tab === 'stones'
            ? [0, 1, 2, 3].map(g => ({ key: g, label: STONE_GRADE_NAMES[g], count: gradeCounts[g], max: maxGrade, color: STONE_GRADE_COLORS[g] }))
            : [0, 1, 2, 3].map(l => ({ key: l, label: TOOL_LEVEL_NAMES[l], count: levelCounts[l], max: maxLevel, color: TOOL_LEVEL_COLORS[l] }))
          ).map(item => (
            <div key={item.key} className="text-center">
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all`}
                  style={{ width: item.max > 0 ? `${(item.count / item.max) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
              <p className="text-xs font-black text-gray-700">{item.count}</p>
            </div>
          ))}
        </div>
        {/* Status row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          {tab === 'stones' ? (
            <>
              <span className="text-[10px] text-gray-500">可打磨</span>
              <span className="text-xs font-bold text-blue-600">{polishableStones}/{userData.stones.length}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-500">可使用</span>
              <span className="text-xs font-bold text-green-600">{usableTools}/{userData.tools.length}</span>
            </>
          )}
        </div>
      </div>

      {/* Item grid */}
      {tab === 'stones' ? (
        userData.stones.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-gem text-4xl text-gray-300 mb-3 block" />
            <p className="text-gray-500 font-medium text-sm">还没有矿石</p>
            <p className="text-gray-400 text-xs mt-1">去商城或打磨获取吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {userData.stones.map((stone) => {
              const isFull = (stone.damage ?? 0) >= (stone.damageLimit ?? 1);
              return (
                <motion.div
                  key={stone.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    isFull
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[stone.grade]} opacity-30 blur-xl`} />
                    <i className={`fas fa-gem text-5xl ${isFull ? 'text-gray-400' : STONE_GRADE_TEXT_COLORS[stone.grade]}`} />
                    {stone.mysterious && (
                      <span className="absolute top-0 right-0 text-[9px] bg-purple-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                        神秘
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 text-center truncate">
                    {getStoneDisplayName(stone.grade, stone.subGrade)}
                  </h4>
                  <p className="text-[10px] text-gray-500 text-center mb-2">
                    {getStoneGradeLabel(stone.grade, stone.subGrade)}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-gradient-to-r from-blue-400 to-cyan-400'}`}
                      style={{ width: `${(stone.damage / stone.damageLimit) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">损耗</span>
                    <span className="text-[10px] font-bold text-gray-600">{stone.damage}/{stone.damageLimit}</span>
                  </div>
                  {isFull && (
                    <p className="text-[10px] text-red-400 font-bold text-center mt-2">
                      <i className="fas fa-exclamation-circle mr-1" />已达上限
                    </p>
                  )}
                  {!isFull && stone.grade >= 3 && (
                    <p className="text-[10px] text-amber-500 font-bold text-center mt-2">
                      <i className="fas fa-crown mr-1" />最高等级
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        userData.tools.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-wrench text-4xl text-gray-300 mb-3 block" />
            <p className="text-gray-500 font-medium text-sm">还没有工具</p>
            <p className="text-gray-400 text-xs mt-1">去商城购买吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {userData.tools.map((tool) => {
              const dead = tool.durability <= 0;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    dead
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-white border-green-200 shadow-sm'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} opacity-15 blur-xl`} />
                    <i className={`fas fa-wrench text-5xl ${dead ? 'text-gray-400' : 'text-gray-700'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 text-center">
                    {TOOL_LEVEL_NAMES[tool.level]}工具
                  </h4>
                  <p className="text-[10px] text-gray-500 text-center mb-2">
                    损耗系数 {tool.lossCoeff}x
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dead ? 'bg-red-400' : 'bg-gradient-to-r from-green-400 to-emerald-400'}`}
                      style={{ width: `${(tool.durability / tool.durabilityMax) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">耐久</span>
                    <span className="text-[10px] font-bold text-gray-600">{tool.durability}/{tool.durabilityMax}</span>
                  </div>
                  {dead && (
                    <p className="text-[10px] text-red-400 font-bold text-center mt-2">
                      <i className="fas fa-exclamation-circle mr-1" />已耗尽
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
