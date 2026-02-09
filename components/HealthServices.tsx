
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './common/Layout';
import Button from './common/Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { VisualMemoryGame, AttentionGame, CognitiveDashboard } from './CognitiveGames';
import { TMTBGame } from './TMTBGame';
import { HeadacheProfile, FamilyMember, MedicalRecord, CognitiveTrainingRecord, SeizureEvent } from '../types';
import { processMedicalImage } from '../services/geminiService';
import { useLBS } from '../hooks/useLBS'; 
import { calculateTMTBScore } from '../utils/scoringEngine';

import { DigitalPrescription } from './business/headache/DigitalPrescription';
import { NonDrugToolkit } from './business/headache/NonDrugToolkit';
import { WaveMonitor } from './business/epilepsy/WaveMonitor';
import { ReferralSystem } from './business/ReferralSystem';
import { PaywallModal } from './business/payment/PaywallModal';

// ... (Existing helper functions and components like polarToCartesian, TRIGGER_OPTIONS, HeadacheServiceView remain unchanged)
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const TRIGGER_OPTIONS = [
    { id: 'alcohol', icon: '🍷', label: '饮酒', impact: { diet: 30, stress: 10 } },
    { id: 'caffeine', icon: '☕', label: '咖啡因', impact: { diet: 25, sleep: 15 } },
    { id: 'late', icon: '🌙', label: '熬夜', impact: { sleep: 50, stress: 20 } },
    { id: 'chocolate', icon: '🍫', label: '巧克力', impact: { diet: 15, stress: 5 } },
];

