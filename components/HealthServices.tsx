
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './common/Layout';
import Button from './common/Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext'; // [NEW]
// 引入完整的认知游戏组件集合
import { VisualMemoryGame, AttentionGame, CognitiveDashboard } from './CognitiveGames';
import { HeadacheProfile, FamilyMember, MedicalRecord, CognitiveTrainingRecord } from '../types';

// 引入拆分后的核心业务组件
import { DigitalPrescription } from './business/headache/DigitalPrescription';
import { NonDrugToolkit } from './business/headache/NonDrugToolkit'; // [NEW] Import Toolkit
import { WaveMonitor } from './business/epilepsy/WaveMonitor';
import { ReferralSystem } from './business/ReferralSystem';
import { PaywallModal } from './business/payment/PaywallModal';

// --- 数学工具库：雷达图计算 ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// 诱因配置
const TRIGGER_OPTIONS = [
    { id: 'alcohol', icon: '🍷', label: '饮酒', impact: { diet: 30, stress: 10 } },
    { id: 'caffeine', icon: '☕', label: '咖啡因', impact: { diet: 25, sleep: 15 } },
    { id: 'late', icon: '🌙', label: '熬夜', impact: { sleep: 50, stress: 20 } },
    { id: 'chocolate', icon: '🍫', label: '巧克力', impact: { diet: 15, stress: 5 } },
];

/** 
 * 专病子模块: 偏头痛全周期管理
 */
