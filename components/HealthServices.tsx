
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './Layout';
import Button from './Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
import { VisualMemoryGame, AttentionGame } from './CognitiveGames';

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
    const { PACKAGES, hasFeature } = usePayment();
    const [showVipPay, setShowVipPay] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    
    // 用户选中的诱因 ID 列表
    const [activeTriggers, setActiveTriggers] = useState<string[]>([]);

    // --- 诱因数据模型 (基线数据 + 动态叠加) ---
    // 0 = 理想状态, 100 = 极高风险
    const baseFactors = {
        pressure: 65, // 气压波动 (外界不可控)
        cycle: 20,    // 生理周期 (内源性)
        sleep: 30,    // 睡眠质量 (基线)
        diet: 15,     // 饮食刺激 (基线)
        stress: 40    // 压力指数 (基线)
    };

    // 动态计算当前的 Factors
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

    // --- 核心医学算法：风险评分计算 ---
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

    // 处理诱因点击
    const toggleTrigger = (id: string) => {
        setActiveTriggers(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // SVG 绘图参数
    const size = 260;
    const center = size / 2;
    const radius = 90;
    
    // 生成雷达图路径
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

    // 生成背景网格
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

    return (
        <Layout headerTitle="偏头痛全周期管理" showBack onBack={onBack}>
            <div className="p-5 space-y-5 pb-24">
                
                {/* 1. 数字处方看板 (闭环核心：接收 factors 驱动排序) */}
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

                {/* Modals */}
                {showReferral && <ReferralSystem onClose={() => setShowReferral(false)} />}
                <PaywallModal visible={showVipPay} pkg={PACKAGES.VIP_MIGRAINE} onClose={() => setShowVipPay(false)} />
            </div>
        </Layout>
    );
};

// [AUDIT_FIX] 扩展日志数据接口
interface EpilepsyLog {
    id: number;
    date: string;
    time: string;
    duration: string;
    type: string;
    risk: 'High' | 'Medium' | 'Low';
    prodrome: string; // 前驱症状
    manifestation: string; // 肢体表现
}

/** 
 * 专病子模块: 癫痫生命守护
 */
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { PACKAGES } = usePayment();
    const [activeTab, setActiveTab] = useState<'monitor' | 'log'>('monitor');
    const [showPay, setShowPay] = useState(false);
    const [selectedLog, setSelectedLog] = useState<EpilepsyLog | null>(null); 
    
    // SOS Logic Status Machine
    const [sosState, setSosState] = useState<'idle' | 'calling' | 'sent'>('idle');

    const handleSOS = () => {
        setSosState('calling');
        
        if ((window as any).ReactNativeWebView) {
            (window as any).ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'EMERGENCY_CALL', 
                phone: '120',
                meta: { reason: 'Epilepsy SOS', timestamp: Date.now() }
            }));
        } else {
            console.log("模拟调用原生拨号: 120");
        }

        setTimeout(() => {
            setSosState('sent');
            setTimeout(() => setSosState('idle'), 3000);
        }, 2000);
    };

    const logs: EpilepsyLog[] = [
        { 
            id: 1, date: '今日', time: '09:42', duration: '35s', type: '强直阵挛发作', risk: 'High',
            prodrome: '患者自述突发眩晕，伴有强烈金属味幻嗅。',
            manifestation: '双眼上翻，牙关紧闭，四肢呈现强直性抽搐，持续约15秒后转为阵挛。'
        },
        { 
            id: 2, date: '昨日', time: '21:15', duration: '12s', type: '失神发作', risk: 'Low',
            prodrome: '无明显先兆，正在进食。',
            manifestation: '动作突然停止，目光呆滞凝视前方，呼之不应，手中餐具掉落。'
        },
        { 
            id: 3, date: '10月24日', time: '14:30', duration: '1min 05s', type: '复杂部分性发作', risk: 'Medium',
            prodrome: '感到胃气上升，胸闷不适。',
            manifestation: '出现无意识的摸索动作，伴有咂嘴、咀嚼等自动症，意识模糊。'
        },
    ];

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="flex flex-col h-full pb-safe">
                {/* 顶部导航 */}
                <div className="px-5 py-2 bg-[#F7F9FA]">
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                        {['monitor', 'log'].map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab as any)} 
                                className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                            >
                                {tab === 'monitor' ? '实时监测' : '发作日志'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto no-scrollbar flex-1">
                    {activeTab === 'monitor' ? (
                        <>
                            {/* 1. 脑电波监测 */}
                            <WaveMonitor />
                            
                            {/* 2. 紧急呼叫卡片 */}
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 text-center relative overflow-hidden transition-all">
                                {sosState === 'idle' && (
                                    <>
                                        <h4 className="text-[13px] font-black text-slate-900 mb-4">安全应急演练</h4>
                                        <Button 
                                            fullWidth 
                                            onClick={handleSOS}
                                            className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-none py-4"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="relative flex h-3 w-3">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                                模拟异常发作呼救 (SOS)
                                            </span>
                                        </Button>
                                    </>
                                )}

                                {sosState === 'calling' && (
                                    <div className="py-2 animate-pulse flex flex-col items-center">
                                        <div className="text-4xl mb-2">📡</div>
                                        <h3 className="text-sm font-black text-slate-900">正在接入华西急救中心...</h3>
                                        <p className="text-[10px] text-slate-400 mt-1">同步定位与生命体征数据</p>
                                    </div>
                                )}

                                {sosState === 'sent' && (
                                    <div className="py-2 animate-fade-in flex flex-col items-center">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">✓</div>
                                        <h3 className="text-sm font-black text-slate-900">求救信号已发出</h3>
                                        <p className="text-[10px] text-slate-400 mt-1">已通知 2 位紧急联系人</p>
                                    </div>
                                )}
                            </div>

                            {/* 3. VIP Upsell Banner */}
                            <div onClick={() => setShowPay(true)} className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-[28px] p-5 text-white shadow-lg active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <h4 className="text-[13px] font-black flex items-center gap-2">
                                            升级生命守护会员
                                            <span className="bg-amber-400 text-amber-900 text-[8px] px-1.5 py-0.5 rounded font-bold">Pro</span>
                                        </h4>
                                        <p className="text-[10px] opacity-80 mt-1">含 7x24h 亲情预警同步</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm">¥599/年</span>
                                        <span className="text-[8px] opacity-60 mt-1 line-through">原价 ¥1200</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Log Tab Implementation */
                        <div className="space-y-3 animate-fade-in">
                             {logs.map((log) => (
                                 <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between">
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="text-[13px] font-black text-slate-800">{log.type}</span>
                                             {log.risk === 'High' && <span className="text-[8px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">高危</span>}
                                         </div>
                                         <div className="text-[10px] text-slate-400 font-medium">
                                             {log.date} {log.time} · 持续 {log.duration}
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => setSelectedLog(log)} 
                                        className="text-brand-600 text-[10px] font-black bg-brand-50 px-3 py-1.5 rounded-lg active:scale-90 transition-transform"
                                     >
                                         详情
                                     </button>
                                 </div>
                             ))}
                             <div className="text-center py-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                                 仅展示最近3条记录
                             </div>
                        </div>
                    )}
                </div>

                {/* 日志详情弹窗 */}
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                        <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative z-10 shadow-2xl animate-slide-up">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{selectedLog.date} {selectedLog.time}</div>
                                    <h3 className="text-xl font-black text-slate-900">{selectedLog.type}</h3>
                                </div>
                                <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-1 rounded-lg border border-red-100">
                                    {selectedLog.duration}
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 mb-1">🧠 前驱症状 (Prodrome)</div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedLog.prodrome}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 mb-1">⚡ 肢体表现 (Manifestation)</div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedLog.manifestation}</p>
                                </div>
                            </div>

                            <Button fullWidth className="mt-6" onClick={() => setSelectedLog(null)}>
                                关闭详情
                            </Button>
                        </div>
                    </div>
                )}

                <PaywallModal visible={showPay} pkg={PACKAGES.VIP_EPILEPSY} onClose={() => setShowPay(false)} />
            </div>
        </Layout>
    );
};

