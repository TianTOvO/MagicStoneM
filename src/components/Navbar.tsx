import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '@/contexts/themeContext';
import { UserDataContext } from '@/contexts/userDataContext';
import { AuthContext } from '@/contexts/authContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { userData } = useContext(UserDataContext);
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) =>
    `flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
      isActive(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`;

  const navItems = [
    { to: '/', icon: 'fa-home', label: '首页' },
    { to: '/inventory', icon: 'fa-box-open', label: '背包' },
    { to: '/polishing', icon: 'fa-wrench', label: '打磨' },
    { to: '/shop', icon: 'fa-store', label: '商城' },
    { to: '/toolcraft', icon: 'fa-layer-group', label: '合成' },
    { to: '/market', icon: 'fa-mask', label: '黑市' },
    { to: '/quests', icon: 'fa-clipboard-list', label: '任务' },
    { to: '/collection', icon: 'fa-book', label: '图鉴' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b-2 border-purple-200 bg-white/80 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <i className="fas fa-gem text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"></i>
            </motion.div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hidden sm:block">
              原石狂磨
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass(item.to)}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Coins */}
          <div className="hidden lg:flex items-center">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-4 py-2 text-sm font-bold flex items-center border-2 border-yellow-300 shadow-md">
              <i className="fas fa-coins text-yellow-500 mr-2 text-lg"></i>
              <span className="text-yellow-700">{userData.coins}</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-gray-200 pt-2 pb-3"
            >
              <div className="grid grid-cols-4 gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center p-2 rounded-lg text-xs font-bold transition-colors ${
                      isActive(item.to)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600'
                    }`}
                  >
                    <i className={`fas ${item.icon} text-lg mb-1`}></i>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-4 py-1.5 text-sm font-bold flex items-center border-2 border-yellow-300">
                  <i className="fas fa-coins text-yellow-500 mr-1.5"></i>
                  <span className="text-yellow-700">{userData.coins}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
