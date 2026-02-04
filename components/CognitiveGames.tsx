
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { useApp } from '../context/AppContext';
import { generateCognitiveAssessment } from '../services/geminiService';
import { CognitiveStats } from '../types';

// --- Audio Helper for Cognitive Stimulation (Web Audio API) ---
// 声音刺激是认知康复的重要一环，有助于强化多感官记忆回路
const playSound = (type: 'correct' | 'wrong' | 'levelUp' | 'complete' | 'click') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        
        switch (type) {
            case 'click':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'correct':
                // 愉悦的高频正弦波
                osc.frequency.setValueAtTime(660, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'wrong':
                // 低频锯齿波，提示错误
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'levelUp':
                // 升级音效三连音
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.1);
                osc.frequency.setValueAtTime(659, now + 0.2);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'complete':
                 // 胜利和弦
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.15);
                osc.frequency.setValueAtTime(783.99, now + 0.3);
                osc.frequency.setValueAtTime(1046.50, now + 0.45);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
                osc.start(now);
                osc.stop(now + 2);
                break;
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

/** 
 * 认知训练控制台 (Dashboard)
 * 负责展示进度、统计数据及智能推荐
 */
export const CognitiveDashboard: React.FC<{ onStartGame: (type: 'memory' | 'attention') => void }> = ({ onStartGame }) => {
    const { state } = useApp();
    // 从全局状态获取统计信息 (支持亲情账号切换)
    const activeProfileId = state.user.currentProfileId || state.user.id;
    const stats = state.user.id === activeProfileId 
        ? state.user.cognitiveStats 
        : state.user.familyMembers?.find(m => m.id === activeProfileId)?.cognitiveStats;

    // 简单的推荐算法：如果上次得分低于 60，推荐基础记忆训练，否则推荐进阶专注力训练
    const recommendedGame = (stats?.lastScore || 0) < 60 ? 'memory' : 'attention';

    return (
        <div className="space-y-4">
             {/* 进度卡片 */}
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800">今日训练进度</h3>
                    <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold">
                        {stats?.todaySessions || 0} / 3 组
                    </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                    <div 
                        className="bg-brand-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((stats?.todaySessions || 0) / 3) * 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>累计训练: {stats?.totalSessions || 0} 次</span>
                    <span>总时长: {Math.floor((stats?.totalDuration || 0) / 60)} 分钟</span>
                </div>
             </div>

             {/* AI 推荐卡片 */}
             <div className="bg-gradient-to-r from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100">
                 <div className="flex items-start gap-3 mb-4">
                     <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">💡</div>
                     <div>
                         <div className="text-xs font-black text-indigo-900">华西推荐训练计划</div>
                         <div className="text-[10px] text-indigo-600/80 mt-0.5">基于您最近一次评估 (评分: {stats?.lastScore || '-'})</div>
                     </div>
                 </div>
                 <Button 
                    fullWidth 
                    onClick={() => onStartGame(recommendedGame)} 
                    className="bg-indigo-600 shadow-indigo-500/20"
                 >
                     <span className="mr-2">{recommendedGame === 'memory' ? '🧩' : '🔢'}</span> 
                     开始{recommendedGame === 'memory' ? '视觉记忆' : '舒尔特方格'}训练
                 </Button>
             </div>

             {/* 自由选择区 */}
             <div className="text-center">
                 <p className="text-[10px] text-slate-400 mb-2">或选择自由训练</p>
                 <div className="flex gap-3">
                     <Button fullWidth variant="outline" onClick={() => onStartGame('memory')} disabled={recommendedGame === 'memory'}>视觉记忆</Button>
                     <Button fullWidth variant="outline" onClick={() => onStartGame('attention')} disabled={recommendedGame === 'attention'}>专注力</Button>
                 </div>
             </div>
        </div>
    );
};

/** 
 * 游戏 1: 视觉空间记忆训练 (Visual Memory)
 * 锻炼海马体空间记忆功能
 */
interface VisualMemoryGameProps {
  onComplete: (score: number, accuracy: number) => void;
  onExit: () => void;
}

