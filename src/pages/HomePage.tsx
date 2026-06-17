import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { calcMineProduction, calcAutoPolish, type AutoPolishResult } from '@/lib/mine';
import { getMineConfig, getWorkbenchConfig, MAX_MINE_LEVEL, MAX_WORKBENCH_LEVEL } from '@/data/mineConfig';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '已就绪';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function HomePage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [autoResults, setAutoResults] = useState<AutoPolishResult | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mineConfig = getMineConfig(userData.mineLevel);
  const mineState = calcMineProduction(userData.mineLevel, userData.mineLastCollect, userData.stones.length);
  const wbConfig = getWorkbenchConfig(userData.workbenchLevel);

  // Auto-collect mine output → buffer
  useEffect(() => {
    const tick = () => {
      const state = calcMineProduction(userData.mineLevel, userData.mineLastCollect, userData.stones.length);
      if (state.produced.length === 0) return;
      const space = wbConfig.bufferCapacity - userData.workbenchBuffer.length;
      if (space <= 0) return;
      const count = Math.min(state.produced.length, space);
      const toBuffer = state.produced.slice(0, count);
      // Advance lastCollect by count * interval (partial collect)
      const newLastCollect = userData.mineLastCollect + count * getMineConfig(userData.mineLevel).intervalMs;
      updateUserData(prev => ({
        workbenchBuffer: [...prev.workbenchBuffer, ...toBuffer],
        mineLastCollect: newLastCollect,
      }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [userData.mineLevel, userData.mineLastCollect, userData.workbenchBuffer.length, wbConfig.bufferCapacity]);

  // Auto-polish: use refs to avoid stale closure in interval
  const autoPolishOn = userData.autoPolishMaxGrade > 0;
  const bufferRef = useRef(userData.workbenchBuffer);
  const lastAutoRef = useRef(userData.autoPolishLastTime);
  const stonesRef = useRef(userData.stones);
  const toolsRef = useRef(userData.tools);
  bufferRef.current = userData.workbenchBuffer;
  lastAutoRef.current = userData.autoPolishLastTime;
  stonesRef.current = userData.stones;
  toolsRef.current = userData.tools;

  useEffect(() => {
    if (!wbConfig.autoUnlock || !autoPolishOn) return;

    const tick = () => {
      const autoResult = calcAutoPolish(
        userData.workbenchLevel, lastAutoRef.current,
        bufferRef.current, stonesRef.current, toolsRef.current,
        userData.workbenchBoundToolId,
      );
      if (autoResult && autoResult.result.polished) {
        updateUserData({
          workbenchBuffer: autoResult.newBuffer,
          stones: autoResult.newBackpack,
          tools: autoResult.newTools,
          autoPolishLastTime: autoResult.newLastTime,
        });
        setAutoResults(autoResult.result);
      }
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [userData.workbenchLevel, autoPolishOn]);

  // Aggregate results by ore name
  const resultSummary = autoResults
    ? autoResults.results.filter(n => n !== '未发现矿石').reduce((acc, n) => {
        acc[n] = (acc[n] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;
  const failedCount = autoResults ? autoResults.results.filter(n => n === '未发现矿石').length : 0;

  const handleCollect = () => {
    if (mineState.produced.length === 0) { toast('矿山还没有产出'); return; }
    const produced = mineState.produced;
    updateUserData(prev => ({
      stones: [...prev.stones, ...produced],
      mineLastCollect: Date.now(),
    }));
    toast.success(`收集了 ${produced.length} 块矿石 → 背包`);
  };

  // Buffer transfer with quantity
  const [showXfer, setShowXfer] = useState<'deposit' | 'withdraw' | null>(null);
  const [xferQty, setXferQty] = useState(1);

  const bufferCount = userData.workbenchBuffer.length;
  const rawInBackpack = userData.stones.filter(s => s.grade === 0).length;
  const maxDeposit = Math.min(rawInBackpack, wbConfig.bufferCapacity - bufferCount);
  const maxWithdraw = bufferCount;

  const execTransfer = () => {
    if (showXfer === 'deposit') {
      const toMove = userData.stones.filter(s => s.grade === 0).slice(0, xferQty);
      const moveIds = new Set(toMove.map(m => m.id));
      updateUserData(prev => ({
        stones: prev.stones.filter(s => !moveIds.has(s.id)),
        workbenchBuffer: [...prev.workbenchBuffer, ...toMove],
      }));
    } else if (showXfer === 'withdraw') {
      const toMove = userData.workbenchBuffer.slice(0, xferQty);
      updateUserData(prev => ({
        workbenchBuffer: prev.workbenchBuffer.slice(xferQty),
        stones: [...prev.stones, ...toMove],
      }));
    }
    setShowXfer(null);
    setXferQty(1);
  };

  const handleUpgradeMine = () => {
    if (userData.mineLevel >= MAX_MINE_LEVEL) { toast.error('矿山已满级'); return; }
    const next = getMineConfig(userData.mineLevel + 1);
    if (userData.coins < next.upgradeCost) { toast.error('游戏币不足'); return; }
    updateUserData(prev => ({ coins: prev.coins - next.upgradeCost, mineLevel: prev.mineLevel + 1 }));
    toast.success(`矿山升级到 Lv.${userData.mineLevel + 1}`);
  };

  const handleUpgradeWorkbench = () => {
    if (userData.workbenchLevel >= MAX_WORKBENCH_LEVEL) { toast.error('工作台已满级'); return; }
    const next = getWorkbenchConfig(userData.workbenchLevel + 1);
    if (userData.coins < next.upgradeCost) { toast.error('游戏币不足'); return; }
    updateUserData({ coins: userData.coins - next.upgradeCost, workbenchLevel: userData.workbenchLevel + 1 });
    toast.success(`工作台升级到 Lv.${userData.workbenchLevel + 1}`);
  };

  const toggleAutoPolish = () => {
    if (!wbConfig.autoUnlock) return;
    const isOn = userData.autoPolishMaxGrade > 0;
    updateUserData({
      autoPolishMaxGrade: isOn ? 0 : 1,
      autoPolishLastTime: Date.now(),
    });
    toast.success(isOn ? '自动打磨已关闭' : '自动打磨已开启');
  };

  const mineBlocked = bufferCount >= wbConfig.bufferCapacity && mineState.produced.length >= mineConfig.storageMax;
  const autoCooldown = Math.max(0, wbConfig.autoCooldownMs - (Date.now() - userData.autoPolishLastTime));
  const usableTools = userData.tools.filter(t => t.durability > 0).length;
  const completedQuests = userData.quests.filter(q => q.progress >= q.target && !q.claimed).length;

  const recentItems = [
    ...userData.stones.map(s => ({ ...s, _type: 'stone' as const })),
    ...userData.tools.map(t => ({ ...t, _type: 'tool' as const })),
  ].sort((a, b) => {
    const aTime = a._type === 'stone' ? (a.acquiredAt ?? 0) : 0;
    const bTime = b._type === 'stone' ? (b.acquiredAt ?? 0) : 0;
    return bTime - aTime;
  }).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Hero bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-[10px]">矿山 Lv.{userData.mineLevel} · 工作台 Lv.{userData.workbenchLevel}</p>
            <span className="bg-white/15 rounded-full px-3 py-1 text-sm font-bold inline-block mt-1">
              <i className="fas fa-coins text-yellow-300 mr-1" />{userData.coins.toLocaleString()}
            </span>
          </div>
          <div className="text-right text-[10px] text-purple-200">
            <div>💎 {userData.stones.length} · 🔧 {usableTools}</div>
            {completedQuests > 0 && <div className="text-amber-300 mt-1">📋 {completedQuests} 可领奖</div>}
          </div>
        </div>
      </motion.div>

      {/* Auto-polish results banner */}
      <AnimatePresence>
        {autoResults && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-black">
                <i className="fas fa-robot mr-1" />自动打磨完成 · {autoResults.count} 块
              </h3>
              <button onClick={() => setAutoResults(null)} className="text-white/60 hover:text-white">
                <i className="fas fa-times text-xs" />
              </button>
            </div>
            {Object.keys(resultSummary!).length > 0 ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                {Object.entries(resultSummary!).map(([name, count]) => (
                  <span key={name} className="font-bold whitespace-nowrap">
                    {name} ×{count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-xs">未产出矿石</p>
            )}
            {failedCount > 0 && (
              <p className="text-white/50 text-[10px] mt-1">{failedCount} 块原石内未发现矿石</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⛏️ Mine */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-gray-800">
            <i className="fas fa-mountain text-amber-600 mr-1.5" />矿山 Lv.{userData.mineLevel}
            <motion.span
              className="ml-2 text-sm inline-block"
              animate={mineBlocked ? { rotate: 0 } : { rotate: [-20, 20, -20] }}
              transition={mineBlocked ? {} : { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              title={mineBlocked ? '暂存区满，矿山暂停' : '采集中...'}
            >⛏️</motion.span>
          </h3>
          {userData.mineLevel < MAX_MINE_LEVEL && (
            <button onClick={handleUpgradeMine}
              disabled={userData.coins < getMineConfig(userData.mineLevel + 1).upgradeCost}
              className="text-[10px] font-bold bg-amber-500 text-white rounded-full px-3 py-1 disabled:opacity-40 active:scale-95 transition-transform"
            >
              升级 {getMineConfig(userData.mineLevel + 1).upgradeCost.toLocaleString()} 币
            </button>
          )}
        </div>
        {userData.mineLevel < MAX_MINE_LEVEL && (() => {
          const next = getMineConfig(userData.mineLevel + 1);
          return (
            <p className="text-[9px] text-gray-400 mb-2">
              Lv.{userData.mineLevel + 1} → {Math.floor(next.intervalMs / 1000)}秒/块 · 存储{next.storageMax}
              {next.bonusOres.length > 0 && <> · 掉落 {next.bonusOres.map(b => `${getStoneDisplayName(b.grade, b.subGrade)}+${Math.round(b.chance * 100)}%`).join(' ')}</>}
            </p>
          );
        })()}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${mineState.produced.length >= mineConfig.storageMax ? 'bg-red-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                style={{ width: `${mineConfig.intervalMs > 0 ? Math.min(100, ((mineConfig.intervalMs - mineState.countdown) / mineConfig.intervalMs) * 100) : 100}%` }} />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              {mineState.produced.length}/{mineConfig.storageMax} 块 · {mineState.countdown > 0 ? formatCountdown(mineState.countdown) : '可收集'}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.93 }} onClick={handleCollect}
            disabled={mineState.produced.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-bold shadow-md disabled:opacity-40 active:scale-95 transition-transform whitespace-nowrap"
          >
            <i className="fas fa-hand-paper mr-1" />收集
          </motion.button>
        </div>
      </div>

      {/* 📦 Buffer */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-gray-800">
            <i className="fas fa-inbox text-gray-500 mr-1.5" />暂存区 · {bufferCount}/{wbConfig.bufferCapacity}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowXfer('deposit'); setXferQty(1); }}
            disabled={maxDeposit === 0}
            className="flex-1 py-1.5 bg-blue-500 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-transform disabled:opacity-40"
          ><i className="fas fa-arrow-down mr-1" />存入原石</button>
          <button onClick={() => { setShowXfer('withdraw'); setXferQty(1); }}
            disabled={maxWithdraw === 0}
            className="flex-1 py-1.5 bg-gray-400 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-transform disabled:opacity-40"
          ><i className="fas fa-arrow-up mr-1" />取出原石</button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          矿山产出优先填满暂存区 · 仅供自动打磨
        </p>
      </div>

      {/* 🔧 Workbench */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-gray-800">
            <i className="fas fa-tools text-blue-600 mr-1.5" />工作台 Lv.{userData.workbenchLevel}
            {autoPolishOn && (
              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                bufferCount === 0 ? 'bg-yellow-100 text-yellow-700' :
                autoCooldown > 0 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {bufferCount === 0 ? '暂存区空' : autoCooldown > 0 ? `冷却 ${formatCountdown(autoCooldown)}` : '就绪'}
              </span>
            )}
          </h3>
          {userData.workbenchLevel < MAX_WORKBENCH_LEVEL && (
            <button onClick={handleUpgradeWorkbench}
              disabled={userData.coins < getWorkbenchConfig(userData.workbenchLevel + 1).upgradeCost}
              className="text-[10px] font-bold bg-blue-500 text-white rounded-full px-3 py-1 disabled:opacity-40 active:scale-95 transition-transform"
            >
              升级 {getWorkbenchConfig(userData.workbenchLevel + 1).upgradeCost.toLocaleString()} 币
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          <span>升级率 <b className="text-blue-600">+{wbConfig.upgradeBonus}%</b></span>
          <span>批量 <b className="text-blue-600">×{wbConfig.batchSize}</b></span>
          {wbConfig.autoUnlock && <span className="text-green-600 font-bold"><i className="fas fa-robot mr-1" />自动</span>}
        </div>

        {/* Bound tool */}
        <div className="mb-2">
          {(() => {
            const bound = userData.tools.find(t => t.id === userData.workbenchBoundToolId);
            const eligible = userData.tools.filter(t => t.level <= wbConfig.maxToolLevel);
            return (
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">绑定工具：{bound ? (
                  <span className="font-bold text-blue-600">
                    {TOOL_LEVEL_NAMES[bound.level]}工具 ({bound.durability}/{bound.durabilityMax})
                    <button onClick={() => updateUserData({ workbenchBoundToolId: null })}
                      className="ml-1 text-red-400 text-xs">✕</button>
                  </span>
                ) : <span className="text-gray-400">未绑定</span>}</p>
                {eligible.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {eligible.map(t => (
                      <button key={t.id}
                        onClick={() => updateUserData({ workbenchBoundToolId: t.id })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          bound?.id === t.id
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 active:border-blue-300'
                        }`}
                      >
                        {TOOL_LEVEL_NAMES[t.level]} {t.durability}/{t.durabilityMax}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">背包中没有可用工具</p>
                )}
              </div>
            );
          })()}
        </div>
        {wbConfig.autoUnlock ? (
          <div className="space-y-2">
            <button onClick={toggleAutoPolish}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${autoPolishOn ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <i className={`fas ${autoPolishOn ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`} />
              {autoPolishOn ? '自动打磨 开' : '开启自动打磨'}
            </button>
            {autoPolishOn && (
              <p className="text-[10px] text-gray-500 text-center">
                从暂存区取 ≤{wbConfig.batchSize} 块批量打磨
                {bufferCount === 0 ? (
                  <span className="text-red-400 font-bold"> · 暂存区为空</span>
                ) : autoCooldown > 0 ? (
                  <span className="text-blue-500 font-bold"> · 冷却 {formatCountdown(autoCooldown)}</span>
                ) : (
                  <span className="text-green-500 font-bold"> · 就绪</span>
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400">升至 Lv.4 解锁自动打磨</p>
        )}
      </div>

      {/* Transfer quantity modal */}
      <AnimatePresence>
        {showXfer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center"
            onClick={() => setShowXfer(null)}
          >
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl p-6 pb-20 w-full max-w-lg safe-area-bottom"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-800 mb-4">{showXfer === 'deposit' ? '存入暂存区' : '取出到背包'}</h3>
              <div className="flex items-center gap-4 justify-center mb-4">
                <button onClick={() => setXferQty(Math.max(1, xferQty - 1))} disabled={xferQty <= 1}
                  className="w-10 h-10 bg-gray-100 rounded-xl font-bold disabled:opacity-30">−</button>
                <span className="text-2xl font-black w-12 text-center">{xferQty}</span>
                <button onClick={() => setXferQty(Math.min(showXfer === 'deposit' ? maxDeposit : maxWithdraw, xferQty + 1))}
                  disabled={xferQty >= (showXfer === 'deposit' ? maxDeposit : maxWithdraw)}
                  className="w-10 h-10 bg-gray-100 rounded-xl font-bold disabled:opacity-30">+</button>
                <button
                  onClick={() => setXferQty(showXfer === 'deposit' ? maxDeposit : maxWithdraw)}
                  className="px-3 py-2 bg-gray-100 rounded-xl text-[10px] font-bold text-gray-600 active:scale-90 transition-transform"
                >最大</button>
              </div>
              <p className="text-xs text-gray-500 text-center mb-4">
                {showXfer === 'deposit' ? `背包中可用原石: ${rawInBackpack} · 暂存区剩余: ${wbConfig.bufferCapacity - bufferCount}` : `暂存区可用: ${bufferCount}`}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowXfer(null)} className="flex-1 py-3 bg-gray-200 rounded-2xl font-bold">取消</button>
                <button onClick={execTransfer}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white font-bold"
                >确认{xferQty}块</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { path: '/polishing', icon: 'fa-gem', label: '开始打磨', color: 'from-purple-500 to-pink-500' },
          { path: '/shop', icon: 'fa-store', label: '商城交易', color: 'from-green-500 to-emerald-500' },
        ].map(btn => (
          <motion.button key={btn.path} whileTap={{ scale: 0.95 }} onClick={() => navigate(btn.path)}
            className={`bg-gradient-to-r ${btn.color} rounded-2xl p-3 text-white text-left shadow-md`}
          >
            <i className={`fas ${btn.icon} text-lg mb-1 block`} />
            <p className="font-black text-sm">{btn.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { path: '/inventory', icon: 'fa-box-open', label: '背包' },
          { path: '/quests', icon: 'fa-clipboard-list', label: '任务' },
          { path: '/collection', icon: 'fa-book', label: '图鉴' },
          { path: '/toolcraft', icon: 'fa-layer-group', label: '合成' },
        ].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 py-2.5 bg-white/70 rounded-xl border border-purple-100 active:scale-95 transition-transform"
          >
            <i className={`fas ${item.icon} text-sm text-purple-500`} />
            <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Recent items */}
      {recentItems.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-gray-500 mb-2">最近获得</h3>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {recentItems.map((item) => (
              <div key={`${item._type}-${item.id}`}
                className="flex-shrink-0 w-16 bg-white rounded-2xl p-2.5 border border-purple-100 shadow-sm text-center"
              >
                <div className="h-10 flex items-center justify-center mb-1">
                  <i className={`fas ${item._type === 'stone' ? 'fa-gem' : 'fa-wrench'} text-lg ${item._type === 'stone' ? 'text-blue-500' : 'text-green-500'}`} />
                </div>
                <p className="text-[9px] font-bold text-gray-700 truncate">
                  {item._type === 'stone' ? getStoneDisplayName((item as any).grade, (item as any).subGrade) : TOOL_LEVEL_NAMES[(item as any).level]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
