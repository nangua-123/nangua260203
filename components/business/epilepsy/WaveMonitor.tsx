
import React, { useEffect, useState, useRef, memo } from 'react';

// 使用 React.memo 避免父组件渲染导致的不必要重绘
export const WaveMonitor = memo(() => {
  const [eegPath, setEegPath] = useState('');
  const [stats, setStats] = useState({ hr: 72, spo2: 98, tremor: 0.5 });
  
  // 使用 Ref 存储动画帧 ID，防止内存泄漏
  const animationFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  // 1. 生命体征模拟循环 (低频更新)
  useEffect(() => {
    const interval = setInterval(() => {
        setStats(prev => ({
            hr: 70 + Math.floor(Math.random() * 8), // 心率在 70-78 波动
            spo2: 96 + Math.floor(Math.random() * 4), // 血氧在 96-99 波动
            tremor: parseFloat((0.2 + Math.random() * 0.3).toFixed(1)) // 震颤指数
        }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 2. 脑电波形绘制循环 (高频 60FPS)
  useEffect(() => {
    const generateWave = () => {
      // [AUDIT_FIX] 调整时间步进，使波形流动更自然
      tickRef.current += 0.15; 
      
      const points = [];
      const width = 360; 
      const pointsCount = 90; // 增加采样点密度以提高曲线平滑度
      const step = width / pointsCount;

      for (let i = 0; i <= pointsCount; i++) {
        const x = i * step;
        // const t = tickRef.current + i * 0.1; // 旧算法
        
        // [AUDIT_FIX] 核心算法增强：引入偶发痫样放电 (Spike Wave)
        // 使用正弦波叠加模拟脑电背景活动，并随机插入高幅值的棘波
        
        // 基础节律 (Alpha/Beta)
        const basePhase = x * 0.15 + tickRef.current;
        const baseWave = Math.sin(basePhase) * 10; 
        
        // 随机尖波模拟：利用 x 和 tick 的组合产生伪随机但连续的尖峰
        // 通过 Math.sin 的高频分量模拟尖波形态
        const spikeTrigger = Math.sin(x * 0.05 - tickRef.current * 0.5);
        let spike = 0;
        
        // 当触发器处于特定相位且随机因子满足时，产生尖波
        if (spikeTrigger > 0.95 && Math.random() > 0.3) {
             spike = -35; // 向下棘波
        } else if (spikeTrigger < -0.95 && Math.random() > 0.3) {
             spike = 35;  // 向上棘波
        }

        // 组合波形，基线调整为 50 (容器高度 100 的中心)
        const y = 50 + baseWave + spike + (Math.random() - 0.5) * 4; // 添加少量高频噪声

        points.push(`${x},${y}`);
      }

      // [AUDIT_FIX] 调整 viewBox 为 0 0 360 100 以容纳大幅值尖波，防止截断
      setEegPath(`M 0,50 L ${points.join(' L ')}`);
      
      animationFrameRef.current = requestAnimationFrame(generateWave);
    };

    animationFrameRef.current = requestAnimationFrame(generateWave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden transform transition-transform">
        {/* 背景网格装饰 */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* 顶部状态栏 */}
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">华西 AI 实时哨兵监测中</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold">设备连接: 稳定</span>
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
            
            {/* 动态 SVG [AUDIT_FIX] 更新 viewBox 以匹配新的波形幅度 */}
            <svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none" className="overflow-visible">
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                        <stop offset="10%" stopColor="#10B981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path d={eegPath} fill="none" stroke="url(#waveGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            {/* 扫描线动画 */}
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-slate-900 z-20"></div>
        </div>

        {/* 生命体征仪表盘 */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">心率 (BPM)</span>
                <span className="text-2xl font-black text-emerald-500 tracking-tighter">{stats.hr}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">血氧 (%)</span>
                <span className="text-2xl font-black text-brand-500 tracking-tighter">{stats.spo2}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">肌张力 (Hz)</span>
                <span className="text-2xl font-black text-amber-500 tracking-tighter">{stats.tremor}</span>
            </div>
        </div>
    </div>
  );
});
