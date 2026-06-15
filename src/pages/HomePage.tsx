import { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName, getStoneGradeLabel } from '@/types';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { userData } = useContext(UserDataContext);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const polishableCount = userData.stones.filter(
    s => (s.damage ?? 0) < (s.damageLimit ?? 1) && s.grade < 3
  ).length;
  const usableTools = userData.tools.filter(t => t.durability > 0).length;
  const completedQuests = userData.quests.filter(
    q => q.progress >= q.target && !q.claimed
  ).length;

  const stats = [
    { icon: 'fa-gem', color: 'from-blue-400 to-cyan-400', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', value: userData.stones.length, label: '矿石' },
    { icon: 'fa-wrench', color: 'from-green-400 to-emerald-400', bg: 'from-green-50 to-emerald-50', border: 'border-green-200', value: usableTools, label: '工具' },
    { icon: 'fa-clipboard-list', color: 'from-orange-400 to-amber-400', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', value: completedQuests, label: '可领奖' },
  ];

  // Merge stones + tools sorted by acquiredAt (newest first)
  const recentItems = [
    ...userData.stones.map(s => ({ ...s, _type: 'stone' as const })),
    ...userData.tools.map(t => ({ ...t, _type: 'tool' as const })),
  ]
    .filter(item => (item._type === 'stone' ? item.acquiredAt : true))
    .sort((a, b) => {
      const aTime = a._type === 'stone' ? (a.acquiredAt ?? 0) : 0;
      const bTime = b._type === 'stone' ? (b.acquiredAt ?? 0) : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Hero area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-purple-500/20"
      >
        {/* Decorative background gems */}
        <div className="absolute top-3 right-4 opacity-20">
          <i className="fas fa-gem text-7xl text-white rotate-12" />
        </div>
        <div className="absolute bottom-2 left-8 opacity-10">
          <i className="fas fa-gem text-5xl text-white -rotate-12" />
        </div>

        <div className="relative z-10">
          <p className="text-purple-200 text-xs font-medium mb-1">欢迎回来，工匠</p>
          <h1 className="text-2xl font-black text-white mb-2">原石狂磨</h1>
          <p className="text-purple-200 text-xs leading-relaxed max-w-[70%]">
            打磨矿石，探索收藏，成为传奇工匠
          </p>

          {/* Balance highlight */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/10">
            <i className="fas fa-coins text-yellow-300 text-sm" />
            <span className="text-white font-black text-lg">{userData.coins}</span>
            <span className="text-purple-200 text-xs">游戏币</span>
          </div>
        </div>
      </motion.div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-3 border ${stat.border} text-center`}
          >
            <i className={`fas ${stat.icon} bg-clip-text text-transparent bg-gradient-to-br ${stat.color} text-lg mb-1 block`} />
            <p className="text-lg font-black text-gray-800">{stat.value}</p>
            <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Primary CTA: Polish */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        onClick={() => navigate('/polishing')}
        className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl text-white font-black text-base shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <i className="fas fa-gem text-lg" />
        <span>开始打磨</span>
        {polishableCount > 0 && (
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{polishableCount} 可打磨</span>
        )}
      </motion.button>

      {/* Secondary CTAs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { path: '/shop', icon: 'fa-store', label: '商城', desc: '买矿石和工具', color: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
          { path: '/inventory', icon: 'fa-box-open', label: '背包', desc: '查看我的资产', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
        ].map((btn, i) => (
          <motion.button
            key={btn.path}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => navigate(btn.path)}
            className={`bg-gradient-to-br ${btn.color} rounded-2xl p-4 text-white text-left shadow-lg ${btn.shadow} active:scale-[0.98] transition-transform`}
          >
            <i className={`fas ${btn.icon} text-xl mb-2 block`} />
            <p className="font-black text-sm">{btn.label}</p>
            <p className="text-white/70 text-[10px]">{btn.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick access grid — 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { path: '/quests', icon: 'fa-clipboard-list', label: '任务', desc: '完成任务获奖励', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { path: '/toolcraft', icon: 'fa-layer-group', label: '合成', desc: '3合1升级工具', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', border: 'border-orange-200' },
          { path: '/collection', icon: 'fa-book', label: '图鉴', desc: '矿石品种收集', color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { path: '/shop', icon: 'fa-mask', label: '黑市', desc: '神秘商人交易', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((item, i) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            onClick={() => navigate(item.path)}
            className={`${item.bg} rounded-2xl p-4 border ${item.border} text-left active:scale-[0.97] transition-transform shadow-sm`}
          >
            <div className={`bg-gradient-to-br ${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-2`}>
              <i className={`fas ${item.icon} text-white text-sm`} />
            </div>
            <p className="font-black text-sm text-gray-800">{item.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Recent items — horizontal scroll */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-800">最近获得</h3>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-3 px-3"
          >
            {recentItems.map((item, i) => (
              <motion.div
                key={`${item._type}-${item.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex-shrink-0 w-20 bg-white rounded-2xl p-3 border border-purple-100 shadow-sm text-center"
              >
                <div className="relative h-14 flex items-center justify-center mb-1">
                  <div className={`absolute inset-0 rounded-full ${
                    item._type === 'stone'
                      ? STONE_GRADE_COLORS[(item as any).grade]
                      : TOOL_LEVEL_COLORS[(item as any).level]
                  } opacity-15 blur-md`} />
                  <i className={`fas ${item._type === 'stone' ? 'fa-gem' : 'fa-wrench'} text-xl ${
                    item._type === 'stone' ? 'text-blue-500' : 'text-green-500'
                  }`} />
                </div>
                <p className="text-[10px] font-bold text-gray-700 truncate">
                  {item._type === 'stone'
                    ? getStoneDisplayName((item as any).grade, (item as any).subGrade)
                    : TOOL_LEVEL_NAMES[(item as any).level]
                  }
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