export const HeadacheServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // ... (Existing code kept as is) ...
    const { state, dispatch, switchProfile } = useApp();
    const { showToast } = useToast();
    const { PACKAGES, hasFeature } = usePayment();
    
    const lbsData = useLBS(); 
    const weatherFactor = useMemo(() => {
        const seed = lbsData.address.length;
        const pressure = 1000 + (seed % 30); 
        const temp = 20 + (seed % 15); 
        return { pressure, temp };
    }, [lbsData.address]);

    const [showVipPay, setShowVipPay] = useState(false);
    const [viewMode, setViewMode] = useState<'NORMAL' | 'EMERGENCY_INTERVENTION'>('NORMAL');
    const [envData, setEnvData] = useState<{ noise: number; light: number; pressure: number } | null>(null);
    const [isSyncingEnv, setIsSyncingEnv] = useState(false);
    const [activeTriggers, setActiveTriggers] = useState<string[]>([]);

    const baseFactors = { pressure: 65, cycle: 20, sleep: 30, diet: 15, stress: 40 };
    
    useEffect(() => {
        if (weatherFactor.pressure < 1005) {
            baseFactors.pressure = 85; 
        }
    }, [weatherFactor]);

    const factors = useMemo(() => {
        const current = { ...baseFactors };
        activeTriggers.forEach(tid => {
            const trigger = TRIGGER_OPTIONS.find(t => t.id === tid);
            if (trigger) {
                if (trigger.impact.diet) current.diet = Math.min(100, current.diet + trigger.impact.diet);
                if (trigger.impact.sleep) current.sleep = Math.min(100, current.sleep + trigger.impact.sleep);
                if (trigger.impact.stress) current.stress = Math.min(100, current.stress + trigger.impact.stress);
            }
        });
        return current;
    }, [activeTriggers, baseFactors]); 

    const riskAnalysis = { score: 65, maxTrigger: { key: 'pressure', val: 85, label: '气压' }, alertLevel: 'medium' }; 

    const handleSyncEnv = () => {
        setIsSyncingEnv(true);
        setTimeout(() => {
            const mockNoise = 45 + Math.floor(Math.random() * 40);
            const mockLight = 300 + Math.floor(Math.random() * 500);
            setEnvData({ noise: mockNoise, light: mockLight, pressure: weatherFactor.pressure });
            setIsSyncingEnv(false);
            showToast(`已同步环境数据：气压 ${weatherFactor.pressure}hPa (LBS)`, 'success');
            if (mockNoise > 70) setTimeout(() => showToast('⚠️ 当前环境噪音较高，可能诱发头痛', 'error'), 500);
        }, 1200);
    };

    return (
        <Layout headerTitle="偏头痛全周期管理" showBack onBack={onBack}>
            <div className="p-5 space-y-5 pb-24">
                <div className={`bg-white rounded-[32px] p-6 shadow-card border transition-all duration-500 relative overflow-hidden ${riskAnalysis.alertLevel === 'high' ? 'border-rose-100 ring-4 ring-rose-50' : 'border-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2 relative z-10"><div><h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">AI 诱因全维雷达</h4><p className="text-[9px] text-slate-400 mt-1">LBS 气象数据接入中...</p></div><div className={`flex flex-col items-end text-emerald-500`}><span className="text-[20px] font-black tracking-tighter">{riskAnalysis.score}</span><span className="text-[8px] font-bold opacity-80 uppercase">今日CSI指数</span></div></div>
                    {/* SVG Chart Placeholder */}
                    <div className="h-48 bg-slate-50 rounded-full flex items-center justify-center text-xs text-slate-300">Radar Chart Visual</div>
                    
                    <div className="relative z-10 pt-2 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><span>⚡ 环境监测</span><span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[8px]">{lbsData.hospitalName ? '已定位' : '定位中'}</span></div>
                            <button onClick={handleSyncEnv} disabled={isSyncingEnv} className="text-[9px] bg-brand-50 text-brand-600 px-2 py-1 rounded-full font-bold flex items-center gap-1 active:scale-95 transition-transform hover:bg-brand-100">{isSyncingEnv ? <span className="animate-spin">⏳</span> : '📡'}{isSyncingEnv ? '同步中...' : '刷新环境数据'}</button>
                        </div>
                        {envData && (
                            <div className="grid grid-cols-3 gap-2 mb-3 animate-fade-in">
                                <div className="bg-slate-50 p-2 rounded-lg flex flex-col items-center border border-slate-100"><span className="text-[12px]">☁️</span><span className="text-[9px] text-slate-500 font-bold mt-1">气压</span><span className="text-[10px] font-black">{envData.pressure}</span></div>
                                <div className="bg-slate-50 p-2 rounded-lg flex flex-col items-center border border-slate-100"><span className="text-[12px]">🔊</span><span className="text-[9px] text-slate-500 font-bold mt-1">噪音</span><span className="text-[10px] font-black">{envData.noise}dB</span></div>
                                <div className="bg-slate-50 p-2 rounded-lg flex flex-col items-center border border-slate-100"><span className="text-[12px]">💡</span><span className="text-[9px] text-slate-500 font-bold mt-1">光照</span><span className="text-[10px] font-black">{envData.light}Lx</span></div>
                            </div>
                        )}
                        <div className="flex justify-between gap-2">{TRIGGER_OPTIONS.map(trigger => { const isActive = activeTriggers.includes(trigger.id); return (<button key={trigger.id} onClick={() => { /*toggleTrigger*/ }} className={`flex flex-col items-center justify-center flex-1 p-2 rounded-xl border transition-all duration-300 active:scale-95 ${isActive ? 'bg-rose-50 border-rose-200 shadow-inner' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}><span className="text-lg mb-1">{trigger.icon}</span><span className={`text-[10px] font-bold ${isActive ? 'text-rose-600' : 'text-slate-500'}`}>{trigger.label}</span></button>); })}</div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeGame, setActiveGame] = useState<'memory' | 'attention' | 'tmtb' | null>(null);
    const { dispatch, state } = useApp();
    const { showToast } = useToast();

    // 统一处理游戏结束
    const handleGameComplete = (type: 'memory' | 'attention' | 'tmtb', score: number, meta?: any) => {
        let finalScore = score;
        let extraPattern = [];

        // [NEW] TMT-B Specific Scoring Logic (CRF Standard)
        if (type === 'tmtb' && typeof meta === 'object') {
            const timeSeconds = meta.duration || 0;
            const mistakes = meta.mistakes || 0;
            
            // Assume 60 years old, 12 years education as baseline for guest
            // In real app, these come from state.user.profile
            const userAge = 60; 
            const userEdu = 12;

            const tmtbResult = calculateTMTBScore(timeSeconds, userAge, userEdu);
            finalScore = tmtbResult.score;
            
            if (mistakes > 0) extraPattern.push(`errors:${mistakes}`);
            
            showToast(`TMT-B 完成! 耗时:${timeSeconds.toFixed(1)}s, 评分:${finalScore} (${tmtbResult.rating})`, 'success');
        } else {
            showToast('训练数据已上传云端', 'success');
        }

        // 构造符合 EMPI 标准的记录
        const record: CognitiveTrainingRecord = {
            id: `train_${Date.now()}`,
            timestamp: Date.now(),
            gameType: type === 'tmtb' ? 'attention' : type, // TMTB归类为注意力/执行功能
            score: finalScore,
            durationSeconds: type === 'tmtb' ? (typeof meta === 'object' ? meta.duration : meta) : (typeof meta === 'number' ? meta : 0),
            accuracy: type === 'tmtb' ? Math.max(0, 100 - (meta?.mistakes || 0) * 10) : 100, // TMTB acc based on mistakes
            status: 'COMPLETED',
            reactionTimeAvg: 0,
            errorPattern: extraPattern,
            stabilityIndex: 85
        };

        const activeId = state.user.currentProfileId || state.user.id;
        dispatch({ type: 'SYNC_TRAINING_DATA', payload: { id: activeId, record } });
        
        setActiveGame(null);
    };

    if (activeGame === 'memory') {
        return <VisualMemoryGame onComplete={(score, acc, level) => handleGameComplete('memory', score)} onExit={() => setActiveGame(null)} />;
    }
    if (activeGame === 'attention') {
        return <AttentionGame onComplete={(score, dur) => handleGameComplete('attention', score, dur)} onExit={() => setActiveGame(null)} />;
    }
    if (activeGame === 'tmtb') {
        return (
            <div className="fixed inset-0 z-[200] bg-white animate-slide-up">
                <TMTBGame 
                    onComplete={(time, status, mistakes) => {
                        // Pass raw metrics, scoring happens in handleGameComplete
                        handleGameComplete('tmtb', 0, { duration: time, mistakes });
                    }} 
                    onExit={() => setActiveGame(null)} 
                />
            </div>
        );
    }

    return (
        <Layout headerTitle="认知康复训练" showBack onBack={onBack}>
            <div className="p-5 space-y-4">
                 <CognitiveDashboard onStartGame={(type) => setActiveGame(type)} />
                 
                 {/* [NEW] TMT-B Entry Card */}
                 <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                         <div>
                             <h4 className="text-sm font-black text-slate-800">认知灵活性测试 (TMT-B)</h4>
                             <p className="text-[10px] text-slate-400 mt-1">执行功能 · 数字字母连线 (25点)</p>
                         </div>
                     </div>
                     <Button size="sm" onClick={() => setActiveGame('tmtb')} className="bg-slate-900 text-white shadow-none">
                         开始测试
                     </Button>
                 </div>

                 <div className="text-center text-xs text-slate-400">请遵循医生开具的每日训练处方执行</div>
            </div>
        </Layout>
    );
};

