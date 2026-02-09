
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { ReferralSystem } from '../components/business/ReferralSystem';
import { calculateCSI, CSIResult } from '../utils/scoringEngine';

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

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome, onIntervention }) => {
  const { state, dispatch } = useApp();
  const { lastDiagnosis, user } = state;
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [csiResult, setCsiResult] = useState<CSIResult>({ score: 100, trend: 'STABLE', flags: [] });
  const [reportTitle, setReportTitle] = useState("");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showPassport, setShowPassport] = useState(false); 
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // 0分代表未测评/基础模式 -> 低风险处理
  const actualScore = score || 5; 

  // --- Data Mapping: Real History Processing ---
  const historyData = useMemo(() => {
      const days = 30;
      const now = Date.now();
      const oneDay = 86400000;
      
      const labels = [];
      const dataA = new Array(days).fill(0); // Series A (e.g., Pain, Seizures)
      const dataB = new Array(days).fill(0); // Series B (e.g., Meds)

      // Initialize Labels
      for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now - i * oneDay);
          labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }

      const getDayIndex = (ts: number) => {
          const diff = Math.floor((now - ts) / oneDay);
          if (diff >= 0 && diff < days) return (days - 1) - diff;
          return -1;
      };

      if (diseaseType === DiseaseType.MIGRAINE) {
          const medLogs = user.medicationLogs || [];
          // Map Meds (Data B)
          medLogs.forEach(log => {
              const idx = getDayIndex(log.timestamp);
              if (idx !== -1) {
                  dataB[idx] += 1; // Count doses
                  // Map Pain (Data A) - Take max pain for the day
                  dataA[idx] = Math.max(dataA[idx], log.painScale || 0);
              }
          });
      } else if (diseaseType === DiseaseType.EPILEPSY) {
          const seizures = user.epilepsyProfile?.seizureHistory || [];
          // Map Seizures (Data A)
          seizures.forEach(sz => {
              const idx = getDayIndex(sz.timestamp);
              if (idx !== -1) dataA[idx] += 1;
          });
          // Data B could be something else or empty for Epilepsy
      }

      return { labels, dataA, dataB };
  }, [diseaseType, user.medicationLogs, user.epilepsyProfile?.seizureHistory]);

  // --- CSI Calculation & Dynamic Order ---
  useEffect(() => {
      // 1. Calculate Real CSI
      const medLogs = user.medicationLogs || [];
      const seizureHist = user.epilepsyProfile?.seizureHistory || [];
      
      const result = calculateCSI(diseaseType, medLogs, seizureHist, actualScore);
      setCsiResult(result);

      // 2. Dynamic Medical Order Generation
      // If CSI < 60 and no pending LAB_TEST order exists
      if (result.score < 60) {
          const hasExistingOrder = user.medicalOrders?.some(o => o.type === 'LAB_TEST' && o.status === 'PENDING');
          
          if (!hasExistingOrder) {
              dispatch({
                  type: 'ADD_MEDICAL_ORDER',
                  payload: {
                      id: `ord_auto_${Date.now()}`,
                      type: 'LAB_TEST',
                      title: '建议完善血药浓度监测',
                      description: `CSI指数 (${result.score}) 提示病情波动，建议复查 TDM 以调整治疗方案。`,
                      priority: 'HIGH',
                      status: 'PENDING',
                      targetView: 'profile', // Redirect to profile journey
                      issuedAt: Date.now(),
                      doctorName: 'AI CDSS 系统'
                  }
              });
          }
      }

  }, [diseaseType, user.medicationLogs, user.epilepsyProfile?.seizureHistory, actualScore, dispatch, user.medicalOrders]);

  // --- Chart Rendering ---
  useEffect(() => {
    // 风险分级
    if (actualScore >= 60) {
        setRisk(RiskLevel.HIGH);
        setReportTitle("高风险 · 需就医");
        setTimeout(() => setShowEmergencyModal(true), 800);
    } else if (actualScore >= 30) {
        setRisk(RiskLevel.MODERATE);
        setReportTitle("中度风险 · 需关注");
    } else {
        setRisk(RiskLevel.LOW);
        setReportTitle("低风险 · 正常");
    }

    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        
        let config: any = {};

        if (diseaseType === DiseaseType.MIGRAINE) {
            config = {
                type: 'bar',
                data: {
                    labels: historyData.labels,
                    datasets: [
                        {
                            type: 'line',
                            label: '最大痛感 (VAS)',
                            data: historyData.dataA, // Real Pain Data
                            borderColor: '#EF4444', 
                            borderWidth: 2,
                            yAxisID: 'y',
                            tension: 0.4,
                            pointRadius: 2
                        },
                        {
                            type: 'bar',
                            label: '用药频次',
                            data: historyData.dataB, // Real Med Data
                            backgroundColor: 'rgba(59, 130, 246, 0.5)', 
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
                        title: { display: true, text: '近30天 病情-用药关联趋势', font: { size: 11 } }
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
        } else if (diseaseType === DiseaseType.EPILEPSY) {
            config = {
                type: 'line',
                data: {
                    labels: historyData.labels,
                    datasets: [{
                        label: '发作频次',
                        data: historyData.dataA, // Real Seizure Data
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.2
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            };
        } else {
            // Cognitive or Default (Mock for now as no time-series defined)
             config = {
                type: 'line',
                data: {
                    labels: historyData.labels,
                    datasets: [{
                        label: '认知状态模拟',
                        data: Array.from({length: 30}, () => 28), // Flatline default
                        borderColor: '#8B5CF6',
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            };
        }

        chartInstance.current = new Chart(ctx, config);
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [actualScore, diseaseType, historyData]);

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
                canvas { min-height: 300px !important; width: 100% !important; }
            }
        `}</style>

      <div className="min-h-screen bg-slate-50 pb-8 relative">
        
        {/* CSI Warning Banner */}
        {csiResult.score < 60 && (
            <div className="bg-red-600 text-white px-4 py-3 text-center animate-pulse sticky top-0 z-50 shadow-lg">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">📉</span>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest">临床稳定性指数 (CSI) 警报</h3>
                        <p className="text-[10px] font-bold">CSI = {csiResult.score} (不稳定) · 病情波动剧烈</p>
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

        {/* Main Content Area */}
        <div id="medical-report-container" className="px-5 -mt-20 relative z-10 space-y-5 animate-slide-up">
            
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
                        {diseaseType === DiseaseType.MIGRAINE ? '真实病程数据' : '病情演变趋势'}
                    </h4>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold no-print">近30天</span>
                </div>
                <div className="h-64 w-full relative">
                    <canvas ref={canvasRef} className="relative z-10"></canvas>
                </div>
                <div className="mt-2 text-[9px] text-slate-400 text-center italic no-print">
                    *数据源自您的真实打卡记录 (N={diseaseType === DiseaseType.MIGRAINE ? (user.medicationLogs?.length||0) : (user.epilepsyProfile?.seizureHistory?.length||0)})
                </div>
            </div>

            {/* 3. Detailed Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 print:grid-cols-2 print:gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 print:border-slate-300">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">CSI 稳定性指数</div>
                    <div className={`text-2xl font-black ${csiResult.score < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {csiResult.score}
                        <span className="text-[10px] ml-1 text-slate-400 font-normal">/ 100</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                        {csiResult.trend === 'STABLE' ? '病情稳定' : csiResult.trend === 'FLUCTUATING' ? '存在波动' : '恶化趋势'}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 print:border-slate-300">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">关键预警指标</div>
                    <div className="text-sm font-black text-slate-800">
                        {csiResult.flags.length > 0 ? csiResult.flags[0] : '无异常风险标记'}
                    </div>
                    {csiResult.flags.length > 1 && (
                        <div className="text-[9px] text-red-500 mt-1 font-bold">
                            +{csiResult.flags.length - 1} 个其他风险项
                        </div>
                    )}
                </div>
            </div>

            {/* 2. 重症路径：就医凭证 */}
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
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-full animate-[scan_2s_infinite]"></div>
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

            {/* 3. 轻症路径 */}
            {risk !== RiskLevel.HIGH && (
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
            )}

            {/* Expert Advice */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 print:border-slate-300">
                <h4 className="text-[12px] font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span>👨‍⚕️</span> 华西专家诊疗建议
                </h4>
                <div className="text-[11px] leading-relaxed text-slate-600 space-y-2 text-justify">
                    <p>
                        <span className="font-bold text-slate-800">1. 诊断印象：</span> 
                        {lastDiagnosis?.reason || `CSI指数(${csiResult.score})提示${csiResult.trend === 'STABLE' ? '病情平稳' : '病情波动，需警惕药物依赖或发作频率'}`}
                    </p>
                    <p>
                        <span className="font-bold text-slate-800">2. 干预建议：</span>
                        {csiResult.score < 60 ? '目前病情控制不佳，系统已自动为您生成“血药浓度监测”医嘱，请尽快执行。' : '病情相对平稳，请继续保持当前生活方式，注意避免已知诱因。'}
                    </p>
                </div>
            </div>

            <div className="hidden print:block mt-8 text-center">
                <div className="border-t border-slate-300 pt-4 text-[9px] text-slate-500 flex justify-between">
                    <span>医师签名: ________________</span>
                    <span>打印日期: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            <Button fullWidth onClick={onBackToHome} className="bg-slate-800 shadow-xl py-4 no-print">
                返回首页
            </Button>
        </div>

        {/* Emergency Modal */}
        {showEmergencyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl relative overflow-hidden border-t-8 border-red-500">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
                        🚨
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">紧急就诊提醒</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium text-justify px-2">
                        基于您的深度测评及历史数据，系统检测到<span className="text-red-600 font-bold">高风险指征</span>。
                        <br/>
                        {csiResult.flags.length > 0 && <span className="block mt-2 bg-red-50 text-red-700 p-2 rounded text-[10px] font-bold">原因: {csiResult.flags.join('; ')}</span>}
                    </p>
                    <div className="space-y-3">
                        <Button fullWidth onClick={() => setShowEmergencyModal(false)} className="bg-red-600 hover:bg-red-700 shadow-red-500/30 border-none text-white">
                            我已知晓，查看就医凭证
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {showPassport && <ReferralSystem onClose={() => setShowPassport(false)} />}

      </div>
    </Layout>
  );
};

export default ReportView;
