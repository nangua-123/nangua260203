
import React, { useEffect, useState, useRef } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from './Layout';
import Button from './Button';

// Declare Chart.js type for TypeScript
declare const Chart: any;

interface ReportViewProps {
  score: number;
  diseaseType: DiseaseType;
  onBackToHome: () => void;
  onIntervention?: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome, onIntervention }) => {
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Determine Risk Logic
    let r = RiskLevel.LOW;
    let title = "";
    let desc = "";

    if (score >= 60) {
        r = RiskLevel.HIGH;
        title = "高风险预警";
        desc = `AI 分诊模型分析显示风险指数为 ${score}。建议立即启动干预机制，并完善临床级量表评估。`;
    } else if (score >= 30) {
        r = RiskLevel.MODERATE;
        title = "中度风险";
        desc = "症状处于波动期，建议进行周期性监测。";
    } else {
        r = RiskLevel.LOW;
        title = "风险较低";
        desc = "未发现明显异常，建议保持健康生活方式。";
    }

    setRisk(r);
    setReportTitle(title);
    setReportDesc(desc);

    // --- Chart.js Rendering ---
    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        
        // Mock 7-day data
        const labels = ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Today'];
        const dataPoints = [35, 42, 38, 45, 50, 48, score];
        const color = score >= 60 ? '#E11D48' : (score >= 30 ? '#F59E0B' : '#10B981');
        const bgGradient = ctx!.createLinearGradient(0, 0, 0, 200);
        bgGradient.addColorStop(0, score >= 60 ? 'rgba(225, 29, 72, 0.2)' : 'rgba(16, 185, 129, 0.2)');
        bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '风险趋势',
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: bgGradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: color,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleFont: { size: 10 },
                        bodyFont: { size: 12, weight: 'bold' },
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 }, color: '#94A3B8' }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: '#F1F5F9', borderDash: [4, 4] },
                        ticks: { font: { size: 9 }, color: '#94A3B8', stepSize: 20 }
                    }
                }
            }
        });
    }

    return () => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
    };

  }, [score, diseaseType]);

  const getRiskColor = () => {
    if (risk === RiskLevel.HIGH) return 'bg-rose-600 text-white';
    if (risk === RiskLevel.MODERATE) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <Layout headerTitle="AI 预诊报告" hideHeader>
      <div className="relative min-h-screen bg-slate-50 pb-8">
        {/* Header Risk Card */}
        <div className={`${getRiskColor()} pt-12 pb-24 px-6 rounded-b-[2.5rem] text-center shadow-lg relative overflow-hidden transition-colors duration-500`}>
            <div className="relative z-10">
                <div className="text-xs font-medium uppercase tracking-widest opacity-80 mb-2">RISK ASSESSMENT</div>
                <h2 className="text-3xl font-bold mb-1">{reportTitle}</h2>
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium mt-2">
                    风险指数: {score}
                </div>
            </div>
        </div>

        {/* Content Card */}
        <div className="mx-4 -mt-16 relative z-20 space-y-5 animate-slide-up">
            
            {/* 1. Risk Trend Chart */}
            <div className="bg-white rounded-2xl shadow-card p-4 border border-slate-50">
                 <h3 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-2 px-2">
                    <span className="w-1 h-3 bg-slate-800 rounded-full"></span>
                    近7日风险评分趋势
                 </h3>
                 <div className="h-48 w-full">
                     <canvas ref={canvasRef}></canvas>
                 </div>
            </div>

            {/* 2. Analysis Box */}
            <div className="bg-white rounded-2xl shadow-card p-6 border border-slate-50">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    AI 智能临床解读
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                    {reportDesc}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                    <span>报告时间: {new Date().toLocaleTimeString()}</span>
                    <span>ID: {Math.floor(Math.random() * 100000)}</span>
                </div>
            </div>

            {/* 3. Action Triage */}
            {risk === RiskLevel.HIGH ? (
                <div className="bg-white rounded-2xl shadow-card p-1 border border-rose-100 overflow-hidden">
                     <div className="bg-rose-50 px-4 py-3 border-b border-rose-100">
                         <span className="text-xs font-bold text-rose-600 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                            建议立即干预
                         </span>
                     </div>
                     <div className="p-5 text-center">
                         <h4 className="font-bold text-slate-800 text-sm mb-2">已为您匹配专家深度评估方案</h4>
                         <p className="text-xs text-slate-500 mb-6 px-2">
                            需进一步完善 MIDAS/AD8 等临床量表，以获取华西专家复核权益。
                         </p>
                         <Button 
                            fullWidth 
                            className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30 animate-pulse-fast"
                            onClick={onIntervention || onBackToHome}
                        >
                            去处理 (解锁评估)
                         </Button>
                     </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-card p-5 border border-green-100 flex flex-col items-center text-center">
                     <h4 className="font-bold text-green-800 text-sm mb-1">保持健康监测</h4>
                     <p className="text-xs text-green-700 leading-tight mb-4">
                        建议开启日常健康打卡，预防病情波动。
                     </p>
                     <Button size="sm" onClick={onBackToHome} className="bg-green-600 shadow-none">返回首页</Button>
                </div>
            )}
            
            {risk === RiskLevel.HIGH && (
                <p className="text-center text-[10px] text-slate-300 pb-4">
                    点击处理将为您导流至专业评估工具
                </p>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportView;
