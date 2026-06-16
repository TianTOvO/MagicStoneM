import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { QUEST_TYPE_INFO } from '@/types';
import type { Quest } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const QUEST_LIST: Quest[] = [
  { id: 1, type: '日常', title: '打磨3次矿石', description: '使用打磨工具打磨任意矿石3次', progress: 0, target: 3, reward: 150 },
  { id: 2, type: '日常', title: '获得2块玛瑙', description: '通过打磨或购买获得2块玛瑙等级的矿石', progress: 0, target: 2, reward: 300 },
  { id: 7, type: '日常', title: '商城购物', description: '在商城购买任意物品1次', progress: 0, target: 1, reward: 100 },
  { id: 8, type: '日常', title: '清理背包', description: '出售任意物品1次', progress: 0, target: 1, reward: 100 },
  { id: 9, type: '日常', title: '初次合成', description: '合成1次工具', progress: 0, target: 1, reward: 200 },
  { id: 3, type: '成就', title: '首次打磨成功', description: '成功将一块原石升级为玛瑙', progress: 0, target: 1, reward: 100 },
  { id: 4, type: '成就', title: '工具大师', description: '拥有3个专业级别及以上的打磨工具', progress: 0, target: 3, reward: 500 },
  { id: 5, type: '寻宝', title: '稀世珍品', description: '集齐帝王绿翡翠(2-4)、蓝钻(3-2)和非洲之心(3-4)', progress: 0, target: 1, reward: 20000 },
];

export default function QuestsPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [filter, setFilter] = useState<'all' | 'daily' | 'achievement' | 'treasure'>('all');

  const typeMap: Record<string, typeof filter> = {
    '日常': 'daily', '成就': 'achievement', '寻宝': 'treasure',
  };

  const filtered = filter === 'all'
    ? QUEST_LIST
    : QUEST_LIST.filter(q => typeMap[q.type] === filter);

  const handleClaim = (quest: Quest) => {
    const uq = userData.quests.find(q => q.id === quest.id);
    if (!uq || uq.progress < uq.target) { toast.error('任务尚未完成'); return; }
    if (uq.claimed) { toast.error('奖励已领取'); return; }
    updateUserData({
      coins: userData.coins + quest.reward,
      quests: userData.quests.map(q => q.id === quest.id ? { ...q, claimed: true } : q),
    });
    toast.success(`获得 ${quest.reward} 游戏币！`);
  };

  const filters = [
    { key: 'all' as const, label: '全部', icon: 'fa-list' },
    { key: 'daily' as const, label: '日常', icon: 'fa-calendar-day' },
    { key: 'achievement' as const, label: '成就', icon: 'fa-trophy' },
    { key: 'treasure' as const, label: '寻宝', icon: 'fa-map-marked-alt' },
  ];

  const completedCount = userData.quests.filter(q => q.progress >= q.target && !q.claimed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-800">
          <i className="fas fa-clipboard-list text-amber-500 mr-2" />任务中心
        </h2>
        {completedCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {completedCount} 可领
          </span>
        )}
      </div>

      {/* Daily reset hint */}
      <p className="text-[10px] text-gray-400">
        <i className="fas fa-sync-alt mr-1" />日常任务每日凌晨 2:00 重置
      </p>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            <i className={`fas ${f.icon} mr-1`} />{f.label}
          </button>
        ))}
      </div>

      {filtered.map((quest, i) => {
        const uq = userData.quests.find(q => q.id === quest.id);
        const progress = uq?.progress ?? 0;
        const claimed = uq?.claimed ?? false;
        const done = progress >= quest.target;
        const typeInfo = QUEST_TYPE_INFO[quest.type];

        return (
          <motion.div key={quest.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl p-4 border-2 ${
              claimed ? 'bg-gray-50 border-gray-200 opacity-50' :
              done ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
              'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center text-white flex-shrink-0`}>
                <i className={`fas fa-${typeInfo.icon} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeInfo.color} text-white`}>{quest.type}</span>
                  <h4 className="text-sm font-bold text-gray-800 truncate">{quest.title}</h4>
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-1">{quest.description}</p>
                {!claimed && (
                  <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-amber-600">
                  <i className="fas fa-coins text-amber-500 text-[10px] mr-0.5" />{quest.reward}
                </p>
                {claimed ? (
                  <span className="text-[10px] text-gray-400 font-bold">已领取</span>
                ) : (
                  <button onClick={() => handleClaim(quest)} disabled={!done}
                    className={`mt-1 px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      done ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-90' :
                      'bg-gray-200 text-gray-400'
                    }`}
                  >{done ? '领取' : `${progress}/${quest.target}`}</button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
