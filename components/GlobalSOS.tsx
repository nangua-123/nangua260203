
import React, { useEffect, useRef, useState } from 'react';
import Button from './common/Button';
import { useApp } from '../context/AppContext';
import { DiseaseType } from '../types';

// [Requirement 3] 极简线条急救图解 (Updated to match specific requirements)
// 1. 侧卧 (Side Lying)
const Step1SVG = () => (
    <svg viewBox="0 0 60 60" className="w-full h-full text-slate-600">
        <path d="M15,45 Q30,40 45,45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="40" r="4" fill="currentColor"/>
        <path d="M45,45 L50,30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20,40 L10,50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20,40 L30,50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <text x="30" y="58" fontSize="8" textAnchor="middle" fill="currentColor">侧卧防窒息</text>
    </svg>
);

// 2. 禁塞物 (No putting things in mouth) - Mouth with cross
const Step2SVG = () => (
    <svg viewBox="0 0 60 60" className="w-full h-full text-slate-600">
        <path d="M20,30 Q30,40 40,30" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M20,30 Q30,20 40,30" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M25,25 L35,35 M35,25 L25,35" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="30" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="1"/>
        <text x="30" y="58" fontSize="8" textAnchor="middle" fill="currentColor">口腔禁塞物</text>
    </svg>
);

// 3. 避尖锐 (Avoid sharp objects) - Sharp object with shield
const Step3SVG = () => (
    <svg viewBox="0 0 60 60" className="w-full h-full text-slate-600">
        <path d="M10,40 L20,20 L30,40" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="20" r="1" fill="currentColor"/>
        <path d="M40,25 L50,35 M50,25 L40,35" stroke="#EF4444" strokeWidth="2"/>
        <rect x="35" y="40" width="20" height="5" fill="currentColor" rx="1"/>
        <text x="30" y="58" fontSize="8" textAnchor="middle" fill="currentColor">移开尖锐物</text>
    </svg>
);

// 4. 记时长 (Record Duration) - Stopwatch
const Step4SVG = () => (
    <svg viewBox="0 0 60 60" className="w-full h-full text-slate-600">
        <circle cx="30" cy="32" r="14" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M30,18 L30,14 M25,16 L23,13 M35,16 L37,13" stroke="currentColor" strokeWidth="2"/>
        <path d="M30,32 L36,26" stroke="currentColor" strokeWidth="2"/>
        <text x="30" y="58" fontSize="8" textAnchor="middle" fill="currentColor">记录发作时长</text>
    </svg>
);

