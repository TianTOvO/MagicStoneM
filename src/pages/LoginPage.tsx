import { motion } from 'framer-motion';

interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function LoginPage({ setIsAuthenticated }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-purple-200 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6"
        >
          <i className="fas fa-gem text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"></i>
        </motion.div>
        <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          原石狂磨
        </h1>
        <p className="text-gray-600 text-lg mb-8">收集 · 打磨 · 交易</p>
        <button
          onClick={() => setIsAuthenticated(true)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-600/30"
        >
          <i className="fas fa-play mr-2"></i> 开始游戏
        </button>
      </motion.div>
    </div>
  );
}