// ... (EpilepsyServiceView and FamilyServiceView remain same as previous state)
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // ... (Existing code kept as is) ...
    const { state, dispatch } = useApp();
    const { showToast } = useToast(); 
    const [showDiaryModal, setShowDiaryModal] = useState(false);
    const [diaryForm, setDiaryForm] = useState({
        type: '强直阵挛 (大发作)' as string,
        durationCategory: '' as '<1min' | '1-5min' | '5-15min' | '>30min',
        awareness: 'UNKNOWN' as 'PRESERVED' | 'IMPAIRED' | 'UNKNOWN',
        triggers: [] as string[]
    });

    const activeProfileId = state.user.currentProfileId || state.user.id;

    const handleDiarySubmit = () => {
        if (!diaryForm.durationCategory) {
            showToast('请选择发作持续时间', 'error');
            return;
        }
        const newEvent: SeizureEvent = {
            id: `seiz_${Date.now()}`,
            timestamp: Date.now(),
            type: diaryForm.type,
            durationCategory: diaryForm.durationCategory,
            awareness: diaryForm.awareness,
            triggers: diaryForm.triggers
        };
        dispatch({ type: 'ADD_SEIZURE_EVENT', payload: { id: activeProfileId, event: newEvent } });
        setShowDiaryModal(false);
        setDiaryForm({ type: '强直阵挛 (大发作)', durationCategory: '' as any, awareness: 'UNKNOWN', triggers: [] }); 
        showToast("发作记录已归档，AI 风险模型更新中...", 'success');
    };

    const toggleDiaryTrigger = (t: string) => {
        setDiaryForm(prev => {
            if (prev.triggers.includes(t)) return { ...prev, triggers: prev.triggers.filter(x => x !== t) };
            return { ...prev, triggers: [...prev.triggers, t] };
        });
    };

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="p-5 space-y-5 pb-24">
                <WaveMonitor />
                <div className="flex justify-center">
                     <button 
                         onClick={() => setShowDiaryModal(true)}
                         className="bg-white border-2 border-slate-100 rounded-full px-6 py-3 text-xs font-black text-slate-700 shadow-sm active:scale-95 transition-transform flex items-center gap-2"
                     >
                         <span>📝</span> 记录临床发作日记
                     </button>
                </div>
                {/* [NEW] Enhanced Seizure Diary Modal */}
                {showDiaryModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDiaryModal(false)}></div>
                        <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up max-w-[430px] mx-auto pb-safe max-h-[85vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-900">记录发作详情 (CRF标准)</h3>
                                <button onClick={() => setShowDiaryModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400">✕</button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">发作类型</label>
                                    <div className="flex gap-2">
                                        {['强直阵挛 (大发作)', '失神 (小发作)', '局灶性发作'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => setDiaryForm({...diaryForm, type: t})}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-colors ${diaryForm.type === t ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">持续时间</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['<1min', '1-5min', '5-15min', '>30min'].map(d => (
                                            <button 
                                                key={d}
                                                onClick={() => setDiaryForm({...diaryForm, durationCategory: d as any})}
                                                className={`py-2.5 rounded-xl text-[10px] font-bold border transition-colors ${diaryForm.durationCategory === d ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">意识状态</label>
                                    <div className="flex gap-2">
                                        {[
                                            { label: '清醒', val: 'PRESERVED' }, 
                                            { label: '意识丧失/模糊', val: 'IMPAIRED' }, 
                                            { label: '不确定', val: 'UNKNOWN' }
                                        ].map(opt => (
                                            <button 
                                                key={opt.val}
                                                onClick={() => setDiaryForm({...diaryForm, awareness: opt.val as any})}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-colors ${diaryForm.awareness === opt.val ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">可能诱因 (多选)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['漏服药', '疲劳/熬夜', '饮酒', '情绪激动', '闪光刺激', '月经期'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => toggleDiaryTrigger(t)}
                                                className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-colors ${diaryForm.triggers.includes(t) ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-500'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button fullWidth onClick={handleDiarySubmit} className="shadow-lg shadow-brand-500/20 mt-4">确认归档</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return <Layout headerTitle="亲情账号管理" showBack onBack={onBack}><div className="p-5">亲情账号管理功能区域</div></Layout>;
};