export const GlobalSOS: React.FC = () => {
    const { state, dispatch } = useApp();
    const { user, primaryCondition } = state;
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // 获取当前监测数据
    const activeProfileId = user.currentProfileId || user.id;
    const currentStats = user.id === activeProfileId 
        ? user.iotStats 
        : user.familyMembers?.find(m => m.id === activeProfileId)?.iotStats;

    const isEpilepsy = primaryCondition === DiseaseType.EPILEPSY;
    
    // [Requirement 1] 逻辑判定：跌倒监测 OR 声音识别 (模拟)
    const isFallDetected = currentStats?.isFallDetected || false;
    const isSoundTriggered = currentStats?.isSoundTriggered || false;
    const isTriggered = isFallDetected || isSoundTriggered;

    // [Requirement 1] 强制锁定最高音量报警
    useEffect(() => {
        if (isTriggered && !isAlarmPlaying) {
            // 初始化报警音频
            if (!audioRef.current) {
                // 使用模拟的警报声 URL
                audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
                audioRef.current.loop = true;
                audioRef.current.volume = 1.0; // 强制最高音量 (Web API limit)
            }
            audioRef.current.play().catch(e => console.log("Alarm play blocked:", e));
            setIsAlarmPlaying(true);
        } else if (!isTriggered && isAlarmPlaying) {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
            setIsAlarmPlaying(false);
        }
    }, [isTriggered]);

    // 手动触发 SOS (Floating Button)
    const handleManualSOS = () => {
        window.location.href = "tel:120";
    };

    // 解除误报
    const handleDismiss = () => {
        if (currentStats) {
            // 停止报警
            audioRef.current?.pause();
            setIsAlarmPlaying(false);
            
            // 重置状态
            dispatch({
                type: 'UPDATE_IOT_STATS',
                payload: { 
                    id: activeProfileId, 
                    stats: { ...currentStats, isFallDetected: false, isSoundTriggered: false } 
                }
            });
        }
    };

    return (
        <>
            {/* [Requirement 2] SOS 悬浮避障球 (针对癫痫用户全应用强制开启) */}
            {isEpilepsy && !isTriggered && (
                <button
                    onClick={handleManualSOS}
                    className="fixed right-5 bottom-32 w-16 h-16 bg-[#FF4D4F] rounded-full shadow-[0_4px_20px_rgba(255,77,79,0.5)] flex items-center justify-center text-3xl z-[9999] active:scale-90 transition-transform animate-pulse border-4 border-white"
                    aria-label="一键呼叫急救"
                    style={{ touchAction: 'none' }} // 预留给拖拽逻辑
                >
                    🆘
                </button>
            )}

            {/* [Requirement 1] 三级预警全屏熔断 (红屏覆盖) */}
            {isTriggered && (
                <div className="fixed inset-0 z-[99999] bg-[#FF4D4F] flex flex-col items-center justify-center p-6 animate-fade-in text-white overflow-y-auto">
                    
                    {/* Header Alert */}
                    <div className="flex flex-col items-center mb-6 animate-shake w-full">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-6xl shadow-xl mb-4 text-[#FF4D4F] border-4 border-white/50">
                            🚨
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-center">
                            {isFallDetected ? '跌倒监测触发' : '持续抽搐告警'}
                        </h2>
                        <p className="text-lg font-bold opacity-90 mt-2 text-center bg-black/20 px-4 py-1 rounded-full">
                            三级熔断机制已激活
                        </p>
                        <p className="text-sm mt-2 opacity-80 font-mono">
                            {isSoundTriggered ? 'Audio Pattern Matched' : 'Fall Detection Activated'}
                        </p>
                    </div>

                    {/* [Requirement 1] 两个大按钮 */}
                    <div className="w-full space-y-4 mb-8">
                        <button 
                            onClick={handleManualSOS}
                            className="w-full h-[72px] bg-white text-[#FF4D4F] rounded-2xl text-xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                        >
                            <span className="text-3xl">📞</span>
                            拨打紧急联系人
                        </button>
                        
                        <button 
                            onClick={() => alert("位置已通过本地短信发送: 北纬30.67, 东经104.06")}
                            className="w-full h-[72px] bg-red-800/40 border-2 border-white/50 text-white rounded-2xl text-xl font-black flex items-center justify-center gap-3 active:scale-95 transition-transform backdrop-blur-md"
                        >
                            <span className="text-3xl">📍</span>
                            一键发定位
                        </button>
                    </div>

                    {/* [Requirement 3] 华西 4 步急救法 (插画指南) */}
                    <div className="bg-white/10 rounded-[24px] p-5 w-full backdrop-blur-sm border border-white/20">
                        <div className="flex items-center justify-center gap-2 mb-4 border-b border-white/20 pb-2">
                            <span className="bg-white text-[#FF4D4F] text-[10px] font-black px-2 py-0.5 rounded">华西科普</span>
                            <h3 className="text-sm font-black">目击者急救 4 步法</h3>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 mb-1">
                            <div className="aspect-square bg-white/90 rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                                <div className="w-10 h-10 mb-1"><Step1SVG /></div>
                            </div>
                            <div className="aspect-square bg-white/90 rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                                <div className="w-10 h-10 mb-1"><Step2SVG /></div>
                            </div>
                            <div className="aspect-square bg-white/90 rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                                <div className="w-10 h-10 mb-1"><Step3SVG /></div>
                            </div>
                            <div className="aspect-square bg-white/90 rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                                <div className="w-10 h-10 mb-1"><Step4SVG /></div>
                            </div>
                        </div>
                        <p className="text-[9px] text-center opacity-80 mt-2">
                            保持冷静 · 切勿强行按压 · 记录时长
                        </p>
                    </div>

                    {/* Dismiss */}
                    <button 
                        onClick={handleDismiss}
                        className="mt-8 text-white/60 text-sm font-bold underline decoration-white/40 pb-safe px-4 py-2"
                    >
                        误报解除 (I am safe)
                    </button>

                </div>
            )}
        </>
    );
};
