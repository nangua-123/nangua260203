
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Button from './Button';
import { TrainingRecord, HeadacheLog, MedicationTask, FamilyMember, SeizureLog, DeviceInfo } from '../types';
import { VisualMemoryGame, AttentionGame } from './CognitiveGames';

// --- COMMERCIAL INFRASTRUCTURE ---

interface ServicePackage {
    id: string;
    title: string;
    price: number;
    duration: string;
    features: string[];
    medicalValue: string; // The core medical proposition
}

const PACKAGES: Record<string, ServicePackage> = {
    COGNITIVE: {
        id: 'pkg_cog',
        title: 'AD 认知康复会员',
        price: 365,
        duration: '年',
        features: ['每日定制训练处方', '季度华西专家远程随访', '月度认知能力评估报告'],
        medicalValue: '延缓认知衰退，建立长期脑健康档案'
    },
    MIGRAINE: {
        id: 'pkg_mig',
        title: '偏头痛管理会员',
        price: 299,
        duration: '年',
        features: ['AI 诱因雷达图谱', '华西专家/AI 影像复核', '用药效果分析报告'],
        medicalValue: '精准识别诱因，优化药物治疗方案'
    },
    EPILEPSY: {
        id: 'pkg_epi',
        title: '癫痫生命守护包',
        price: 599,
        duration: '年',
        features: ['智能监护手环租赁 (HaaS)', '24H 异常跌倒/抽搐报警', '亲情紧急通话服务'],
        medicalValue: '居家安全监测，降低意外风险'
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
                setStep('info'); // Reset
            }, 2000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 relative z-10 animate-slide-up sm:animate-none">
                {step === 'info' && (
                    <>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{pkg.title}</h3>
                                <p className="text-xs text-brand-600 font-medium mt-1">{pkg.medicalValue}</p>
                            </div>
                            <button onClick={onClose} className="bg-slate-50 p-1 rounded-full text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3 border border-slate-100">
                            {pkg.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">✓</div>
                                    <span className="text-sm text-slate-700">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-end mb-8 border-t border-slate-50 pt-4">
                            <div>
                                <span className="text-xs text-slate-500">服务周期: {pkg.duration}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-accent-600">¥</span>
                                <span className="text-3xl font-bold text-accent-600">{pkg.price}</span>
                            </div>
                        </div>

                        <Button fullWidth onClick={handlePay} className="shadow-xl shadow-brand-200 bg-gradient-to-r from-brand-600 to-brand-500">
                            确认开通服务
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 mt-3">
                            本服务由华西医院神经内科医联体提供专业支持
                        </p>
                    </>
                )}
                
                {step === 'paying' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="font-bold text-slate-800">安全支付处理中...</h3>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-lg shadow-green-50">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-slate-800">开通成功</h3>
                        <p className="text-sm text-slate-500 mt-2">您的专属医疗权益已生效</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-MODULE 1: HEADACHE DIARY (Migraine Management) ---

export const HeadacheServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'log' | 'analysis'>('log');
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    
    // Logs Data
    const [logs] = useState<HeadacheLog[]>([
        { id: '1', startTime: '10/24 14:00', durationHours: 4, painLevel: 7, nature: ['跳痛'], triggers: ['睡眠不足'], medication: '布洛芬', medicationEffect: 'effective' },
        { id: '2', startTime: '10/22 09:30', durationHours: 2, painLevel: 5, nature: ['胀痛'], triggers: ['天气变化'], medication: '布洛芬', medicationEffect: 'none' },
        { id: '3', startTime: '10/20 18:00', durationHours: 3, painLevel: 6, nature: ['电击样'], triggers: ['劳累'], medication: '佐米曲普坦', medicationEffect: 'effective' },
    ]);

    // Check for Medication Overuse Headache (MOH) Risk
    // Criteria simulation: > 2 intakes in the recent logs list for demo purposes
    const medicationCount = logs.filter(l => l.medication && l.medication !== '无' && l.medication !== 'None').length;
    const isMOHRisk = medicationCount >= 3; 

    return (
        <Layout headerTitle="偏头痛管理" showBack onBack={onBack}>
            <div className="p-4">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setActiveTab('log')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'log' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>日记本</button>
                    <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>诱因分析 & 复核</button>
                </div>

                {activeTab === 'log' ? (
                    <div className="space-y-4 animate-slide-up">
                        {/* MOH Warning */}
                        {isMOHRisk && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 animate-fade-in">
                                <div className="text-red-500 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-800 text-sm mb-1">药物过度使用预警 (MOH)</h4>
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        检测到您近期止痛药服用频繁（{medicationCount}次）。过度用药可能导致头痛加重，建议咨询医生调整治疗方案或启用预防性用药。
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">10月记录概览</h3>
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">共 {logs.length} 次发作</span>
                             </div>
                             {/* Simple Visualization Placeholder */}
                             <div className="flex gap-1 h-16 items-end border-b border-slate-100 pb-2 mb-2">
                                 {[0,0,0,5,0,0,7,0,0,0,6,0].map((v, i) => (
                                     <div key={i} className={`flex-1 rounded-t-sm ${v>0?'bg-red-400':'bg-slate-100'}`} style={{height: v ? `${v*10}%` : '10%'}}></div>
                                 ))}
                             </div>
                             <Button fullWidth size="sm" className="mt-2">记一笔</Button>
                        </div>
                        
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-slate-700">{log.startTime}</span>
                                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">VAS {log.painLevel}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                                        <div><span className="text-slate-400">诱因:</span> {log.triggers.join(', ')}</div>
                                        <div><span className="text-slate-400">用药:</span> {log.medication}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-slide-up">
                        {/* 1. Trigger Analysis (Locked/Unlocked) */}
                        <div className={`bg-white rounded-2xl border ${isVip ? 'border-brand-200' : 'border-slate-100'} overflow-hidden relative`}>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                                    AI 诱因雷达分析
                                    {isVip && <span className="text-[10px] bg-brand-50 text-brand-600 px-2 rounded-full border border-brand-100">PRO</span>}
                                </h3>
                                
                                {isVip ? (
                                    <div className="space-y-4">
                                        <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200">
                                            [可视化雷达图：睡眠不足关联度 85%]
                                        </div>
                                        <div className="text-sm text-slate-600 bg-brand-50 p-3 rounded-lg leading-relaxed">
                                            <strong>分析结论：</strong> 您的头痛发作与“睡眠时长不足6小时”呈强相关。建议调整作息，并尝试睡前冥想。
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="filter blur-sm opacity-50 space-y-2 select-none">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                            <div className="h-32 bg-slate-100 rounded mt-4"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="mb-2 text-xs text-slate-500">解锁查看完整的诱因与发作规律</div>
                                                <Button size="sm" onClick={() => setShowPay(true)}>解锁分析报告</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Expert Re-check (Locked/Unlocked) */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-2">华西专家影像复核</h3>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                上传 CT/MRI 影像，由神经内科专科医生进行二次阅片，提供详细的复核建议书。
                            </p>
                            {isVip ? (
                                <Button fullWidth className="bg-white text-slate-900 hover:bg-slate-100 border-none">
                                    发起复核申请 (本月剩余 1 次)
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                                    <span className="text-xs font-medium text-amber-400">会员专属权益</span>
                                    <button onClick={() => setShowPay(true)} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold">立即开通</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <CommercialPaymentModal 
                    visible={showPay} 
                    pkg={PACKAGES.MIGRAINE}
                    onClose={() => setShowPay(false)}
                    onSuccess={() => setIsVip(true)}
                />
            </div>
        </Layout>
    );
};

// --- SUB-MODULE 2: EPILEPSY CARE (Guardian Package) ---

export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Hardware State: unbound -> shipping -> active
    const [deviceState, setDeviceState] = useState<DeviceInfo>({
        id: '',
        status: 'unbound',
        battery: 0,
        lastSync: '',
        model: '',
        signalStrength: 'weak',
        syncFrequency: '5min',
        activeAlerts: []
    });
    const [meds, setMeds] = useState<MedicationTask[]>([
        { id: '1', name: '丙戊酸钠缓释片', dosage: '500mg', time: '08:00', taken: false },
        { id: '2', name: '左乙拉西坦片', dosage: '250mg', time: '08:00', taken: false },
    ]);
    const [showPay, setShowPay] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [showAddMed, setShowAddMed] = useState(false);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' });
    const [notificationPermission, setNotificationPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    const handleRentDevice = () => {
        setShowPay(true);
    };

    const handlePaymentSuccess = () => {
        // Simulate Shipping
        setDeviceState(prev => ({ ...prev, status: 'shipping' }));
    };

    const handleActivate = () => {
        setIsActivating(true);
        // Simulate Scanning & Activation
        setTimeout(() => {
            setDeviceState({
                id: 'HW-2023X',
                status: 'active',
                battery: 92,
                lastSync: '刚刚',
                model: '华西监护手环 Pro',
                signalStrength: 'strong',
                syncFrequency: '10s',
                activeAlerts: [] // Empty = safe, ['Fall Detected'] = danger
            });
            setIsActivating(false);
        }, 2000);
    };

    const toggleMed = (id: string) => {
        setMeds(meds.map(m => m.id === id ? { 
            ...m, 
            taken: !m.taken, 
            takenTime: !m.taken ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined 
        } : m));
    };

    const handleAddMedSubmit = () => {
        if (!newMed.name || !newMed.time) return;
        setMeds([...meds, {
            id: Date.now().toString(),
            name: newMed.name,
            dosage: newMed.dosage,
            time: newMed.time,
            taken: false
        }]);
        
        // Mock scheduling notification
        if (notificationPermission === 'granted') {
             new Notification("服药计划已更新", { body: `已为您设置 ${newMed.time} 服用 ${newMed.name} 的提醒` });
        }

        setNewMed({ name: '', dosage: '', time: '' });
        setShowAddMed(false);
    };
    
    const enableNotifications = async () => {
        if (!("Notification" in window)) {
            alert("您的浏览器不支持通知功能");
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
            new Notification("华西 Neuro-Link", { body: "服药提醒功能已开启，我们将按时提醒您。" });
        }
    };

    return (
        <Layout headerTitle="癫痫全程管理" showBack onBack={onBack}>
            <div className="p-4 space-y-6">
                {/* 1. Hardware Status Card (The core of 599 package) */}
                <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    {deviceState.status === 'unbound' && (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2">未开启生命守护</h3>
                            <p className="text-xs text-slate-400 mb-6 px-4">
                                开启「癫痫生命守护包」，获得智能监护手环(HaaS)、AI 异常报警及亲情通话服务。
                            </p>
                            <Button fullWidth onClick={handleRentDevice} className="bg-gradient-to-r from-orange-500 to-red-500 border-none">
                                开启守护 (¥599/年)
                            </Button>
                        </div>
                    )}

                    {deviceState.status === 'shipping' && (
                        <div className="text-center py-6">
                            <div className="mb-4 text-3xl">🚚</div>
                            <h3 className="font-bold text-lg">设备配送中</h3>
                            <p className="text-xs text-slate-400 mt-2 mb-6">顺丰单号: SF1234567890</p>
                            <Button fullWidth onClick={handleActivate} variant="secondary">
                                {isActivating ? '激活中...' : '收到设备？扫码激活'}
                            </Button>
                        </div>
                    )}

                    {deviceState.status === 'active' && (
                        <div>
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                         </span>
                                         <span className="text-xs text-green-400 font-bold">实时监护中</span>
                                     </div>
                                     <h3 className="font-bold text-lg">{deviceState.model}</h3>
                                     <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                         <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                                                <path fillRule="evenodd" d="M3.75 3a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 013.75 3zM8 3a.75.75 0 01.75.75v9.5a.75.75 0 01-1.5 0v-9.5A.75.75 0 018 3zm4.25 0a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0v-12.5a.75.75 0 01.75-.75zm4.25 0a.75.75 0 01.75.75v15.5a.75.75 0 01-1.5 0v-15.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                            </svg>
                                            信号{deviceState.signalStrength === 'strong' ? '极佳' : '一般'}
                                         </span>
                                         <span>·</span>
                                         <span>电量 {deviceState.battery}%</span>
                                     </div>
                                 </div>
                                 <div className="bg-white/10 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 </div>
                             </div>
                             
                             {/* Detailed Metrics */}
                             <div className="grid grid-cols-2 gap-3 mt-6">
                                 <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                     <div className="text-xs text-slate-400 mb-1">同步频率</div>
                                     <div className="font-bold text-lg">{deviceState.syncFrequency}</div>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                     <div className="text-xs text-slate-400 mb-1">今日心率</div>
                                     <div className="font-bold text-lg">72 <span className="text-xs font-normal opacity-70">bpm</span></div>
                                 </div>
                             </div>

                             {/* Active Alerts */}
                             {deviceState.activeAlerts && deviceState.activeAlerts.length > 0 && (
                                 <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-2 animate-pulse">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                                     <span className="text-sm font-bold text-red-100">{deviceState.activeAlerts.join(', ')}</span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                {/* 2. Medication Adherence (Medical Core) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">今日服药计划</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${notificationPermission === 'granted' ? 'text-green-600' : 'text-slate-400'}`}>
                                {notificationPermission === 'granted' ? '按时提醒开启' : '开启服药提醒'}
                            </span>
                            <button 
                                onClick={enableNotifications} 
                                className={`w-10 h-5 rounded-full transition-colors relative ${notificationPermission === 'granted' ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${notificationPermission === 'granted' ? 'left-5' : 'left-0.5'}`}></span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Add Med Form */}
                    {showAddMed && (
                        <div className="p-4 bg-slate-50 border-b border-slate-100 animate-slide-up">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input type="text" placeholder="药物名称" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                                <input type="text" placeholder="剂量" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                            </div>
                            <div className="flex gap-3">
                                <input type="time" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex-1" />
                                <Button size="sm" onClick={handleAddMedSubmit}>添加</Button>
                                <Button size="sm" variant="outline" onClick={() => setShowAddMed(false)}>取消</Button>
                            </div>
                        </div>
                    )}

                    <div className="p-4 space-y-3">
                         {/* Empty State */}
                         {meds.length === 0 && (
                             <div className="text-center py-6 text-slate-400 text-sm">
                                 暂无服药计划，请点击右上角添加
                             </div>
                         )}

                         {meds.map(med => (
                             <div key={med.id} className="flex items-center justify-between group">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${med.taken ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                         {med.taken ? '✓' : med.time.split(':')[0]}
                                     </div>
                                     <div>
                                         <div className={`text-sm font-bold ${med.taken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{med.name}</div>
                                         <div className="text-xs text-slate-400">{med.dosage} · {med.time}</div>
                                     </div>
                                 </div>
                                 <Button 
                                    size="sm" 
                                    variant={med.taken ? "ghost" : "outline"} 
                                    onClick={() => toggleMed(med.id)}
                                    className={med.taken ? "opacity-50" : ""}
                                >
                                     {med.taken ? '已服' : '打卡'}
                                 </Button>
                             </div>
                         ))}
                         
                         {!showAddMed && (
                            <button 
                                onClick={() => setShowAddMed(true)}
                                className="w-full py-2 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:bg-slate-50 transition-colors mt-2"
                            >
                                + 添加新药物
                            </button>
                         )}
                    </div>
                </div>

                <CommercialPaymentModal 
                    visible={showPay} 
                    pkg={PACKAGES.EPILEPSY}
                    onClose={() => setShowPay(false)}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </Layout>
    );
};

// --- SUB-MODULE 3: COGNITIVE TRAINING (AD Member) ---

export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [playingGame, setPlayingGame] = useState<'memory' | 'attention' | null>(null);

    // Mock completing a game
    const handleGameComplete = () => {
        setPlayingGame(null);
        alert('训练完成！');
    };

    if (playingGame === 'memory') return <VisualMemoryGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;
    if (playingGame === 'attention') return <AttentionGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;

    return (
        <Layout headerTitle="认知康复训练" showBack onBack={onBack}>
            <div className="p-4 space-y-6">
                {/* 1. Prescription Header */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                         <div>
                             <h3 className="font-bold text-slate-800">今日训练处方</h3>
                             <p className="text-xs text-slate-500 mt-1">根据 AD8 筛查结果定制</p>
                         </div>
                         <div className="text-right">
                             <div className="text-2xl font-bold text-brand-600">72</div>
                             <div className="text-[10px] text-slate-400">脑健康指数</div>
                         </div>
                    </div>
                    {/* Progress */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-500 w-1/3 h-full rounded-full"></div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 text-right">已完成 1/3</div>
                </div>

                {/* 2. Task List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700">推荐任务</h4>
                    
                    {/* Free Task */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 hover:border-brand-200 transition-colors">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-xl">🧩</div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 text-sm">空间记忆训练</div>
                            <div className="text-xs text-slate-500">激活海马体功能</div>
                        </div>
                        <Button size="sm" onClick={() => setPlayingGame('memory')}>开始</Button>
                    </div>

                    {/* VIP Tasks */}
                    <div 
                        onClick={() => !isVip && setShowPay(true)}
                        className={`bg-white p-4 rounded-xl border flex items-center gap-4 transition-all relative overflow-hidden
                        ${isVip ? 'border-slate-100 hover:border-brand-200' : 'border-slate-100 opacity-90'}`}
                    >
                        {!isVip && (
                            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-end px-4 backdrop-blur-[1px]">
                                <div className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                    会员解锁
                                </div>
                            </div>
                        )}
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-xl">👁️</div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 text-sm">舒尔特方格 (进阶)</div>
                            <div className="text-xs text-slate-500">提升专注力与抗干扰</div>
                        </div>
                        <Button size="sm" variant={isVip ? 'primary' : 'outline'} onClick={() => isVip && setPlayingGame('attention')}>
                            {isVip ? '开始' : '解锁'}
                        </Button>
                    </div>
                </div>

                {/* 3. Expert Follow-up Card (The 365 value prop) */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">专家远程随访</h4>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                         <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-xl shadow-sm">👨‍⚕️</div>
                         <div className="flex-1">
                             <div className="font-bold text-slate-800 text-sm">季度认知能力复评</div>
                             <div className="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
                                 由华西专家团队定期通过视频连线，评估认知下降情况并调整训练处方。
                             </div>
                             {isVip ? (
                                 <div className="text-xs text-brand-600 bg-white px-3 py-1.5 rounded-lg inline-block font-medium border border-brand-100">
                                     下次随访：2023-11-15
                                 </div>
                             ) : (
                                 <button onClick={() => setShowPay(true)} className="text-xs text-white bg-brand-600 px-3 py-1.5 rounded-lg font-medium shadow-sm shadow-brand-200">
                                     开通会员权益 (¥365/年)
                                 </button>
                             )}
                         </div>
                    </div>
                </div>

                <CommercialPaymentModal 
                    visible={showPay} 
                    pkg={PACKAGES.COGNITIVE}
                    onClose={() => setShowPay(false)}
                    onSuccess={() => setIsVip(true)}
                />
            </div>
        </Layout>
    );
};

// --- SUB-MODULE 4: FAMILY CARE (Account Management) ---

export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [members, setMembers] = useState<FamilyMember[]>([
        { 
            id: '1', name: '陈建国', relation: '父亲', age: 68, condition: '癫痫守护中', lastUpdate: '10分钟前', deviceStatus: 'online',
            alertSettings: { lowBattery: true, seizureDetected: true, deviceOffline: false }
        },
        { 
            id: '2', name: '李素芬', relation: '母亲', age: 65, condition: '健康', lastUpdate: '3天前', deviceStatus: undefined,
            alertSettings: { lowBattery: true, seizureDetected: true, deviceOffline: true }
        }
    ]);
    const [showPay, setShowPay] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [settingMemberId, setSettingMemberId] = useState<string | null>(null);

    const handlePayForMember = (id: string) => {
        setSelectedMember(id);
        setShowPay(true);
    };

    const toggleAlertSetting = (memberId: string, key: keyof FamilyMember['alertSettings']) => {
        setMembers(members.map(m => {
            if (m.id === memberId && m.alertSettings) {
                return {
                    ...m,
                    alertSettings: {
                        ...m.alertSettings,
                        [key]: !m.alertSettings[key as keyof typeof m.alertSettings]
                    }
                }
            }
            return m;
        }));
    };

    return (
        <Layout headerTitle="亲情账号" showBack onBack={onBack}>
            <div className="p-4 space-y-6">
                {/* 1. Member List */}
                <div className="space-y-4">
                    {members.map(member => (
                        <div key={member.id} className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 relative overflow-hidden transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-lg">
                                        {member.relation[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            {member.name}
                                            {member.deviceStatus === 'online' && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="设备在线"></span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{member.age}岁 · {member.condition}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-xs text-slate-400">{member.lastUpdate}</div>
                                    <button 
                                        onClick={() => setSettingMemberId(settingMemberId === member.id ? null : member.id)}
                                        className="text-slate-400 hover:text-brand-600 p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.042 7.042 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Alert Configuration Panel */}
                            {settingMemberId === member.id && member.alertSettings && (
                                <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 animate-slide-up">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">报警通知设置</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-700">异常发作报警</span>
                                            <button 
                                                onClick={() => toggleAlertSetting(member.id, 'seizureDetected')}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${member.alertSettings.seizureDetected ? 'bg-red-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${member.alertSettings.seizureDetected ? 'left-5' : 'left-0.5'}`}></span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-700">设备低电量</span>
                                            <button 
                                                onClick={() => toggleAlertSetting(member.id, 'lowBattery')}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${member.alertSettings.lowBattery ? 'bg-brand-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${member.alertSettings.lowBattery ? 'left-5' : 'left-0.5'}`}></span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-700">设备离线</span>
                                            <button 
                                                onClick={() => toggleAlertSetting(member.id, 'deviceOffline')}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${member.alertSettings.deviceOffline ? 'bg-brand-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${member.alertSettings.deviceOffline ? 'left-5' : 'left-0.5'}`}></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status or Pay Action */}
                            {member.condition.includes('癫痫') ? (
                                <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center border border-green-100">
                                    <div className="text-xs text-green-700">
                                        <span className="font-bold">生命守护包</span> 生效中
                                    </div>
                                    <button className="text-xs bg-white text-green-600 px-3 py-1 rounded border border-green-200">查看监测数据</button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                                    <div className="text-xs text-slate-500">
                                        未开通任何专病服务
                                    </div>
                                    <button 
                                        onClick={() => handlePayForMember(member.id)}
                                        className="text-xs bg-brand-600 text-white px-3 py-1 rounded shadow-sm shadow-brand-200"
                                    >
                                        代付开通
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 2. Add Member */}
                <button className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    绑定新成员
                </button>

                {/* 3. Safety Note */}
                <div className="bg-orange-50 p-4 rounded-xl text-xs text-orange-800 border border-orange-100 leading-relaxed">
                    <strong>亲情看护权限：</strong> 作为监护人，您可代为接收异常报警推送（如跌倒、发作），并管理家人的设备租赁订单。
                </div>

                {/* Reuse payment modal, defaulting to Epilepsy for demo */}
                <CommercialPaymentModal 
                    visible={showPay} 
                    pkg={PACKAGES.EPILEPSY}
                    onClose={() => setShowPay(false)}
                    onSuccess={() => alert('代付成功，请完善家人收货信息')}
                />
            </div>
        </Layout>
    );
};
