import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
          404
        </div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">页面未找到</h2>
        <p className="text-gray-400 text-sm mb-6">你访问的页面不存在</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg"
        >
          <i className="fas fa-home mr-2" />返回首页
        </Link>
      </motion.div>
    </div>
  );
}
