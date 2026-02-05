
import React, { useState, useEffect, useRef } from 'react';
import Button from './common/Button';
import { useApp } from '../context/AppContext';
import { generateCognitiveAssessment } from '../services/geminiService';
import { CognitiveStats } from '../types';

// --- Audio Engine (Singleton Pattern) ---
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!sharedAudioCtx) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            sharedAudioCtx = new AudioContext();
        }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(console.error);
    }
    return sharedAudioCtx;
};

const playSound = (type: 'correct' | 'wrong' | 'levelUp' | 'complete' | 'click') => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

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
                osc.frequency.setValueAtTime(660, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'wrong':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'levelUp':
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
 * 游戏结果结算页
 */
const GameResult: React.FC<{ score: number; accuracy?: number; type: 'memory' | 'attention'; onExit: () => void }> = ({ score, accuracy, type, onExit }) => {
    const [analysis, setAnalysis] = useState<{rating: string; advice: string} | null>(null);

    useEffect(() => {
        generateCognitiveAssessment(score, accuracy || 0, type).then(setAnalysis);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white animate-fade-in relative max-w-[430px] mx-auto">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-5xl mb-6 shadow-[0_0_40px_rgba(124,58,237,0.5)] animate-bounce">
                    {analysis ? analysis.rating : '...'}
                </div>
                <h2 className="text-2xl font-black mb-2">训练完成</h2>
                <div className="flex gap-8 mb-8 text-slate-300">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">得分</span>
                        <span className="text-3xl font-black">{score}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">{type === 'memory' ? '准确率' : '耗时'}</span>
                        <span className="text-3xl font-black">{type === 'memory' ? `${accuracy}%` : `${Math.floor((accuracy || 0)/1000)}s`}</span>
                    </div>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md mb-8 w-full border border-white/10">
                    <h4 className="text-xs font-bold text-brand-300 uppercase tracking-widest mb-2">AI 康复分析</h4>
                    <p className="text-sm leading-relaxed text-slate-200">
                        {analysis ? analysis.advice : '正在生成神经认知评估报告...'}
                    </p>
                </div>

                <Button fullWidth onClick={onExit} className="bg-white text-slate-900 hover:bg-slate-100">
                    保存并返回
                </Button>
            </div>
        </div>
    );
};

/** 
 * 认知训练控制台 (Dashboard)
 */
export const CognitiveDashboard: React.FC<{ onStartGame: (type: 'memory' | 'attention') => void }> = ({ onStartGame }) => {
    const { state } = useApp();
    const activeProfileId = state.user.currentProfileId || state.user.id;
    const stats = state.user.id === activeProfileId 
        ? state.user.cognitiveStats 
        : state.user.familyMembers?.find(m => m.id === activeProfileId)?.cognitiveStats;

    const recommendedGame = (stats?.lastScore || 0) < 60 ? 'memory' : 'attention';

    const targetMinutes = 20;
    const currentMinutes = stats?.todayDuration || 0;
    const remaining = Math.max(0, targetMinutes - currentMinutes);
    const progress = Math.min(100, (currentMinutes / targetMinutes) * 100);

    return (
        <div className="space-y-5 animate-slide-up">
             {/* 1. Progress Bar Card */}
             <div className="bg-white rounded-[20px] p-5 shadow-sm border border-brand-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -translate-y-10 translate-x-10 opacity-60"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                今日大脑激活计划
                                {progress >= 100 && <span className="text-xs">🎉</span>}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">
                                每日 20 分钟 · 预防认知衰退
                            </p>
                        </div>
                        <div className="text-right">
                            {remaining > 0 ? (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] text-slate-400 font-bold">今日剩余</span>
                                    <span className="text-xl font-black text-brand-600 font-mono">{remaining}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">分钟</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                                    <span className="text-[10px] font-black">目标已达成</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] skew-x-12 origin-left"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold">
                        <span>0 min</span>
                        <span>10 min</span>
                        <span>20 min</span>
                    </div>
                </div>
             </div>

             {/* 2. AI 推荐卡片 */}
             <div className="bg-gradient-to-r from-indigo-50 to-white p-5 rounded-[20px] border border-indigo-100 shadow-sm">
                 <div className="flex items-start gap-3 mb-4">
                     <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl shadow-sm">💡</div>
                     <div>
                         <div className="text-xs font-black text-indigo-900">华西推荐训练计划</div>
                         <div className="text-[10px] text-indigo-600/80 mt-0.5 font-bold">基于您最近一次评估 (评分: {stats?.lastScore || '-'})</div>
                     </div>
                 </div>
                 <Button 
                    fullWidth 
                    onClick={() => { playSound('click'); onStartGame(recommendedGame); }} 
                    className="bg-indigo-600 shadow-lg shadow-indigo-500/20 text-xs py-3"
                 >
                     <span className="mr-2">{recommendedGame === 'memory' ? '🧩' : '🔢'}</span> 
                     开始{recommendedGame === 'memory' ? '视觉记忆' : '舒尔特方格'}训练
                 </Button>
             </div>

             {/* 3. 自由选择区 */}
             <div className="text-center pt-2">
                 <div className="flex items-center gap-2 justify-center mb-3 opacity-60">
                    <div className="h-px bg-slate-200 w-12"></div>
                    <p className="text-[10px] text-slate-400 font-bold">或选择自由训练</p>
                    <div className="h-px bg-slate-200 w-12"></div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" onClick={() => { playSound('click'); onStartGame('memory'); }} className="border-slate-200 bg-white text-slate-600">
                        <span className="mr-1">🧩</span> 视觉记忆
                     </Button>
                     <Button variant="outline" onClick={() => { playSound('click'); onStartGame('attention'); }} className="border-slate-200 bg-white text-slate-600">
                        <span className="mr-1">🔢</span> 专注力
                     </Button>
                 </div>
             </div>
        </div>
    );
};

/** 
 * 游戏 1: 视觉空间记忆训练 (Visual Memory)
 */
interface VisualMemoryGameProps {
  onComplete: (score: number, accuracy: number, level: number) => void;
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

  useEffect(() => {
    if (gameState === 'preview') {
      const tileCount = Math.min(3 + Math.floor(level / 2), 8); 
      const size = level > 3 ? 4 : 3;
      setGridSize(size);

      const newTargets = new Set<number>();
      while (newTargets.size < tileCount) {
        newTargets.add(Math.floor(Math.random() * (size * size)));
      }
      setTargets(Array.from(newTargets));
      
      if (level > 1) playSound('levelUp');

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
      playSound('wrong');
      if (lives > 1) {
        setLives(l => l - 1);
      } else {
        setGameState('result');
      }
    }
  };

  if (gameState === 'result') {
    // Calculate final accuracy based on level
    const finalAccuracy = Math.min(100, Math.floor((level * 10) / (level + 2)));
    return (
      <GameResult 
        score={score} 
        accuracy={finalAccuracy}
        type="memory"
        onExit={() => onComplete(score, finalAccuracy, level)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white relative max-w-[430px] mx-auto animate-fade-in">
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
                if (gameState === 'preview' && targets.includes(i)) {
                    statusClass = "bg-white shadow-[0_0_25px_rgba(255,255,255,0.7)] scale-105 transition-all duration-300";
                }
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
 */
interface AttentionGameProps {
  onComplete: (score: number, durationMs: number, mistakes: number) => void;
  onExit: () => void;
}

export const AttentionGame: React.FC<AttentionGameProps> = ({ onComplete, onExit }) => {
    const [numbers, setNumbers] = useState<number[]>([]);
    const [nextNum, setNextNum] = useState(1);
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    
    // Hint System
    const [hintTarget, setHintTarget] = useState<number | null>(null);
    const [shakeTarget, setShakeTarget] = useState<number | null>(null);
    const hintTimerRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    const resetHintTimer = (next: number) => {
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        setHintTarget(null);
        hintTimerRef.current = setTimeout(() => {
            setHintTarget(next);
        }, 5000);
    };

    useEffect(() => {
        const nums = Array.from({length: 16}, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        setNumbers(nums);
        setStartTime(Date.now());
        resetHintTimer(1);
        
        timerRef.current = setInterval(() => {
            if (!isGameOver && startTime > 0) {
                 setElapsed(Date.now() - startTime);
            }
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (startTime > 0 && !isGameOver) {
             const interval = setInterval(() => {
                setElapsed(Date.now() - startTime);
             }, 100);
             return () => clearInterval(interval);
        }
    }, [startTime, isGameOver]);

    const handleNumClick = (num: number) => {
        if (isGameOver) return;

        if (num === nextNum) {
            playSound('correct');
            if (num === 16) {
                // Win
                playSound('complete');
                setIsGameOver(true);
                const finalTime = Date.now() - startTime;
                const score = Math.max(0, 100 - Math.floor((finalTime / 1000) - 10) - (mistakes * 5)); 
                // Pass final result but wait for user to click exit
            } else {
                setNextNum(n => n + 1);
                resetHintTimer(num + 1);
            }
        } else {
            playSound('wrong');
            setMistakes(m => m + 1);
            setShakeTarget(num);
            setTimeout(() => setShakeTarget(null), 500);
        }
    };

    if (isGameOver) {
        return (
            <GameResult 
                score={Math.max(0, 100 - Math.floor(elapsed / 1000) - (mistakes * 5))} 
                accuracy={elapsed} 
                type="attention"
                onExit={() => onComplete(Math.max(0, 100 - Math.floor(elapsed / 1000) - (mistakes * 5)), elapsed, mistakes)}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white relative max-w-[430px] mx-auto animate-fade-in">
             <div className="flex justify-between items-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top))]">
                <div className="text-[11px] font-black opacity-60 uppercase tracking-widest">寻找数字</div>
                <div className="text-2xl font-black font-mono tracking-tighter">{(elapsed / 1000).toFixed(1)}s</div>
                <div className="text-[11px] font-black opacity-60 uppercase tracking-widest">目标: {nextNum}</div>
             </div>

             <div className="flex-1 flex items-center justify-center p-4">
                 <div className="grid grid-cols-4 gap-3 w-full max-w-sm aspect-square">
                     {numbers.map((num) => (
                         <button
                            key={num}
                            onClick={() => handleNumClick(num)}
                            className={`
                                rounded-2xl text-2xl font-black transition-all duration-200 relative overflow-hidden
                                ${num < nextNum ? 'bg-slate-800 text-slate-600 scale-95 opacity-50' : 'bg-slate-700 text-white active:scale-95 shadow-lg'}
                                ${hintTarget === num ? 'ring-4 ring-brand-500 animate-pulse' : ''}
                                ${shakeTarget === num ? 'animate-shake bg-red-500/20' : ''}
                            `}
                            disabled={num < nextNum}
                         >
                             {num}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="p-8 text-center text-white/40 text-[11px] font-black uppercase tracking-widest pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                请按顺序点击数字 1 - 16
             </div>
        </div>
    );
};