export const VisualMemoryGame: React.FC<VisualMemoryGameProps> = ({ onComplete, onExit }) => {
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'preview' | 'playing' | 'result'>('preview');
  const [gridSize, setGridSize] = useState(3); 
  const [targets, setTargets] = useState<number[]>([]);
  const [userSelection, setUserSelection] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  // 初始化或进入下一关
  useEffect(() => {
    if (gameState === 'preview') {
      // 难度曲线：随关卡增加方块数
      const tileCount = Math.min(3 + Math.floor(level / 2), 8); 
      const size = level > 3 ? 4 : 3;
      setGridSize(size);

      const newTargets = new Set<number>();
      while (newTargets.size < tileCount) {
        newTargets.add(Math.floor(Math.random() * (size * size)));
      }
      setTargets(Array.from(newTargets));
      
      if (level > 1) playSound('levelUp');

      // 预览模式持续 1.5 秒后开始
      const timer = setTimeout(() => {
        setGameState('playing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [level, gameState]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;
    playSound('click');

    if (targets.includes(index)) {
      if (!userSelection.includes(index)) {
        const newSelection = [...userSelection, index];
        setUserSelection(newSelection);
        playSound('correct');
        
        // 本关完成
        if (newSelection.length === targets.length) {
          setScore(s => s + (targets.length * 10));
          setTimeout(() => {
            setLevel(l => l + 1);
            setUserSelection([]);
            setGameState('preview');
          }, 500);
        }
      }
    } else {
      // 点击错误，扣除生命
      playSound('wrong');
      if (lives > 1) {
        setLives(l => l - 1);
      } else {
        // 游戏结束，进入结算
        setGameState('result');
      }
    }
  };

  if (gameState === 'result') {
    return (
      <GameResult 
        score={score} 
        accuracy={Math.min(100, Math.floor((level * 10) / (level + 2)))}
        type="memory"
        onExit={onExit}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white relative max-w-[430px] mx-auto animate-fade-in">
      {/* 游戏状态栏 */}
      <div className="flex justify-between items-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <div className="text-[11px] font-black opacity-60 uppercase tracking-widest">康复关卡 {level}</div>
        <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-800'}`}></div>
            ))}
        </div>
        <div className="text-2xl font-black tracking-tighter">{score}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div 
            className="grid gap-4 w-full max-w-sm aspect-square"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
            {[...Array(gridSize * gridSize)].map((_, i) => {
                let statusClass = "bg-slate-800/80 active:scale-90 transition-all duration-150";
                
                // 预览模式显示目标
                if (gameState === 'preview' && targets.includes(i)) {
                    statusClass = "bg-white shadow-[0_0_25px_rgba(255,255,255,0.7)] scale-105 transition-all duration-300";
                }
                // 游戏模式显示已选中
                if (gameState === 'playing' && userSelection.includes(i)) {
                    statusClass = "bg-brand-500 shadow-[0_0_20px_rgba(22,119,255,0.8)] scale-95 duration-100";
                }

                return (
                    <button
                        key={i}
                        onClick={() => handleTileClick(i)}
                        className={`rounded-2xl ${statusClass}`}
                        disabled={gameState !== 'playing'}
                    ></button>
                );
            })}
        </div>
      </div>
      
      <div className="p-10 text-center text-white/40 text-[11px] font-black uppercase tracking-widest pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        {gameState === 'preview' ? '请观察并记忆闪烁的方块' : '请按显示顺序点击方块'}
      </div>
    </div>
  );
};

/** 
 * 游戏 2: 舒尔特方格 (Attention / Schulte Grid)
 * 锻炼注意力集中与视觉搜索速度
 * 
 * [Optimization] 针对 AD 患者的特殊优化：
 * 1. 智能提示：长时间未操作自动高亮下一目标。
 * 2. 错误反馈：点击错误时震动/变色。
 * 3. 顶部指引：常驻显示“当前目标”，降低认知负荷。
 */
interface AttentionGameProps {
  onComplete: (score: number, metrics: number) => void;
  onExit: () => void;
}

export const AttentionGame: React.FC<AttentionGameProps> = ({ onComplete, onExit }) => {
    const [numbers, setNumbers] = useState<number[]>([]);
    const [nextNum, setNextNum] = useState(1);
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    
    // Hint System
    const [hintTarget, setHintTarget] = useState<number | null>(null);
    const [shakeTarget, setShakeTarget] = useState<number | null>(null);
    const hintTimerRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    // 重置提示计时器 (AD 抗挫败机制)
    const resetHintTimer = (next: number) => {
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        setHintTarget(null);
        
        // 5秒无操作，触发提示
        hintTimerRef.current = setTimeout(() => {
            setHintTarget(next);
        }, 5000);
    };

    // 初始化打乱数字
    useEffect(() => {
        const nums = Array.from({length: 16}, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        setNumbers(nums);
        setStartTime(Date.now());
        resetHintTimer(1);
        
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(hintTimerRef.current);
        };
    }, []);

    // 游戏主计时器
    useEffect(() => {
        if (startTime > 0 && !isGameOver) {
             timerRef.current = setInterval(() => {
                setElapsed(Date.now() - startTime);
            }, 100);
        }
        return () => clearInterval(timerRef.current);
    }, [startTime, isGameOver]);

    const handleTap = (num: number) => {
        if (num === nextNum) {
            // Correct
            playSound('correct');
            if (num === 16) {
                setIsGameOver(true);
                playSound('complete');
                clearInterval(timerRef.current);
                clearTimeout(hintTimerRef.current);
            } else {
                const next = nextNum + 1;
                setNextNum(next);
                resetHintTimer(next);
            }
        } else {
            // Wrong
            playSound('wrong');
            setShakeTarget(num);
            setTimeout(() => setShakeTarget(null), 400); // 震动动画持续时间
        }
    };

    if (isGameOver) {
        const finalTime = Date.now() - startTime;
        const seconds = finalTime / 1000;
        // 计算得分：基准 25秒，每快1秒加分
        const calculatedScore = Math.max(10, Math.floor(100 - (seconds - 25) * 4));
        
        return (
            <GameResult 
                score={calculatedScore} 
                accuracy={seconds} // 此处 accuracy 传时间
                type="attention"
                onExit={onExit}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative max-w-[430px] mx-auto overflow-hidden animate-fade-in">
             {/* 顶部目标指引 - 减轻工作记忆负荷 */}
             <div className="p-6 flex justify-between items-center bg-white shadow-sm border-b border-slate-100 z-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
                 <div className="flex items-center gap-3">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">当前目标</div>
                     <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand-500/30 animate-pulse-fast">
                        {nextNum}
                     </div>
                 </div>
                 <div className="font-mono text-xl font-black text-slate-900 tabular-nums">
                    {(elapsed/1000).toFixed(1)} <span className="text-xs text-slate-400">s</span>
                 </div>
             </div>

             <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC]">
                 <div className="grid grid-cols-4 gap-3 w-full max-w-sm aspect-square">
                     {numbers.map((num) => {
                         const isFound = num < nextNum;
                         const isHint = num === hintTarget;
                         const isShake = num === shakeTarget;

                         // 动态样式计算
                         let btnClass = "bg-white text-slate-800 border-b-4 border-slate-200 active:border-b-0 active:translate-y-[4px]";
                         if (isFound) btnClass = "bg-slate-100 text-slate-300 border-none shadow-none scale-95 opacity-50";
                         else if (isHint) btnClass = "bg-amber-50 text-amber-600 border-b-4 border-amber-200 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)] relative z-10 scale-105";
                         else if (isShake) btnClass = "bg-red-50 text-red-500 border-b-4 border-red-200 animate-shake";

                         return (
                             <button
                                key={num}
                                disabled={isFound}
                                onClick={() => handleTap(num)}
                                className={`rounded-2xl text-2xl font-black shadow-sm transition-all duration-200 flex items-center justify-center min-h-[70px] ${btnClass}`}
                             >
                                 {num}
                             </button>
                         )
                     })}
                 </div>
             </div>
             
             {/* 底部操作区 */}
             <div className="p-8 text-center pb-[calc(2.5rem+env(safe-area-inset-bottom))] bg-white border-t border-slate-50">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                     请按顺序点击数字 1 - 16
                 </p>
                 
                 {/* 进度条 */}
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6">
                     <div 
                        className="bg-brand-500 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${((nextNum - 1) / 16) * 100}%` }}
                     ></div>
                 </div>

                 <button onClick={onExit} className="text-slate-400 text-xs font-bold underline decoration-slate-200 active:text-slate-600">
                     结束训练
                 </button>
             </div>
        </div>
    );
};


// --- 通用游戏结算组件 (AI 评估 & 状态持久化) ---
const GameResult: React.FC<{ score: number; accuracy: number; type: 'memory' | 'attention'; onExit: () => void }> = ({ score, accuracy, type, onExit }) => {
    const { state, dispatch } = useApp();
    const [aiAssessment, setAiAssessment] = useState<{rating: string; advice: string} | null>(null);

    const activeProfileId = state.user.currentProfileId || state.user.id;

    useEffect(() => {
        const processResult = async () => {
            // 1. 调用 Gemini Mock 生成评估
            const assessment = await generateCognitiveAssessment(score, accuracy, type);
            setAiAssessment(assessment);

            // 2. 更新全局状态 (自动同步到 localStorage)
            // 获取当前 stats 以便累加
            const currentStats = state.user.id === activeProfileId 
                ? state.user.cognitiveStats 
                : state.user.familyMembers?.find(m => m.id === activeProfileId)?.cognitiveStats;

            const baseStats = currentStats || { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 };
            
            // 检查是否跨天，重置今日计数
            const today = new Date().toDateString();
            const lastDate = new Date(baseStats.lastUpdated).toDateString();
            const todaySessions = (today !== lastDate && baseStats.lastUpdated !== 0) ? 1 : (baseStats.todaySessions + 1);

            const newStats: Partial<CognitiveStats> = {
                totalSessions: baseStats.totalSessions + 1,
                todaySessions: todaySessions,
                totalDuration: baseStats.totalDuration + (type === 'memory' ? 120 : Math.floor(accuracy)), // 估算时长
                lastScore: score,
                aiRating: assessment.rating,
                lastUpdated: Date.now()
            };

            dispatch({
                type: 'UPDATE_COGNITIVE_STATS',
                payload: { id: activeProfileId, stats: newStats }
            });
        };

        processResult();
    }, [score, accuracy, type, activeProfileId]);

    if (!aiAssessment) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-white text-center p-8 max-w-[430px] mx-auto">
                 <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                 <h3 className="font-black text-slate-900 mb-2">正在分析认知数据</h3>
                 <p className="text-xs text-slate-400">华西 AI 正在生成康复评估...</p>
             </div>
        );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in max-w-[430px] mx-auto bg-white min-h-screen">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
           <span className="text-4xl">🧠</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">康复训练已完成</h2>
        <div className="text-4xl font-black text-brand-500 mb-6">{score} <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">积分</span></div>
        
        {/* 结算页双栏 */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-slate-50 p-4 rounded-[24px] text-left border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">华西 AI 评级</span>
                <span className="text-2xl font-black text-indigo-600">{aiAssessment.rating}级</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-[24px] text-left border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{type === 'memory' ? '记忆广度' : '反应耗时'}</span>
                <span className="text-sm font-black text-slate-800">{type === 'memory' ? `${score/10} 项` : `${accuracy.toFixed(1)}s`}</span>
            </div>
        </div>

        {/* AI Advice */}
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 w-full text-left mb-8">
            <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">医师建议</div>
            <p className="text-xs text-brand-800 font-medium leading-relaxed">
                {aiAssessment.advice}
            </p>
        </div>

        <Button fullWidth onClick={() => { playSound('click'); onExit(); }} className="py-4 shadow-lg shadow-brand-500/20">
            保存并返回
        </Button>
      </div>
    );
};
