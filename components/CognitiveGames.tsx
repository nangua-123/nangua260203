
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

/** 
 * 游戏 1: 视觉空间记忆训练 (海马体功能激活)
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
      const tileCount = Math.min(3 + Math.floor(level / 2), 8); 
      const size = level > 3 ? 4 : 3;
      setGridSize(size);

      const newTargets = new Set<number>();
      while (newTargets.size < tileCount) {
        newTargets.add(Math.floor(Math.random() * (size * size)));
      }
      setTargets(Array.from(newTargets));

      // 预览模式持续 1.5 秒
      const timer = setTimeout(() => {
        setGameState('playing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [level, gameState]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;

    if (targets.includes(index)) {
      if (!userSelection.includes(index)) {
        const newSelection = [...userSelection, index];
        setUserSelection(newSelection);
        
        // 关卡完成
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
      // 点击错误
      if (lives > 1) {
        setLives(l => l - 1);
      } else {
        // 游戏结束
        setGameState('result');
        onComplete(score, Math.min(100, Math.floor((level * 10) / (level + 2)))); 
      }
    }
  };

  if (gameState === 'result') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in max-w-[430px] mx-auto bg-white min-h-screen">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
           <span className="text-4xl">🧠</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">康复训练已完成</h2>
        <div className="text-4xl font-black text-brand-500 mb-6">{score} <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">积分</span></div>
        
        {/* 结算页双栏重构 */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8">
            <div className="bg-slate-50 p-4 rounded-[24px] text-left border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">记忆广度</span>
                <span className="text-sm font-black text-slate-800">{targets.length} 项物品</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-[24px] text-left border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">综合准确率</span>
                <span className="text-sm font-black text-slate-800">{(level/(level+1) * 100).toFixed(0)}%</span>
            </div>
        </div>
        <Button fullWidth onClick={onExit} className="py-4 shadow-lg shadow-brand-500/20">保存并上传华西数据中心</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white relative max-w-[430px] mx-auto">
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
 * 游戏 2: 舒尔特方格 (注意力与视觉搜索训练)
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
    
    const timerRef = useRef<any>(null);

    useEffect(() => {
        const nums = Array.from({length: 16}, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        setNumbers(nums);
        setStartTime(Date.now());
        return () => clearInterval(timerRef.current);
    }, []);

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
            if (num === 16) {
                setIsGameOver(true);
                clearInterval(timerRef.current);
                const finalTime = Date.now() - startTime;
                const seconds = finalTime / 1000;
                const calculatedScore = Math.max(10, Math.floor(100 - (seconds - 10) * 2));
                setTimeout(() => onComplete(calculatedScore, finalTime), 500);
            } else {
                setNextNum(n => n + 1);
            }
        }
    };

    if (isGameOver) {
        return <div className="flex items-center justify-center h-screen bg-white text-brand-600 font-black text-2xl max-w-[430px] mx-auto uppercase tracking-widest animate-pulse">数据同步至华西...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative max-w-[430px] mx-auto overflow-hidden">
             <div className="p-6 flex justify-between items-center bg-white shadow-soft z-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
                 <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">寻找目标: <span className="text-brand-600 font-black text-2xl ml-2">{nextNum}</span></div>
                 <div className="font-mono text-xl font-black text-slate-900">{(elapsed/1000).toFixed(1)} 秒</div>
             </div>

             <div className="flex-1 flex items-center justify-center p-6">
                 <div className="grid grid-cols-4 gap-3 w-full max-w-sm aspect-square">
                     {numbers.map((num) => {
                         const isClicked = num < nextNum;
                         return (
                             <button
                                key={num}
                                disabled={isClicked}
                                onClick={() => handleTap(num)}
                                className={`rounded-2xl text-2xl font-black shadow-sm transition-all active:scale-95 flex items-center justify-center min-h-[70px]
                                    ${isClicked 
                                        ? 'bg-slate-100 text-slate-300 border-none shadow-none scale-90' 
                                        : 'bg-white text-slate-800 border-b-4 border-slate-200 active:border-b-0 active:translate-y-[4px]'}
                                `}
                             >
                                 {num}
                             </button>
                         )
                     })}
                 </div>
             </div>
             
             <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                 请按从 1 到 16 的顺序点击数字
                 <br/>
                 <button onClick={onExit} className="mt-6 text-slate-400 underline decoration-slate-200">退出强化训练</button>
             </div>
        </div>
    );
}
