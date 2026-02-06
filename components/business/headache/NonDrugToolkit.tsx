
import React, { useState, useRef, useEffect } from 'react';

interface NonDrugToolkitProps {
    isEmergency?: boolean;
}

export const NonDrugToolkit: React.FC<NonDrugToolkitProps> = ({ isEmergency = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // 模拟动画帧
    const [pulse, setPulse] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => setPulse(p => !p), 2000);
        return () => clearInterval(interval);
    }, []);

    const toggleAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio("https://actions.google.com/sounds/v1/water/gentle_stream.ogg"); // Mock gentle audio
            audioRef.current.loop = true;
        }
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log("Audio play failed (interaction required)", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={`bg-white rounded-[24px] p-5 shadow-sm border animate-slide-up space-y-5 transition-all duration-500 ${isEmergency ? 'border-orange-200 ring-4 ring-orange-50 shadow-lg' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${isEmergency ? 'bg-orange-100 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                    {isEmergency ? '🚑' : '🌿'}
                </div>
                <div>
                    <h3 className={`text-sm font-black ${isEmergency ? 'text-orange-900' : 'text-slate-800'}`}>
                        {isEmergency ? '华西物理缓解指南 (急救版)' : '物理缓解工具箱'}
                    </h3>
                    <p className={`text-[10px] ${isEmergency ? 'text-orange-700 font-bold' : 'text-slate-400'}`}>
                        {isEmergency ? '请立即停止用药，执行以下方案' : '华西推荐 · 替代药物止痛方案'}
                    </p>
                </div>
            </div>

            {/* 1. 舒缓音频 */}
            <div className={`rounded-2xl p-4 flex items-center justify-between ${isEmergency ? 'bg-orange-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isPlaying ? (isEmergency ? 'bg-orange-200 text-orange-700 animate-pulse' : 'bg-teal-100 text-teal-600 animate-pulse') : (isEmergency ? 'bg-white text-orange-300' : 'bg-slate-200 text-slate-400')}`}>
                        {isPlaying ? '⏸' : '▶️'}
                    </div>
                    <div>
                        <div className={`text-xs font-bold ${isEmergency ? 'text-orange-900' : 'text-slate-700'}`}>
                            {isEmergency ? '镇痛引导冥想 (SOS)' : '华西舒缓冥想 (15min)'}
                        </div>
                        <div className={`text-[9px] mt-0.5 ${isEmergency ? 'text-orange-700' : 'text-slate-400'}`}>
                            {isEmergency ? '深呼吸 · 降低痛觉敏感度' : 'Alpha 波助眠 · 缓解血管紧张'}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={toggleAudio}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sm active:scale-95 transition-transform ${isEmergency ? 'bg-white text-orange-600 border-orange-200' : 'bg-white text-teal-600 border-teal-100'}`}
                >
                    {isPlaying ? '暂停' : '播放'}
                </button>
            </div>

            {/* 2. 动态图解 (Heat Compress vs Acupoint) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-36 flex items-center justify-center">
                {/* Emergency Mode: Heat Compress Diagram */}
                {isEmergency ? (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-slate-900"></div>
                        
                        {/* 头部轮廓 */}
                        <svg width="120" height="120" viewBox="0 0 100 100" className="opacity-40 absolute">
                            <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="2" />
                            <path d="M50,85 L50,100" stroke="white" strokeWidth="8" strokeLinecap="round" />
                        </svg>

                        {/* 热敷区域 (太阳穴/后颈) */}
                        <div className="relative z-10 flex gap-8">
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 bg-orange-500/80 rounded-full blur-xl absolute animate-pulse`}></div>
                                <div className="w-4 h-4 bg-orange-400 rounded-full shadow-[0_0_20px_rgba(251,146,60,1)] relative z-20 border-2 border-white"></div>
                                <span className="text-orange-200 text-[9px] font-bold mt-2 bg-black/40 px-2 py-0.5 rounded backdrop-blur relative z-20">太阳穴</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className={`w-16 h-16 bg-orange-500/60 rounded-full blur-xl absolute animate-pulse delay-500`}></div>
                                <div className="w-4 h-4 bg-orange-400 rounded-full shadow-[0_0_20px_rgba(251,146,60,1)] relative z-20 border-2 border-white"></div>
                                <span className="text-orange-200 text-[9px] font-bold mt-2 bg-black/40 px-2 py-0.5 rounded backdrop-blur relative z-20">后颈风池穴</span>
                            </div>
                        </div>

                        <div className="absolute top-2 right-2 bg-orange-600 text-white text-[8px] px-2 py-1 rounded font-bold animate-pulse">
                            🔥 热敷位置示意
                        </div>
                    </>
                ) : (
                    // Normal Mode: Acupoint
                    <>
                        <svg width="200" height="120" viewBox="0 0 200 120" className="opacity-20 absolute">
                            <path d="M40,100 C20,90 10,70 20,50 C30,30 60,10 90,20 C110,30 130,20 150,30 C170,40 180,60 170,90" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M90,20 C100,50 110,70 120,100" fill="none" stroke="white" strokeWidth="4"/>
                        </svg>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative">
                                <div className={`w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_20px_rgba(20,184,166,0.6)] transition-all duration-1000 ${pulse ? 'scale-110 opacity-100' : 'scale-100 opacity-80'}`}>
                                    按
                                </div>
                                <div className={`absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-75`}></div>
                            </div>
                            <span className="text-white text-[10px] font-bold mt-2 bg-black/30 px-2 py-0.5 rounded backdrop-blur">
                                合谷穴 (虎口) · 按压 30次
                            </span>
                        </div>
                        
                        <div className="absolute top-2 right-2 bg-teal-600/30 text-teal-300 text-[8px] px-1.5 py-0.5 rounded border border-teal-500/30">
                            动态指引
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
