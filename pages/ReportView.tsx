
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';

// Declare Chart.js type for TypeScript
declare const Chart: any;

interface ReportViewProps {
  score: number;
  diseaseType: DiseaseType;
  onBackToHome: () => void;
  onIntervention?: () => void;
}

// --- Privacy Utils ---
const maskID = (id: string) => id ? id.replace(/^(.{3})(.*)(.{4})$/, "$1***********$3") : '510***********0000';
const maskPhone = (phone: string) => phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '138****0000';

// --- Minimalist SVG Illustrations ---
const SleepSVG = () => (
    <svg viewBox="0 0 100 60" className="w-full h-full opacity-80">
        <path d="M20,50 Q40,10 60,50 T100,50" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="40" r="2" fill="#64748B" />
        <circle cx="80" cy="20" r="4" fill="#FEF08A" />
        <path d="M70,15 L75,10 M85,15 L90,10 M80,28 L80,35" stroke="#FEF08A" strokeWidth="2" />
    </svg>
);

const DietSVG = () => (
    <svg viewBox="0 0 100 60" className="w-full h-full opacity-80">
        <circle cx="50" cy="30" r="20" fill="none" stroke="#64748B" strokeWidth="2" />
        <path d="M50,15 L50,45 M35,30 L65,30" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="60" cy="25" r="3" fill="#F87171" />
        <path d="M20,50 L80,50" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const EnvSVG = () => (
    <svg viewBox="0 0 100 60" className="w-full h-full opacity-80">
        <circle cx="50" cy="50" r="30" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" />
        <path d="M50,20 L50,50 L70,50" fill="none" stroke="#64748B" strokeWidth="2" />
        <path d="M20,20 L30,30 L20,40" fill="none" stroke="#94A3B8" strokeWidth="2" />
    </svg>
);

// --- Export Modal Component (A4 Layout) ---
const MedicalReportExportModal: React.FC<{ 
    onClose: () => void; 
    data: any; 
}> = ({ onClose, data }) => {
    const { user, score, diseaseType, diagnosis } = data;
    const { showToast } = useToast();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    // 生成防伪校验码
    const verificationCode = useMemo(() => {
        const seed = `${user.id}-${Date.now()}-${score}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
        return `HX-VERI-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
    }, [user.id, score]);

    useEffect(() => {
        if (chartRef.current && typeof Chart !== 'undefined') {
            const ctx = chartRef.current.getContext('2d');
            
            // Re-render chart for PDF (High Contrast Black/White style)
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['T-30', 'T-15', 'T-7', 'T-3', 'T-1', 'Today'],
                    datasets: [{
                        label: '病情指数',
                        data: [45, 48, 52, 55, 58, score],
                        borderColor: '#000', // Black for print
                        borderWidth: 2,
                        pointBackgroundColor: '#000',
                        pointRadius: 3,
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#000', font: { size: 8 } } },
                        y: { beginAtZero: true, max: 100, ticks: { color: '#000', font: { size: 8 } }, grid: { color: '#eee' } }
                    }
                }
            });
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [score]);

    const handleDownload = () => {
        showToast('正在生成加密 PDF...', 'info');
        setTimeout(() => {
            showToast('导出成功，已保存至本地文件', 'success');
            onClose();
        }, 1500);
    };

    const currentDate = new Date().toLocaleDateString('zh-CN');

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Toolbar */}
            <div className="w-full max-w-[360px] flex justify-between items-center mb-4 text-white">
                <h3 className="font-bold text-sm">打印预览 (A4)</h3>
                <button onClick={onClose} className="bg-white/20 px-3 py-1 rounded-full text-xs hover:bg-white/30">关闭</button>
            </div>

            {/* A4 Paper Container (Scaled Down for Mobile View) */}
            <div className="bg-white w-full max-w-[360px] aspect-[210/297] shadow-2xl relative overflow-hidden text-slate-900 flex flex-col scale-100 origin-top">
                {/* Watermark */}
                <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03] rotate-45">
                    <div className="text-6xl font-black whitespace-nowrap">华西数字华佗系统</div>
                </div>

                {/* 1. Header (Red Head) */}
                <div className="border-b-2 border-red-600 pb-2 mx-6 mt-8 relative z-10">
                    <div className="text-center">
                        <h1 className="text-lg font-serif font-black text-red-700 tracking-widest">四川大学华西医院</h1>
                        <h2 className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-wider">神经内科专科门诊病历 (电子版)</h2>
                    </div>
                    <div className="flex justify-between mt-4 text-[9px] text-slate-500 font-mono">
                        <span>No. {verificationCode.split('-')[2]}</span>
                        <span>打印日期: {currentDate}</span>
                    </div>
                </div>

                {/* 2. Patient Info Grid */}
                <div className="mx-6 mt-4 relative z-10">
                    <h3 className="text-[10px] font-bold text-slate-400 mb-1">患者基本信息 (Patient Profile)</h3>
                    <div className="border border-slate-300 grid grid-cols-2 text-[10px]">
                        <div className="p-1.5 border-b border-r border-slate-300 bg-slate-50 font-bold">姓名</div>
                        <div className="p-1.5 border-b border-slate-300">{user.name}</div>
                        
                        <div className="p-1.5 border-b border-r border-slate-300 bg-slate-50 font-bold">性别/年龄</div>
                        <div className="p-1.5 border-b border-slate-300">未知 / {user.headacheProfile?.onsetAge || '--'}岁</div>
                        
                        <div className="p-1.5 border-b border-r border-slate-300 bg-slate-50 font-bold">联系电话</div>
                        <div className="p-1.5 border-b border-slate-300 font-mono">{maskPhone(user.phone)}</div>
                        
                        <div className="p-1.5 border-r border-slate-300 bg-slate-50 font-bold">身份证号</div>
                        <div className="p-1.5 font-mono">{maskID(user.idNumber)}</div> {/* Assuming user.idNumber exists or mock it */}
                    </div>
                </div>

                {/* 3. Trend Chart Area */}
                <div className="mx-6 mt-4 relative z-10 flex-1 min-h-0 flex flex-col">
                    <h3 className="text-[10px] font-bold text-slate-400 mb-1">近30天病情趋势 (Clinical Trend)</h3>
                    <div className="border border-slate-200 p-2 h-32 w-full">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                {/* 4. Risk & Advice */}
                <div className="mx-6 mt-4 relative z-10 mb-4">
                    <h3 className="text-[10px] font-bold text-slate-400 mb-1">显著风险点 (Risk Factors)</h3>
                    <div className="flex gap-2 mb-3">
                        {score > 60 && <span className="text-[9px] border border-red-500 text-red-600 px-1 rounded">高危指征</span>}
                        <span className="text-[9px] border border-slate-300 text-slate-600 px-1 rounded">{diseaseType}</span>
                        <span className="text-[9px] border border-slate-300 text-slate-600 px-1 rounded">CDSS评分: {score}</span>
                    </div>

                    <h3 className="text-[10px] font-bold text-slate-400 mb-1">华西专家建议 (Expert Recommendation)</h3>
                    <div className="border-t border-b border-slate-200 py-2 text-[10px] leading-relaxed text-slate-800 text-justify">
                        {diagnosis?.reason || "根据目前采集的临床数据，建议进行常规随访。如症状加重，请立即前往线下门诊就医。"}
                    </div>
                </div>

                {/* 5. Footer (Verification) */}
                <div className="mt-auto mb-6 mx-6 text-center relative z-10">
                    <div className="flex justify-center items-center gap-2 mb-1">
                        <div className="w-16 h-16 border-2 border-red-600 rounded-full flex items-center justify-center p-1 rotate-[-12deg] opacity-80">
                            <div className="w-full h-full border border-red-600 rounded-full flex items-center justify-center text-[8px] text-red-600 font-black text-center leading-none">
                                华西数字<br/>华佗系统<br/>专用章
                            </div>
                        </div>
                    </div>
                    <div className="text-[8px] text-slate-400 font-mono scale-90">
                        数字签名: {verificationCode}
                        <br/>
                        *本报告仅供临床参考，不作为最终司法鉴定依据*
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full max-w-[360px] mt-6 flex gap-3">
                <Button fullWidth onClick={handleDownload} className="bg-red-600 shadow-lg shadow-red-600/30">
                    确认导出 (PDF)
                </Button>
            </div>
        </div>
    );
};

