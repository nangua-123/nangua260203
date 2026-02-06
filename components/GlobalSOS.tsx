
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DiseaseType } from '../types';

export const GlobalSOS: React.FC = () => {
    const { state, dispatch } = useApp();
    const { user, primaryCondition } = state;
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // 获取当前监测数据
    const activeProfileId = user.currentProfileId || user.id;
    const currentStats = user.id === activeProfileId 
        ? user.iotStats 
        : user.familyMembers?.find(m => m.id === activeProfileId)?.iotStats;

    const isEpilepsy = primaryCondition === DiseaseType.EPILEPSY;
    
    // [Requirement 1] 状态位监听
    const isFallDetected = currentStats?.isFallDetected || false;
    const isSoundTriggered = currentStats?.isSoundTriggered || false;
    const isTriggered = isFallDetected || isSoundTriggered;

    // 报警音频锁定
    useEffect(() => {
        if (isTriggered && !isAlarmPlaying) {
            if (!audioRef.current) {
                audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
                audioRef.current.loop = true;
                audioRef.current.volume = 1.0;
            }
            audioRef.current.play().catch(e => console.log("Alarm play blocked:", e));
            setIsAlarmPlaying(true);
        } else if (!isTriggered && isAlarmPlaying) {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
            setIsAlarmPlaying(false);
        }
    }, [isTriggered, isAlarmPlaying]);

    // [Requirement 2] RequestAnimationFrame 动画渲染 (全屏红色脉冲)
    useEffect(() => {
        if (isTriggered && canvasRef.current) {
            let animationId: number;
            let tick = 0;
            
            const animate = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // 实时适配屏幕
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                tick += 0.08; // 脉冲速度
                
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 1. 全屏红色背景 (基础透明度脉冲)
                const baseOpacity = 0.6 + Math.sin(tick) * 0.3; // 0.3 - 0.9
                ctx.fillStyle = `rgba(255, 77, 79, ${baseOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. 中心径向渐变 (模拟冲击波)
                const gradient = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, 0,
                    canvas.width / 2, canvas.height / 2, canvas.width * 0.9
                );
                gradient.addColorStop(0, `rgba(220, 38, 38, ${baseOpacity})`); // Red-600
                gradient.addColorStop(1, `rgba(220, 38, 38, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                animationId = requestAnimationFrame(animate);
            };
            
            animationId = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationId);
        }
    }, [isTriggered]);

    // 手动触发 SOS (Floating Button)
    const handleManualSOS = () => {
        window.location.href = "tel:120";
    };

    // 解除误报
    const handleDismiss = () => {
        if (currentStats) {
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
            {/* SOS 悬浮避障球 (仅在未触发且为癫痫用户时显示) */}
            {isEpilepsy && !isTriggered && (
                <button
                    onClick={handleManualSOS}
                    className="fixed right-5 bottom-32 w-16 h-16 bg-[#FF4D4F] rounded-full shadow-[0_4px_20px_rgba(255,77,79,0.5)] flex items-center justify-center text-3xl z-[9999] active:scale-90 transition-transform animate-pulse border-4 border-white"
                    aria-label="一键呼叫急救"
                >
                    🆘
                </button>
            )}

            {/* [Requirement 1] 系统级 UI 接管 */}
            {isTriggered && (
                <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden">
                    
                    {/* 背景层: Canvas RAF 动画 */}
                    <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

                    {/* 内容层: 巨型按钮与警告 */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 pb-12">
                        
                        {/* 顶部警告信息 */}
                        <div className="mt-16 flex flex-col items-center animate-bounce">
                            <div className="text-7xl mb-4 drop-shadow-xl">🚨</div>
                            <h2 className="text-4xl font-black text-white drop-shadow-md text-center tracking-wider">
                                {isFallDetected ? '跌倒监测触发' : '持续抽搐告警'}
                            </h2>
                            <p className="text-white/90 text-lg font-bold mt-2 bg-black/20 px-6 py-2 rounded-full backdrop-blur-md">
                                三级熔断机制已激活
                            </p>
                        </div>

                        {/* [Requirement 3] 巨型双按钮布局 (禁止滑动) */}
                        <div className="w-full space-y-6">
                            {/* Button 1: 呼叫 120 */}
                            <button 
                                onClick={() => window.location.href = "tel:120"}
                                className="w-full h-32 bg-white text-[#FF4D4F] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-transform"
                            >
                                <span className="text-5xl">📞</span>
                                <span className="text-4xl font-black tracking-tight">呼叫 120</span>
                            </button>
                            
                            {/* Button 2: 发送位置 */}
                            <button 
                                onClick={() => alert("位置已通过本地短信发送: 北纬30.67, 东经104.06")}
                                className="w-full h-32 bg-black/40 border-4 border-white/60 text-white rounded-[32px] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-transform backdrop-blur-lg"
                            >
                                <span className="text-4xl">📍</span>
                                <span className="text-3xl font-black tracking-tight">发送位置</span>
                            </button>
                        </div>

                        {/* 误报解除 (保持最小化以防止误触，但保留出口) */}
                        <button 
                            onClick={handleDismiss}
                            className="text-white/60 text-sm font-bold underline decoration-white/40 pt-4"
                        >
                            误报解除 (I am safe)
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
