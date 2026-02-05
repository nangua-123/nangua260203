
import React, { useState, useRef, useEffect } from 'react';

export const NonDrugToolkit: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // 模拟穴位动画帧
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
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 animate-slide-up space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 text-xl">
                    🌿
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800">物理缓解工具箱</h3>
                    <p className="text-[10px] text-slate-400">华西推荐 · 替代药物止痛方案</p>
                </div>
            </div>

            {/* 1. 舒缓音频 */}
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isPlaying ? 'bg-teal-100 text-teal-600 animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                        {isPlaying ? '⏸' : '▶️'}
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-700">华西舒缓冥想 (15min)</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Alpha 波助眠 · 缓解血管紧张</div>
                    </div>
                </div>
                <button 
                    onClick={toggleAudio}
                    className="text-xs font-bold text-teal-600 bg-white px-3 py-1.5 rounded-lg border border-teal-100 shadow-sm active:scale-95 transition-transform"
                >
                    {isPlaying ? '暂停' : '播放'}
                </button>
            </div>

            {/* 2. 穴位按压图解 (动态 CSS 模拟) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-32 flex items-center justify-center">
                {/* 背景手部轮廓 (SVG) */}
                <svg width="200" height="120" viewBox="0 0 200 120" className="opacity-20 absolute">
                    <path d="M40,100 C20,90 10,70 20,50 C30,30 60,10 90,20 C110,30 130,20 150,30 C170,40 180,60 170,90" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M90,20 C100,50 110,70 120,100" fill="none" stroke="white" strokeWidth="4"/>
                </svg>
                
                {/* 穴位点 - 合谷穴 */}
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
            </div>
        </div>
    );
};
