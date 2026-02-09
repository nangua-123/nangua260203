
/**
 * @file HomeView.tsx
 * @description 应用首页 (Dashboard)
 * 
 * 视觉架构:
 * 1. 沉浸式顶栏 (Immersion Header): 展示用户信息、健康分环及会员状态。
 * 2. 金刚区 (King Kong District): 4个核心功能入口 (问诊/报告/家庭/设备)。
 * 3. 信息流 (Feed): 包含风险预警、智能推荐卡片及专病管理入口。
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, AppView, DiseaseType, IoTStats, CognitiveStats, UserRole, FamilyMember } from '../types';
import Button from '../components/common/Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext'; // [NEW]
import { NonDrugToolkit } from '../components/business/headache/NonDrugToolkit';
import { useRole } from '../hooks/useRole';

// Declare Chart.js type for TypeScript
declare const Chart: any;

interface HomeViewProps {
  user: User;
  riskScore: number;
  hasDevice: boolean;
  onNavigate: (view: AppView) => void;
  primaryCondition: DiseaseType | null;
}

// [NEW] Bluetooth Pairing Modal
const BluetoothPairingModal: React.FC<{ onClose: () => void; onConnected: () => void }> = ({ onClose, onConnected }) => {
    const [step, setStep] = useState<'scanning' | 'list' | 'connecting'>('scanning');
    const [foundDevices, setFoundDevices] = useState<{id: string, name: string, signal: number}[]>([]);

    useEffect(() => {
        if (step === 'scanning') {
            const timer = setTimeout(() => {
                setFoundDevices([
                    { id: 'dev_01', name: 'Neuro-Link 癫痫监测贴', signal: -45 },
                    { id: 'dev_02', name: 'Cogni-Band 认知头带', signal: -68 }
                ]);
                setStep('list');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleConnect = () => {
        setStep('connecting');
        setTimeout(() => {
            onConnected();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up max-w-[430px] mx-auto min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">
                        {step === 'scanning' ? '正在搜索设备...' : step === 'list' ? '发现可用设备' : '正在建立连接'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
                </div>

                {step === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="relative">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl text-[#1677FF] relative z-10">
                                📡
                            </div>
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute -inset-4 bg-blue-500 rounded-full animate-pulse opacity-10"></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-6 font-bold">请确保设备已开机并靠近手机</p>
                    </div>
                )}

                {step === 'list' && (
                    <div className="space-y-3">
                        {foundDevices.map(dev => (
                            <div key={dev.id} onClick={handleConnect} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">
                                        ⌚
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800">{dev.name}</div>
                                        <div className="text-[10px] text-emerald-500 font-bold">信号强度: 极佳</div>
                                    </div>
                                </div>
                                <Button size="sm" className="h-8 px-4 text-[10px]">连接</Button>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'connecting' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#1677FF] rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-black text-slate-800">正在握手...</p>
                        <p className="text-xs text-slate-400 mt-1">正在同步历史监测数据</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// [NEW] Cognitive Radar Chart Card
const CognitiveRadarCard: React.FC<{ stats?: CognitiveStats; onClick: () => void; isElderly: boolean }> = ({ stats, onClick, isElderly }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || typeof Chart === 'undefined') return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy previous instance
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Data Prep
        const dataValues = [
            stats?.dimensionStats?.memory || 60,
            stats?.dimensionStats?.attention || 60,
            stats?.dimensionStats?.reaction || 60,
            stats?.dimensionStats?.stability || 60,
            stats?.dimensionStats?.flexibility || 60
        ];

        // Chart Config
        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['记忆', '专注', '反应', '稳定', '灵活'],
                datasets: [{
                    label: '今日脑力值',
                    data: dataValues,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)', // Purple-500 alpha 0.2
                    borderColor: 'rgba(139, 92, 246, 1)',     // Purple-500
                    pointBackgroundColor: 'rgba(139, 92, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false, stepSize: 20 },
                        pointLabels: {
                            font: { size: isElderly ? 14 : 10, weight: 'bold' },
                            color: '#64748B' // slate-500
                        },
                        grid: { color: '#E2E8F0' }, // slate-200
                        angleLines: { color: '#E2E8F0' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false } // Disable tooltip for cleaner view on mobile
                },
                animation: { duration: 1000 }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats, isElderly]);

    return (
        <div onClick={onClick} className={`bg-white border border-purple-100 rounded-2xl p-4 shadow-sm mb-3 active:scale-[0.99] transition-transform relative overflow-hidden group flex justify-between items-center ${isElderly ? 'min-h-[160px]' : 'min-h-[140px]'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -translate-y-10 translate-x-10 opacity-60 pointer-events-none"></div>
            
            <div className="flex-1 z-10 pr-2">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🧠</span>
                    <div>
                        <h4 className={`text-slate-800 leading-tight ${isElderly ? 'text-lg font-black' : 'text-sm font-black'}`}>今日大脑雷达</h4>
                        <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block">多维度精准评估</span>
                    </div>
                </div>
                <div className="space-y-1 mt-2">
                    <p className={`text-slate-500 font-bold ${isElderly ? 'text-sm' : 'text-xs'}`}>
                        上次评分: <span className="text-purple-600 font-black">{stats?.lastScore || 0}</span>
                    </p>
                    <p className="text-[9px] text-slate-400">
                        今日已训练: {stats?.todayDuration || 0} min
                    </p>
                </div>
                <button className={`mt-3 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-500/30 active:scale-95 transition-all ${isElderly ? 'px-6 py-2.5 text-sm font-bold' : 'px-4 py-1.5 text-xs font-bold'}`}>
                    开始训练
                </button>
            </div>

            {/* Chart Area */}
            <div className="relative w-32 h-32 shrink-0">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

