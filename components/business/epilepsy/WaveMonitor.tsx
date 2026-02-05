
import React, { useEffect, useState, useRef, memo } from 'react';

// 使用 React.memo 避免父组件渲染导致的不必要重绘
export const WaveMonitor = memo(() => {
  const [isConnected, setIsConnected] = useState(true); // 蓝牙连接状态
  const [eegPath, setEegPath] = useState('');
  const [stats, setStats] = useState({ hr: 72, spo2: 98, tremor: 0.5 });
  const [isAbnormal, setIsAbnormal] = useState(false);
  
  // 使用 Ref 存储动画帧 ID，防止内存泄漏
  const animationFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  // 模拟断开连接
  const toggleConnection = () => {
      setIsConnected(prev => !prev);
  };

  // 1. 生命体征模拟循环 (低频更新)
  useEffect(() => {
    if (!isConnected) return; // 断连停止更新

    const interval = setInterval(() => {
        setStats(prev => ({
            hr: 70 + Math.floor(Math.random() * 8), // 心率在 70-78 波动
            spo2: 96 + Math.floor(Math.random() * 4), // 血氧在 96-99 波动
            tremor: parseFloat((0.2 + Math.random() * 0.3).toFixed(1)) // 震颤指数
        }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // 2. 脑电波形绘制循环 (高频 60FPS)
  useEffect(() => {
    if (!isConnected) {
        setEegPath(''); // 清空波形
        return;
    }

    const generateWave = () => {
      // [AUDIT_FIX] 调整时间步进，使波形流动更自然
      tickRef.current += 0.15; 
      
      const points = [];
      const width = 360; 
      const pointsCount = 90; // 增加采样点密度以提高曲线平滑度
      const step = width / pointsCount;
      
      let hasSpikeThisFrame = false;

      for (let i = 0; i <= pointsCount; i++) {
        const x = i * step;
        
        // 基础节律 (Alpha/Beta)
        const basePhase = x * 0.15 + tickRef.current;
        const baseWave = Math.sin(basePhase) * 10; 
        
        // 随机尖波模拟
        const spikeTrigger = Math.sin(x * 0.05 - tickRef.current * 0.5);
        let spike = 0;
        
        // 增加尖波触发逻辑
        if (spikeTrigger > 0.95 && Math.random() > 0.95) { // 降低随机概率，增加视觉冲击
             spike = -45; // 向下棘波幅度增大
             hasSpikeThisFrame = true;
        } else if (spikeTrigger < -0.95 && Math.random() > 0.95) {
             spike = 45;  // 向上棘波
             hasSpikeThisFrame = true;
        }

        // 组合波形，基线调整为 50
        const y = 50 + baseWave + spike + (Math.random() - 0.5) * 4; 

        points.push(`${x},${y}`);
      }
      
      // 异常状态持续一小段时间
      if (hasSpikeThisFrame) {
          setIsAbnormal(true);
          setTimeout(() => setIsAbnormal(false), 500); // 500ms 红色警报
      }

      setEegPath(`M 0,50 L ${points.join(' L ')}`);
      animationFrameRef.current = requestAnimationFrame(generateWave);
    };

    animationFrameRef.current = requestAnimationFrame(generateWave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isConnected]);

  return (
    <div className={`bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden transform transition-all duration-300 ${isAbnormal ? 'animate-shake ring-4 ring-red-500 shadow-red-500/50' : ''} ${!isConnected ? 'opacity-90 grayscale' : ''}`}>
        {/* 背景网格装饰 */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* 顶部状态栏 */}
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2" onClick={toggleConnection}>
                <div className="relative cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${!isConnected ? 'bg-slate-500' : isAbnormal ? 'bg-red-500' : 'bg-emerald-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    {isConnected && <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isAbnormal ? 'bg-red-500' : 'bg-emerald-500'}`}></div>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${!isConnected ? 'text-slate-400' : isAbnormal ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isConnected ? (isAbnormal ? '检测到异常棘慢波' : '华西 AI 实时哨兵监测中') : '设备已断开连接'}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold">设备连接: {isConnected ? '稳定' : '异常'}</span>
                <span className="text-[8px] text-slate-600 font-mono">ID: HaaS-8829</span>
            </div>
        </div>

        {/* 核心波形区域 */}
        <div className="relative z-10 h-24 mb-6 border-b border-slate-700/50 relative pl-8">
            {/* Y轴刻度 */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-600 font-mono py-2 leading-none select-none">
                <span>100</span>
                <span>0</span>
                <span>-100</span>
            </div>
            
            {/* 断连提示遮罩 */}
            {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-600 text-center">
                        <div className="text-xl mb-1">🔌</div>
                        <div className="text-[10px] text-slate-300 font-bold">蓝牙信号丢失</div>
                        <div className="text-[8px] text-slate-500">点击左上角状态灯模拟重连</div>
                    </div>
                </div>
            )}

            {/* 动态 SVG */}
            <svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none" className="overflow-visible">
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                        <stop offset="10%" stopColor="#10B981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
                        <stop offset="10%" stopColor="#EF4444" stopOpacity="1" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {isConnected && (
                    <path 
                        d={eegPath} 
                        fill="none" 
                        stroke={isAbnormal ? "url(#alertGradient)" : "url(#waveGradient)"} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-colors duration-100"
                    />
                )}
            </svg>
            
            {/* 扫描线动画 */}
            {isConnected && <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-slate-900 z-20"></div>}
        </div>

        {/* 生命体征仪表盘 */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">心率 (BPM)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : isAbnormal ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{isConnected ? stats.hr : '--'}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">血氧 (%)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : 'text-brand-500'}`}>{isConnected ? stats.spo2 : '--'}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">肌张力 (Hz)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : 'text-amber-500'}`}>{isConnected ? stats.tremor : '--'}</span>
            </div>
        </div>
    </div>
  );
});
