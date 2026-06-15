import { useContext } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { motion } from 'framer-motion';

export default function ResourceHUD() {
  const { userData } = useContext(UserDataContext);

  const polishableCount = userData.stones.filter(
    s => (s.damage ?? 0) < (s.damageLimit ?? 1) && s.grade < 3
  ).length;
  const usableTools = userData.tools.filter(t => t.durability > 0).length;
  const activeQuests = userData.quests.filter(
    q => q.progress < q.target
  ).length;

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-purple-100 safe-area-top">
      <div className="flex items-center justify-between px-4 h-11">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <i className="fas fa-gem text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500" />
          </motion.div>
          <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            原石狂磨
          </span>
        </div>

        {/* Resource chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-2.5 py-1 border border-yellow-200">
            <i className="fas fa-coins text-yellow-500 text-[10px]" />
            <span className="text-xs font-bold text-yellow-700">{userData.coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full px-2.5 py-1 border border-blue-200">
            <i className="fas fa-gem text-blue-400 text-[10px]" />
            <span className="text-xs font-bold text-blue-600">{userData.stones.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-2.5 py-1 border border-green-200">
            <i className="fas fa-wrench text-green-400 text-[10px]" />
            <span className="text-xs font-bold text-green-600">{usableTools}</span>
          </div>
          {activeQuests > 0 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-red-50 to-orange-50 rounded-full px-2.5 py-1 border border-red-200">
              <i className="fas fa-clipboard-list text-red-400 text-[10px]" />
              <span className="text-xs font-bold text-red-600">{activeQuests}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
