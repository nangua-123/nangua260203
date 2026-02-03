
import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import Button from './Button';
import { MedicationTask, DeviceInfo, DiseaseType } from '../types';
import { VisualMemoryGame, AttentionGame } from './CognitiveGames';

// --- 商业化底层架构 ---

interface ServicePackage {
    id: string;
    title: string;
    price: number;
    duration: string;
    features: string[];
    medicalValue: string;
}

const PACKAGES: Record<string, ServicePackage> = {
    COGNITIVE: {
        id: 'pkg_cog',
        title: 'AD 认知康复会员',
        price: 365,
        duration: '年',
        features: ['每日定制训练处方', '季度专家远程随访', '月度脑健康报告'],
        medicalValue: '延缓认知衰退，建立长期健康档案'
    },
    MIGRAINE: {
        id: 'pkg_mig',
        title: '偏头痛管理会员',
        price: 299,
        duration: '年',
        features: ['AI 诱因全维雷达', '华西专家影像复核', '用药方案优化报告'],
        medicalValue: '精准识别诱因，减少发作频率'
    },
    EPILEPSY: {
        id: 'pkg_epi',
        title: '癫痫生命守护包',
        price: 599,
        duration: '年',
        features: ['硬件租赁 (HaaS)', '24小时异常报警', '紧急医疗通话服务'],
        medicalValue: '居家安全实时监护，降低意外风险'
    }
};

interface PaymentModalProps {
    visible: boolean;
    pkg: ServicePackage;
    onClose: () => void;
    onSuccess: () => void;
}

