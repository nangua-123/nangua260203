import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

// --- GAME 1: VISUAL MEMORY (Spatial Working Memory) ---
// 模拟经典的 n-back 或 Corsi Block Tapping 变体

interface VisualMemoryGameProps {
  onComplete: (score: number, accuracy: number) => void;
  onExit: () => void;
}

export const VisualMemoryGame: React.FC<VisualMemoryGameProps> = ({ onComplete, onExit }) => {
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'preview' | 'playing' | 'result'>('preview');
  const [gridSize, setGridSize] = useState(3); // Start 3x3
  const [targets, setTargets] = useState<number[]>([]);
  const [userSelection, setUserSelection] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  // Generate new level
  useEffect(() => {
    if (gameState === 'preview') {
      const tileCount = Math.min(3 + Math.floor(level / 2), 8); // Increase difficulty
      const size = level > 3 ? 4 : 3;
      setGridSize(size);

      const newTargets = new Set<number>();
      while (newTargets.size < tileCount) {
        newTargets.add(Math.floor(Math.random() * (size * size)));
      }
      setTargets(Array.from(newTargets));

      // Show pattern for 1.5s then hide
      const timer = setTimeout(() => {
        setGameState('playing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [level, gameState]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;

    // Correct tap
    if (targets.includes(index)) {
      if (!userSelection.includes(index)) {
        const newSelection = [...userSelection, index];
        setUserSelection(newSelection);
        
        // Level Complete?
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
      // Wrong tap
      if (lives > 1) {
        setLives(l => l - 1);
        // Visual shake feedback could go here
      } else {
        // Game Over
        setGameState('result');
        onComplete(score, Math.min(100, Math.floor((level * 10) / (level + 2)))); 
      }
    }
  };

  if (gameState === 'result') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
           <span className="text-4xl">🧠</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">训练完成</h2>
        <div className="text-4xl font-bold text-purple-600 mb-6">{score} <span className="text-sm text-slate-400">分</span></div>
        
        <div className="bg-slate-50 p-4 rounded-xl w-full mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">记忆广度 (Span)</span>
                <span className="font-medium">{targets.length} items</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">准确率</span>
                <span className="font-medium">{(level/(level+1) * 100).toFixed(0)}%</span>
            </div>
        </div>
        <Button fullWidth onClick={onExit}>保存并退出</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative">
      {/* HUD */}
      <div className="flex justify-between items-center p-4">
        <div className="text-sm font-medium opacity-80">关卡 {level}</div>
        <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
                <span key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-red-500' : 'bg-slate-700'}`}></span>
            ))}
        </div>
        <div className="text-xl font-bold">{score}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div 
            className="grid gap-3 w-full max-w-sm aspect-square"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
            {[...Array(gridSize * gridSize)].map((_, i) => {
                let statusClass = "bg-slate-700 hover:bg-slate-600";
                
                if (gameState === 'preview' && targets.includes(i)) {
                    statusClass = "bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-105 transition-all duration-300";
                }
                if (gameState === 'playing' && userSelection.includes(i)) {
                    statusClass = "bg-purple-500 shadow-inner scale-95 transition-all duration-100";
                }

                return (
                    <button
                        key={i}
                        onClick={() => handleTileClick(i)}
                        className={`rounded-xl transition-all duration-200 ${statusClass}`}
                    ></button>
                );
            })}
        </div>
      </div>
      
      <div className="p-6 text-center text-white/50 text-sm pb-10">
        {gameState === 'preview' ? '请记住亮起的方块' : '请按顺序点击刚才亮起的方块'}
      </div>
    </div>
  );
};

// --- GAME 2: SCHULTE GRID (Attention) ---
// 舒尔特方格：1-16 or 1-25 按顺序点击

interface AttentionGameProps {
  onComplete: (score: number, timeMs: number) => void;
  onExit: () => void;
}

export const AttentionGame: React.FC<AttentionGameProps> = ({ onComplete, onExit }) => {
    const [numbers, setNumbers] = useState<number[]>([]);
    const [nextNum, setNextNum] = useState(1);
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    
    // Timer Ref
    const timerRef = useRef<any>(null);

    useEffect(() => {
        // Init grid 4x4 (1-16)
        const nums = Array.from({length: 16}, (_, i) => i + 1);
        // Shuffle
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        setNumbers(nums);
        setStartTime(Date.now());

        timerRef.current = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 100);

        return () => clearInterval(timerRef.current);
    }, []);

    // Fix timer update
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
                // Win
                setIsGameOver(true);
                clearInterval(timerRef.current);
                const finalTime = Date.now() - startTime;
                // Score calculation: faster is better. Baseline 30s.
                // Score = 100 - (seconds - 15) * 2 roughly
                const seconds = finalTime / 1000;
                const calculatedScore = Math.max(10, Math.floor(100 - (seconds - 10) * 2));
                
                setTimeout(() => onComplete(calculatedScore, finalTime), 500);
            } else {
                setNextNum(n => n + 1);
            }
        } else {
            // Penalty? For now just visual feedback could be added
        }
    };

    if (isGameOver) {
        // Handled by parent via onComplete delay, or show simple summary here
        return <div className="flex items-center justify-center h-full text-white text-xl font-bold">处理中...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
             <div className="p-4 flex justify-between items-center bg-white shadow-sm z-10">
                 <div className="text-slate-500 font-medium">目标: <span className="text-brand-600 font-bold text-xl">{nextNum}</span></div>
                 <div className="font-mono text-lg font-bold text-slate-700">{(elapsed/1000).toFixed(1)}s</div>
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
                                className={`rounded-lg text-2xl font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center
                                    ${isClicked 
                                        ? 'bg-slate-100 text-slate-300 border border-slate-100' 
                                        : 'bg-white text-slate-800 border-b-4 border-slate-200 hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px]'}
                                `}
                             >
                                 {num}
                             </button>
                         )
                     })}
                 </div>
             </div>
             
             <div className="p-4 text-center text-slate-400 text-xs">
                 请按顺序（1-16）尽可能快地点击数字
                 <br/>
                 <button onClick={onExit} className="mt-4 text-slate-400 underline">退出训练</button>
             </div>
        </div>
    );
}
