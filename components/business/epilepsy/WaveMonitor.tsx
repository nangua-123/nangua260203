
import React, { useEffect, useState, useRef, memo } from 'react';

// 使用 React.memo 避免父组件渲染导致的不必要重绘
export const WaveMonitor = memo(() => {
  const [isConnected, setIsConnected] = useState(true); // 蓝牙连接状态
  const [eegPath, setEegPath] = useState('');
  // [NEW] Added Blood Pressure stats
  const [stats, setStats] = useState({ hr: 72, spo2: 98, bpSys: 120, bpDia: 80 });
  // [NEW] Health Status: 'normal' | 'warning' | 'critical'
  const [monitorStatus, setMonitorStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  
  // 使用 Ref 存储动画帧 ID，防止内存泄漏
  const animationFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  // 模拟断开连接
  const toggleConnection = () => {
      setIsConnected(prev => !prev);
  };

  // 1. 生命体征模拟循环 (低频更新 2s)
  useEffect(() => {
    if (!isConnected) return; // 断连停止更新

    const interval = setInterval(() => {
        setStats(prev => ({
            hr: 70 + Math.floor(Math.random() * 15 - 5), // 65 - 80
            spo2: 96 + Math.floor(Math.random() * 4), // 96 - 99
            // [NEW] Simulate BP fluctuation
            bpSys: 110 + Math.floor(Math.random() * 20), // 110 - 130
            bpDia: 70 + Math.floor(Math.random() * 15)   // 70 - 85
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
      tickRef.current += 0.15; 
      
      const points = [];
      const width = 360; 
      const pointsCount = 90; 
      const step = width / pointsCount;
      
      // 随机决定当前帧的“微状态”，模拟真实脑电的不稳定性
      // 98% 正常, 1.5% 预警(黄), 0.5% 异常(红)
      const rand = Math.random();
      let currentFrameStatus: 'normal' | 'warning' | 'critical' = 'normal';
      
      if (rand > 0.995) currentFrameStatus = 'critical';
      else if (rand > 0.98) currentFrameStatus = 'warning';

      // 状态惯性：如果检测到异常，保持 UI 状态 800ms
      if (currentFrameStatus !== 'normal') {
          setMonitorStatus(currentFrameStatus);
          setTimeout(() => setMonitorStatus('normal'), 800);
      }

      for (let i = 0; i <= pointsCount; i++) {
        const x = i * step;
        
        // 基础节律 (Alpha/Beta mix)
        const basePhase = x * 0.15 + tickRef.current;
        const baseWave = Math.sin(basePhase) * 8 + Math.cos(basePhase * 2.5) * 4; 
        
        let spike = 0;
        
        // [Logic] 癫痫棘慢波模拟 (Epileptic Spike-Wave Complex)
        const trigger = Math.sin(x * 0.2 - tickRef.current * 0.8);

        if (currentFrameStatus === 'critical') {
            // 典型棘慢波：高幅尖波 + 慢波
            if (trigger > 0.8) spike = -60 * Math.random(); // 向下大棘波
            else if (trigger < -0.8) spike = 40 * Math.sin(x); // 慢波跟随
        } else if (currentFrameStatus === 'warning') {
            // 先兆：散发性尖波
            if (Math.random() > 0.85) spike = (Math.random() - 0.5) * 30; 
        }

        // 组合波形，基线调整为 50
        const y = 50 + baseWave + spike + (Math.random() - 0.5) * 3; 
        // 边界限制，防止溢出 SVG
        const clampedY = Math.max(5, Math.min(95, y));

        points.push(`${x},${clampedY}`);
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

  // UI 颜色映射
  const getStatusColor = () => {
      if (!isConnected) return 'text-slate-400';
      switch (monitorStatus) {
          case 'critical': return 'text-red-500';
          case 'warning': return 'text-amber-400';
          default: return 'text-emerald-400';
      }
  };

  const getStatusText = () => {
      if (!isConnected) return '设备已断开连接';
      switch (monitorStatus) {
          case 'critical': return '检测到异常棘慢波 (Danger)';
          case 'warning': return '脑电节律不稳定 (Warning)';
          default: return '华西 AI 实时哨兵监测中';
      }
  };

  return (
    <div className={`bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden transform transition-all duration-300 ${monitorStatus === 'critical' ? 'animate-shake ring-4 ring-red-500 shadow-red-500/50' : ''} ${!isConnected ? 'opacity-90 grayscale' : ''}`}>
        {/* 背景网格装饰 */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* 顶部状态栏 */}
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2" onClick={toggleConnection}>
                <div className="relative cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${!isConnected ? 'bg-slate-500' : monitorStatus === 'critical' ? 'bg-red-500' : monitorStatus === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    {isConnected && <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${monitorStatus === 'critical' ? 'bg-red-500' : monitorStatus === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor()}`}>
                    {getStatusText()}
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
                    <linearGradient id="waveGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                        <stop offset="10%" stopColor="#10B981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="waveGradientYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FBBF24" stopOpacity="0" />
                        <stop offset="10%" stopColor="#FBBF24" stopOpacity="1" />
                        <stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="waveGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
                        <stop offset="10%" stopColor="#EF4444" stopOpacity="1" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {isConnected && (
                    <path 
                        d={eegPath} 
                        fill="none" 
                        stroke={monitorStatus === 'critical' ? "url(#waveGradientRed)" : monitorStatus === 'warning' ? "url(#waveGradientYellow)" : "url(#waveGradientGreen)"} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                    />
                )}
            </svg>
            
            {/* 扫描线动画 */}
            {isConnected && <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-slate-900 z-20"></div>}
        </div>

        {/* 生命体征仪表盘 (3 Cols -> HR | SpO2 | BP) */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            {/* Heart Rate */}
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">心率 (BPM)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : stats.hr > 100 || stats.hr < 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                    {isConnected ? stats.hr : '--'}
                </span>
            </div>
            
            {/* SpO2 */}
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">血氧 (%)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : stats.spo2 < 95 ? 'text-amber-500' : 'text-brand-500'}`}>
                    {isConnected ? stats.spo2 : '--'}
                </span>
            </div>

            {/* Blood Pressure (Replaced Tremor) */}
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">血压 (mmHg)</span>
                <div className={`flex items-baseline ${!isConnected ? 'text-slate-600' : 'text-white'}`}>
                    <span className="text-xl font-black tracking-tighter">{isConnected ? stats.bpSys : '--'}</span>
                    <span className="text-xs opacity-60 mx-0.5">/</span>
                    <span className="text-sm font-bold opacity-80">{isConnected ? stats.bpDia : '--'}</span>
                </div>
            </div>
        </div>
    </div>
  );
});
