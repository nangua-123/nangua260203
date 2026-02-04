
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './Layout';
import Button from './Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
// 引入完整的认知游戏组件集合
import { VisualMemoryGame, AttentionGame, CognitiveDashboard } from './CognitiveGames';
import { HeadacheProfile } from '../types';

// 引入拆分后的核心业务组件
import { DigitalPrescription } from './business/headache/DigitalPrescription';
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
    const { state, dispatch } = useApp();
    const { PACKAGES, hasFeature } = usePayment();
    const [showVipPay, setShowVipPay] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    
    // --- 档案管理状态 ---
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [isSwitchingUser, setIsSwitchingUser] = useState(false);
    const [showProfileDetails, setShowProfileDetails] = useState(false); // 控制 AI 档案详情展开

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

    // --- 诱因数据模型 (基线数据 + 动态叠加) ---
    const baseFactors = {
        pressure: 65, 
        cycle: 20,    
        sleep: 30,    
        diet: 15,     
        stress: 40    
    };

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

    // 维度配置
    const axes = [
        { key: 'pressure', label: '气压', weight: 0.15 },
        { key: 'cycle', label: '生理', weight: 0.2 },
        { key: 'sleep', label: '睡眠', weight: 0.35 }, 
        { key: 'diet', label: '饮食', weight: 0.1 },
        { key: 'stress', label: '压力', weight: 0.2 },
    ];

    // --- 风险评分计算 ---
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
        let advice = "";
        let alertLevel: 'low' | 'medium' | 'high' = 'low';

        if (score > 70) {
            alertLevel = 'high';
            advice = `风险指数 ${score} (高危)。检测到"${maxTrigger.label}"诱因显著，建议立即执行阻断方案。`;
        } else if (score > 40) {
            alertLevel = 'medium';
            advice = "诱因水平处于波动期，请注意规避刺激源。";
        } else {
            alertLevel = 'low';
            advice = "当前各项指标平稳，请继续保持。";
        }

        return { score, maxTrigger, advice, alertLevel };
    }, [factors]);

    const toggleTrigger = (id: string) => {
        setActiveTriggers(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    // SVG 绘图参数
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

    // --- 档案表单提交 (Manual) ---
    const handleProfileSubmit = (formData: any) => {
        let diagnosis = '无先兆偏头痛';
        if (formData.familyHistory) diagnosis = '家族性偏头痛';
        if (formData.frequency === '>15天/月') diagnosis = '慢性偏头痛';
        
        const newProfile: HeadacheProfile = {
            isComplete: true,
            source: 'USER_INPUT',
            onsetAge: parseInt(formData.age),
            frequency: formData.frequency,
            familyHistory: formData.familyHistory,
            medicationHistory: formData.meds,
            diagnosisType: diagnosis,
            symptomsTags: [], // 手动录入暂时没有 AI tags
            lastUpdated: Date.now()
        };

        dispatch({
            type: 'UPDATE_PROFILE',
            payload: {
                id: activePatient.id,
                profile: newProfile
            }
        });
        setShowProfileForm(false);
    };

    return (
        <Layout headerTitle="偏头痛全周期管理" showBack onBack={onBack}>
            <div className="p-5 space-y-5 pb-24">

                {/* --- 0. 患者管理与数字化档案 --- */}
                <div className="space-y-3">
                    {/* 患者切换器 */}
                    <div className="flex justify-between items-center px-1">
                        <div 
                            className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-transform"
                            onClick={() => setIsSwitchingUser(!isSwitchingUser)}
                        >
                            <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-700">
                                {activePatient.relation === '本人' ? activePatient.avatar : '👪'}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{activePatient.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded">{activePatient.relation}</span>
                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        
                        {/* 切换菜单 */}
                        {isSwitchingUser && (
                            <div className="absolute top-16 left-5 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 animate-slide-up">
                                <div className="text-[9px] text-slate-400 px-2 py-1 mb-1 font-bold">切换档案</div>
                                <div 
                                    onClick={() => { dispatch({type: 'SWITCH_PATIENT', payload: state.user.id}); setIsSwitchingUser(false); }}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${state.user.id === activePatient.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                                >
                                    <span className="text-sm">👨</span>
                                    <span className="text-xs font-bold">本人 ({state.user.name})</span>
                                </div>
                                {state.user.familyMembers?.map(m => (
                                    <div 
                                        key={m.id}
                                        onClick={() => { dispatch({type: 'SWITCH_PATIENT', payload: m.id}); setIsSwitchingUser(false); }}
                                        className={`flex items-center gap-2 p-2 rounded-lg ${m.id === activePatient.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <span className="text-sm">{m.avatar}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{m.name}</span>
                                            <span className="text-[9px] text-slate-400">{m.relation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 数字化病历卡 */}
                    {activePatient.profile?.isComplete ? (
                        <div 
                            className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-[24px] p-5 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group transition-all"
                            onClick={() => setShowProfileDetails(!showProfileDetails)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border-2 border-brand-200">
                                            {activePatient.relation === '本人' ? '👨' : activePatient.avatar}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black">{activePatient.name}</h3>
                                                {/* 显示 AI 认证徽章 */}
                                                {activePatient.profile.source === 'AI_GENERATED' && (
                                                    <span className="bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm flex items-center gap-1">
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                        华西 AI 归档
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-brand-200 font-mono">ID: {activePatient.id.split('_')[1] || '8829'} · 神经内科</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-sm">🏥</span>
                                    </div>
                                </div>

                                {/* Diagnosis Info */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                                        <div className="text-[8px] text-brand-200 uppercase tracking-widest mb-0.5">确诊类型</div>
                                        <div className="text-xs font-black">{activePatient.profile.diagnosisType}</div>
                                    </div>
                                    <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                                        <div className="text-[8px] text-brand-200 uppercase tracking-widest mb-0.5">发作频率</div>
                                        <div className="text-xs font-black">{activePatient.profile.frequency}</div>
                                    </div>
                                </div>
                                
                                {/* Expanded Details for AI Profile */}
                                {showProfileDetails && activePatient.profile.source === 'AI_GENERATED' && (
                                    <div className="mt-2 pt-3 border-t border-white/10 animate-fade-in">
                                        <div className="text-[9px] text-brand-200 uppercase tracking-widest mb-2">AI 提取临床特征</div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {activePatient.profile.symptomsTags?.map((tag, idx) => (
                                                <span key={idx} className="bg-white/10 px-2 py-1 rounded text-[9px] font-medium border border-white/5">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[9px] text-brand-200">
                                            <span>首发年龄: {activePatient.profile.onsetAge}岁</span>
                                            <span>家族史: {activePatient.profile.familyHistory ? '有' : '无'}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Footer & Commercial Hook */}
                                <div className="flex justify-between items-end border-t border-white/10 pt-3 mt-2">
                                    <div className="text-[9px] text-brand-300">
                                        {showProfileDetails ? '点击收起档案' : '点击查看 AI 提取详情'}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowVipPay(true); }}
                                        className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg text-[9px] font-black transition-colors shadow-sm"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        导出病历 PDF
                                        <span className="bg-black/10 px-1 rounded text-[8px]">VIP</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 档案补全引导卡片
                        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-brand-100 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[13px] font-black text-slate-800">完善头痛基础画像</h4>
                                <span className="text-[9px] font-bold text-slate-400">档案完整度 30%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                                <div className="bg-brand-500 h-full w-[30%] rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex items-start gap-3 mb-4">
                                <div className="text-2xl">📋</div>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    建立多维医疗档案可大幅提升 AI 诱因分析准确率，并为医生提供诊断依据。
                                </p>
                            </div>
                            <Button size="sm" fullWidth onClick={() => setShowProfileForm(true)}>
                                立即完善 (预计1分钟)
                            </Button>
                        </div>
                    )}
                </div>
                
                {/* 1. 数字处方看板 (联动高风险状态) */}
                <DigitalPrescription highlight={riskAnalysis.alertLevel === 'high'} factors={factors} />

                {/* 2. 动态诱因雷达 */}
                <div className={`bg-white rounded-[32px] p-6 shadow-card border transition-all duration-500 relative overflow-hidden ${riskAnalysis.alertLevel === 'high' ? 'border-rose-100 ring-4 ring-rose-50' : 'border-slate-50'}`}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">
                                AI 诱因全维雷达
                            </h4>
                            <p className="text-[9px] text-slate-400 mt-1">
                                实时计算今日发作概率模型
                            </p>
                        </div>
                        <div className={`flex flex-col items-end ${riskAnalysis.alertLevel === 'high' ? 'text-rose-600' : riskAnalysis.alertLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            <span className="text-[20px] font-black tracking-tighter transition-all duration-500">{riskAnalysis.score}</span>
                            <span className="text-[8px] font-bold opacity-80 uppercase">今日风险值</span>
                        </div>
                    </div>

                    {/* SVG Chart Area */}
                    <div className="relative flex justify-center py-4 z-10">
                        <svg width={size} height={size} className="overflow-visible">
                            {renderGrid()}
                            {/* 轴线 & 标签 */}
                            {axes.map((axis, i) => {
                                const angle = (360 / 5) * i;
                                const edge = polarToCartesian(center, center, radius, angle);
                                const labelPos = polarToCartesian(center, center, radius + 20, angle);
                                return (
                                    <g key={axis.key}>
                                        <line x1={center} y1={center} x2={edge.x} y2={edge.y} stroke="#E2E8F0" strokeWidth="1" />
                                        <text 
                                            x={labelPos.x} 
                                            y={labelPos.y} 
                                            fontSize="10" 
                                            fontWeight="bold" 
                                            fill={factors[axis.key as keyof typeof factors] > 60 ? '#EF4444' : '#64748B'}
                                            textAnchor="middle" 
                                            dominantBaseline="middle"
                                        >
                                            {axis.label}
                                        </text>
                                    </g>
                                );
                            })}
                            {/* 数据区域 */}
                            <polygon 
                                points={getPath(factors)} 
                                fill={riskAnalysis.alertLevel === 'high' ? "rgba(244, 63, 94, 0.2)" : "rgba(37, 99, 235, 0.2)"}
                                stroke={riskAnalysis.alertLevel === 'high' ? "#E11D48" : "#2563EB"} 
                                strokeWidth="2"
                                className="transition-all duration-500 ease-out"
                            />
                            {/* 数据点 */}
                            {axes.map((axis, i) => {
                                const angle = (360 / 5) * i;
                                const val = factors[axis.key as keyof typeof factors];
                                const p = polarToCartesian(center, center, radius * (val / 100), angle);
                                return (
                                    <circle 
                                        key={i} 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r={4}
                                        fill="white" 
                                        stroke={val > 60 ? "#EF4444" : "#2563EB"} 
                                        strokeWidth={2}
                                        className="transition-all duration-500"
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    {/* 快速记录交互区 (Trigger Diary) */}
                    <div className="relative z-10 pt-2 border-t border-slate-50">
                        <div className="text-[9px] text-slate-400 font-bold mb-3 uppercase tracking-wider text-center flex items-center justify-center gap-2">
                            <span>⚡ 快速记录今日行为</span>
                            <span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[8px]">实时反馈</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            {TRIGGER_OPTIONS.map(trigger => {
                                const isActive = activeTriggers.includes(trigger.id);
                                return (
                                    <button
                                        key={trigger.id}
                                        onClick={() => toggleTrigger(trigger.id)}
                                        className={`flex flex-col items-center justify-center flex-1 p-2 rounded-xl border transition-all duration-300 active:scale-95 ${
                                            isActive 
                                            ? 'bg-rose-50 border-rose-200 shadow-inner' 
                                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="text-lg mb-1">{trigger.icon}</span>
                                        <span className={`text-[10px] font-bold ${isActive ? 'text-rose-600' : 'text-slate-500'}`}>
                                            {trigger.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. VIP 预测报告 (商业转化入口) */}
                <div 
                    onClick={() => setShowVipPay(true)}
                    className="bg-slate-100 rounded-[24px] p-5 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer border border-slate-200"
                >
                    {/* 模糊内容层 */}
                    <div className="opacity-40 filter blur-[1px] select-none pointer-events-none">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-slate-800 text-sm">未来 7 天发作趋势预测</h4>
                            <span className="text-xs font-bold text-slate-500">2024.10.25 - 11.01</span>
                        </div>
                        <div className="flex items-end gap-1 h-12 w-full mb-2">
                            {[30, 45, 20, 80, 60, 40, 25].map((h, i) => (
                                <div key={i} className="flex-1 bg-slate-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500">AI 分析显示：您的发作周期与气压变化呈强相关...</p>
                    </div>
                    
                    {/* 遮罩引导层 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-100/90 via-slate-100/50 to-transparent">
                        <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white flex items-center gap-2">
                            <span className="text-lg">🔐</span>
                            <div>
                                <div className="text-[11px] font-black text-slate-800">解锁 AI 预测报告</div>
                                <div className="text-[9px] text-slate-500">结合近 3 天记录分析</div>
                            </div>
                            <span className="ml-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-full">VIP</span>
                        </div>
                    </div>
                </div>

                {/* 4. 转诊入口 */}
                <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-5 flex items-center justify-between">
                     <div>
                        <h4 className="text-rose-900 font-black text-xs mb-1">转诊绿色通道</h4>
                        <p className="text-[10px] text-rose-700">符合华西二阶段转诊标准</p>
                     </div>
                     <Button size="sm" className="bg-rose-600 text-[10px]" onClick={() => setShowReferral(true)}>生成通行证</Button>
                </div>

                {/* --- Form Modal --- */}
                {showProfileForm && (
                    <ProfileForm 
                        onClose={() => setShowProfileForm(false)} 
                        onSubmit={handleProfileSubmit}
                        userRelation={activePatient.relation}
                    />
                )}

                {/* Modals */}
                {showReferral && <ReferralSystem onClose={() => setShowReferral(false)} />}
                <PaywallModal visible={showVipPay} pkg={PACKAGES.VIP_MIGRAINE} onClose={() => setShowVipPay(false)} />
            </div>
        </Layout>
    );
};

// --- Cognitive Service View (Games) ---
export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [game, setGame] = useState<'none' | 'memory' | 'attention'>('none');
    const { PACKAGES } = usePayment();
    const [showPay, setShowPay] = useState(false);

    // 游戏状态管理：
    // 当游戏进行中时，onComplete 回调仅用于内部状态传递，不直接关闭游戏
    // 只有当用户在结算页点击“保存并返回”时，触发 onExit，此时才将 game 设为 'none'
    if (game === 'memory') return <VisualMemoryGame onComplete={() => {}} onExit={() => setGame('none')} />;
    if (game === 'attention') return <AttentionGame onComplete={() => {}} onExit={() => setGame('none')} />;

    return (
        <Layout headerTitle="认知康复训练" showBack onBack={onBack}>
            <div className="p-5 space-y-4">
                 {/* 智能仪表盘：展示进度与推荐 */}
                 <CognitiveDashboard onStartGame={setGame} />
                 
                 {/* VIP Promote */}
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

// --- Epilepsy Service View (Wave Monitor) ---
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { hasFeature, PACKAGES } = usePayment();
    const [showPay, setShowPay] = useState(false);
    const isVip = hasFeature('VIP_EPILEPSY');

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="p-5 space-y-5">
                <WaveMonitor />
                
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

// --- Family Service View ---
export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { state } = useApp();
    return (
        <Layout headerTitle="亲情账号管理" showBack onBack={onBack}>
             <div className="p-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">已绑定的家庭成员</h3>
                
                {state.user.familyMembers?.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                                {m.avatar}
                            </div>
                            <div>
                                <div className="font-black text-slate-800 text-sm">{m.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded mt-1 inline-block">{m.relation}</div>
                            </div>
                        </div>
                        <div className="text-emerald-500 font-bold text-xs">
                            已关联
                        </div>
                    </div>
                ))}
                
                <div className="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="text-2xl mb-2">+</span>
                    <span className="text-xs font-bold">添加新的家庭成员</span>
                </div>
             </div>
        </Layout>
    );
};

// --- Internal Component: Profile Form ---
const ProfileForm: React.FC<{ onClose: () => void; onSubmit: (data: any) => void; userRelation: string }> = ({ onClose, onSubmit, userRelation }) => {
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
                    {/* Age */}
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

                    {/* Frequency */}
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

                    {/* Family History */}
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

                    {/* Meds */}
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
