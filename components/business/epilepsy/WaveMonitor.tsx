
import React, { useEffect, useState, useRef, memo } from 'react';
import { cleanEEGWaveform } from '../../../utils/signalProcessing';

// 使用 React.memo 避免父组件渲染导致的不必要重绘
export const WaveMonitor = memo(() => {
  const [isConnected, setIsConnected] = useState(true); // 蓝牙连接状态
  const [eegPath, setEegPath] = useState('');
  const [stats, setStats] = useState({ hr: 72, spo2: 98, sqi: 100 }); // [NEW] SQI
  const [monitorStatus, setMonitorStatus] = useState<'normal' | 'warning' | 'critical'>('normal');
  
  const animationFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  // 模拟断开连接
  const toggleConnection = () => {
      setIsConnected(prev => !prev);
  };

  // 1. 生命体征模拟 (2s update)
  useEffect(() => {
    if (!isConnected) return; 

    const interval = setInterval(() => {
        // Simulate SQI fluctuation
        const newSqi = 85 + Math.floor(Math.random() * 15);
        
        setStats(prev => ({
            hr: 70 + Math.floor(Math.random() * 15 - 5), 
            spo2: 96 + Math.floor(Math.random() * 4), 
            sqi: newSqi
        }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // 2. 脑电波形绘制 (60FPS)
  useEffect(() => {
    if (!isConnected) {
        setEegPath(''); 
        return;
    }

    const generateWave = () => {
      tickRef.current += 0.15; 
      
      const points: number[] = [];
      const width = 360; 
      const pointsCount = 90; 
      const step = width / pointsCount;
      
      // Determine frame status
      const rand = Math.random();
      let currentFrameStatus: 'normal' | 'warning' | 'critical' = 'normal';
      
      if (rand > 0.995) currentFrameStatus = 'critical';
      else if (rand > 0.98) currentFrameStatus = 'warning';

      if (currentFrameStatus !== 'normal') {
          setMonitorStatus(currentFrameStatus);
          setTimeout(() => setMonitorStatus('normal'), 800);
      }

      // Generate Raw Waveform Points
      for (let i = 0; i <= pointsCount; i++) {
        const x = i * step;
        const basePhase = x * 0.15 + tickRef.current;
        const baseWave = Math.sin(basePhase) * 8 + Math.cos(basePhase * 2.5) * 4; 
        
        let spike = 0;
        
        // Add Noise/Artifacts randomly
        const noise = (Math.random() - 0.5) * 10; // EMG Noise

        // Epileptic features
        const trigger = Math.sin(x * 0.2 - tickRef.current * 0.8);
        if (currentFrameStatus === 'critical') {
            if (trigger > 0.8) spike = -60 * Math.random(); 
            else if (trigger < -0.8) spike = 40 * Math.sin(x); 
        } else if (currentFrameStatus === 'warning') {
            if (Math.random() > 0.85) spike = (Math.random() - 0.5) * 30; 
        }

        let y = 50 + baseWave + spike + noise; 
        points.push(y);
      }

      // [NEW] Apply Cleaning Algorithm
      const cleanedPoints = cleanEEGWaveform(points);

      // Convert to Path String
      const pathData = cleanedPoints.map((y, i) => `${i * step},${y}`).join(' L ');
      
      setEegPath(`M 0,50 L ${pathData}`);
      animationFrameRef.current = requestAnimationFrame(generateWave);
    };

    animationFrameRef.current = requestAnimationFrame(generateWave);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isConnected]);

  const getStatusColor = () => {
      if (!isConnected) return 'text-slate-400';
      switch (monitorStatus) {
          case 'critical': return 'text-red-500';
          case 'warning': return 'text-amber-400';
          default: return 'text-emerald-400';
      }
  };

  return (
    <div className={`bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden transform transition-all duration-300 ${monitorStatus === 'critical' ? 'animate-shake ring-4 ring-red-500 shadow-red-500/50' : ''} ${!isConnected ? 'opacity-90 grayscale' : ''}`}>
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Top Status Bar */}
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2" onClick={toggleConnection}>
                <div className="relative cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${!isConnected ? 'bg-slate-500' : monitorStatus === 'critical' ? 'bg-red-500' : monitorStatus === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                    {isConnected && <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${monitorStatus === 'critical' ? 'bg-red-500' : monitorStatus === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor()}`}>
                    {isConnected ? (monitorStatus === 'normal' ? 'AI 伪影过滤开启' : '检测到异常波形') : '设备已断开'}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 font-bold">SQI: {isConnected ? stats.sqi : '--'}%</span>
                <span className="text-[8px] text-slate-600 font-mono">ID: HaaS-8829</span>
            </div>
        </div>

        {/* Waveform Area */}
        <div className="relative z-10 h-24 mb-6 border-b border-slate-700/50 relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-600 font-mono py-2 leading-none select-none">
                <span>100</span>
                <span>0</span>
                <span>-100</span>
            </div>
            
            {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-600 text-center">
                        <div className="text-xl mb-1">🔌</div>
                        <div className="text-[10px] text-slate-300 font-bold">蓝牙信号丢失</div>
                    </div>
                </div>
            )}

            <svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none" className="overflow-visible">
                <defs>
                    <linearGradient id="waveGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="waveGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {isConnected && (
                    <path 
                        d={eegPath} 
                        fill="none" 
                        stroke={monitorStatus === 'critical' ? "url(#waveGradientRed)" : "url(#waveGradientGreen)"} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                    />
                )}
            </svg>
            
            {/* Scanline */}
            {isConnected && <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-slate-900 z-20"></div>}
        </div>

        {/* Vitals Dashboard */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">心率 (BPM)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : stats.hr > 100 || stats.hr < 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                    {isConnected ? stats.hr : '--'}
                </span>
            </div>
            
            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">血氧 (%)</span>
                <span className={`text-2xl font-black tracking-tighter ${!isConnected ? 'text-slate-600' : stats.spo2 < 95 ? 'text-amber-500' : 'text-brand-500'}`}>
                    {isConnected ? stats.spo2 : '--'}
                </span>
            </div>

            <div className="flex flex-col items-center border-l border-slate-800">
                <span className="text-[8px] font-black text-slate-500 uppercase mb-1">信号质量</span>
                <div className={`flex items-baseline ${!isConnected ? 'text-slate-600' : stats.sqi > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className="text-xl font-black tracking-tighter">{isConnected ? stats.sqi : '--'}</span>
                    <span className="text-xs font-bold ml-1">%</span>
                </div>
            </div>
        </div>
    </div>
  );
});
