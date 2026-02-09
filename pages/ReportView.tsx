
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { ReferralSystem } from '../components/business/ReferralSystem';

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

// --- CSI Calculation Engine ---
const calculateCSI = (diseaseType: DiseaseType, frequencyStr: string, currentScore: number): number => {
    // 1. Parse Frequency (Mocking baseline as 4 times/month for demo)
    // Format: ">1次/周" -> approx 6/month, "1-4次/月" -> 3/month
    let freqVal = 1;
    if (frequencyStr.includes('周')) freqVal = 6;
    else if (frequencyStr.includes('月')) freqVal = 3;
    else if (frequencyStr.includes('无')) freqVal = 0;
    
    const freqBase = 4; // Baseline assumption
    
    // 2. Parse Intensity (VAS) from currentScore (0-100 scale -> 0-10 scale)
    const intensity = Math.min(10, Math.max(0, currentScore / 10));

    // 3. Formula: CSI = 100 - ( (Freq/Base)*50 + (Int/10)*50 )
    // Adding protection against division by zero
    const term1 = (freqVal / (freqBase || 1)) * 50;
    const term2 = (intensity / 10) * 50;
    
    const csi = 100 - (term1 + term2);
    return Math.floor(Math.max(0, Math.min(100, csi)));
};

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome, onIntervention }) => {
  const { state } = useApp();
  const { mohAlertTriggered, lastDiagnosis, user } = state;
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [csiScore, setCsiScore] = useState<number>(100);
  const [reportTitle, setReportTitle] = useState("");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showPassport, setShowPassport] = useState(false); // [NEW] Control Passport Modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // 0分代表未测评/基础模式 -> 低风险处理
  const actualScore = score || 5; 

  // [GATEWAY] 判定条件：Risk > 75 OR MOH_Alert
  const isGreenChannel = actualScore > 75 || mohAlertTriggered;

  // 计算 CSI
  useEffect(() => {
      const freq = user.headacheProfile?.frequency || "1-4次/月";
      const csi = calculateCSI(diseaseType, freq, actualScore);
      setCsiScore(csi);
  }, [diseaseType, user.headacheProfile, actualScore]);

  useEffect(() => {
    // 风险分级逻辑
    if (actualScore >= 60) {
        setRisk(RiskLevel.HIGH);
        setReportTitle("高风险 · 需就医");
        // PRD Req: "重症...强制弹窗'紧急就诊提醒'"
        setTimeout(() => setShowEmergencyModal(true), 800);
    } else if (actualScore >= 30) {
        setRisk(RiskLevel.MODERATE);
        setReportTitle("中度风险 · 需关注");
    } else {
        setRisk(RiskLevel.LOW);
        setReportTitle("低风险 · 正常");
    }

    // Advanced Charting Logic
    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        
        // Mock 30-day Data Generation
        const labels = Array.from({length: 30}, (_, i) => `Day ${i+1}`);
        
        let config: any = {};

        if (diseaseType === DiseaseType.MIGRAINE) {
            // [Migraine] Mixed Chart: VAS (Line) + Meds (Bar)
            const vasData = Array.from({length: 30}, () => Math.floor(Math.random() * 6) + 2); // 2-8 VAS
            const medsData = vasData.map(v => v > 5 ? (Math.random() > 0.5 ? 1 : 0) : 0); // Take meds if pain > 5

            config = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            type: 'line',
                            label: '头痛程度 (VAS)',
                            data: vasData,
                            borderColor: '#EF4444', // Red
                            borderWidth: 2,
                            yAxisID: 'y',
                            tension: 0.4,
                            pointRadius: 0
                        },
                        {
                            type: 'bar',
                            label: '用药频次',
                            data: medsData,
                            backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                        title: { display: true, text: '30天病情-用药关联趋势', font: { size: 11 } }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { display: false } },
                        y: { 
                            type: 'linear', display: true, position: 'left', min: 0, max: 10, 
                            title: { display: true, text: 'VAS评分', font: { size: 9 } } 
                        },
                        y1: { 
                            type: 'linear', display: true, position: 'right', min: 0, max: 5, grid: { drawOnChartArea: false },
                            title: { display: true, text: '药量', font: { size: 9 } }
                        },
                    }
                }
            };
        } else if (diseaseType === DiseaseType.COGNITIVE) {
            // [Cognitive] Trend Line with Thresholds
            const mmseData = Array.from({length: 30}, (_, i) => 28 - (i * 0.1) + (Math.random() - 0.5)).map(v => Math.min(30, v));
            
            config = {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'MMSE 认知分',
                        data: mmseData,
                        borderColor: '#8B5CF6', // Purple
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        annotation: { // Mocking annotation via simple plugin config if available, else standard
                            annotations: {
                                line1: { type: 'line', yMin: 24, yMax: 24, borderColor: 'orange', borderWidth: 1, label: { content: 'MCI警戒线' } }
                            }
                        },
                        title: { display: true, text: '认知功能衰退趋势模拟', font: { size: 11 } }
                    },
                    scales: {
                        y: { min: 10, max: 30 }
                    }
                }
            };
        } else {
            // [Epilepsy/Default] Frequency Bar
            config = {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: '发作风险指数',
                        data: Array.from({length: 30}, () => Math.random() * 100),
                        borderColor: '#10B981',
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            };
        }

        chartInstance.current = new Chart(ctx, config);
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [actualScore, diseaseType]);

  // 根据风险等级配置样式
  const getTheme = () => {
      if (risk === RiskLevel.HIGH) return { bg: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: '🚨' };
      if (risk === RiskLevel.MODERATE) return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: '⚠️' };
      return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: '✅' };
  };
  const theme = getTheme();

  // Print Handler
  const handlePrint = () => {
      setIsPrintMode(true);
      setTimeout(() => {
          window.print();
          setIsPrintMode(false);
      }, 500);
  };

  return (
    <Layout headerTitle="测评与分流报告" hideHeader>
        {/* Global Print Styles Injection */}
        <style>{`
            @media print {
                body * { visibility: hidden; }
                #medical-report-container, #medical-report-container * { visibility: visible; }
                #medical-report-container { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100%; 
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: black;
                }
                .no-print { display: none !important; }
                /* Ensure charts render in print */
                canvas { min-height: 300px !important; width: 100% !important; }
            }
        `}</style>

      <div className="min-h-screen bg-slate-50 pb-8 relative">
        
        {/* CSI Warning Banner */}
        {csiScore < 60 && (
            <div className="bg-red-600 text-white px-4 py-3 text-center animate-pulse sticky top-0 z-50 shadow-lg">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">📉</span>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest">临床稳定性指数 (CSI) 警报</h3>
                        <p className="text-[10px] font-bold">CSI = {csiScore} (低) · 病情波动剧烈，建议尽快复诊</p>
                    </div>
                </div>
            </div>
        )}

        {/* 1. Dashboard Header */}
        <div className={`${theme.bg} pt-12 pb-24 px-6 rounded-b-[40px] text-center shadow-lg transition-colors duration-500 relative no-print`}>
            <button 
                onClick={handlePrint}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md transition-colors flex items-center gap-1 active:scale-95"
            >
                <span>🖨️</span> 打印报告
            </button>

            <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] mb-2">CLINICAL RISK ASSESSMENT</div>
            <h2 className="text-3xl font-black text-white mb-2">{reportTitle}</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">华西 AI 评分</span>
                <span className="text-white text-xl font-black">{actualScore}</span>
            </div>
        </div>

        {/* Main Content Area (Wraps Printable Content) */}
        <div id="medical-report-container" className="px-5 -mt-20 relative z-10 space-y-5 animate-slide-up">
            
            {/* Printable Header (Visible only in print) */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6 pt-4">
                <h1 className="text-2xl font-serif font-bold tracking-widest">四川大学华西医院</h1>
                <h2 className="text-sm font-bold uppercase mt-1 text-slate-600">神经内科专科电子病历</h2>
                <div className="flex justify-between mt-4 text-xs font-mono text-slate-500">
                    <span>ID: {user.id.split('_')[1]}</span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* 2. Advanced Trend Chart Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-xl shadow-brand-500/10 border border-slate-50 print:shadow-none print:border-2 print:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
                        <span>📈</span> 
                        {diseaseType === DiseaseType.MIGRAINE ? '痛感-药量双维分析' : '病情演变趋势'}
                    </h4>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold no-print">近30天数据</span>
                </div>
                <div className="h-64 w-full relative">
                    {/* Watermark for Print */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg] z-0 hidden print:flex">
                        <span className="text-6xl font-black">华西数字华佗</span>
                    </div>
                    <canvas ref={canvasRef} className="relative z-10"></canvas>
                </div>
                <div className="mt-2 text-[9px] text-slate-400 text-center italic no-print">
                    *双指缩放可查看详细历史数据
                </div>
            </div>

            {/* 3. Detailed Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 print:grid-cols-2 print:gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 print:border-slate-300">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">CSI 稳定性指数</div>
                    <div className={`text-2xl font-black ${csiScore < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {csiScore}
                        <span className="text-[10px] ml-1 text-slate-400 font-normal">/ 100</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                        {csiScore < 60 ? '病情波动较大' : '处于稳定期'}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 print:border-slate-300">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">主要诱因 (AI)</div>
                    <div className="text-sm font-black text-slate-800">
                        {diseaseType === DiseaseType.MIGRAINE ? '睡眠不足 / 气压' : '药物漏服'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                        关联度: High
                    </div>
                </div>
            </div>

            {/* 2. 重症路径：就医凭证 (Digital Living Record Integration) */}
            {risk === RiskLevel.HIGH && (
                <>
                    <div 
                        onClick={() => setShowPassport(true)}
                        className="bg-white rounded-[24px] p-6 shadow-xl border-t-4 border-rose-500 text-center relative overflow-hidden active:scale-95 transition-transform cursor-pointer group"
                    >
                        <div className="absolute top-2 right-2 text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-bold group-hover:bg-rose-200 transition-colors">
                            点击打开通行证
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Digital Living Record</div>
                        
                        <div className="w-48 h-48 bg-slate-900 mx-auto rounded-xl p-3 flex items-center justify-center mb-4 shadow-lg relative">
                            {/* Animated Scanner Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-full animate-[scan_2s_infinite]"></div>
                            
                            {/* Live Data Icon */}
                            <div className="w-full h-full bg-slate-800 rounded flex flex-col items-center justify-center text-white gap-2">
                                <span className="text-4xl animate-pulse">🔒</span>
                                <span className="text-[10px] font-mono text-slate-400">AES-256 ENCRYPTED</span>
                            </div>
                        </div>
                        
                        <div className="text-sm font-black text-slate-800">数字活病历通行证</div>
                        <p className="text-[10px] text-slate-500 mt-1 mb-4">
                            医师扫码可获取：MRI影像、用药史、认知量表详情
                        </p>
                    </div>

                    {/* LBS Recommendation */}
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50">
                        <h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <span>🏥</span> 推荐协作医院 (LBS 匹配)
                        </h4>
                        <div className="p-3 bg-slate-50 rounded-xl mb-3">
                            <div className="font-bold text-xs text-slate-800">四川大学华西医院 (本部)</div>
                            <div className="text-[10px] text-slate-500 mt-1">距离 2.3km · 神经内科 · 专家号源充足</div>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[9px] border border-slate-200 px-1 rounded text-slate-400">三甲</span>
                                <span className="text-[9px] border border-slate-200 px-1 rounded text-slate-400">医保定点</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 3. 轻症路径 (Same as before) */}
            {risk !== RiskLevel.HIGH && (
                <>
                    {/* ... (Existing Light Risk Content) ... */}
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
                </>
            )}

            {/* Expert Advice (Always Visible) */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 print:border-slate-300">
                <h4 className="text-[12px] font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span>👨‍⚕️</span> 华西专家诊疗建议
                </h4>
                <div className="text-[11px] leading-relaxed text-slate-600 space-y-2 text-justify">
                    <p>
                        <span className="font-bold text-slate-800">1. 诊断印象：</span> 
                        {lastDiagnosis?.reason || `根据CSI指数(${csiScore})及VAS评分趋势，考虑${diseaseType === DiseaseType.MIGRAINE ? '慢性偏头痛急性发作期' : '病情波动'}。`}
                    </p>
                    <p>
                        <span className="font-bold text-slate-800">2. 干预建议：</span>
                        {csiScore < 60 ? '目前病情控制不佳，建议立即启动预防性治疗方案，并预约线下门诊调整用药。' : '病情相对平稳，请继续保持当前生活方式，注意避免已知诱因。'}
                    </p>
                </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-8 text-center">
                <div className="border-t border-slate-300 pt-4 text-[9px] text-slate-500 flex justify-between">
                    <span>医师签名: ________________</span>
                    <span>打印日期: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="mt-2 text-[8px] text-slate-300 font-mono">
                    System Ver: Neuro-Link v2.4.0 | Hash: {user.id.slice(-6)}
                </div>
            </div>

            <Button fullWidth onClick={onBackToHome} className="bg-slate-800 shadow-xl py-4 no-print">
                返回首页
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

        {/* Digital Passport Modal */}
        {showPassport && <ReferralSystem onClose={() => setShowPassport(false)} />}

      </div>
    </Layout>
  );
};

export default ReportView;