// [NEW] Assistant Patient Card Component with Risk Logic
const AssistantPatientCard: React.FC<{ patient: FamilyMember; onAction: (p: FamilyMember, type: 'call' | 'remind' | 'view') => void }> = ({ patient, onAction }) => {
    // 风险计算器 (Risk Logic)
    const getRiskLevel = (p: FamilyMember) => {
        // High Risk: Fall detected OR Med overdose (>=3 logs in 24h)
        const isFall = p.iotStats?.isFallDetected;
        const recentMeds = p.medicationLogs?.filter(l => Date.now() - l.timestamp < 24*60*60*1000).length || 0;
        if (isFall || recentMeds >= 3) return { level: 'HIGH', reason: isFall ? '跌倒监测触发' : '药物过量风险' };
        
        // Medium Risk: Low Duration (<10m) OR Abnormal Heart Rate
        const duration = p.cognitiveStats?.todayDuration || 0;
        const isHrAbnormal = p.iotStats?.isAbnormal;
        if (duration < 10) return { level: 'MEDIUM', reason: '时长不足' };
        if (isHrAbnormal) return { level: 'MEDIUM', reason: '心率异常' };
        
        return { level: 'LOW', reason: '状态平稳' };
    };

    const { level, reason } = getRiskLevel(patient);

    const getTheme = () => {
        switch (level) {
            case 'HIGH': return { border: 'border-red-500 ring-4 ring-red-50 animate-pulse', bg: 'bg-red-50', text: 'text-red-600', icon: '🚨' };
            case 'MEDIUM': return { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', icon: '⚠️' };
            default: return { border: 'border-slate-100', bg: 'bg-white', text: 'text-emerald-600', icon: '✅' };
        }
    };

    const theme = getTheme();

    return (
        <div className={`rounded-2xl p-4 shadow-sm border mb-3 flex flex-col gap-3 transition-all ${theme.border} ${theme.bg}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100 relative">
                        {patient.avatar}
                        {level !== 'LOW' && (
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-xs">{theme.icon}</span>
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800">{patient.name}</h4>
                            <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">{patient.relation}</span>
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${theme.text}`}>
                            {reason} · HR: {patient.iotStats?.hr || '--'}
                        </p>
                    </div>
                </div>
                
                {level === 'HIGH' && (
                    <button 
                        onClick={() => onAction(patient, 'call')}
                        className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 animate-bounce"
                    >
                        立即呼叫
                    </button>
                )}
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/60 p-2 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500">今日训练</span>
                    <span className="font-bold text-slate-800">{patient.cognitiveStats?.todayDuration || 0} min</span>
                </div>
                <div className="bg-white/60 p-2 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500">上次服药</span>
                    <span className="font-bold text-slate-800">
                        {patient.medicationLogs?.[0] ? '2h 前' : '无记录'}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-1">
                <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth 
                    className="bg-white border-slate-200 h-8 text-[10px]"
                    onClick={() => onAction(patient, 'view')}
                >
                    查看档案
                </Button>
                {level !== 'HIGH' && (
                    <Button 
                        size="sm" 
                        fullWidth 
                        className={`h-8 text-[10px] ${level === 'MEDIUM' ? 'bg-amber-500' : 'bg-brand-600'}`}
                        onClick={() => onAction(patient, 'remind')}
                    >
                        {level === 'MEDIUM' ? '发送提醒' : '健康关怀'}
                    </Button>
                )}
            </div>
        </div>
    );
};

// --- Assistant Dashboard (Role_Based_View_Resolver Target) ---
const AssistantDashboard: React.FC<{ user: User }> = ({ user }) => {
    const { showToast } = useToast();
    
    // Mock Data Generator for Empty State
    const mockPatients: FamilyMember[] = useMemo(() => [
        {
            id: 'p_high_1',
            name: '张爷爷',
            relation: '社区签约',
            avatar: '👴',
            isElderly: true,
            iotStats: { hr: 45, hrStandardDeviation: 10, bpSys: 90, bpDia: 60, spo2: 92, isAbnormal: true, isFallDetected: true, lastUpdated: Date.now() },
            cognitiveStats: { totalSessions: 5, todaySessions: 0, todayDuration: 0, totalDuration: 100, lastScore: 0, aiRating: 'C', lastUpdated: Date.now(), dimensionStats: { memory: 40, attention: 40, reaction: 30, stability: 20, flexibility: 30 } },
            medicationLogs: []
        },
        {
            id: 'p_high_2',
            name: '李阿姨',
            relation: '重点关注',
            avatar: '👵',
            isElderly: true,
            iotStats: { hr: 80, hrStandardDeviation: 30, bpSys: 130, bpDia: 85, spo2: 98, isAbnormal: false, isFallDetected: false, lastUpdated: Date.now() },
            cognitiveStats: { totalSessions: 10, todaySessions: 1, todayDuration: 15, totalDuration: 300, lastScore: 75, aiRating: 'B', lastUpdated: Date.now(), dimensionStats: { memory: 70, attention: 70, reaction: 70, stability: 70, flexibility: 70 } },
            medicationLogs: [
                { id: 'm1', timestamp: Date.now() - 10000, drugName: '布洛芬', dosage: '1' },
                { id: 'm2', timestamp: Date.now() - 3600000, drugName: '布洛芬', dosage: '1' },
                { id: 'm3', timestamp: Date.now() - 7200000, drugName: '曲普坦', dosage: '1' },
                { id: 'm4', timestamp: Date.now() - 10800000, drugName: '布洛芬', dosage: '1' }
            ]
        },
        {
            id: 'p_med_1',
            name: '王叔叔',
            relation: '慢病随访',
            avatar: '👨',
            isElderly: false,
            iotStats: { hr: 115, hrStandardDeviation: 55, bpSys: 140, bpDia: 90, spo2: 97, isAbnormal: true, isFallDetected: false, lastUpdated: Date.now() },
            cognitiveStats: { totalSessions: 20, todaySessions: 1, todayDuration: 25, totalDuration: 500, lastScore: 85, aiRating: 'A', lastUpdated: Date.now(), dimensionStats: { memory: 80, attention: 80, reaction: 80, stability: 80, flexibility: 80 } },
            medicationLogs: []
        },
        {
            id: 'p_med_2',
            name: '赵小弟',
            relation: '康复期',
            avatar: '🧒',
            isElderly: false,
            iotStats: { hr: 70, hrStandardDeviation: 30, bpSys: 110, bpDia: 70, spo2: 99, isAbnormal: false, isFallDetected: false, lastUpdated: Date.now() },
            cognitiveStats: { totalSessions: 5, todaySessions: 0, todayDuration: 5, totalDuration: 100, lastScore: 60, aiRating: 'B', lastUpdated: Date.now(), dimensionStats: { memory: 60, attention: 60, reaction: 60, stability: 60, flexibility: 60 } },
            medicationLogs: []
        },
        {
            id: 'p_low_1',
            name: '刘女士',
            relation: '常规',
            avatar: '👩',
            isElderly: false,
            iotStats: { hr: 72, hrStandardDeviation: 35, bpSys: 115, bpDia: 75, spo2: 98, isAbnormal: false, isFallDetected: false, lastUpdated: Date.now() },
            cognitiveStats: { totalSessions: 50, todaySessions: 1, todayDuration: 20, totalDuration: 1000, lastScore: 90, aiRating: 'A', lastUpdated: Date.now(), dimensionStats: { memory: 90, attention: 90, reaction: 90, stability: 90, flexibility: 90 } },
            medicationLogs: [{ id: 'm_ok', timestamp: Date.now() - 3600000, drugName: '维C', dosage: '1' }]
        }
    ], []);

    // Merge User patients with Mock data if empty
    const patients = (user.familyMembers && user.familyMembers.length > 0) ? user.familyMembers : mockPatients;

    // Sorting Logic: High > Medium > Low
    const sortedPatients = useMemo(() => {
        const getScore = (p: FamilyMember) => {
            const isFall = p.iotStats?.isFallDetected;
            const recentMeds = p.medicationLogs?.filter(l => Date.now() - l.timestamp < 24*60*60*1000).length || 0;
            if (isFall || recentMeds >= 3) return 3; // HIGH
            
            const duration = p.cognitiveStats?.todayDuration || 0;
            const isHrAbnormal = p.iotStats?.isAbnormal;
            if (duration < 10 || isHrAbnormal) return 2; // MEDIUM
            
            return 1; // LOW
        };
        return [...patients].sort((a, b) => getScore(b) - getScore(a));
    }, [patients]);

    const handleAction = (p: FamilyMember, type: 'call' | 'remind' | 'view') => {
        if (type === 'call') {
            window.location.href = "tel:120";
        } else if (type === 'remind') {
            showToast(`已向 ${p.name} 发送强提示：请按时服药/训练`, 'success');
        } else {
            showToast(`正在打开 ${p.name} 的完整健康档案...`, 'info');
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F4F7] flex flex-col pb-safe">
            {/* Header */}
            <div className="bg-white px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 sticky top-0 z-20 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-black text-slate-900">医助工作台</h2>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold border border-indigo-100">
                        {user.assistantProof?.hospitalName || '华西协作医院'}
                    </span>
                </div>
                <p className="text-xs text-slate-500">待处理患者: {patients.length} 人 · <span className="text-red-500 font-bold">高危 {sortedPatients.filter(p => (p.iotStats?.isFallDetected || (p.medicationLogs?.length || 0) >= 3)).length} 人</span></p>
            </div>

            {/* List */}
            <div className="p-4 flex-1 overflow-y-auto">
                {sortedPatients.map(patient => (
                    <AssistantPatientCard 
                        key={patient.id} 
                        patient={patient} 
                        onAction={handleAction} 
                    />
                ))}
                
                <div className="text-center py-6">
                    <p className="text-[10px] text-slate-300">
                        数据同步于: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = ({ user, riskScore, hasDevice, onNavigate, primaryCondition }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast(); 
  const { checkPermission } = useRole(); 
  const { mohAlertTriggered } = state; 

  const [wavePath, setWavePath] = useState('');
  const { getRecommendedPackage, hasFeature } = usePayment();
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  // [UX Polish] Modals State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false); // [NEW] Pairing Modal
  
  // --- Elderly Mode Config ---
  const isElderly = user.isElderlyMode;
  const touchClass = isElderly ? 'min-h-[64px] py-3' : '';
  const textClass = isElderly ? 'font-black text-base' : 'font-bold text-[11px]';
  
  // --- IoT Simulation Logic ---
  const activeProfileId = user.currentProfileId || user.id;
  const isManagedView = user.role === UserRole.FAMILY && user.currentProfileId !== user.id;
  const managedPatient = isManagedView ? user.familyMembers?.find(m => m.id === user.currentProfileId) : null;

  // 获取当前选中 Profile 的设备数据
  const currentIoTStats = useMemo(() => {
     if (user.id === activeProfileId) return user.iotStats;
     return user.familyMembers?.find(m => m.id === activeProfileId)?.iotStats;
  }, [user, activeProfileId]);

  // [NEW] Offline Detection Logic
  // Threshold: 60 seconds without update = Offline
  const isOffline = useMemo(() => {
      if (!currentIoTStats?.lastUpdated) return true;
      return (Date.now() - currentIoTStats.lastUpdated) > 60000;
  }, [currentIoTStats?.lastUpdated]);

  const timeAgoStr = useMemo(() => {
      if (!currentIoTStats?.lastUpdated) return '未连接';
      const diff = Date.now() - currentIoTStats.lastUpdated;
      if (diff < 60000) return '刚刚';
      const mins = Math.floor(diff / 60000);
      return `${mins}分钟前`;
  }, [currentIoTStats?.lastUpdated, isOffline]); // Depend on isOffline to force refresh

  const currentCognitiveStats = useMemo(() => {
      if (user.id === activeProfileId) return user.cognitiveStats;
      return user.familyMembers?.find(m => m.id === activeProfileId)?.cognitiveStats;
  }, [user, activeProfileId]);

  const recommendedPkg = getRecommendedPackage();
  const isPkgUnlocked = hasFeature(recommendedPkg.featureKey);
  const isAssessmentPaid = hasFeature('ICE_BREAKING_MIGRAINE') || hasFeature('VIP_MIGRAINE') || hasFeature('VIP_EPILEPSY') || hasFeature('VIP_COGNITIVE');
  const isPredictedScore = riskScore > 0 && !isAssessmentPaid;
  const displayScore = riskScore > 0 ? riskScore : 95;
  const finalHealthScore = riskScore > 0 ? (100 - riskScore) : 95;
  const isCritical = finalHealthScore < 60; 
  const isEpilepsy = primaryCondition === DiseaseType.EPILEPSY;
  
  let themeColor = 'bg-[#1677FF]';
  if (isManagedView) {
      themeColor = 'bg-emerald-500';
  } else if (isCritical || isEpilepsy) {
      themeColor = 'bg-[#FF4D4F]';
  }

  useEffect(() => {
      if (currentIoTStats?.isAbnormal && !showAlertModal && !isOffline) {
          setShowAlertModal(true);
      }
  }, [currentIoTStats?.isAbnormal, isOffline]);

  useEffect(() => {
    let tick = 0;
    const generateWave = () => {
      tick += 0.15;
      const points = [];
      const width = 160; 
      for (let i = 0; i <= width; i += 5) {
        const y = 20 + Math.sin(tick + i * 0.1) * 8 + (Math.random() - 0.5) * 4;
        points.push(`${i},${y}`);
      }
      setWavePath(`M 0,20 L ${points.join(' L ')}`);
      requestAnimationFrame(generateWave);
    };
    const anim = requestAnimationFrame(generateWave);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleRecordSubmit = (hr: string) => {
      const val = parseInt(hr);
      if (val > 0) {
          const stats: IoTStats = {
            hr: val, bpSys: 120, bpDia: 80, spo2: 98,
            hrStandardDeviation: 30, 
            isAbnormal: val > 120 || val < 60, 
            isFallDetected: false,
            lastUpdated: Date.now()
          };
          dispatch({ type: 'UPDATE_IOT_STATS', payload: { id: activeProfileId, stats } });
          setShowRecordModal(false);
          showToast('录入成功，AI 风险模型已更新'); 
          
          if (stats.isAbnormal) {
              setShowAlertModal(true);
          }
      }
  };

  const handleRemoteReminder = () => {
      showToast(`已向 ${managedPatient?.name || '患者'} 发送强制服药提醒`, 'success');
  };

  // [NEW] Pairing Success Handler
  const handlePairingSuccess = () => {
      setShowPairingModal(false);
      dispatch({ type: 'BIND_HARDWARE', payload: true });
      showToast('设备配对成功，实时监测已开启', 'success');
      // Trigger an immediate IoT update (mock)
      const initialStats: IoTStats = {
          hr: 75, bpSys: 120, bpDia: 80, spo2: 98, hrStandardDeviation: 30,
          isAbnormal: false, isFallDetected: false, lastUpdated: Date.now()
      };
      dispatch({ type: 'UPDATE_IOT_STATS', payload: { id: activeProfileId, stats: initialStats } });
  };

  // --- Alert Modal (二级预警: 心率异常) ---
  const AlertModal = () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-shake">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm text-center shadow-2xl border-4 border-red-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-red-500 animate-pulse"></div>
              <div className="flex justify-center mb-6 mt-4">
                 <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse relative">
                     <span className="text-5xl">💓</span>
                     <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center font-black text-xs border-2 border-white">!</div>
                 </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">二级风险预警</h3>
              <div className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100">
                  <p className="text-sm text-slate-600 font-bold mb-1">
                      监测到心率异常: <span className="text-red-600 text-xl font-black">{currentIoTStats?.hr}</span> bpm
                  </p>
                  <p className="text-xs text-red-500">(阈值范围: 60 - 120 bpm)</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      系统判断可能存在<strong className="text-slate-900">严重心律失常</strong>或<strong className="text-slate-900">癫痫发作风险</strong>。
                  </p>
              </div>
              <div className="space-y-3">
                  <Button fullWidth className="bg-[#FF4D4F] hover:opacity-90 shadow-lg shadow-red-500/40 py-4 h-auto flex flex-col items-center justify-center gap-1" onClick={() => window.location.href = "tel:120"}>
                      <span className="text-base font-black">📞 一键呼叫 120</span>
                      <span className="text-[10px] opacity-80 font-normal">及紧急联系人</span>
                  </Button>
                  <button onClick={() => setShowAlertModal(false)} className="w-full py-4 rounded-full border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all">
                      我已确认安全，关闭预警
                  </button>
              </div>
          </div>
      </div>
  );

  // --- Dynamic Priority Card Strategy ---
  const renderPrioritySection = () => {
      // 1. [SAFETY FENCE] Managed Mode Card (Priority 1)
      if (isManagedView && managedPatient) {
          return (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm mb-3 active:scale-[0.99] transition-transform">
                  {/* ... (Existing Managed Mode Card Content) */}
                  <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">🚧</div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span></span>
                      </div>
                      <div>
                          <h4 className="text-emerald-900 text-sm font-black">安全围栏已激活</h4>
                          <p className="text-emerald-700 font-medium text-[10px] mt-0.5">
                              正在实时同步 {managedPatient.name} 的数据
                          </p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-lg">💓</span>
                          <div>
                              <div className="text-[9px] text-slate-500">心率</div>
                              <div className={`text-sm font-black ${currentIoTStats?.isAbnormal ? 'text-red-500' : 'text-slate-800'}`}>{currentIoTStats?.hr} bpm</div>
                          </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          <div>
                              <div className="text-[9px] text-slate-500">位置</div>
                              <div className="text-xs font-black text-slate-800">家中 (安全)</div>
                          </div>
                      </div>
                  </div>
                  {checkPermission('REMOTE_REMINDER') && (
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoteReminder(); }}
                          className="mt-3 w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                          <span>🔊 远程强制提醒服药</span>
                      </button>
                  )}
              </div>
          );
      }

      // 2. Epilepsy (癫痫): 置顶安全哨兵
      if (primaryCondition === DiseaseType.EPILEPSY) {
          return (
              <div onClick={() => onNavigate('service-epilepsy')} className={`bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm mb-3 active:scale-[0.99] transition-transform flex items-center justify-between ${touchClass}`}>
                  {/* ... (Existing Epilepsy Card Content) */}
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🛡️</div>
                          {hasDevice && !isOffline && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span></span>}
                      </div>
                      <div>
                          <h4 className={`text-emerald-900 ${isElderly ? 'text-lg font-black' : 'text-xs font-black'}`}>安全哨兵状态: {hasDevice ? (isOffline ? '离线 (数据陈旧)' : '监测中') : '未连接'}</h4>
                          <p className={`text-emerald-700 font-medium mt-0.5 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>
                              {hasDevice ? (isOffline ? `最后同步: ${timeAgoStr}` : `心率 ${currentIoTStats?.hr} bpm · 节律稳定`) : '请尽快连接设备以开启防护'}
                          </p>
                      </div>
                  </div>
                  <div className="h-8 w-16 opacity-50">
                        <svg width="100%" height="100%" viewBox="0 0 160 40">
                            <path d={wavePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                  </div>
              </div>
          );
      }

      // 3. Migraine (偏头痛): 置顶诱因雷达 (环境建议)
      if (primaryCondition === DiseaseType.MIGRAINE) {
          return (
              <div onClick={() => onNavigate('service-headache')} className={`bg-sky-50 border border-sky-100 rounded-xl p-4 shadow-sm mb-3 active:scale-[0.99] transition-transform ${touchClass}`}>
                  {/* ... (Existing Migraine Card Content) */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                          <span className="text-xl">⚡</span>
                          <h4 className={`text-slate-800 ${isElderly ? 'text-lg font-black' : 'text-xs font-black'}`}>环境诱因雷达</h4>
                      </div>
                      <span className="text-[9px] text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded font-bold">实时</span>
                  </div>
                  <div className="flex gap-2">
                      <div className="flex-1 bg-white/60 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-sm">☀️</span>
                          <div>
                              <div className="text-[10px] font-bold text-slate-700">600 lux (偏亮)</div>
                              <div className="text-[9px] text-sky-600">建议佩戴墨镜</div>
                          </div>
                      </div>
                      <div className="flex-1 bg-white/60 rounded-lg p-2 flex items-center gap-2">
                          <span className="text-sm">🔊</span>
                          <div>
                              <div className="text-[10px] font-bold text-slate-700">45 dB (舒适)</div>
                              <div className="text-[9px] text-emerald-600">环境噪音适宜</div>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      return null; 
  };

  const kingKongItems = [
      { label: 'AI 问诊', icon: '🩺', color: 'text-[#1677FF]', bg: 'bg-blue-50', nav: 'chat' },
      { label: '查报告', icon: '📄', color: 'text-emerald-500', bg: 'bg-emerald-50', nav: 'report' },
      { label: '亲情号', icon: '👨‍👩‍👧', color: 'text-orange-500', bg: 'bg-orange-50', nav: 'service-family' },
      { label: '租设备', icon: '⌚', color: 'text-purple-500', bg: 'bg-purple-50', nav: 'service-mall' },
  ].filter(item => !isElderly || item.nav !== 'service-mall');

  if (user.role === UserRole.DOCTOR_ASSISTANT) {
      return <AssistantDashboard user={user} />; 
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none relative">
      
      {/* 1. 沉浸式顶栏 */}
      <div className={`${themeColor} pt-[calc(1rem+env(safe-area-inset-top))] pb-16 px-5 transition-colors duration-500 relative`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, white 10%, transparent 20%)' }}></div>
        
        <div className="flex justify-between items-start relative z-10 mb-6">
            <div className="flex items-center gap-3" onClick={() => onNavigate('profile')}>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 text-lg shadow-sm">
                    {user.name[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">{user.name}</h2>
                        <span className="bg-black/20 text-white/90 text-[9px] px-1.5 py-0.5 rounded font-bold backdrop-blur-sm flex items-center gap-1">
                            {user.vipLevel > 0 ? '👑 尊享会员' : '未认证'}
                            <span className="opacity-60">›</span>
                        </span>
                    </div>
                    <p className="text-[10px] text-white/70 mt-0.5">华西数字医疗档案 ID: {user.id.split('_')[1] || '8829'}</p>
                </div>
            </div>
            
            <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                    <circle 
                        cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" 
                        strokeDasharray="276.4" 
                        strokeDashoffset={276.4 - (276.4 * finalHealthScore) / 100} 
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-white">{finalHealthScore}</span>
                    <span className="text-[7px] text-white/80 uppercase flex items-center gap-1">
                        {isPredictedScore ? '待临床确认' : '健康分'}
                        {isPredictedScore && <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse"></span>}
                    </span>
                </div>
            </div>
        </div>

        {/* [SAFETY FENCE] Managed Mode Banner */}
        {isManagedView && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md rounded-xl p-2 flex items-center justify-center gap-2 border border-white/30 animate-slide-up">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                <span className="text-white text-xs font-bold tracking-wide">
                    当前正在代管 {managedPatient?.name} 的健康状态
                </span>
            </div>
        )}
      </div>

      {/* 2. 金刚区 */}
      <div className="px-3 -mt-10 relative z-20 mb-2">
          <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 flex justify-between items-center">
              {kingKongItems.map((item, i) => (
                  <button key={i} onClick={() => onNavigate(item.nav as AppView)} className={`flex flex-col items-center gap-2 active:opacity-70 transition-opacity ${isElderly ? 'flex-1' : ''}`}>
                      <div className={`w-11 h-11 rounded-full ${item.bg} flex items-center justify-center text-xl shadow-sm ${item.color} ${isElderly ? 'w-14 h-14 text-2xl' : ''}`}>
                          {item.icon}
                      </div>
                      <span className={`text-slate-700 ${textClass}`}>{item.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. 核心业务流 (Feed) */}
      <div className="px-3 space-y-3 pb-24">
        
        {/* [NEW] MOH Alert Banner */}
        {mohAlertTriggered && !isManagedView && (
            <div className={`bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3 animate-slide-up shadow-sm ${touchClass}`}>
                <div className="text-xl">⚠️</div>
                <div>
                    <h4 className={`text-orange-800 ${isElderly ? 'text-lg font-black' : 'text-xs font-black'}`}>警告：检测到用药频繁</h4>
                    <p className={`text-orange-700 leading-tight mt-1 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>
                        近24小时用药&gt;3次，存在“药物过度使用性头痛”风险。建议立即暂停药物，尝试下方物理缓解方案。
                    </p>
                </div>
            </div>
        )}

        {mohAlertTriggered && !isManagedView && <NonDrugToolkit />}

        {isCritical && !mohAlertTriggered && !isManagedView && (
            <div onClick={() => onNavigate('report')} className={`bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3 animate-pulse ${touchClass}`}>
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-[#FF4D4F] font-bold">!</div>
                <div className="flex-1">
                    <div className={`text-rose-700 ${isElderly ? 'text-lg font-black' : 'text-xs font-black'}`}>检测到健康风险异常</div>
                    <div className={`text-rose-500 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>建议立即进行深度评估</div>
                </div>
                <button className={`bg-[#FF4D4F] text-white rounded-full ${isElderly ? 'text-sm font-bold px-5 py-2' : 'text-[10px] font-bold px-3 py-1.5'}`}>去处理</button>
            </div>
        )}

        <CognitiveRadarCard 
            stats={currentCognitiveStats} 
            onClick={() => onNavigate('service-cognitive')} 
            isElderly={isElderly} 
        />

        {renderPrioritySection()}

        {!isPkgUnlocked && !renderPrioritySection() && !isElderly && !isManagedView && ( 
            <div className="bg-white rounded-xl p-4 shadow-sm relative overflow-hidden group" onClick={() => onNavigate('service-mall')}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">为您推荐</div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">{recommendedPkg.title}</h3>
                        <p className="text-[10px] text-slate-400">{recommendedPkg.features[0]} · {recommendedPkg.features[1]}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-lg font-black text-[#FF4D4F]">¥{recommendedPkg.price}</span>
                        <span className="text-[9px] text-slate-300 line-through">¥{recommendedPkg.originalPrice || 999}</span>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3">
            <div onClick={() => onNavigate('service-epilepsy')} className={`bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between border border-slate-50 active:scale-[0.98] transition-transform ${isElderly ? 'min-h-[160px]' : 'min-h-[140px]'}`}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">🧠</span>
                        {hasDevice && !isOffline && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    </div>
                    <h4 className={`text-slate-800 ${isElderly ? 'text-lg font-black' : 'text-[13px] font-black'}`}>生命守护</h4>
                    <p className={`text-slate-400 mt-0.5 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>癫痫发作实时监测</p>
                </div>
                <div className="mt-2 h-10 w-full opacity-50">
                     <svg width="100%" height="100%" viewBox="0 0 160 40">
                        <path d={wavePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                     </svg>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div onClick={() => onNavigate('service-headache')} className={`bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1 ${touchClass}`}>
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 text-lg">⚡</div>
                    <div>
                        <h4 className={`text-slate-800 ${isElderly ? 'text-lg font-black' : 'text-[12px] font-black'}`}>诱因雷达</h4>
                        <p className={`text-slate-400 ${isElderly ? 'text-sm' : 'text-[9px]'}`}>偏头痛气象预警</p>
                    </div>
                </div>
                <div onClick={() => onNavigate('service-cognitive')} className={`bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1 ${touchClass}`}>
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">🧩</div>
                    <div>
                        <h4 className={`text-slate-800 ${isElderly ? 'text-lg font-black' : 'text-[12px] font-black'}`}>记忆训练</h4>
                        <p className={`text-slate-400 ${isElderly ? 'text-sm' : 'text-[9px]'}`}>AD 认知康复</p>
                    </div>
                </div>
            </div>
        </div>

        {/* [NEW] Updated IoT Card: Rental / Pairing / Status Compensation */}
        <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-50 ${touchClass}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${hasDevice ? 'bg-slate-50' : 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-300'}`}>
                        {hasDevice ? '⌚' : '+'}
                    </div>
                    <div>
                        <h4 className={`text-slate-800 flex items-center gap-2 ${isElderly ? 'text-lg font-black' : 'text-[12px] font-black'}`}>
                            {hasDevice ? '我的智能装备' : '智能监测 (未绑定)'}
                            {!hasDevice && <span className="bg-[#1677FF]/10 text-[#1677FF] px-1.5 py-0.5 rounded text-[8px] font-bold border border-[#1677FF]/20">华西临床监测推荐</span>}
                        </h4>
                        
                        {hasDevice ? (
                            isOffline ? (
                                <p className={`text-slate-300 italic flex items-center gap-1 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>
                                    <span>⚠️ 信号中断</span>
                                    <span>· 最后同步于 {timeAgoStr}</span>
                                </p>
                            ) : (
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`font-bold text-slate-500 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>HR: {currentIoTStats?.hr || '--'}</span>
                                    <span className={`text-emerald-500 bg-emerald-50 px-1 rounded ${isElderly ? 'text-xs' : 'text-[10px]'}`}>已连接</span>
                                </div>
                            )
                        ) : (
                            <p className={`text-slate-400 mt-0.5 ${isElderly ? 'text-sm' : 'text-[10px]'}`}>
                                暂无设备，支持 HaaS 租赁
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {!hasDevice && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => onNavigate('haas-checkout')}
                        className={`flex-1 bg-[#1677FF] text-white rounded-lg shadow-md shadow-blue-500/20 active:scale-95 ${isElderly ? 'text-sm font-bold py-3' : 'text-[10px] font-bold py-2'}`}
                    >
                        租赁设备
                    </button>
                    <button 
                        onClick={() => setShowPairingModal(true)}
                        className={`flex-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg active:scale-95 ${isElderly ? 'text-sm font-bold py-3' : 'text-[10px] font-bold py-2'}`}
                    >
                        去配对
                    </button>
                </div>
            )}
            
            {hasDevice && isOffline && (
                <div className="text-[9px] text-slate-400 text-center bg-slate-50 py-1 rounded border border-slate-100 mt-2">
                    正在尝试重新连接蓝牙...
                </div>
            )}
        </div>

        {/* [Compliance] 医疗免责声明 */}
        <div className="text-center px-4 pt-4 opacity-50">
            <p className="text-[9px] text-slate-400 leading-tight">
                医疗声明：本应用基于 AI 算法提供辅助建议，不能替代线下医疗诊断。<br/>
                如遇紧急医疗状况，请立即拨打 120 急救电话。
            </p>
            <div className="flex justify-center gap-4 mt-2">
                <span className="text-[9px] text-slate-300 underline" onClick={() => onNavigate('profile')}>隐私协议</span>
                <span className="text-[9px] text-slate-300 underline" onClick={() => onNavigate('profile')}>数据授权</span>
            </div>
        </div>

      </div>

      {/* Modals */}
      {showAlertModal && <AlertModal />}
      
      {showRecordModal && (
        <ManualRecordModal 
            onClose={() => setShowRecordModal(false)} 
            onSubmit={handleRecordSubmit} 
        />
      )}

      {showPairingModal && (
          <BluetoothPairingModal 
              onClose={() => setShowPairingModal(false)}
              onConnected={handlePairingSuccess}
          />
      )}

    </div>
  );
};

// --- Sub-components for Modals ---

const ManualRecordModal: React.FC<{ onClose: () => void; onSubmit: (hr: string) => void }> = ({ onClose, onSubmit }) => {
    const [hr, setHr] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm rounded-[24px] p-6 relative z-10 animate-slide-up shadow-2xl">
                <h3 className="text-lg font-black text-slate-900 mb-4 text-center">手动录入生命体征</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">当前静息心率 (BPM)</label>
                        <input 
                            type="number" 
                            autoFocus
                            placeholder="75"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xl font-bold text-center focus:border-brand-500 outline-none"
                            value={hr}
                            onChange={e => setHr(e.target.value)}
                        />
                    </div>
                    <Button fullWidth onClick={() => onSubmit(hr)} disabled={!hr}>确认提交</Button>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