export const HeadacheServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // ... (Headache logic remains unchanged, omitting to save space as it's not the focus)
    // Assuming content is identical to previous version, just re-exporting.
    // For brevity in response, I will include the CognitiveServiceView update below.
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const { PACKAGES, hasFeature } = usePayment();
    const [showVipPay, setShowVipPay] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    
    // --- 档案管理状态 ---
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [isSwitchingUser, setIsSwitchingUser] = useState(false);
    const [showProfileDetails, setShowProfileDetails] = useState(false); 
    const [hasImportedPrescription, setHasImportedPrescription] = useState(false);
    
    // [NEW] OCR Modal State
    const [showOCRModal, setShowOCRModal] = useState(false);

    // [NEW] Environment Data State
    const [envData, setEnvData] = useState<{ noise: number; light: number } | null>(null);
    const [isSyncingEnv, setIsSyncingEnv] = useState(false);

    // [NEW] Ref for NonDrugToolkit scrolling
    const nonDrugToolkitRef = useRef<HTMLDivElement>(null);

    // 获取当前展示的患者信息 (自己 or 家属)
    const activePatient = useMemo(() => {
        if (!state.user.currentProfileId || state.user.currentProfileId === state.user.id) {
            return {
                id: state.user.id,
                name: state.user.name,
                relation: '本人',
                avatar: state.user.name[0],
                profile: state.user.headacheProfile
            };
        }
        const family = state.user.familyMembers?.find(m => m.id === state.user.currentProfileId);
        return family ? { ...family, profile: family.headacheProfile } : { 
            id: 'unknown', name: '未知', relation: '未知', avatar: '?', profile: undefined 
        };
    }, [state.user, state.user.currentProfileId]);

    // 用户选中的诱因 ID 列表
    const [activeTriggers, setActiveTriggers] = useState<string[]>([]);

    const baseFactors = { pressure: 65, cycle: 20, sleep: 30, diet: 15, stress: 40 };

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
    }, [activeTriggers]);

    const axes = [
        { key: 'pressure', label: '气压', weight: 0.15 },
        { key: 'cycle', label: '生理', weight: 0.2 },
        { key: 'sleep', label: '睡眠', weight: 0.35 }, 
        { key: 'diet', label: '饮食', weight: 0.1 },
        { key: 'stress', label: '压力', weight: 0.2 },
    ];

    const riskAnalysis = useMemo(() => {
        let totalScore = 0;
        let maxTrigger = { key: '', val: 0, label: '' };
        axes.forEach(axis => {
            const val = factors[axis.key as keyof typeof factors];
            totalScore += val * axis.weight;
            if (val > maxTrigger.val) {
                maxTrigger = { key: axis.key, val: val, label: axis.label };
            }
        });
        const score = Math.min(100, Math.floor(totalScore));
        let alertLevel: 'low' | 'medium' | 'high' = 'low';
        if (score > 70) alertLevel = 'high';
        else if (score > 40) alertLevel = 'medium';
        return { score, maxTrigger, alertLevel };
    }, [factors]);

    const toggleTrigger = (id: string) => {
        setActiveTriggers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const size = 260;
    const center = size / 2;
    const radius = 90;
    
    const getPath = (data: typeof factors, scale = 1) => {
        const points = axes.map((axis, i) => {
            const angle = (360 / 5) * i;
            const val = data[axis.key as keyof typeof factors];
            const r = radius * ((val * scale) / 100); 
            const { x, y } = polarToCartesian(center, center, r, angle);
            return `${x},${y}`;
        });
        return points.join(' ');
    };

    const renderGrid = () => {
        return [0.25, 0.5, 0.75, 1.0].map((level, i) => {
            const points = axes.map((_, idx) => {
                const angle = (360 / 5) * idx;
                const { x, y } = polarToCartesian(center, center, radius * level, angle);
                return `${x},${y}`;
            }).join(' ');
            return (
                <polygon key={i} points={points} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray={i===3 ? "0" : "4 2"} />
            );
        });
    };

    const handleProfileSubmit = (formData: any) => {
        let diagnosis = '无先兆偏头痛';
        if (formData.familyHistory) diagnosis = '家族性偏头痛';
        if (formData.frequency === '>15天/月') diagnosis = '慢性偏头痛';
        const newProfile: HeadacheProfile = {
            isComplete: true, source: 'USER_INPUT', onsetAge: parseInt(formData.age),
            frequency: formData.frequency, familyHistory: formData.familyHistory,
            medicationHistory: formData.meds, diagnosisType: diagnosis, symptomsTags: [], lastUpdated: Date.now()
        };
        dispatch({ type: 'UPDATE_PROFILE', payload: { id: activePatient.id, profile: newProfile } });
        setShowProfileForm(false);
        showToast('病历档案更新成功');
    };

    const handleOCRSuccess = (record: MedicalRecord) => {
        dispatch({ type: 'ADD_MEDICAL_RECORD', payload: { profileId: activePatient.id, record } });
        setShowOCRModal(false);
        showToast('纸质报告归档成功');
    };

    const handleGuideToNonDrug = () => {
        nonDrugToolkitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nonDrugToolkitRef.current?.classList.add('ring-4', 'ring-teal-200');
        setTimeout(() => nonDrugToolkitRef.current?.classList.remove('ring-4', 'ring-teal-200'), 1500);
    };

    const handleSyncEnv = () => {
        setIsSyncingEnv(true);
        setTimeout(() => {
            const mockNoise = 45 + Math.floor(Math.random() * 40);
            const mockLight = 300 + Math.floor(Math.random() * 500);
            setEnvData({ noise: mockNoise, light: mockLight });
            setIsSyncingEnv(false);
            showToast('环境数据同步成功', 'success');
            if (mockNoise > 70) setTimeout(() => showToast('⚠️ 当前环境噪音较高，可能诱发头痛', 'error'), 500);
        }, 1200);
    };

    return (
        <Layout headerTitle="偏头痛全周期管理" showBack onBack={onBack}>
            <div className="p-5 space-y-5 pb-24">
                {/* Simplified view logic for brevity - Core Headache logic is retained */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-transform" onClick={() => setIsSwitchingUser(!isSwitchingUser)}>
                            <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-700">{activePatient.relation === '本人' ? activePatient.avatar : '👪'}</div>
                            <span className="text-xs font-bold text-slate-800">{activePatient.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded">{activePatient.relation}</span>
                        </div>
                        {isSwitchingUser && (
                            <div className="absolute top-16 left-5 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 animate-slide-up">
                                <div className="text-[9px] text-slate-400 px-2 py-1 mb-1 font-bold">切换档案</div>
                                <div onClick={() => { dispatch({type: 'SWITCH_PATIENT', payload: state.user.id}); setIsSwitchingUser(false); }} className={`flex items-center gap-2 p-2 rounded-lg ${state.user.id === activePatient.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}><span className="text-sm">👨</span><span className="text-xs font-bold">本人 ({state.user.name})</span></div>
                                {state.user.familyMembers?.map(m => (
                                    <div key={m.id} onClick={() => { dispatch({type: 'SWITCH_PATIENT', payload: m.id}); setIsSwitchingUser(false); }} className={`flex items-center gap-2 p-2 rounded-lg ${m.id === activePatient.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}><span className="text-sm">{m.avatar}</span><div className="flex flex-col"><span className="text-xs font-bold">{m.name}</span><span className="text-[9px] text-slate-400">{m.relation}</span></div></div>
                                ))}
                            </div>
                        )}
                    </div>
                    {activePatient.profile?.isComplete ? (
                        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-[24px] p-5 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group transition-all" onClick={() => setShowProfileDetails(!showProfileDetails)}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border-2 border-brand-200">{activePatient.relation === '本人' ? '👨' : activePatient.avatar}</div><div><div className="flex items-center gap-2"><h3 className="text-sm font-black">{activePatient.name}</h3>{activePatient.profile.source === 'AI_GENERATED' && (<span className="bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm flex items-center gap-1">华西 AI 归档</span>)}</div><p className="text-[10px] text-brand-200 font-mono">ID: {activePatient.id.split('_')[1] || '8829'} · 神经内科</p></div></div>
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm"><span className="text-sm">🏥</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4"><div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm"><div className="text-[8px] text-brand-200 uppercase tracking-widest mb-0.5">确诊类型</div><div className="text-xs font-black">{activePatient.profile.diagnosisType}</div></div><div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm"><div className="text-[8px] text-brand-200 uppercase tracking-widest mb-0.5">发作频率</div><div className="text-xs font-black">{activePatient.profile.frequency}</div></div></div>
                                {showProfileDetails && activePatient.profile.source === 'AI_GENERATED' && (<div className="mt-2 pt-3 border-t border-white/10 animate-fade-in"><div className="text-[9px] text-brand-200 uppercase tracking-widest mb-2">AI 提取临床特征</div><div className="flex flex-wrap gap-1.5 mb-3">{activePatient.profile.symptomsTags?.map((tag, idx) => (<span key={idx} className="bg-white/10 px-2 py-1 rounded text-[9px] font-medium border border-white/5">{tag}</span>))}</div></div>)}
                                <div className="flex justify-between items-end border-t border-white/10 pt-3 mt-2"><div className="text-[9px] text-brand-300">{showProfileDetails ? '点击收起档案' : '点击查看 AI 提取详情'}</div><button onClick={(e) => { e.stopPropagation(); setShowVipPay(true); }} className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg text-[9px] font-black transition-colors shadow-sm">导出病历 PDF<span className="bg-black/10 px-1 rounded text-[8px]">VIP</span></button></div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-brand-100 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-3"><h4 className="text-[13px] font-black text-slate-800">完善头痛基础画像</h4><span className="text-[9px] font-bold text-slate-400">档案完整度 30%</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4"><div className="bg-brand-500 h-full w-[30%] rounded-full animate-pulse"></div></div><Button size="sm" fullWidth onClick={() => setShowProfileForm(true)}>立即完善 (预计1分钟)</Button>
                        </div>
                    )}
                </div>
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 relative overflow-hidden"><div className="flex justify-between items-center mb-4"><div><h4 className="text-[13px] font-black text-slate-800 flex items-center gap-2">📈 核心指标趋势<span className="text-[9px] bg-brand-50 text-brand-600 px-1.5 rounded">VAS评分</span></h4><p className="text-[10px] text-slate-400 mt-0.5">基于历次纸质报告自动提取</p></div><button onClick={() => setShowOCRModal(true)} className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md active:scale-95"><span>📷</span> 拍摄报告归档</button></div><div className="h-32 w-full bg-slate-50 rounded-xl relative flex items-end px-2 pb-2 gap-1 mb-3 border border-slate-100">{(activePatient.profile?.medicalRecords && activePatient.profile.medicalRecords.length > 0) ? (activePatient.profile.medicalRecords.map((rec, idx) => { const vasStr = rec.indicators.find(i => i.name.includes('VAS'))?.value || '5'; const vas = parseInt(vasStr.toString()); const height = (vas / 10) * 100; return (<div key={rec.id} className="flex-1 flex flex-col items-center gap-1 group"><div className="relative w-full flex justify-center items-end h-full"><div className="w-2/3 bg-brand-500 rounded-t-sm transition-all duration-500 group-hover:bg-brand-400" style={{ height: `${height}%` }}></div><div className="absolute -top-6 text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow-sm">VAS:{vas}</div></div><div className="text-[8px] text-slate-400 scale-75 whitespace-nowrap">{rec.date.slice(5)}</div></div>); })) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300"><span className="text-2xl mb-1">📉</span><span className="text-[10px]">暂无数据，请拍摄上传病历</span></div>)}</div></div>
                {hasImportedPrescription ? (<DigitalPrescription highlight={riskAnalysis.alertLevel === 'high'} factors={factors} onGuideToNonDrug={handleGuideToNonDrug} />) : (<div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center" onClick={() => setHasImportedPrescription(true)}><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-sm text-2xl">📷</div><h4 className="text-xs font-bold text-slate-600 mb-1">暂无电子处方</h4><p className="text-[10px] text-slate-400">点击模拟扫描医院处方二维码 (HS-001)</p></div>)}
                <div className={`bg-white rounded-[32px] p-6 shadow-card border transition-all duration-500 relative overflow-hidden ${riskAnalysis.alertLevel === 'high' ? 'border-rose-100 ring-4 ring-rose-50' : 'border-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2 relative z-10"><div><h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">AI 诱因全维雷达</h4><p className="text-[9px] text-slate-400 mt-1">实时计算今日发作概率模型</p></div><div className={`flex flex-col items-end ${riskAnalysis.alertLevel === 'high' ? 'text-rose-600' : riskAnalysis.alertLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}><span className="text-[20px] font-black tracking-tighter transition-all duration-500">{riskAnalysis.score}</span><span className="text-[8px] font-bold opacity-80 uppercase">今日风险值</span></div></div>
                    <div className="relative flex justify-center py-4 z-10"><svg width={size} height={size} className="overflow-visible">{renderGrid()}{axes.map((axis, i) => { const angle = (360 / 5) * i; const edge = polarToCartesian(center, center, radius, angle); const labelPos = polarToCartesian(center, center, radius + 20, angle); return (<g key={axis.key}><line x1={center} y1={center} x2={edge.x} y2={edge.y} stroke="#E2E8F0" strokeWidth="1" /><text x={labelPos.x} y={labelPos.y} fontSize="10" fontWeight="bold" fill={factors[axis.key as keyof typeof factors] > 60 ? '#EF4444' : '#64748B'} textAnchor="middle" dominantBaseline="middle">{axis.label}</text></g>); })}<polygon points={getPath(factors)} fill={riskAnalysis.alertLevel === 'high' ? "rgba(244, 63, 94, 0.2)" : "rgba(37, 99, 235, 0.2)"} stroke={riskAnalysis.alertLevel === 'high' ? "#E11D48" : "#2563EB"} strokeWidth="2" className="transition-all duration-500 ease-out"/><title></title>{axes.map((axis, i) => { const angle = (360 / 5) * i; const val = factors[axis.key as keyof typeof factors]; const p = polarToCartesian(center, center, radius * (val / 100), angle); return (<circle key={i} cx={p.x} cy={p.y} r={4} fill="white" stroke={val > 60 ? "#EF4444" : "#2563EB"} strokeWidth={2} className="transition-all duration-500"/>); })}</svg></div>
                    <div className="relative z-10 pt-2 border-t border-slate-50"><div className="flex justify-between items-center mb-3"><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><span>⚡ 快速记录今日行为</span><span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[8px]">实时</span></div><button onClick={handleSyncEnv} disabled={isSyncingEnv} className="text-[9px] bg-brand-50 text-brand-600 px-2 py-1 rounded-full font-bold flex items-center gap-1 active:scale-95 transition-transform hover:bg-brand-100">{isSyncingEnv ? <span className="animate-spin">⏳</span> : '📡'}{isSyncingEnv ? '同步中...' : '一键同步环境'}</button></div>{envData && (<div className="grid grid-cols-2 gap-2 mb-3 animate-fade-in"><div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100"><div className="flex items-center gap-1.5"><span className="text-[12px]">🔊</span><span className="text-[9px] text-slate-500 font-bold">环境噪音</span></div><span className={`text-[10px] font-black ${envData.noise > 60 ? 'text-orange-500' : 'text-slate-700'}`}>{envData.noise} dB</span></div><div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100"><div className="flex items-center gap-1.5"><span className="text-[12px]">💡</span><span className="text-[9px] text-slate-500 font-bold">光照强度</span></div><span className={`text-[10px] font-black ${envData.light > 500 ? 'text-orange-500' : 'text-slate-700'}`}>{envData.light} Lux</span></div></div>)}<div className="flex justify-between gap-2">{TRIGGER_OPTIONS.map(trigger => { const isActive = activeTriggers.includes(trigger.id); return (<button key={trigger.id} onClick={() => toggleTrigger(trigger.id)} className={`flex flex-col items-center justify-center flex-1 p-2 rounded-xl border transition-all duration-300 active:scale-95 ${isActive ? 'bg-rose-50 border-rose-200 shadow-inner' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}><span className="text-lg mb-1">{trigger.icon}</span><span className={`text-[10px] font-bold ${isActive ? 'text-rose-600' : 'text-slate-500'}`}>{trigger.label}</span></button>); })}</div></div>
                </div>
                <div ref={nonDrugToolkitRef} className="transition-all duration-500"><NonDrugToolkit /></div>
                <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-5 flex items-center justify-between"><div><h4 className="text-rose-900 font-black text-xs mb-1">转诊绿色通道</h4><p className="text-[10px] text-rose-700">符合华西二阶段转诊标准</p></div><Button size="sm" className="bg-rose-600 text-[10px]" onClick={() => setShowReferral(true)}>生成通行证</Button></div>
                {showProfileForm && (<ProfileForm onClose={() => setShowProfileForm(false)} onSubmit={handleProfileSubmit} userRelation={activePatient.relation} />)}
                {showOCRModal && (<MedicalRecordOCRModal onClose={() => setShowOCRModal(false)} onSuccess={handleOCRSuccess} />)}
                {showReferral && <ReferralSystem onClose={() => setShowReferral(false)} />}
                <PaywallModal visible={showVipPay} pkg={PACKAGES.VIP_MIGRAINE} onClose={() => setShowVipPay(false)} />
            </div>
        </Layout>
    );
};

// --- Cognitive Service View (Games) ---
export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [game, setGame] = useState<'none' | 'memory' | 'attention'>('none');
    const { PACKAGES } = usePayment();
    const [showPay, setShowPay] = useState(false);

    // [UPDATED] Handle Game Completion with EMPI Sync
    const handleGameComplete = (score: number, durationSeconds: number, accuracy: number, level: number = 1, reactionMs?: number) => {
        const activeProfileId = state.user.currentProfileId || state.user.id;
        
        // 1. Construct JSON Record for EMPI
        const trainingRecord: CognitiveTrainingRecord = {
            id: `train_${Date.now()}`,
            timestamp: Date.now(),
            gameType: game === 'memory' ? 'memory' : 'attention',
            score,
            durationSeconds,
            accuracy,
            difficultyLevel: level,
            reactionSpeedMs: reactionMs
        };

        // 2. Feedback: Syncing State
        showToast('🔄 正在同步训练数据至 EMPI 全病程档案...', 'info');

        // 3. Simulated Async Write (Write to global state)
        setTimeout(() => {
            dispatch({
                type: 'SYNC_TRAINING_DATA',
                payload: {
                    id: activeProfileId,
                    record: trainingRecord
                }
            });
            setGame('none');
            showToast('✅ 数据归档成功', 'success');
        }, 800);
    };

    if (game === 'memory') {
        return <VisualMemoryGame 
            onComplete={(score, accuracy, level) => handleGameComplete(score, 180, accuracy, level)} // Assume 3 min per session
            onExit={() => setGame('none')} 
        />;
    }
    
    if (game === 'attention') {
        return <AttentionGame 
            onComplete={(score, timeMs, mistakes) => {
                const durationSec = Math.ceil(timeMs / 1000);
                const accuracy = Math.max(0, 100 - (mistakes * 5));
                handleGameComplete(score, durationSec, accuracy, 1, timeMs / 16); // Approx reaction per item
            }} 
            onExit={() => setGame('none')} 
        />;
    }

    return (
        <Layout headerTitle="认知康复训练" showBack onBack={onBack}>
            <div className="p-5 space-y-4">
                 <CognitiveDashboard onStartGame={setGame} />
                 <div onClick={() => setShowPay(true)} className="bg-gradient-to-r from-purple-50 to-white p-5 rounded-2xl border border-purple-100 cursor-pointer active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-black text-purple-800 text-sm">解锁高阶认知训练</div>
                            <div className="text-[10px] text-purple-600 mt-1">包含：听觉工作记忆、执行功能训练</div>
                        </div>
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">🔒</div>
                    </div>
                 </div>
                 <PaywallModal visible={showPay} pkg={PACKAGES.VIP_COGNITIVE} onClose={() => setShowPay(false)} />
            </div>
        </Layout>
    );
};

// ... (Epilepsy and Family views remain unchanged)
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // ... Content unchanged
    const { hasFeature, PACKAGES } = usePayment();
    const { showToast } = useToast(); 
    const [showPay, setShowPay] = useState(false);
    const [showManualRecord, setShowManualRecord] = useState(false); 
    const isVip = hasFeature('VIP_EPILEPSY');

    const handleSaveRecord = () => {
        setShowManualRecord(false);
        showToast("记录已保存至本地缓存 (HS-007)");
    };

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="p-5 space-y-5">
                <WaveMonitor />
                <div className="flex justify-center">
                     <button 
                         onClick={() => setShowManualRecord(!showManualRecord)}
                         className="text-xs font-bold text-slate-500 underline decoration-slate-300"
                     >
                         设备无法连接？切换手动记录模式
                     </button>
                </div>
                {showManualRecord && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up">
                         <h3 className="font-black text-slate-800 text-sm mb-3">手动记录发作事件</h3>
                         <div className="space-y-3">
                             <div>
                                 <label className="text-[10px] font-bold text-slate-500 block mb-1">发作形式</label>
                                 <div className="flex gap-2">
                                     <button className="flex-1 bg-brand-50 text-brand-600 py-2 rounded-lg text-xs font-bold border border-brand-200">大发作</button>
                                     <button className="flex-1 bg-slate-50 text-slate-500 py-2 rounded-lg text-xs font-bold border border-slate-100">失神</button>
                                     <button className="flex-1 bg-slate-50 text-slate-500 py-2 rounded-lg text-xs font-bold border border-slate-100">局灶</button>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-500 block mb-1">持续时间 (秒)</label>
                                 <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" placeholder="例如: 120" />
                             </div>
                             <Button fullWidth size="sm" onClick={handleSaveRecord}>保存记录</Button>
                         </div>
                    </div>
                )}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50">
                    <h3 className="font-black text-slate-800 text-sm mb-3">最近24小时监测日志</h3>
                    {isVip ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-500">02:14 AM</span>
                                <span className="font-bold text-slate-800">睡眠期慢波活动</span>
                                <span className="text-emerald-500 font-bold">正常</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-500">Yesterday</span>
                                <span className="font-bold text-slate-800">无异常放电记录</span>
                                <span className="text-emerald-500 font-bold">--</span>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-6 text-slate-400 text-xs">
                             <p>历史监测数据需订阅会员服务</p>
                         </div>
                    )}
                </div>
                {!isVip && (
                    <div onClick={() => setShowPay(true)} className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 cursor-pointer active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-emerald-800 text-sm">开启 24h 实时异常预警</h3>
                                <p className="text-[10px] text-emerald-600 mt-1">亲情账号同步通知 · 异常波形专家解读</p>
                            </div>
                            <Button size="sm" className="bg-emerald-600">订阅</Button>
                        </div>
                    </div>
                )}
                <PaywallModal visible={showPay} pkg={PACKAGES.VIP_EPILEPSY} onClose={() => setShowPay(false)} />
            </div>
        </Layout>
    );
};

