
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { ReferralSystem } from '../components/business/ReferralSystem';
import { calculateCSI, CSIResult, calculateGPAQScore, calculateSBQScore, GPAQResult, SBQResult } from '../utils/scoringEngine';

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

// --- Helper: Label Mapping for V0 Fields ---
const MAP_DICT: Record<string, string> = {
    'tap': '自来水', 'barrel': '桶装水', 'well': '井水', 'purified': '净化水', 'distilled': '纯净水', 'mineral': '矿泉水',
    'rapeseed': '菜籽油', 'soybean': '大豆油', 'peanut': '花生油', 'olive': '橄榄油', 'corn': '玉米油', 'sesame': '芝麻油', 'animal': '动物油',
    'oily': '油腻', 'spicy': '辛辣', 'salty': '咸味', 'light': '清淡', 'sweet': '偏甜',
    'oxygen': '吸氧', 'acetazolamide': '乙酰唑胺', 'dexamethasone': '地塞米松', 'rhodiola': '红景天', 'salvia': '丹参', 'adaptation': '阶梯习服'
};

const getLabels = (keys: string[]) => keys?.map(k => MAP_DICT[k] || k).join('、') || '未记录';

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome, onIntervention }) => {
  const { state, dispatch } = useApp();
  const { lastDiagnosis, user } = state;
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [csiResult, setCsiResult] = useState<CSIResult>({ score: 100, trend: 'STABLE', flags: [] });
  
  // Metabolic Results State
  const [gpaqResult, setGpaqResult] = useState<GPAQResult | null>(null);
  const [sbqResult, setSbqResult] = useState<SBQResult | null>(null);

  const [reportTitle, setReportTitle] = useState("");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showPassport, setShowPassport] = useState(false); 
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  // Chart Mode State: SHORT_TERM (Daily) vs LONG_TERM (Follow-up)
  const [chartMode, setChartMode] = useState<'SHORT_TERM' | 'LONG_TERM'>('SHORT_TERM');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null); // [NEW] Ref for Radar Chart
  const chartInstance = useRef<any>(null);
  const radarInstance = useRef<any>(null); // [NEW] Instance for Radar

  // 0分代表未测评/基础模式 -> 低风险处理
  const actualScore = score || 5; 

  // --- Data Mapping: Short Term (Daily Logs) ---
  const shortTermData = useMemo(() => {
      const days = 30;
      const now = Date.now();
      const oneDay = 86400000;
      const labels = [];
      const dataA = new Array(days).fill(0);
      const dataB = new Array(days).fill(0);
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
          medLogs.forEach(log => {
              const idx = getDayIndex(log.timestamp);
              if (idx !== -1) { dataB[idx] += 1; dataA[idx] = Math.max(dataA[idx], log.painScale || 0); }
          });
      } else if (diseaseType === DiseaseType.EPILEPSY) {
          const seizures = user.epilepsyProfile?.seizureHistory || [];
          seizures.forEach(sz => {
              const idx = getDayIndex(sz.timestamp);
              if (idx !== -1) dataA[idx] += 1;
          });
      }
      return { labels, dataA, dataB };
  }, [diseaseType, user.medicationLogs, user.epilepsyProfile?.seizureHistory]);

  // --- Data Mapping: Long Term (Follow-up V0-V5) ---
  const longTermData = useMemo(() => {
      if (diseaseType !== DiseaseType.EPILEPSY) return null;
      const schedule = user.epilepsyProfile?.followUpSchedule || [];
      const completed = schedule.filter(s => s.status === 'COMPLETED').sort((a, b) => a.targetDate - b.targetDate);
      
      // If mock profile exists, we want to show it even if schedule is sparse, but schedule logic should handle it.
      // With MOCK_EPILEPSY_PROFILE in AppContext, this should populate.
      
      if (completed.length === 0 && !user.epilepsyProfile?.baselineDate) return null;
      
      const labels: string[] = [];
      const seizureData: number[] = [];
      const tdmData: number[] = [];
      
      if (user.epilepsyProfile?.baselineDate) {
          labels.push('V0(基线)');
          const baselineFreqYear = user.epilepsyProfile.researchData?.seizureDetails?.frequencyYear || 0;
          seizureData.push(Math.round(baselineFreqYear / 4)); 
          tdmData.push(0);
      }
      completed.forEach(s => {
          labels.push(s.title.split(' ')[0]);
          seizureData.push(s.data?.seizure_count_total || 0);
          tdmData.push(s.data?.tdm_value || 0);
      });
      return { labels, seizureData, tdmData };
  }, [diseaseType, user.epilepsyProfile]);

  // --- CSI & Metabolic Calculation ---
  useEffect(() => {
      const medLogs = user.medicationLogs || [];
      const seizureHist = user.epilepsyProfile?.seizureHistory || [];
      const rawFrequency = user.epilepsyProfile?.researchData?.highAltitudeHistory?.entryFrequency;
      const returnFreq = rawFrequency ? parseInt(rawFrequency, 10) : 0;
      const result = calculateCSI(diseaseType, medLogs, seizureHist, actualScore, { returnFrequency: isNaN(returnFreq) ? 0 : returnFreq });
      setCsiResult(result);

      if (diseaseType === DiseaseType.EPILEPSY) {
          const schedule = user.epilepsyProfile?.followUpSchedule || [];
          const latestData = schedule.filter(s => s.status === 'COMPLETED' && s.data).sort((a,b) => (b.completionDate || 0) - (a.completionDate || 0))[0]?.data;
          const draftAnswers = state.assessmentDraft?.answers;
          const sourceData = latestData || draftAnswers;
          if (sourceData) {
              if (sourceData['vigorous_work_days'] !== undefined) setGpaqResult(calculateGPAQScore(sourceData));
              if (sourceData['sbq_wd_0'] !== undefined) setSbqResult(calculateSBQScore(sourceData));
          }
      }

      if (result.score < 60) {
          const hasExistingOrder = user.medicalOrders?.some(o => o.type === 'LAB_TEST' && o.status === 'PENDING');
          if (!hasExistingOrder) {
              dispatch({
                  type: 'ADD_MEDICAL_ORDER',
                  payload: { id: `ord_auto_${Date.now()}`, type: 'LAB_TEST', title: '建议完善血药浓度监测', description: `CSI指数 (${result.score}) 提示病情波动，建议复查 TDM 以调整治疗方案。`, priority: 'HIGH', status: 'PENDING', targetView: 'profile', issuedAt: Date.now(), doctorName: 'AI CDSS 系统' }
              });
          }
      }
  }, [diseaseType, user.medicationLogs, user.epilepsyProfile?.seizureHistory, user.epilepsyProfile?.researchData, actualScore, dispatch, user.medicalOrders, user.epilepsyProfile?.followUpSchedule, state.assessmentDraft]);

  // --- Main Chart Rendering ---
  useEffect(() => {
    if (actualScore >= 60) { setRisk(RiskLevel.HIGH); setReportTitle("高风险 · 需就医"); setTimeout(() => setShowEmergencyModal(true), 800); } 
    else if (actualScore >= 30) { setRisk(RiskLevel.MODERATE); setReportTitle("中度风险 · 需关注"); } 
    else { setRisk(RiskLevel.LOW); setReportTitle("低风险 · 正常"); }

    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        let config: any = {};
        
        // Ant Design Style Config
        const commonOptions = {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } },
                title: { display: true, font: { size: 12, weight: 'bold' }, padding: { bottom: 20 } }
            },
            elements: {
                line: { tension: 0.4 },
                point: { radius: 3, hitRadius: 10 }
            }
        };

        if (diseaseType === DiseaseType.EPILEPSY && chartMode === 'LONG_TERM' && longTermData) {
            config = {
                type: 'bar',
                data: {
                    labels: longTermData.labels,
                    datasets: [
                        { type: 'bar', label: '发作频次 (次)', data: longTermData.seizureData, backgroundColor: '#FF4D4F', borderRadius: 4, order: 2, yAxisID: 'y' },
                        { type: 'line', label: 'TDM 浓度 (ug/ml)', data: longTermData.tdmData, borderColor: '#1677FF', backgroundColor: 'rgba(22, 119, 255, 0.1)', borderWidth: 2, order: 1, yAxisID: 'y1' }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: '全病程随访趋势 (V0-V5)' } },
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '发作' }, grid: { display: false } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { borderDash: [2, 4] }, title: { display: true, text: 'TDM' } },
                        x: { grid: { display: false } }
                    }
                }
            };
        } else if (diseaseType === DiseaseType.MIGRAINE) {
            config = {
                type: 'bar',
                data: {
                    labels: shortTermData.labels,
                    datasets: [
                        { type: 'line', label: '痛感 (VAS)', data: shortTermData.dataA, borderColor: '#FF4D4F', borderWidth: 2, yAxisID: 'y' },
                        { type: 'bar', label: '用药', data: shortTermData.dataB, backgroundColor: 'rgba(22, 119, 255, 0.5)', yAxisID: 'y1' }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: '近30天 病情-用药关联趋势' } },
                    scales: {
                        x: { grid: { display: false }, ticks: { display: false } },
                        y: { type: 'linear', position: 'left', min: 0, max: 10, title: { display: true, text: 'VAS' } },
                        y1: { type: 'linear', position: 'right', min: 0, max: 5, grid: { display: false } }
                    }
                }
            };
        } else {
             config = {
                type: 'line',
                data: { labels: shortTermData.labels, datasets: [{ label: '状态趋势', data: shortTermData.dataA, borderColor: '#1677FF', backgroundColor: 'rgba(22, 119, 255, 0.1)', fill: true }] },
                options: { ...commonOptions, plugins: { title: { display: true, text: '近30天日志' } } }
            };
        }
        chartInstance.current = new Chart(ctx, config);
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [actualScore, diseaseType, shortTermData, longTermData, chartMode]);

  // --- Radar Chart Rendering (Metabolic) ---
  useEffect(() => {
      if (gpaqResult && radarRef.current && typeof Chart !== 'undefined') {
          if (radarInstance.current) radarInstance.current.destroy();
          const ctx = radarRef.current.getContext('2d');
          
          radarInstance.current = new Chart(ctx, {
              type: 'radar',
              data: {
                  labels: ['工作相关', '交通出行', '休闲运动'],
                  datasets: [{
                      label: '代谢当量 (METs)',
                      data: [gpaqResult.breakdown.workMETs, gpaqResult.breakdown.transportMETs, gpaqResult.breakdown.recMETs],
                      backgroundColor: 'rgba(22, 119, 255, 0.2)', // Ant Blue 6
                      borderColor: '#1677FF',
                      pointBackgroundColor: '#1677FF',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: '#1677FF'
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  elements: { line: { borderWidth: 2 } },
                  scales: {
                      r: {
                          angleLines: { display: true, color: 'rgba(0,0,0,0.05)' },
                          grid: { color: 'rgba(0,0,0,0.05)' },
                          ticks: { display: false, backdropColor: 'transparent' }, // Clean look
                          pointLabels: { font: { size: 10, weight: 'bold' }, color: '#64748B' },
                          suggestedMin: 0,
                          suggestedMax: 1000 
                      }
                  },
                  plugins: {
                      legend: { display: false },
                      title: { display: false }
                  }
              }
          });
      }
      return () => { if (radarInstance.current) radarInstance.current.destroy(); };
  }, [gpaqResult]);

  const getTheme = () => {
      if (risk === RiskLevel.HIGH) return { bg: 'bg-[#FF4D4F]', light: 'bg-rose-50', text: 'text-[#FF4D4F]', border: 'border-rose-100', icon: '🚨' };
      if (risk === RiskLevel.MODERATE) return { bg: 'bg-[#FA8C16]', light: 'bg-orange-50', text: 'text-[#FA8C16]', border: 'border-orange-100', icon: '⚠️' };
      return { bg: 'bg-[#52C41A]', light: 'bg-emerald-50', text: 'text-[#52C41A]', border: 'border-emerald-100', icon: '✅' };
  };
  const theme = getTheme();

  const handlePrint = () => { setIsPrintMode(true); setTimeout(() => { window.print(); setIsPrintMode(false); }, 500); };
  const researchData = user.epilepsyProfile?.researchData;
  const isHighAltitudeRisk = csiResult.flags.some(f => f.includes('ALTITUDE_RISK'));

  return (
    <Layout headerTitle="测评与分流报告" hideHeader>
        <style>{`
            @media print {
                body * { visibility: hidden; }
                #medical-report-container, #medical-report-container * { visibility: visible; }
                #medical-report-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white; color: black; }
                .no-print { display: none !important; }
                canvas { min-height: 300px !important; width: 100% !important; }
            }
        `}</style>

      <div className="min-h-screen bg-[#F5F5F5] pb-8 relative">
        {csiResult.score < 60 && (
            <div className="bg-[#FF4D4F] text-white px-4 py-3 text-center animate-pulse sticky top-0 z-50 shadow-lg">
                <div className="flex items-center justify-center gap-2"><span className="text-xl">📉</span><div><h3 className="text-xs font-black uppercase tracking-widest">临床稳定性指数 (CSI) 警报</h3><p className="text-[10px] font-bold">CSI = {csiResult.score} (不稳定) · 病情波动剧烈</p></div></div>
            </div>
        )}

        <div className={`${theme.bg} pt-12 pb-24 px-6 rounded-b-[32px] text-center shadow-lg transition-colors duration-500 relative no-print`}>
            <button onClick={handlePrint} className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md transition-colors flex items-center gap-1 active:scale-95"><span>🖨️</span> 打印报告</button>
            <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] mb-2">CLINICAL RISK ASSESSMENT</div>
            <h2 className="text-3xl font-black text-white mb-2">{reportTitle}</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full"><span className="text-white text-xs font-bold">华西 AI 评分</span><span className="text-white text-xl font-black">{actualScore}</span></div>
        </div>

        <div id="medical-report-container" className="px-4 -mt-20 relative z-10 space-y-4 animate-slide-up">
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6 pt-4"><h1 className="text-2xl font-serif font-bold tracking-widest">四川大学华西医院</h1><h2 className="text-sm font-bold uppercase mt-1 text-slate-600">神经内科专科电子病历</h2><div className="flex justify-between mt-4 text-xs font-mono text-slate-500"><span>ID: {user.id.split('_')[1]}</span><span>Date: {new Date().toLocaleDateString()}</span></div></div>

            {/* Main Chart Card (Rounded-2xl) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:shadow-none print:border-2 print:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[14px] font-black text-slate-800 flex items-center gap-2"><span>📈</span> {chartMode === 'LONG_TERM' ? '全病程随访趋势 (V0-V5)' : '近30天发作日志'}</h4>
                    {diseaseType === DiseaseType.EPILEPSY && longTermData && (
                        <div className="flex bg-slate-100 rounded-lg p-0.5 no-print">
                            <button onClick={() => setChartMode('SHORT_TERM')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${chartMode === 'SHORT_TERM' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>日志</button>
                            <button onClick={() => setChartMode('LONG_TERM')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${chartMode === 'LONG_TERM' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>趋势</button>
                        </div>
                    )}
                    {!longTermData && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold no-print">近30天</span>}
                </div>
                <div className="h-64 w-full relative"><canvas ref={canvasRef} className="relative z-10"></canvas></div>
                <div className="mt-2 text-[10px] text-slate-400 text-center italic no-print">{chartMode === 'LONG_TERM' ? '*数据源自您的临床随访记录 (Follow-up)' : `*数据源自您的真实打卡记录 (N=${diseaseType === DiseaseType.MIGRAINE ? (user.medicationLogs?.length||0) : (user.epilepsyProfile?.seizureHistory?.length||0)})`}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 print:grid-cols-2 print:gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 print:border-slate-300"><div className="text-[10px] text-slate-400 font-bold uppercase mb-1">CSI 稳定性指数</div><div className={`text-2xl font-black ${csiResult.score < 60 ? 'text-[#FF4D4F]' : 'text-[#52C41A]'}`}>{csiResult.score}<span className="text-[10px] ml-1 text-slate-400 font-normal">/ 100</span></div><div className="text-[10px] text-slate-500 mt-1">{csiResult.trend === 'STABLE' ? '病情稳定' : csiResult.trend === 'FLUCTUATING' ? '存在波动' : '恶化趋势'}</div></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 print:border-slate-300"><div className="text-[10px] text-slate-400 font-bold uppercase mb-1">关键预警指标</div><div className="text-sm font-black text-slate-800">{csiResult.flags.length > 0 ? csiResult.flags[0] : '无异常风险标记'}</div>{csiResult.flags.length > 1 && (<div className="text-[10px] text-[#FF4D4F] mt-1 font-bold">+{csiResult.flags.length - 1} 个其他风险项</div>)}</div>
            </div>

            {/* Metabolic Analysis Card */}
            {diseaseType === DiseaseType.EPILEPSY && (gpaqResult || sbqResult) && (
                <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border-slate-300`}>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[14px] font-black text-slate-800 flex items-center gap-2"><span>🏃</span> 高原代谢与生活方式</h4>
                        {gpaqResult && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${gpaqResult.level === 'HIGH' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : gpaqResult.level === 'MODERATE' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {gpaqResult.level === 'HIGH' ? '高活跃' : gpaqResult.level === 'MODERATE' ? '中等' : '低活跃'}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* GPAQ Radar */}
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 relative overflow-hidden">
                            {gpaqResult && (
                                <>
                                    <div className="absolute top-2 left-3 z-10 pointer-events-none">
                                        <div className="text-[10px] text-blue-400 font-bold">周代谢当量</div>
                                        <div className="text-xl font-black text-[#1677FF] tracking-tighter">{gpaqResult.totalMETs}</div>
                                    </div>
                                    <div className="h-32 mt-4">
                                        <canvas ref={radarRef}></canvas>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SBQ Sedentary */}
                        <div className="flex flex-col gap-3">
                            {sbqResult && (
                                <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-center ${sbqResult.risk === 'SEDENTARY_DANGER' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className={`text-[10px] font-bold mb-1 ${sbqResult.risk === 'SEDENTARY_DANGER' ? 'text-orange-500' : 'text-slate-400'}`}>日均静坐时长</div>
                                    <div className={`text-2xl font-black tracking-tighter ${sbqResult.risk === 'SEDENTARY_DANGER' ? 'text-orange-600' : 'text-slate-800'}`}>{Math.floor(sbqResult.averageDailyMinutes / 60)}h {sbqResult.averageDailyMinutes % 60}m</div>
                                    {sbqResult.risk === 'SEDENTARY_DANGER' && <div className="text-[10px] text-orange-600 mt-1 font-bold">⚠️ 久坐风险高</div>}
                                </div>
                            )}
                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-tight">
                                <span className="font-bold">建议：</span>
                                {gpaqResult?.level === 'LOW' ? '当前体力活动不足，建议增加快走。' : '保持当前活动水平。'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {diseaseType === DiseaseType.EPILEPSY && researchData && (
                <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border-slate-300 relative overflow-hidden ${isHighAltitudeRisk ? 'ring-2 ring-red-100' : ''}`}>
                    <div className="flex justify-between items-center mb-4 relative z-10"><h4 className="text-[14px] font-black text-slate-800 flex items-center gap-2"><span>🏔️</span> 高原环境因子</h4>{isHighAltitudeRisk && (<span className="text-[10px] bg-red-50 text-[#FF4D4F] px-2 py-0.5 rounded font-bold border border-red-100">环境高危</span>)}</div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100"><div className="text-[10px] text-blue-400 font-bold mb-1">环境因子</div><div className="text-xs font-black text-blue-900">海拔 {researchData.demographics.altitude}m</div><div className="text-[10px] text-blue-600 mt-1">气压 {researchData.demographics.pressure || 1000}mmHg</div></div>
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100"><div className="text-[10px] text-orange-400 font-bold mb-1">饮食偏好</div><div className="text-[10px] font-bold text-orange-900 leading-tight">{getLabels((state.assessmentDraft?.answers?.taste_preference as string[]) || [])}</div><div className="text-[10px] text-orange-600 mt-1 truncate">{getLabels((state.assessmentDraft?.answers?.cooking_oil_type as string[]) || [])}</div></div>
                    </div>
                    {isHighAltitudeRisk && (<div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 relative z-10"><div className="text-[10px] font-bold text-[#FF4D4F] flex items-center gap-1 mb-1">⚠️ 检测到频繁往返平原风险</div><p className="text-[10px] text-red-600 leading-relaxed">近3个月往返平原次数 ≥4次。海拔急剧变化可能降低癫痫发作阈值。</p></div>)}
                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 pointer-events-none">🏔️</div>
                </div>
            )}

            {risk === RiskLevel.HIGH && (
                <>
                    <div onClick={() => setShowPassport(true)} className="bg-white rounded-2xl p-6 shadow-xl border-t-4 border-[#FF4D4F] text-center relative overflow-hidden active:scale-95 transition-transform cursor-pointer group">
                        <div className="absolute top-2 right-2 text-[10px] bg-red-50 text-[#FF4D4F] px-2 py-0.5 rounded font-bold group-hover:bg-red-100 transition-colors">点击打开通行证</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Digital Living Record</div>
                        <div className="w-48 h-48 bg-slate-900 mx-auto rounded-xl p-3 flex items-center justify-center mb-4 shadow-lg relative"><div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent w-full h-full animate-[scan_2s_infinite]"></div><div className="w-full h-full bg-slate-800 rounded flex flex-col items-center justify-center text-white gap-2"><span className="text-4xl animate-pulse">🔒</span><span className="text-[10px] font-mono text-slate-400">AES-256 ENCRYPTED</span></div></div>
                        <div className="text-sm font-black text-slate-800">数字活病历通行证</div>
                        <p className="text-[10px] text-slate-500 mt-1 mb-4">医师扫码可获取：MRI影像、用药史、认知量表详情</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2"><span>🏥</span> 推荐协作医院 (LBS 匹配)</h4><div className="p-3 bg-slate-50 rounded-xl mb-3"><div className="font-bold text-xs text-slate-800">四川大学华西医院 (本部)</div><div className="text-[10px] text-slate-500 mt-1">距离 2.3km · 神经内科 · 专家号源充足</div><div className="mt-2 flex gap-2"><span className="text-[10px] border border-slate-200 px-1 rounded text-slate-400">三甲</span><span className="text-[10px] border border-slate-200 px-1 rounded text-slate-400">医保定点</span></div></div></div>
                </>
            )}

            {risk !== RiskLevel.HIGH && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center"><div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mb-3">🍃</div><h3 className="font-black text-slate-800 text-sm">享受基础免费管理服务</h3><p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-4 mb-4">您的风险处于可控范围，App 将为您提供全免费的日常健康管理支持。</p><div className="grid grid-cols-2 gap-3 w-full"><Button variant="outline" className="text-xs bg-slate-50 border-slate-200" onClick={onBackToHome}>💊 用药提醒</Button><Button variant="outline" className="text-xs bg-slate-50 border-slate-200" onClick={onBackToHome}>📝 症状打卡</Button></div></div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:border-slate-300"><h4 className="text-[14px] font-black text-slate-800 mb-3 flex items-center gap-2"><span>👨‍⚕️</span> 华西专家诊疗建议</h4><div className="text-[11px] leading-relaxed text-slate-600 space-y-2 text-justify"><p><span className="font-bold text-slate-800">1. 诊断印象：</span> {lastDiagnosis?.reason || `CSI指数(${csiResult.score})提示${csiResult.trend === 'STABLE' ? '病情平稳' : '病情波动，需警惕药物依赖或发作频率'}`}</p><p><span className="font-bold text-slate-800">2. 干预建议：</span>{csiResult.score < 60 ? '目前病情控制不佳，系统已自动为您生成“血药浓度监测”医嘱，请尽快执行。' : '病情相对平稳，请继续保持当前生活方式，注意避免已知诱因。'}</p></div></div>
            <div className="hidden print:block mt-8 text-center"><div className="border-t border-slate-300 pt-4 text-[9px] text-slate-500 flex justify-between"><span>医师签名: ________________</span><span>打印日期: {new Date().toLocaleDateString()}</span></div></div>
            <Button fullWidth onClick={onBackToHome} className="bg-slate-800 shadow-xl py-4 no-print">返回首页</Button>
        </div>

        {showEmergencyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-sm rounded-[32px] p-6 text-center shadow-2xl relative overflow-hidden border-t-8 border-[#FF4D4F]"><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">🚨</div><h3 className="text-xl font-black text-slate-900 mb-2">紧急就诊提醒</h3><p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium text-justify px-2">基于您的深度测评及历史数据，系统检测到<span className="text-[#FF4D4F] font-bold">高风险指征</span>。<br/>{csiResult.flags.length > 0 && <span className="block mt-2 bg-red-50 text-[#FF4D4F] p-2 rounded text-[10px] font-bold">原因: {csiResult.flags.join('; ')}</span>}</p><div className="space-y-3"><Button fullWidth onClick={() => setShowEmergencyModal(false)} className="bg-[#FF4D4F] hover:bg-red-700 shadow-red-500/30 border-none text-white">我已知晓，查看就医凭证</Button></div></div></div>
        )}
        {showPassport && <ReferralSystem onClose={() => setShowPassport(false)} />}
      </div>
    </Layout>
  );
};

export default ReportView;
