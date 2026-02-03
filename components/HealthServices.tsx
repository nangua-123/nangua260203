
import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import Button from './Button';
import { TrainingRecord, HeadacheLog, MedicationTask, FamilyMember, SeizureLog, DeviceInfo, DiseaseType } from '../types';
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
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服务周期: {pkg.duration}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-slate-900">¥</span>
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                            </div>
                        </div>

                        <Button fullWidth onClick={handlePay} className="shadow-xl shadow-brand-500/20 py-5 text-[13px] tracking-widest">
                            确认开启会员权益
                        </Button>
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
 * 专病子模块: 偏头痛管理 
 */
export const HeadacheServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'log' | 'analysis'>('log');
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    
    const [logs] = useState<HeadacheLog[]>([
        { id: '1', startTime: '10/24 14:00', durationHours: 4, painLevel: 7, nature: ['跳痛'], triggers: ['睡眠不足'], medication: '布洛芬', medicationEffect: 'effective' },
        { id: '2', startTime: '10/22 09:30', durationHours: 2, painLevel: 5, nature: ['胀痛'], triggers: ['天气变化'], medication: '阿米替林', medicationEffect: 'none' },
        { id: '3', startTime: '10/20 18:00', durationHours: 3, painLevel: 8, nature: ['刺痛'], triggers: ['工作压力'], medication: '布洛芬', medicationEffect: 'partial' },
        { id: '4', startTime: '10/18 20:00', durationHours: 5, painLevel: 6, nature: ['胀痛'], triggers: ['亮光刺激'], medication: '布洛芬', medicationEffect: 'effective' },
    ]);

    // MOH (药物过度使用性头痛) 预警系统
    // 如果过去30天内（此处模拟逻辑为记录中布洛芬摄入次数过多）
    const ibuCount = logs.filter(l => l.medication === '布洛芬').length;
    const isMOHRisk = ibuCount >= 3; 

    return (
        <Layout headerTitle="偏头痛管理" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto">
                {/* MOH 预警 */}
                {isMOHRisk && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm">
                        <div className="text-red-500 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h4 className="text-red-800 font-black text-sm uppercase tracking-tight">药物过度使用性头痛 (MOH) 风险</h4>
                            <p className="text-red-700 text-[11px] font-bold mt-1 leading-relaxed">
                                系统监测到您近期服用止痛药（布洛芬）频率较高。频繁用药可能诱发药物过度使用性头痛。强烈建议咨询华西专家，探讨预防性治疗方案。
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex bg-slate-100 p-1 rounded-2xl mb-2">
                    <button onClick={() => setActiveTab('log')} className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all ${activeTab === 'log' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>发作日志</button>
                    <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>诱因与复核</button>
                </div>

                {activeTab === 'log' ? (
                    <div className="space-y-4 animate-slide-up">
                        <div className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-50">
                             <div className="flex justify-between items-center mb-5">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">近期记录趋势</h3>
                                <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{logs.length} 次发作</span>
                             </div>
                             <div className="flex gap-1.5 h-16 items-end border-b border-slate-50 pb-3 mb-4">
                                 {[0,3,0,5,0,0,7,2,0,4,6,0,3].map((v, i) => (
                                     <div key={i} className={`flex-1 rounded-t-lg transition-all ${v > 0 ? 'bg-brand-500' : 'bg-slate-100'}`} style={{height: v ? `${v*12}%` : '15%'}}></div>
                                 ))}
                             </div>
                             <Button fullWidth size="sm" className="shadow-none min-h-[48px] text-[11px] tracking-widest">新增一次发作记录</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm">
                                    <div className="flex justify-between mb-3 items-center">
                                        <span className="font-black text-slate-800 text-[13px]">{log.startTime}</span>
                                        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">VAS 评分 {log.painLevel}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-white">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">主要诱因</span>
                                            <span className="text-[11px] font-bold text-slate-600">{log.triggers[0]}</span>
                                        </div>
                                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-white">
                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">缓解评价</span>
                                            <span className="text-[11px] font-bold text-slate-600">{log.medicationEffect === 'effective' ? '显著缓解' : '效果不明显'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-up">
                        <div className="bg-white rounded-[32px] border border-slate-50 shadow-soft overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
                                        <span className="text-xl">🧬</span> AI 诱因预测雷达
                                    </h3>
                                    {isVip && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">专家级</span>}
                                </div>
                                {isVip ? (
                                    <div className="space-y-4">
                                        <div className="h-32 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            [ 关联度热力模型计算中... ]
                                        </div>
                                        <p className="text-[11px] text-slate-600 bg-brand-50/50 p-4 rounded-2xl border border-brand-100 leading-relaxed font-bold">
                                            <strong>系统提示：</strong> 检测到近两周发作频率与“睡眠时长”波动呈高度相关。
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="filter blur-sm opacity-40 select-none space-y-4">
                                            <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                                            <div className="h-32 bg-slate-100 rounded-[24px]"></div>
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-widest">订阅会员解锁完整诱因雷达</p>
                                            <Button size="sm" onClick={() => setShowPay(true)} className="shadow-none">立即开启</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden active:scale-[0.98] transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-3xl"></div>
                            <h3 className="font-black text-base mb-2">华西专家影像复核</h3>
                            <p className="text-[10px] text-slate-400 mb-5 leading-relaxed font-bold uppercase tracking-widest">
                                神经内科专家团队人工阅片确认临床建议书
                            </p>
                            <Button fullWidth className="bg-white text-slate-900 border-none shadow-none font-black min-h-[48px]">
                                {isVip ? '上传影像胶片' : '获取复核权益 (¥299/年)'}
                            </Button>
                        </div>
                    </div>
                )}
                
                <CommercialPaymentModal visible={showPay} pkg={PACKAGES.MIGRAINE} onClose={() => setShowPay(false)} onSuccess={() => setIsVip(true)} />
            </div>
        </Layout>
    );
};

/** 
 * 专病子模块: 癫痫生命守护 
 */
export const EpilepsyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [deviceState, setDeviceState] = useState<DeviceInfo>({
        id: '', status: 'unbound', battery: 0, lastSync: '', model: '', signalStrength: 'weak', syncFrequency: '5分钟', activeAlerts: []
    });
    const [meds, setMeds] = useState<MedicationTask[]>([
        { id: '1', name: '丙戊酸钠缓释片', dosage: '500mg', time: '08:00', taken: true, takenTime: '08:05' },
        { id: '2', name: '左乙拉西坦片', dosage: '250mg', time: '08:00', taken: false },
        { id: '3', name: '丙戊酸钠缓释片', dosage: '500mg', time: '20:00', taken: false },
    ]);
    const [showPay, setShowPay] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    
    const handleActivate = () => {
        setIsActivating(true);
        setTimeout(() => {
            setDeviceState({
                id: 'WCH-G-001', 
                status: 'active', 
                battery: 92, 
                lastSync: '刚刚',
                model: '华西生命守护手环 Pro', 
                signalStrength: 'strong', 
                syncFrequency: '10秒',
                activeAlerts: ['低电量预警'],
                wearingQuality: 98
            });
            setIsActivating(false);
        }, 1500);
    };

    const toggleTaken = (id: string) => {
        setMeds(meds.map(m => m.id === id ? { 
            ...m, 
            taken: !m.taken, 
            takenTime: !m.taken ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined 
        } : m));
    };

    return (
        <Layout headerTitle="癫痫生命守护" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto pb-20">
                {/* 增强型智能监护状态栏 */}
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
                    {deviceState.status === 'unbound' ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-5 border border-white/5 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-black mb-2">未开启实时生命监护</h3>
                            <p className="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-[0.2em]">硬件即服务 (HaaS) 模式</p>
                            <Button fullWidth onClick={() => setShowPay(true)} className="bg-gradient-to-r from-brand-600 to-brand-500 border-none shadow-lg shadow-brand-500/20 py-4">
                                开启守护包 (¥599/年)
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-slide-up space-y-4">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <div className="flex items-center gap-2 mb-2">
                                         <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                         </span>
                                         <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">监护运行中</span>
                                     </div>
                                     <h3 className="font-black text-lg">{deviceState.model}</h3>
                                     <div className="flex items-center gap-3 mt-1">
                                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">电量: {deviceState.battery}%</div>
                                         <div className="w-[1.5px] h-2 bg-slate-700"></div>
                                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">信号: {deviceState.signalStrength === 'strong' ? '极佳' : '一般'}</div>
                                     </div>
                                 </div>
                                 <div className="bg-white/10 p-3 rounded-2xl border border-white/5 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 </div>
                             </div>

                             {/* 详细连接状态 */}
                             <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                                 <div className="flex justify-between items-center text-[10px] font-bold">
                                     <span className="text-slate-500">同步频率</span>
                                     <span className="text-white">{deviceState.syncFrequency} / 周期</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] font-bold">
                                     <span className="text-slate-500">佩戴质量评分</span>
                                     <span className="text-emerald-400">{deviceState.wearingQuality}%</span>
                                 </div>
                                 {deviceState.activeAlerts && deviceState.activeAlerts.length > 0 && (
                                     <div className="pt-2 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                                         {deviceState.activeAlerts.map((alert, i) => (
                                             <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase tracking-tighter border border-red-500/20 whitespace-nowrap">
                                                 ● {alert}
                                             </span>
                                         ))}
                                     </div>
                                 )}
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-sm">
                                     <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">平均心率</div>
                                     <div className="font-black text-2xl">76 <span className="text-[10px] font-bold opacity-40">BPM</span></div>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-sm">
                                     <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">上次同步</div>
                                     <div className="font-black text-base mt-1">{deviceState.lastSync}</div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* 紧致型服药打卡与提醒 */}
                <div className="bg-white rounded-[32px] shadow-soft border border-slate-50 overflow-hidden">
                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm tracking-tight">今日服药计划</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{width: `${(meds.filter(m=>m.taken).length / meds.length) * 100}%`}}></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                    {meds.filter(m=>m.taken).length}/{meds.length} 已服
                                </span>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-brand-500 bg-white border border-brand-100 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all">提醒设置</button>
                    </div>
                    <div className="p-6 relative">
                        <div className="absolute left-9 top-10 bottom-10 w-[1.5px] bg-slate-100"></div>
                        <div className="space-y-6">
                            {meds.map(med => (
                                <div key={med.id} className="flex items-center gap-5 relative z-10 group">
                                    <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm shrink-0 transition-all ${med.taken ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-slate-400 font-mono mb-0.5">{med.time}</div>
                                        <div className={`text-[13px] font-black truncate transition-colors ${med.taken ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                                            {med.name}
                                        </div>
                                        {med.taken && <div className="text-[9px] text-emerald-500 font-bold mt-0.5 tracking-tighter">确认于 {med.takenTime}</div>}
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant={med.taken ? "ghost" : "outline"} 
                                        className={`min-w-[64px] min-h-[36px] px-0 text-[11px] ${med.taken ? 'text-emerald-500' : 'text-brand-500 border-brand-100'}`}
                                        onClick={() => toggleTaken(med.id)}
                                    >
                                        {med.taken ? '已撤销' : '打卡'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:text-brand-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="text-sm">+</span> 添加新的服药提醒
                        </button>
                    </div>
                </div>
                
                <div className="pt-4 opacity-30 flex flex-col items-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.5em]">华西生命守护系统</div>
                </div>

                <CommercialPaymentModal visible={showPay} pkg={PACKAGES.EPILEPSY} onClose={() => setShowPay(false)} onSuccess={handleActivate} />
            </div>
        </Layout>
    );
};

/** 
 * 专病子模块: 亲情账号 (可配置报警)
 */
export const FamilyServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [members, setMembers] = useState<FamilyMember[]>([
        { 
            id: 'f1', name: '陈大强', relation: '父亲', age: 72, condition: '癫痫守护中', lastUpdate: '10分钟前', deviceStatus: 'online',
            alertSettings: { seizureDetected: true, lowBattery: true, deviceOffline: false }
        },
        { 
            id: 'f2', name: '王淑芬', relation: '母亲', age: 68, condition: '健康关注', lastUpdate: '3天前', deviceStatus: 'offline',
            alertSettings: { seizureDetected: false, lowBattery: false, deviceOffline: true }
        }
    ]);

    const toggleAlert = (memberId: string, setting: keyof FamilyMember['alertSettings']) => {
        setMembers(prev => prev.map(m => {
            if (m.id === memberId && m.alertSettings) {
                return {
                    ...m,
                    alertSettings: {
                        ...m.alertSettings,
                        [setting]: !m.alertSettings[setting]
                    }
                };
            }
            return m;
        }));
    };

    return (
        <Layout headerTitle="亲情账号" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto pb-20">
                <div className="space-y-4">
                    {members.map(member => (
                        <div key={member.id} className="bg-white rounded-[32px] p-6 shadow-soft border border-slate-50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center text-2xl border border-slate-50 shadow-inner">
                                    {member.relation === '父亲' ? '👨‍🦳' : '👩‍🦳'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-900 text-[15px]">{member.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.relation} · {member.age}岁</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${member.deviceStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    </div>
                                </div>
                                <button className="text-[10px] font-black text-slate-300 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">管理</button>
                            </div>

                            {/* 报警设置区块 */}
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-white space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-600">发作异常报警</span>
                                    <button 
                                        onClick={() => toggleAlert(member.id, 'seizureDetected')}
                                        className={`w-10 h-6 rounded-full transition-colors relative shadow-inner ${member.alertSettings?.seizureDetected ? 'bg-brand-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${member.alertSettings?.seizureDetected ? 'left-5' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-600">低电量提醒</span>
                                    <button 
                                        onClick={() => toggleAlert(member.id, 'lowBattery')}
                                        className={`w-10 h-6 rounded-full transition-colors relative shadow-inner ${member.alertSettings?.lowBattery ? 'bg-brand-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${member.alertSettings?.lowBattery ? 'left-5' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-600">设备离线提醒</span>
                                    <button 
                                        onClick={() => toggleAlert(member.id, 'deviceOffline')}
                                        className={`w-10 h-6 rounded-full transition-colors relative shadow-inner ${member.alertSettings?.deviceOffline ? 'bg-brand-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${member.alertSettings?.deviceOffline ? 'left-5' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                上次活跃：{member.lastUpdate}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[32px] text-[11px] font-black text-slate-400 hover:text-brand-500 hover:border-brand-200 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <span className="text-xl">+</span> 绑定新家庭成员
                </button>
            </div>
        </Layout>
    );
};

/** 
 * 专病子模块: 认知康复训练 
 */
export const CognitiveServiceView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isVip, setIsVip] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [playingGame, setPlayingGame] = useState<'memory' | 'attention' | null>(null);

    const handleGameComplete = () => {
        setPlayingGame(null);
    };

    if (playingGame === 'memory') return <VisualMemoryGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;
    if (playingGame === 'attention') return <AttentionGame onComplete={handleGameComplete} onExit={() => setPlayingGame(null)} />;

    return (
        <Layout headerTitle="认知康复训练" showBack onBack={onBack}>
            <div className="p-5 space-y-5 max-w-[430px] mx-auto pb-20">
                {/* 训练处方状态栏 */}
                <div className="bg-white p-6 rounded-[32px] shadow-soft border border-slate-50 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                         <div>
                             <h3 className="font-black text-slate-900 text-sm tracking-tight">今日训练处方</h3>
                             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">华西大脑养护计划</p>
                         </div>
                         <div className="text-right flex flex-col items-end">
                             <div className="text-3xl font-black text-brand-500 tracking-tighter">72</div>
                             <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">脑健康指数</div>
                         </div>
                    </div>
                    {/* 双栏关键指标 */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-white shadow-sm">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1.5">
                                <span>今日已完成</span>
                                <span className="text-brand-500">1/3</span>
                            </div>
                            <div className="w-full bg-white h-1 rounded-full overflow-hidden">
                                <div className="bg-brand-500 w-1/3 h-full"></div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-white shadow-sm">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1.5">
                                <span>建议时长</span>
                                <span className="text-brand-500">15 分钟</span>
                            </div>
                            <div className="w-full bg-white h-1 rounded-full overflow-hidden">
                                <div className="bg-brand-500 w-full h-full opacity-30"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-[28px] border border-slate-50 shadow-sm flex items-center gap-4 active:bg-slate-50 transition-colors group">
                        <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-2xl border border-purple-100 shadow-inner group-active:scale-95 transition-transform">🧩</div>
                        <div className="flex-1">
                            <div className="font-black text-slate-900 text-[13px] tracking-tight">视觉空间记忆</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">激活：海马体功能</div>
                        </div>
                        <Button size="sm" onClick={() => setPlayingGame('memory')} className="min-h-[40px] px-6">去训练</Button>
                    </div>

                    <div onClick={() => !isVip && setShowPay(true)} className={`bg-white p-4 rounded-[28px] border border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden transition-all ${!isVip && 'opacity-70 grayscale'}`}>
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl border border-orange-100 shadow-inner">👁️</div>
                        <div className="flex-1">
                            <div className="font-black text-slate-900 text-[13px] tracking-tight">舒尔特专注力</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">会员：进阶模式</div>
                        </div>
                        {!isVip && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg border border-brand-100 uppercase tracking-widest">解锁</div>}
                        {isVip && <Button size="sm" onClick={() => setPlayingGame('attention')} className="min-h-[40px] px-6">去训练</Button>}
                    </div>
                </div>

                <div className="bg-brand-50/50 rounded-[32px] p-6 border border-brand-100 relative group active:scale-[0.98] transition-all shadow-sm">
                     <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl border border-brand-100 shadow-sm group-hover:rotate-6 transition-transform">👨‍⚕️</div>
                         <div className="flex-1">
                             <div className="font-black text-slate-900 text-[13px] tracking-tight">季度专家远程随访评估</div>
                             <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed uppercase tracking-wider">
                                 由华西专家团队定期连线进行认知筛查与康复处方微调
                             </p>
                             <button onClick={() => setShowPay(true)} className="mt-4 text-[10px] font-black text-white bg-brand-600 px-4 py-2 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                                 {isVip ? '预约下次随访' : '开通随访权益'}
                             </button>
                         </div>
                     </div>
                </div>

                <CommercialPaymentModal visible={showPay} pkg={PACKAGES.COGNITIVE} onClose={() => setShowPay(false)} onSuccess={() => setIsVip(true)} />
            </div>
        </Layout>
    );
};
