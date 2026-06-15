import { useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { motion } from 'framer-motion';

interface Tab {
  path: string;
  icon: string;
  label: string;
  badge?: number;
}

const TABS: Tab[] = [
  { path: '/', icon: 'fa-home', label: '首页' },
  { path: '/inventory', icon: 'fa-box-open', label: '背包' },
  { path: '/polishing', icon: 'fa-gem', label: '打磨' },
  { path: '/shop', icon: 'fa-store', label: '商店' },
  { path: '/collection', icon: 'fa-book', label: '图鉴' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useContext(UserDataContext);

  const activeQuests = userData.quests.filter(
    q => q.progress >= q.target && !q.claimed
  ).length;

  const getBadge = (tab: Tab): number | undefined => {
    if (tab.path === '/collection' && activeQuests > 0) return activeQuests;
    return undefined;
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-purple-100 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          const isPolish = tab.path === '/polishing';
          const badge = getBadge(tab);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-200 active:scale-90 ${
                active ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              {/* Polish tab special highlight */}
              {isPolish && (
                <div className="absolute -top-5 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-400/40 flex items-center justify-center">
                  <i className="fas fa-gem text-lg text-white" />
                </div>
              )}

              {!isPolish && (
                <>
                  <div className="relative">
                    <i className={`fas ${tab.icon} text-lg`} />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
                </>
              )}

              {/* Active indicator (except polish which has its own highlight) */}
              {active && !isPolish && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -bottom-0 w-5 h-0.5 bg-purple-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
