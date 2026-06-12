import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, STONE_GRADE_NAMES, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName } from '@/types';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { userData } = useContext(UserDataContext);

  const stats = {
    totalStones: userData.stones.length,
    totalTools: userData.tools.length,
    coins: userData.coins,
    activeQuests: userData.quests.filter(q => q.progress < q.target).length,
    completedQuests: userData.quests.filter(q => q.progress >= q.target).length,
    highestStoneGrade: userData.stones.length > 0
      ? STONE_GRADE_NAMES[Math.max(...userData.stones.map(s => s.grade))]
      : '无',
    discoveredCount: (() => {
      const grades = new Set(userData.stones.map(s => `${s.grade}-${s.subGrade}`));
      return grades.size;
    })(),
  };

  const cardHover = 'hover:scale-105 hover:shadow-2xl transition-all duration-150';
  const featureHover = 'hover:-translate-y-2 hover:shadow-2xl transition-all duration-150';

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          ✨ 欢迎来到原石狂磨
        </h1>
        <p className="text-gray-700 text-lg font-medium">开始你的矿石打磨之旅，收集、打磨、交易，成为传奇工匠！</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, type: "tween", duration: 0.15 }}
          className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-300 shadow-lg ${cardHover}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 text-sm font-bold">我的矿石</h3>
            <motion.i className="fas fa-gem text-blue-600 text-xl" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <p className="text-3xl font-black text-blue-700">{stats.totalStones}</p>
          <p className="text-xs text-blue-600 mt-1 font-semibold">最高: {stats.highestStoneGrade} | 发现 {stats.discoveredCount}/10</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "tween", duration: 0.15 }}
          className={`bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-5 border-2 border-green-300 shadow-lg ${cardHover}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 text-sm font-bold">打磨工具</h3>
            <motion.i className="fas fa-tools text-green-600 text-xl" animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <p className="text-3xl font-black text-green-700">{stats.totalTools}</p>
          <p className="text-xs text-green-600 mt-1 font-semibold">可用于打磨和合成</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "tween", duration: 0.15 }}
          className={`bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-5 border-2 border-yellow-300 shadow-lg ${cardHover}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 text-sm font-bold">游戏币</h3>
            <motion.i className="fas fa-coins text-yellow-600 text-xl" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
          <p className="text-3xl font-black text-yellow-700">{stats.coins}</p>
          <p className="text-xs text-yellow-600 mt-1 font-semibold">商城和市场使用</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "tween", duration: 0.15 }}
          className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-300 shadow-lg ${cardHover}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 text-sm font-bold">任务进度</h3>
            <motion.i className="fas fa-tasks text-purple-600 text-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <p className="text-3xl font-black text-purple-700">{stats.completedQuests}/{userData.quests.length}</p>
          <p className="text-xs text-purple-600 mt-1 font-semibold">待完成: {stats.activeQuests}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/polishing', icon: 'fa-wrench', color: 'blue', title: '开始打磨', desc: '打磨矿石，提升等级和价值' },
          { to: '/shop', icon: 'fa-store', color: 'purple', title: '商城购物', desc: '购买矿石和工具' },
          { to: '/market', icon: 'fa-shopping-bag', color: 'amber', title: '交易所', desc: '自由买卖矿石和工具' },
          { to: '/collection', icon: 'fa-book', color: 'indigo', title: '矿石图鉴', desc: '探索收集所有矿石品种' },
        ].map(item => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "tween", duration: 0.15 }}
            className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 rounded-2xl p-5 border-2 border-${item.color}-300 cursor-pointer shadow-lg ${featureHover}`}
          >
            <Link to={item.to} className="h-full flex flex-col justify-between group">
              <div>
                <i className={`fas ${item.icon} text-4xl text-${item.color}-600 mb-3`} />
                <h3 className="text-xl font-black text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-700 text-sm font-medium">{item.desc}</p>
              </div>
              <div className={`mt-3 text-${item.color}-600 text-sm font-bold flex items-center group-hover:translate-x-1.5 transition-transform duration-150`}>
                前往 <i className="fas fa-arrow-right ml-1.5"></i>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent assets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-800">最近资产</h2>
          <Link to="/inventory" className="text-blue-600 hover:text-blue-700 font-bold flex items-center text-sm transition-colors">
            查看全部 <i className="fas fa-chevron-right ml-1.5 text-xs"></i>
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {userData.stones.slice(0, 3).map((stone) => (
            <motion.div
              key={stone.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-300 shadow-md hover:scale-105 hover:rotate-3 hover:shadow-xl transition-all duration-150"
            >
              <div className="relative h-20 flex items-center justify-center mb-3">
                <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[stone.grade]} opacity-20 blur-xl`} />
                <i className="fas fa-gem text-4xl text-blue-600 relative" />
              </div>
              <h4 className="text-center font-bold text-gray-800 text-xs truncate">{getStoneDisplayName(stone.grade, stone.subGrade)}</h4>
              <p className="text-center text-gray-600 text-xs mt-1 font-semibold">{stone.damage}/{stone.damageLimit}</p>
            </motion.div>
          ))}
          {userData.tools.slice(0, 2).map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border-2 border-green-300 shadow-md hover:scale-105 hover:-rotate-3 hover:shadow-xl transition-all duration-150"
            >
              <div className="relative h-20 flex items-center justify-center mb-3">
                <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} opacity-20 blur-xl`} />
                <i className="fas fa-wrench text-4xl text-green-600 relative" />
              </div>
              <h4 className="text-center font-bold text-gray-800 text-xs">{TOOL_LEVEL_NAMES[tool.level]}工具</h4>
              <p className="text-center text-gray-600 text-xs mt-1 font-semibold">{tool.durability}/{tool.durabilityMax}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