/** 
 * 专病子模块: 认知康复
 */
export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { PACKAGES } = usePayment();
    const [game, setGame] = useState<'memory' | 'attention' | null>(null);
    const [showPay, setShowPay] = useState(false);

    if (game === 'memory') return <VisualMemoryGame onComplete={() => setGame(null)} onExit={() => setGame(null)} />;
    if (game === 'attention') return <AttentionGame onComplete={() => setGame(null)} onExit={() => setGame(null)} />;

    return (
        <Layout headerTitle="认知康复中心" showBack onBack={onBack}>
            <div className="p-5 space-y-4">
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[10px] font-black text-emerald-400 uppercase">脑机接口已就绪</span></div>
                        <h2 className="text-2xl font-black">今日训练处方</h2>
                        <p className="text-[11px] text-slate-400 mt-1">华西神经心理实验室 · 定制方案</p>
                    </div>
                </div>

                <div onClick={() => setGame('memory')} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex gap-4 active:scale-95 transition-all">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-2xl">🧠</div>
                    <div><h4 className="font-black text-slate-900 text-sm">海马体激活训练</h4><p className="text-[10px] text-slate-400 mt-1">强化短时记忆与空间导航能力</p></div>
                </div>

                <div onClick={() => setShowPay(true)} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex gap-4 opacity-80">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl">👁️</div>
                    <div className="flex-1">
                        <div className="flex justify-between"><h4 className="font-black text-slate-900 text-sm">舒尔特专注力训练</h4><span className="text-[9px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-bold">VIP</span></div>
                        <p className="text-[10px] text-slate-400 mt-1">提升视觉搜索与抗干扰能力</p>
                    </div>
                </div>

                <PaywallModal visible={showPay} pkg={PACKAGES.VIP_COGNITIVE} onClose={() => setShowPay(false)} />
            </div>
        </Layout>
    );
};

export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <Layout headerTitle="亲情账号" showBack onBack={onBack}>
        <div className="p-10 text-center text-slate-300">
            <div className="text-5xl mb-4">👨‍👩‍👧</div>
            <p className="font-black text-xs uppercase tracking-widest">亲情数据链路建设中...</p>
        </div>
    </Layout>
);