export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Content unchanged...
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    const handleEdit = (member: FamilyMember) => {
        setEditingMember(member);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingMember(null);
        setShowForm(true);
    };

    const handleFormSubmit = (data: any) => {
        if (editingMember) {
            dispatch({
                type: 'EDIT_FAMILY_MEMBER',
                payload: { id: editingMember.id, updates: data }
            });
        } else {
            dispatch({
                type: 'ADD_FAMILY_MEMBER',
                payload: data
            });
        }
        setShowForm(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("确定要解绑该家庭成员吗？解绑后所有监测数据将无法恢复。")) {
            dispatch({ type: 'REMOVE_FAMILY_MEMBER', payload: id });
            setShowForm(false);
        }
    };

    const checkCognitiveStatus = (e: React.MouseEvent, member: FamilyMember) => {
        e.stopPropagation();
        const duration = member.cognitiveStats?.todayDuration || 0;
        if (duration < 10) {
            showToast(`👴 提醒：${member.name}今天的大脑能量还没加满`, 'info');
        } else {
            showToast(`✅ ${member.name}今日已完成训练 ${duration} 分钟`, 'success');
        }
    };

    return (
        <Layout headerTitle="亲情账号管理" showBack onBack={onBack}>
             <div className="p-5 pb-20">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">已绑定的家庭成员</h3>
                {state.user.familyMembers?.map(m => (
                    <div key={m.id} onClick={() => handleEdit(m)} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-50 flex flex-col active:scale-[0.99] transition-transform">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl border border-slate-200 relative">
                                    {m.avatar}
                                    {m.isElderly && <span className="absolute -bottom-1 -right-1 text-[8px] bg-orange-100 text-orange-600 px-1 rounded-full font-bold border border-white">老</span>}
                                </div>
                                <div>
                                    <div className="font-black text-slate-800 text-sm flex items-center gap-2">
                                        {m.name}
                                        {m.isElderly && <span className="bg-orange-50 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">适老模式</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded mt-1 inline-block">{m.relation}</div>
                                </div>
                            </div>
                            <div className="text-slate-300">›</div>
                        </div>
                        {(m.cognitiveProfile || m.isElderly || m.relation.includes('AD')) && (
                            <div className="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-bold">认知训练状态</span>
                                <button 
                                    onClick={(e) => checkCognitiveStatus(e, m)}
                                    className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold active:bg-indigo-100"
                                >
                                    一键查看今日情况
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                <div onClick={handleCreate} className="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer active:scale-[0.98]">
                    <span className="text-2xl mb-2 text-brand-500">+</span>
                    <span className="text-xs font-bold text-slate-500">添加新的家庭成员</span>
                </div>
                {showForm && (
                    <FamilyMemberForm 
                        initialData={editingMember}
                        onClose={() => setShowForm(false)}
                        onSubmit={handleFormSubmit}
                        onDelete={editingMember ? () => handleDelete(editingMember.id) : undefined}
                    />
                )}
             </div>
        </Layout>
    );
};

const FamilyMemberForm: React.FC<{ 
    initialData: FamilyMember | null; 
    onClose: () => void; 
    onSubmit: (data: any) => void;
    onDelete?: () => void;
}> = ({ initialData, onClose, onSubmit, onDelete }) => {
    // ... Content unchanged
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        relation: initialData?.relation || '父亲',
        avatar: initialData?.avatar || '👨‍🦳',
        isElderly: initialData?.isElderly || false
    });
    const [isScanning, setIsScanning] = useState(false);

    const relations = ['父亲', '母亲', '配偶', '子女', '其他'];
    const avatars = ['👨‍🦳', '👵', '👨', '👩', '👦', '👧', '👶'];

    const handleOCRScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            const mockResult = {
                name: '赵淑芬',
                age: 66,
                id: '51010219580101XXXX'
            };
            setFormData(prev => ({
                ...prev,
                name: mockResult.name,
                relation: '母亲',
                avatar: '👵',
                isElderly: mockResult.age > 60
            }));
            setIsScanning(false);
            showToast('身份证识别成功！已自动开启适老模式', 'success');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up relative z-10 max-w-[430px] mx-auto min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">{initialData ? '编辑成员信息' : '添加家庭成员'}</h3>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400">✕</button>
                </div>
                <div className="space-y-6">
                    {!initialData && (
                        <div onClick={handleOCRScan} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm text-blue-600">
                                    {isScanning ? '⏳' : '📷'}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800">{isScanning ? '正在识别身份信息...' : '拍摄身份证自动识别'}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">自动判断年龄并开启适老模式</div>
                                </div>
                            </div>
                            <div className="text-blue-500 font-bold text-xs">去拍摄 ›</div>
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">真实姓名</label>
                        <input 
                            type="text" 
                            placeholder="请输入姓名 (用于病历归档)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">👓</span>
                            <div>
                                <div className="text-xs font-bold text-slate-800">长辈适老模式</div>
                                <div className="text-[10px] text-slate-400">字体放大 +20%，简化界面</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => setFormData({...formData, isElderly: !formData.isElderly})}
                            className={`w-10 h-6 rounded-full relative transition-colors ${formData.isElderly ? 'bg-brand-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.isElderly ? 'left-5' : 'left-1'}`}></div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-3 block">选择头像</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {avatars.map(av => (
                                <button
                                    key={av}
                                    onClick={() => setFormData({...formData, avatar: av})}
                                    className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all ${formData.avatar === av ? 'bg-brand-100 border-2 border-brand-500 scale-110' : 'bg-slate-50 border border-slate-200'}`}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-3 block">亲属关系</label>
                        <div className="flex flex-wrap gap-2">
                            {relations.map(rel => (
                                <button
                                    key={rel}
                                    onClick={() => setFormData({...formData, relation: rel})}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.relation === rel ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {rel}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 space-y-3">
                    <Button fullWidth onClick={() => onSubmit(formData)} disabled={!formData.name}>
                        {initialData ? '保存修改' : '确认添加'}
                    </Button>
                    {initialData && onDelete && (
                        <button 
                            onClick={onDelete}
                            className="w-full py-3 text-rose-500 text-xs font-bold bg-rose-50 rounded-full hover:bg-rose-100 transition-colors"
                        >
                            解绑该成员
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProfileForm: React.FC<{ onClose: () => void; onSubmit: (data: any) => void; userRelation: string }> = ({ onClose, onSubmit, userRelation }) => {
    // ... Content unchanged
    const [formData, setFormData] = useState({
        age: '',
        frequency: '',
        familyHistory: false,
        meds: [] as string[]
    });
    const medsList = ['布洛芬', '对乙酰氨基酚', '散利痛', '佐米曲普坦', '氟桂利嗪'];
    const toggleMed = (med: string) => {
        setFormData(prev => ({
            ...prev,
            meds: prev.meds.includes(med) ? prev.meds.filter(m => m !== med) : [...prev.meds, med]
        }));
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up relative z-10 max-w-[430px] mx-auto min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">建立专病档案</h3>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                            {userRelation !== '本人' && <span className="bg-orange-100 text-orange-600 px-1 rounded mr-1">代录: {userRelation}</span>}
                            仅用于华西 AI 诊断分析
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400">✕</button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">首次发作年龄</label>
                        <input 
                            type="number" 
                            placeholder="例如: 25"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-500 outline-none"
                            value={formData.age}
                            onChange={e => setFormData({...formData, age: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">近3个月发作频率 (MIDAS简版)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['<1天/月', '1-4天/月', '5-14天/月', '>15天/月'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFormData({...formData, frequency: opt})}
                                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${formData.frequency === opt ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">直系亲属是否有头痛史？</label>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setFormData({...formData, familyHistory: true})}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border ${formData.familyHistory ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-transparent text-slate-400'}`}
                            >
                                是，有家族史
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, familyHistory: false})}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border ${!formData.familyHistory ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-transparent text-slate-400'}`}
                            >
                                否 / 不清楚
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">既往用药史 (多选)</label>
                        <div className="flex flex-wrap gap-2">
                            {medsList.map(med => (
                                <button
                                    key={med}
                                    onClick={() => toggleMed(med)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${formData.meds.includes(med) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {med}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8">
                    <Button fullWidth onClick={() => onSubmit(formData)} disabled={!formData.age || !formData.frequency}>
                        生成数字化病历卡
                    </Button>
                </div>
            </div>
        </div>
    );
};

const MedicalRecordOCRModal: React.FC<{ onClose: () => void; onSuccess: (record: MedicalRecord) => void }> = ({ onClose, onSuccess }) => {
    // ... Content unchanged
    const [isProcessing, setIsProcessing] = useState(false);
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsProcessing(true);
        setTimeout(() => {
            const mockRecord: MedicalRecord = {
                id: `rec_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                hospital: '四川大学华西医院',
                diagnosis: '前庭性偏头痛',
                indicators: [
                    { name: 'VAS评分', value: 8, trend: 'up' },
                    { name: '发作频率', value: '4次/周', trend: 'flat' }
                ],
                rawImageUrl: 'mock_url'
            };
            setIsProcessing(false);
            onSuccess(mockRecord);
        }, 2000);
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-[24px] p-6 relative z-10 animate-slide-up max-w-sm text-center">
                <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    {isProcessing ? '🔄' : '📷'}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                    {isProcessing ? 'AI 正在解析报告...' : '拍摄纸质报告'}
                </h3>
                <p className="text-xs text-slate-500 mb-6 px-4">
                    {isProcessing ? '正在提取：检查日期、诊断结论、异常指标' : '请确保光线充足，文字清晰可见。系统将自动提取关键指标并生成趋势图。'}
                </p>
                {isProcessing ? (
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-brand-500 h-full w-1/2 animate-[pulse_1s_infinite] rounded-full"></div>
                    </div>
                ) : (
                    <label className="block w-full">
                        <div className="bg-[#1677FF] hover:bg-[#0958D9] text-white shadow-md shadow-brand-500/20 inline-flex items-center justify-center rounded-full font-black transition-all focus:outline-none active:scale-[0.97] select-none min-h-[44px] px-8 py-3 text-xs tracking-widest w-full cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            启动相机拍摄
                        </div>
                    </label>
                )}
                {!isProcessing && (
                    <button onClick={onClose} className="mt-4 text-slate-400 text-xs font-bold">
                        取消
                    </button>
                )}
            </div>
        </div>
    );
};