const CommercialPaymentModal: React.FC<PaymentModalProps> = ({ visible, pkg, onClose, onSuccess }) => {
    const [step, setStep] = useState<'info' | 'paying' | 'success'>('info');
    if (!visible) return null;
    const handlePay = () => {
        setStep('paying');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
                setStep('info');
            }, 2000);
        }, 1500);
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center max-w-[430px] mx-auto">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[40px] p-8 relative z-10 animate-slide-up shadow-2xl">
                {step === 'info' && (
                    <>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">{pkg.title}</h3>
                                <p className="text-[11px] text-brand-600 font-black mt-1.5 uppercase tracking-widest">{pkg.medicalValue}</p>
                            </div>
                            <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-300 active:scale-90 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-5 mb-8 space-y-4 border border-slate-100/50">
                            {pkg.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                                    <span className="text-[13px] font-bold text-slate-700">{feat}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-end mb-8 border-t border-slate-50 pt-5">
                            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服务周期: {pkg.duration}</span></div>
                            <div className="flex items-baseline gap-1"><span className="text-sm font-black text-slate-900">¥</span><span className="text-4xl font-black text-slate-900 tracking-tighter">{pkg.price}</span></div>
                        </div>
                        <Button fullWidth onClick={handlePay} className="shadow-xl shadow-brand-500/20 py-5 text-[13px] tracking-widest">确认开启会员权益</Button>
                    </>
                )}
                {step === 'paying' && (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 border-[5px] border-slate-100 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">安全支付中...</h3>
                    </div>
                )}
                {step === 'success' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-soft border border-emerald-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="font-black text-2xl text-slate-900 tracking-tight">服务已生效</h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">华西数字医院会员已激活</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/** 
 * 专病子模块: 癫痫生命守护
 */
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [isEmergency, setIsEmergency] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [eegPath, setEegPath] = useState('');
    const [stats, setStats] = useState({ hr: 72, spo2: 98, tremor: 0.5 });
    
    // 实时监测动画模拟
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                hr: 72 + Math.floor(Math.random() * 4),
                spo2: 97 + Math.floor(Math.random() * 3),
                tremor: 0.4 + Math.random() * 0.2
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // EEG 波形模拟
    useEffect(() => {
        let tick = 0;
        const generateWave = () => {
            tick += 0.2;
            const points = [];
            const width = 360; 
            for (let i = 0; i <= width; i += 8) {
                // 模拟正常的脑电波 (Alpha/Beta 混合)
                const y = 25 + Math.sin(tick + i * 0.1) * 10 + Math.sin(tick * 2 + i * 0.2) * 5 + (Math.random() - 0.5) * 4;
                points.push(`${i},${y}`);
            }
            setEegPath(`M 0,25 L ${points.join(' L ')}`);
            requestAnimationFrame(generateWave);
        };
        const anim = requestAnimationFrame(generateWave);
        return () => cancelAnimationFrame(anim);
    }, []);

    // 紧急呼救倒计时逻辑
    useEffect(() => {
        let timer: any;
        if (isEmergency && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(c => c - 1);
            }, 1000);
        } else if (countdown === 0) {
            // 实际上会执行呼叫 120 的逻辑
        }
        return () => clearInterval(timer);
    }, [isEmergency, countdown]);

    const handleSimulateSeizure = () => {
        setIsEmergency(true);
        setCountdown(10);
        // 模拟震动提示
        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
    };

    const handleCancelEmergency = () => {
        setIsEmergency(false);
    };

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto pb-24 relative overflow-hidden">
                
                {/* 1. 实时监测看板 (监护仪风格) */}
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">华西 AI 实时哨兵监测中</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">华西生命守护手环 Pro · 已连接</span>
                    </div>

                    {/* EEG 动态波形 */}
                    <div className="h-16 mb-6 border-b border-white/5 relative">
                        <svg width="100%" height="50" viewBox="0 0 360 50">
                            <path d={eegPath} fill="none" stroke="#1677FF" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="absolute top-0 right-0 text-[8px] font-black text-brand-500 uppercase tracking-tighter">实时脑电 (EEG)</div>
                    </div>

                    {/* 体征网格 */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">实时心率 (BPM)</span>
                            <span className="text-2xl font-black text-emerald-500 tracking-tighter">{stats.hr}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">血氧饱和度 (%)</span>
                            <span className="text-2xl font-black text-brand-500 tracking-tighter">{stats.spo2}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase">震颤频率 (Hz)</span>
                            <span className="text-2xl font-black text-amber-500 tracking-tighter">{stats.tremor.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. 紧急呼救熔断系统 (模拟入口) */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                    <h4 className="text-[13px] font-black text-slate-900 mb-3 tracking-wider">安全应急演练</h4>
                    <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">点击下方按钮可模拟“突发大发作”场景，测试系统的紧急呼叫与家属通知功能。</p>
                    <button 
                        onClick={handleSimulateSeizure}
                        className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[12px] border border-red-100 active:scale-[0.98] transition-all"
                    >
                        模拟检测到疑似发作
                    </button>
                </div>

                {/* 3. 亲情联动 */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[13px] font-black text-slate-900 tracking-wider">紧急联系人</h4>
                        <button className="text-[10px] font-black text-brand-500 bg-brand-50 px-3 py-1 rounded-lg">设置</button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg">👩</div>
                                <div>
                                    <div className="text-[12px] font-black text-slate-800">女儿 (陈晓梅)</div>
                                    <div className="text-[10px] text-slate-400 font-bold">138****8888</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/50 text-emerald-600 border border-emerald-100">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                <span className="text-[8px] font-black uppercase">已关联</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. 发作日志热力图 */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                    <div className="flex justify-between items-center mb-5">
                        <h4 className="text-[13px] font-black text-slate-900 tracking-wider">发作热力图 (近30日)</h4>
                        <span className="text-[10px] font-bold text-slate-400">结合生理期监测</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array(28)].map((_, i) => {
                            const val = Math.random();
                            let color = 'bg-slate-50';
                            if (val > 0.9) color = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                            else if (val > 0.7) color = 'bg-red-300';
                            else if (val > 0.5) color = 'bg-red-100';
                            return (
                                <div key={i} className={`aspect-square rounded-sm ${color} transition-colors duration-500`}></div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                        <span>第 1 周</span><span>第 2 周</span><span>第 3 周</span><span>第 4 周</span>
                    </div>
                </div>

                {/* 5. 商业权益包 */}
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-500 rounded-[32px] p-6 text-white shadow-xl active:scale-[0.98] transition-all cursor-pointer">
                    <div className="relative z-10">
                        <h4 className="text-[15px] font-black mb-1">癫痫生命守护会员包</h4>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mb-6">全维度居家安全实时监护系统</p>
                        <ul className="space-y-2 mb-6">
                            <li className="flex items-center gap-2 text-[11px] font-black"><span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">✓</span> 智能穿戴硬件租赁 (HaaS)</li>
                            <li className="flex items-center gap-2 text-[11px] font-black"><span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">✓</span> 华西 AI 发作哨兵 24h 监测</li>
                            <li className="flex items-center gap-2 text-[11px] font-black"><span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">✓</span> 一键发起 120 紧急医疗呼叫</li>
                        </ul>
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-black">¥599 <span className="text-[10px] font-bold">/年</span></span>
                            <button onClick={() => setShowPay(true)} className="bg-white text-brand-600 px-5 py-2.5 rounded-2xl font-black text-[12px] shadow-lg">立即开启</button>
                        </div>
                    </div>
                </div>

                {/* 紧急警报 Overlay */}
                {isEmergency && (
                    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-8 bg-red-600 animate-[pulse-red_0.5s_infinite]">
                        <style>{`
                            @keyframes pulse-red {
                                0% { background-color: #dc2626; }
                                50% { background-color: #991b1b; }
                                100% { background-color: #dc2626; }
                            }
                        `}</style>
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#dc2626" className="w-12 h-12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                             </svg>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 text-center">识别到疑似发作</h2>
                        <p className="text-white/80 font-bold mb-10 text-center uppercase tracking-widest text-[14px]">疑似：全身性强直阵挛发作</p>
                        
                        <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-8 w-full text-center border border-white/20 shadow-2xl">
                             <div className="text-white/60 text-[12px] font-black mb-4 uppercase tracking-widest">紧急呼救 120 倒计时</div>
                             <div className="text-8xl font-black text-white mb-10 tracking-tighter">{countdown}</div>
                             <div className="flex flex-col gap-4">
                                <Button fullWidth variant="primary" className="bg-white text-red-600 border-none py-5 text-lg" onClick={handleCancelEmergency}>
                                    我目前安全 · 取消呼叫
                                </Button>
                                <p className="text-white/50 text-[10px] font-bold">已同步通知紧急联系人：女儿 (陈晓梅)</p>
                             </div>
                        </div>
                    </div>
                )}

                {/* 页脚合规 */}
                <div className="pt-8 text-center opacity-30 pb-12">
                    <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase leading-relaxed">
                        四川大学华西医院神经内科生命监测中心<br/>
                        所有预警数据仅供临床参考 · 最终解释权归华西医联体所有
                    </p>
                </div>

                <CommercialPaymentModal visible={showPay} pkg={PACKAGES.EPILEPSY} onClose={() => setShowPay(false)} onSuccess={() => setIsVip(true)} />
            </div>
        </Layout>
    );
};

/** 
 * 专病子模块: 认知康复训练 (大脑4S店)
 */
export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [playingGame, setPlayingGame] = useState<'memory' | 'attention' | null>(null);
    const [focusWave, setFocusWave] = useState('');
    const [showPostTrainingHook, setShowPostTrainingHook] = useState(false);

    // 脑机接口 (BCI) 专注度实时波形模拟
    useEffect(() => {
        let tick = 0;
        const generateWave = () => {
            tick += 0.1;
            const points = [];
            const width = 360; 
            for (let i = 0; i <= width; i += 10) {
                const y = 20 + Math.sin(tick + i * 0.05) * 10 + (Math.random() - 0.5) * 5;
                points.push(`${i},${y}`);
            }
            setFocusWave(`M 0,20 L ${points.join(' L ')}`);
            requestAnimationFrame(generateWave);
        };
        const anim = requestAnimationFrame(generateWave);
        return () => cancelAnimationFrame(anim);
    }, []);

    const handleGameComplete = () => {
        setPlayingGame(null);
        setShowPostTrainingHook(true);
    };

    if (playingGame === 'memory') return <VisualMemoryGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;
    if (playingGame === 'attention') return <AttentionGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;

    return (
        <Layout headerTitle="大脑4S店 · 认知康复" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto pb-24 relative">
                {/* 1. 脑机接口 (BCI) 实时监控 */}
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
                        <span className="text-[32px] font-black tracking-widest rotate-12 uppercase">客观脑电数据采集中心</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">便携式脑电头带 - 已连接</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-500">采样率: 256Hz</div>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[11px] font-bold text-slate-400">实时专注度水平</span>
                            <span className="text-2xl font-black text-brand-500">82%</span>
                        </div>
                        <div className="h-10 w-full overflow-hidden">
                            <svg width="100%" height="40" viewBox="0 0 360 40">
                                <path d={focusWave} fill="none" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. 三大维度训练入口矩阵 */}
                <div className="space-y-3">
                    <h4 className="text-[13px] font-black text-slate-900 px-1 tracking-wider">今日康复处方模块</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {/* 记忆力 */}
                        <div onClick={() => setPlayingGame('memory')} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-2xl border border-purple-100 group-hover:rotate-6 transition-transform">🧠</div>
                            <div className="flex-1">
                                <h5 className="text-[14px] font-black text-slate-800">记忆力强化训练</h5>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-slate-400 font-bold">最高记录: 1200分</span>
                                    <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                        <div className="bg-purple-500 h-full w-[80%]"></div>
                                    </div>
                                    <span className="text-[10px] font-black text-purple-500">80%</span>
                                </div>
                            </div>
                        </div>
                        {/* 注意力 */}
                        <div onClick={() => isVip ? setPlayingGame('attention') : setShowPay(true)} className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group ${!isVip && 'opacity-70'}`}>
                            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl border border-orange-100 group-hover:rotate-6 transition-transform">👁️</div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <h5 className="text-[14px] font-black text-slate-800">注意力专注训练</h5>
                                    {!isVip && <span className="text-[8px] font-black bg-brand-50 text-brand-500 px-1.5 py-0.5 rounded border border-brand-100">会员专享</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-slate-400 font-bold">最高记录: 1100分</span>
                                    <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full w-[60%]"></div>
                                    </div>
                                    <span className="text-[10px] font-black text-orange-500">60%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 康复曲线及累计时长 (卖希望) */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                    <h4 className="text-[13px] font-black text-slate-900 mb-4 tracking-wider flex justify-between items-center">
                        康复曲线
                        <span className="text-[10px] font-bold text-slate-400">已坚持 125 天</span>
                    </h4>
                    <div className="h-24 flex items-end gap-2 mb-4">
                        {[40, 55, 45, 70, 65, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-brand-50 rounded-t-lg relative group">
                                <div 
                                    className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg transition-all duration-1000" 
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-around text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span>
                    </div>
                </div>

                {/* 4. 风险预测报告 (高转化钩子) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                        <h4 className="text-[15px] font-black mb-1">未来 3 年 AD 转化风险预测报告</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">根据当前训练及客观 EEG 数据全维计算</p>
                        <button 
                            onClick={() => setShowPay(true)}
                            className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl text-[12px] shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
                        >
                            订阅会员解锁完整分析报告 (¥365/年)
                        </button>
                    </div>
                </div>

                <div className="pt-8 text-center opacity-30 pb-12">
                    <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase">
                        四川大学华西医院神经内科认知中心 · 数字化康复系统
                    </p>
                </div>

                <CommercialPaymentModal visible={showPay} pkg={PACKAGES.COGNITIVE} onClose={() => setShowPay(false)} onSuccess={() => setIsVip(true)} />
            </div>
        </Layout>
    );
};

// --- 其他占位视图 ---
export const HeadacheServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <Layout headerTitle="诱因雷达 · 头痛管理" showBack onBack={onBack}>
            <div className="p-5 flex flex-col items-center justify-center h-[70vh] text-slate-300">
                <div className="text-4xl mb-4">🌪️</div>
                <p className="font-black uppercase tracking-widest text-sm text-center">正在开发中...<br/>头痛日记与诱因分析即将上线</p>
            </div>
        </Layout>
    );
};

export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <Layout headerTitle="亲情账号中心" showBack onBack={onBack}>
            <div className="p-5 flex flex-col items-center justify-center h-[70vh] text-slate-300">
                <div className="text-4xl mb-4">👪</div>
                <p className="font-black uppercase tracking-widest text-sm">亲情联动数据同步中</p>
            </div>
        </Layout>
    );
};