// --- Health Tips Swiper Component ---
const HealthTipsSwiper: React.FC<{ diseaseType: DiseaseType }> = ({ diseaseType }) => {
    const { showToast } = useToast();

    const handleAction = (action: string) => {
        // Simulate system API call
        showToast(`✅ 已调用系统功能：${action}`, 'success');
    };

    const tips = diseaseType === DiseaseType.MIGRAINE ? [
        { 
            id: 1, 
            title: '规律作息', 
            desc: '周末不赖床，保持生物钟稳定，减少下丘脑功能紊乱。', 
            icon: <SleepSVG />, 
            bg: 'bg-blue-50',
            actionLabel: '⏰ 设置睡眠闹钟',
            action: '打开系统闹钟'
        },
        { 
            id: 2, 
            title: '饮食回避', 
            desc: '少吃奶酪、巧克力及含咖啡因饮料，避免酪胺酸诱发头痛。', 
            icon: <DietSVG />, 
            bg: 'bg-orange-50',
            actionLabel: '📅 记录饮食日记',
            action: '打开饮食记录'
        },
        { 
            id: 3, 
            title: '环境调整', 
            desc: '避免强光直射，室内使用暖色调灯光，减少视皮层过度兴奋。', 
            icon: <EnvSVG />, 
            bg: 'bg-emerald-50',
            actionLabel: '💡 调节屏幕护眼',
            action: '开启夜间模式'
        },
    ] : [
        { 
            id: 1, 
            title: '社交互动', 
            desc: '每周至少参加一次集体活动，保持语言中枢活跃度。', 
            icon: <SleepSVG />, 
            bg: 'bg-indigo-50',
            actionLabel: '📞 联系亲友',
            action: '打开通讯录'
        },
        { 
            id: 2, 
            title: '益智游戏', 
            desc: '每天进行15分钟简单的计算或记忆练习，刺激前额叶功能。', 
            icon: <DietSVG />, 
            bg: 'bg-purple-50',
            actionLabel: '🎮 开始训练',
            action: '跳转认知游戏'
        },
        { 
            id: 3, 
            title: '有氧运动', 
            desc: '散步或太极拳有助于脑部供血，提升神经突触可塑性。', 
            icon: <EnvSVG />, 
            bg: 'bg-rose-50',
            actionLabel: '🏃 记录运动',
            action: '打开计步器'
        },
    ];

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-[9px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold">
                    {diseaseType === DiseaseType.MIGRAINE ? '偏头痛科普' : '日常护理'}
                </span>
                <span className="text-[9px] text-slate-400">左滑查看更多 ›</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar px-1">
                {tips.map(tip => (
                    <div key={tip.id} className={`flex-shrink-0 w-[85%] snap-center rounded-[20px] p-5 shadow-sm border border-slate-50 ${tip.bg} flex flex-col justify-between min-h-[160px] relative overflow-hidden`}>
                        <div className="relative z-10 flex-1">
                            <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold border border-slate-100">{tip.id}</span>
                                {tip.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed text-justify font-medium mb-3">
                                {tip.desc}
                            </p>
                        </div>
                        
                        {/* Action Button */}
                        <div className="relative z-10 mt-2">
                            <button 
                                onClick={() => handleAction(tip.action)}
                                className="w-full py-2 bg-white/60 hover:bg-white text-slate-700 text-[10px] font-bold rounded-lg border border-white/50 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                            >
                                {tip.actionLabel}
                            </button>
                        </div>

                        <div className="absolute bottom-0 right-0 w-24 h-16 pointer-events-none">
                            {tip.icon}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome, onIntervention }) => {
  const { state } = useApp();
  const { mohAlertTriggered, lastDiagnosis, user } = state;
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [reportTitle, setReportTitle] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); // [NEW] Export State
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // 0分代表未测评/基础模式 -> 低风险处理
  const actualScore = score || 5; 

  // [GATEWAY] 判定条件：Risk > 75 OR MOH_Alert
  const isGreenChannel = actualScore > 75 || mohAlertTriggered;

  // [GATEWAY] 生成转诊码 (Encrypted Stub)
  const referralCode = useMemo(() => {
      if (!isGreenChannel) return '';
      // 模拟加密：[HX]-[Desensitized ID]-[Disease]-[Timestamp]-[Hash]
      const pid = user.id.slice(-6).toUpperCase();
      const typeCode = diseaseType === DiseaseType.MIGRAINE ? 'MIG' : diseaseType === DiseaseType.EPILEPSY ? 'EPI' : 'COG';
      const reasonCode = mohAlertTriggered ? 'MOH' : 'RSK';
      return `HX-${pid}-${typeCode}-${reasonCode}-${Date.now().toString().slice(-4)}`;
  }, [isGreenChannel, user.id, diseaseType, mohAlertTriggered]);

  // 获取推荐医疗机构信息 (Fallback to Default if not in state)
  const activeReferral = lastDiagnosis?.referral || {
      hospitalName: '四川大学华西医院 (本部)',
      distance: '2.3km',
      address: '成都市武侯区国学巷37号'
  };

  useEffect(() => {
    // 风险分级逻辑
    if (actualScore >= 60) {
        setRisk(RiskLevel.HIGH);
        setReportTitle("高风险 · 需就医");
        // PRD Req: "重症...强制弹窗'紧急就诊提醒'（仅医疗预警，无商业引导）"
        // 仅在首次加载且未处理过 MOH 时弹窗，避免干扰
        setTimeout(() => setShowEmergencyModal(true), 800);
    } else if (actualScore >= 30) {
        setRisk(RiskLevel.MODERATE);
        setReportTitle("中度风险 · 需关注");
    } else {
        setRisk(RiskLevel.LOW);
        setReportTitle("低风险 · 正常");
    }

    // Chart.js 渲染 - [UPDATE] Use global healthTrends state
    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        const color = actualScore >= 60 ? '#EF4444' : (actualScore >= 30 ? '#F59E0B' : '#10B981');
        
        // Prepare data from OCR trends or fallback
        const trends = state.user.healthTrends || [];
        // Fallback dummy data if no OCR records
        const labels = trends.length > 0 ? trends.map(t => t.date) : ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Today'];
        const data = trends.length > 0 ? trends.map(t => t.score) : [30, 35, 40, 38, 45, 50, actualScore];

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Risk/VAS',
                    data: data,
                    borderColor: color,
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 4, // Show points for real data
                    pointBackgroundColor: '#fff',
                    pointBorderColor: color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { display: trends.length > 0, grid: { display: false }, ticks: { font: { size: 8 } } }, 
                    y: { display: trends.length > 0, beginAtZero: true } 
                }
            }
        });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [actualScore, state.user.healthTrends]);

  // 根据风险等级配置样式
  const getTheme = () => {
      if (risk === RiskLevel.HIGH) return { bg: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: '🚨' };
      if (risk === RiskLevel.MODERATE) return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: '⚠️' };
      return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: '✅' };
  };
  const theme = getTheme();

  return (
    <Layout headerTitle="测评与分流报告" hideHeader>
      <div className="min-h-screen bg-slate-50 pb-8">
        
        {/* 1. 风险仪表盘 (Header) - 颜色对标：红黄绿 */}
        <div className={`${theme.bg} pt-12 pb-24 px-6 rounded-b-[40px] text-center shadow-lg transition-colors duration-500 relative`}>
            {/* [NEW] Export Button (Absolute Top Right) */}
            <button 
                onClick={() => setShowExportModal(true)}
                className="absolute top-12 right-6 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md transition-colors flex items-center gap-1 active:scale-95"
            >
                <span>📥</span> 导出病历
            </button>

            <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] mb-2">CLINICAL RISK ASSESSMENT</div>
            <h2 className="text-3xl font-black text-white mb-2">{reportTitle}</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">华西 AI 评分</span>
                <span className="text-white text-xl font-black">{actualScore}</span>
            </div>
        </div>

        <div className="px-5 -mt-20 relative z-10 space-y-5 animate-slide-up">
            
            {/* [GATEWAY UI] 华西绿色通道卡片 (Forced Render at Top) */}
            {isGreenChannel && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[24px] p-[2px] shadow-xl shadow-emerald-500/20 mb-2">
                    <div className="bg-white rounded-[22px] p-5 relative overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-60"></div>
                        
                        <div className="flex justify-between items-start relative z-10 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl shadow-sm border border-emerald-200">
                                    🏥
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        华西绿色通道已开启
                                        <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                                    </h3>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                        {mohAlertTriggered ? '检测到药物过度使用风险' : '重症风险触发优先接诊'}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-1 rounded-full font-bold border border-emerald-200">
                                {activeReferral.distance}
                            </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100/80">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 border-b border-slate-200 pb-1.5">
                                <span>推荐机构</span>
                                <span className="font-bold text-slate-800">{activeReferral.hospitalName}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>推荐科室</span>
                                <span className="font-bold text-slate-800">
                                    {diseaseType === DiseaseType.EPILEPSY ? '神经外科功能组' : diseaseType === DiseaseType.MIGRAINE ? '头痛专科门诊' : '神经内科'}
                                </span>
                            </div>
                        </div>

                        {/* QR Code Action */}
                        <div 
                            onClick={() => setShowQRModal(true)}
                            className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-xl cursor-pointer active:scale-95 transition-transform shadow-lg"
                        >
                            <div className="w-8 h-8 bg-white rounded p-0.5 flex-shrink-0">
                                 {/* Micro QR Visual */}
                                 <div className="w-full h-full border border-slate-200 grid grid-cols-4 gap-[1px] bg-slate-50">
                                     {[...Array(16)].map((_,i) => <div key={i} className={`bg-slate-900 ${i%2===0?'opacity-100':'opacity-20'}`}></div>)}
                                 </div> 
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">TAP TO SHOW QR CODE</div>
                                <div className="text-[10px] font-mono font-bold truncate text-emerald-400">
                                    {referralCode}
                                </div>
                            </div>
                            <span className="text-lg text-slate-500">›</span>
                        </div>
                    </div>
                </div>
            )}

            {/* [NEW] Trend Chart Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-xl shadow-brand-500/10 border border-slate-50">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <span>📈</span> 综合风险趋势 (OCR 联动)
                    </h4>
                    {state.user.healthTrends && state.user.healthTrends.length > 0 && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">已同步检查单数据</span>
                    )}
                </div>
                <div className="h-40 w-full">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>

            {/* 3. 轻症路径：健康科普 & 基础干预 (PRD Req: "享受线上全免费功能... 推送个性化健康科普") */}
            {risk !== RiskLevel.HIGH && !isGreenChannel && (
                <>
                    {/* 基础免费功能入口 */}
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mb-3">🍃</div>
                        <h3 className="font-black text-slate-800 text-sm">享受基础免费管理服务</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-4 mb-4">
                            您的风险处于可控范围，App 将为您提供全免费的日常健康管理支持。
                        </p>
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button variant="outline" className="text-xs bg-slate-50 border-slate-200" onClick={onBackToHome}>💊 用药提醒</Button>
                            <Button variant="outline" className="text-xs bg-slate-50 border-slate-200" onClick={onBackToHome}>📝 症状打卡</Button>
                        </div>
                    </div>

                    {/* PRD Req: "科普 3 招 - 卡片滑动流" */}
                    <HealthTipsSwiper diseaseType={diseaseType} />
                </>
            )}

            <Button fullWidth onClick={onBackToHome} className="bg-slate-800 shadow-xl py-4">
                进入首页 (开始健康管理)
            </Button>
        </div>

        {/* 4. 紧急就诊提醒弹窗 (仅高风险, PRD Req: "强制弹窗...无商业引导") */}
        {showEmergencyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl relative overflow-hidden border-t-8 border-red-500">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
                        🚨
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">紧急就诊提醒</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium text-justify px-2">
                        基于您的深度测评数据，系统检测到<span className="text-red-600 font-bold">高风险指征</span>。
                        这可能提示潜在的神经系统病变风险（如癫痫持续状态或先兆偏头痛）。
                        <br/><br/>
                        <span className="text-slate-900 font-bold">请务必尽快前往具备神经专科资质的医院就诊，切勿拖延。</span>
                    </p>
                    <div className="space-y-3">
                        <Button fullWidth onClick={() => setShowEmergencyModal(false)} className="bg-red-600 hover:bg-red-700 shadow-red-500/30 border-none text-white">
                            我已知晓，查看就医凭证
                        </Button>
                        <p className="text-[9px] text-slate-400">本提醒仅为医疗预警，不包含任何商业推广</p>
                    </div>
                </div>
            </div>
        )}

        {/* [NEW] QR Modal for Green Channel */}
        {showQRModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-fade-in" onClick={() => setShowQRModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl relative">
                    <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900">华西转诊通行证</h3>
                        <p className="text-xs text-slate-500 mt-1">请向分诊台护士出示</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border-4 border-slate-900 mx-auto w-64 h-64 flex items-center justify-center mb-6">
                        {/* Simulation of a complex QR */}
                        <div className="grid grid-cols-8 gap-1 w-full h-full opacity-80">
                             {[...Array(64)].map((_,i) => (
                                 <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                             ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 mb-6">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest break-all">
                            {referralCode}
                        </p>
                    </div>

                    <Button fullWidth onClick={() => setShowQRModal(false)} className="bg-slate-900 text-white">
                        关闭
                    </Button>
                </div>
            </div>
        )}

        {/* [NEW] Export Modal */}
        {showExportModal && (
            <MedicalReportExportModal 
                onClose={() => setShowExportModal(false)}
                data={{ user, score: actualScore, diseaseType, diagnosis: lastDiagnosis }}
            />
        )}

      </div>
    </Layout>
  );
};

export default ReportView;
