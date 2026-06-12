import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { Quest, QUEST_TYPE_INFO } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const mockQuests: Quest[] = [
  { id: 1, type: '日常', title: '打磨5次矿石', description: '使用打磨工具打磨任意矿石5次', progress: 0, target: 5, reward: 100 },
  { id: 2, type: '日常', title: '收集3块玛瑙', description: '通过打磨或购买获得3块玛瑙等级的矿石', progress: 0, target: 3, reward: 200 },
  { id: 3, type: '成就', title: '首次打磨成功', description: '成功将一块原石升级为玛瑙', progress: 0, target: 1, reward: 50 },
  { id: 4, type: '成就', title: '工具大师', description: '拥有3个专业级别的打磨工具', progress: 0, target: 3, reward: 300 },
  { id: 5, type: '寻宝', title: '寻找神秘矿石', description: '解开谜题：什么矿石越打磨越亮，却不会变小？', progress: 0, target: 1, reward: 1000, isPuzzle: true },
  { id: 6, type: '团队', title: '极速研磨', description: '与3名队友一起，在10分钟内完成50次打磨', progress: 0, target: 1, reward: 500 },
];

export default function QuestsPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'achievement' | 'treasure' | 'team'>('all');
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<Quest | null>(null);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');

  const tabLabels: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: 'all', label: '全部', icon: 'fa-list' },
    { key: 'daily', label: '日常', icon: 'fa-calendar-day' },
    { key: 'achievement', label: '成就', icon: 'fa-trophy' },
    { key: 'treasure', label: '寻宝', icon: 'fa-map-marked-alt' },
    { key: 'team', label: '团队', icon: 'fa-users' },
  ];

  const typeMap: Record<string, typeof activeTab> = {
    '日常': 'daily', '成就': 'achievement', '寻宝': 'treasure', '团队': 'team',
  };

  const filteredQuests = activeTab === 'all'
    ? mockQuests
    : mockQuests.filter(q => typeMap[q.type] === activeTab);

  const handleClaim = (quest: Quest) => {
    if (quest.isPuzzle) {
      setCurrentPuzzle(quest);
      setShowPuzzleModal(true);
      return;
    }

    const userQuest = userData.quests.find(q => q.id === quest.id);
    if (!userQuest || userQuest.progress < userQuest.target) {
      toast.error('任务尚未完成');
      return;
    }
    if (userQuest.claimed) {
      toast.error('奖励已领取');
      return;
    }

    updateUserData({
      coins: userData.coins + quest.reward,
      quests: userData.quests.map(q =>
        q.id === quest.id ? { ...q, claimed: true } : q
      ),
    });
    toast.success(`获得 ${quest.reward} 游戏币！`);
  };

  const handlePuzzleSubmit = () => {
    if (!currentPuzzle) return;
    const correctAnswers = ['原石', '原石狂磨', '魔法石', 'magic stone', '矿石'];
    if (correctAnswers.includes(puzzleAnswer.trim())) {
      const newStone = {
        id: Date.now(),
        grade: 0,
        subGrade: 0,
        damage: 0,
        damageLimit: 150 + Math.floor(Math.random() * 51),
        mysterious: true,
        isPolishable: true,
        acquiredAt: Date.now(),
      };

      updateUserData({
        stones: [...userData.stones, newStone],
        coins: userData.coins + currentPuzzle.reward,
        quests: userData.quests.map(q =>
          q.id === currentPuzzle.id ? { ...q, progress: q.target } : q
        ),
      });
      toast.success(`恭喜！你解开了谜题，获得了${currentPuzzle.reward}游戏币和一块神秘矿石！`);
      setShowPuzzleModal(false);
    } else {
      toast.error('答案不对，再想想？');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">📋 任务中心</h1>
        <p className="text-gray-700 text-lg font-medium">完成任务获取游戏币和稀有矿石奖励</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabLabels.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className={`fas ${tab.icon} mr-1.5`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* Quest list */}
      <div className="space-y-4">
        {filteredQuests.map((quest, i) => {
          const userQuest = userData.quests.find(q => q.id === quest.id);
          const progress = userQuest?.progress ?? 0;
          const claimed = userQuest?.claimed ?? false;
          const done = progress >= quest.target;
          const typeInfo = QUEST_TYPE_INFO[quest.type];

          return (
            <motion.div key={quest.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-5 border-2 shadow-lg ${
                claimed ? 'bg-gray-50 border-gray-200 opacity-60' :
                done ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${typeInfo.color} flex items-center justify-center text-white text-lg`}>
                    <i className={`fas fa-${typeInfo.icon}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeInfo.color} text-white`}>{quest.type}</span>
                      <h3 className="font-bold text-gray-800">{quest.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{quest.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-amber-600">
                    <i className="fas fa-coins text-amber-500 mr-1"></i>{quest.reward}
                  </p>
                  {quest.isPuzzle && !claimed && (
                    <button onClick={() => handleClaim(quest)}
                      className="mt-2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg hover:scale-105 transition-all"
                    >
                      解开谜题
                    </button>
                  )}
                  {!quest.isPuzzle && !claimed && (
                    <button onClick={() => handleClaim(quest)}
                      disabled={!done}
                      className={`mt-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                        done
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {done ? '领取奖励' : `${progress}/${quest.target}`}
                    </button>
                  )}
                  {claimed && (
                    <span className="text-sm text-gray-400 font-bold mt-2 block">
                      <i className="fas fa-check-circle mr-1"></i>已领取
                    </span>
                  )}
                </div>
              </div>
              {!quest.isPuzzle && !claimed && (
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Puzzle Modal */}
      {showPuzzleModal && currentPuzzle && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPuzzleModal(false)}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 max-w-md w-full border-2 border-purple-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🔍 寻宝谜题</h3>
            <p className="text-gray-700 mb-4">{currentPuzzle.description}</p>
            <input type="text" value={puzzleAnswer}
              onChange={e => setPuzzleAnswer(e.target.value)}
              placeholder="输入你的答案..."
              className="w-full border-2 border-purple-300 rounded-xl px-4 py-3 text-gray-800 mb-4 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowPuzzleModal(false)}
                className="flex-1 py-3 bg-gray-300 rounded-xl font-bold"
              >取消</button>
              <button onClick={handlePuzzleSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold shadow-lg"
              >提交答案</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
