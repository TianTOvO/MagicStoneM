import { motion } from 'framer-motion';

interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function LoginPage({ setIsAuthenticated }: LoginPageProps) {
  return (
    <div className="h-dvh bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-6">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-white/[0.06] rounded-full blur-2xl" />
        <div className="absolute bottom-[15%] right-[8%] w-40 h-40 bg-white/[0.05] rounded-full blur-2xl" />
        <div className="absolute top-[40%] left-[30%] w-20 h-20 bg-white/[0.07] rounded-full blur-xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Gem icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm mb-4 border border-white/10">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <i className="fas fa-gem text-5xl text-white" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">原石狂磨</h1>
          <p className="text-purple-200/80 text-sm">收集 · 打磨 · 交易</p>
        </motion.div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { icon: 'fa-gem', label: '收集矿石' },
            { icon: 'fa-wrench', label: '打磨升级' },
            { icon: 'fa-store', label: '自由交易' },
          ].map(f => (
            <div key={f.label} className="text-center">
              <div className="w-12 h-12 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-1.5 border border-white/10">
                <i className={`fas ${f.icon} text-lg text-purple-300`} />
              </div>
              <p className="text-[10px] text-purple-200 font-medium">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAuthenticated(true)}
          className="w-full py-4 bg-white rounded-2xl text-purple-700 font-black text-base shadow-2xl shadow-black/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <i className="fas fa-play" />
          开始游戏
        </motion.button>

        <p className="text-center text-purple-300/60 text-[10px] mt-4">
          踏上工匠之旅，成为传奇
        </p>
      </motion.div>
    </div>
  );
}
