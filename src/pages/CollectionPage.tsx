import { useContext } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { buildCollection, ALL_ORE_COMBINATIONS, type CollectionEntry } from '@/types';
import { motion } from 'framer-motion';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function CollectionPage() {
  const { userData } = useContext(UserDataContext);
  const collection = buildCollection(userData.stones);
  const discovered = collection.filter(e => e.discovered).length;
  const total = ALL_ORE_COMBINATIONS.length;
  const pct = Math.round((discovered / total) * 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700">
            <i className="fas fa-book text-purple-500 mr-1.5" />发现进度
          </h3>
          <span className="text-lg font-black text-purple-600">{discovered}<span className="text-sm font-normal text-gray-400">/{total}</span></span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          {pct < 30 && '旅程刚刚开始，继续打磨吧！'}
          {pct >= 30 && pct < 60 && '进展不错，更多珍品等待发现！'}
          {pct >= 60 && pct < 100 && '即将完成图鉴，加油！'}
          {pct === 100 && '🎉 图鉴全部完成，你是传奇收藏家！'}
        </p>
      </div>

      {/* Ore cards */}
      <div className="grid grid-cols-2 gap-3">
        {collection.map((entry, i) => (
          <motion.div
            key={`${entry.grade}-${entry.subGrade}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl p-4 border-2 shadow-sm ${
              entry.discovered
                ? 'bg-white border-blue-200'
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}
          >
            <div className="relative h-20 flex items-center justify-center mb-2">
              <div className={`absolute inset-0 rounded-full ${entry.color} opacity-15 blur-xl`} />
              <i className={`fas fa-gem text-4xl ${entry.discovered ? 'text-white' : 'text-gray-300'}`} />
              <div className="absolute top-0 right-0">
                {entry.discovered ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-bold">✓</span>
                ) : (
                  <span className="text-[9px] bg-gray-200 text-gray-500 rounded-full px-1.5 py-0.5 font-bold">?</span>
                )}
              </div>
            </div>
            <h4 className="text-sm font-bold text-gray-800 text-center">{entry.name}</h4>
            <p className="text-[10px] text-gray-400 text-center mt-0.5">{entry.label}</p>
            <p className="text-[10px] text-gray-500 text-center mt-1 line-clamp-2">{entry.description || '——'}</p>
            {entry.discovered && (
              <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-500">×{entry.count}</span>
                {entry.acquiredAt && (
                  <span className="text-[10px] text-gray-400">{formatTime(entry.acquiredAt)}</span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {discovered === total && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-300 text-center"
        >
          <i className="fas fa-crown text-4xl text-amber-500 mb-2 block" />
          <h3 className="text-lg font-black text-amber-700">图鉴完成！</h3>
          <p className="text-amber-600 text-sm">你已发现全部矿石品种</p>
        </motion.div>
      )}
    </div>
  );
}
