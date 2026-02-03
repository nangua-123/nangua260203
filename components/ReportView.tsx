
import React, { useEffect, useState } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from './Layout';
import Button from './Button';

interface ReportViewProps {
  score: number;
  diseaseType: DiseaseType;
  onBackToHome: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ score, diseaseType, onBackToHome }) => {
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [nearestHospital, setNearestHospital] = useState<string | null>(null);

  useEffect(() => {
    // Determine Risk and Text based on Clinical Guidelines
    let r = RiskLevel.LOW;
    let title = "";
    let desc = "";

    if (diseaseType === DiseaseType.MIGRAINE) {
        // MIDAS Grading
        if (score >= 21) {
            r = RiskLevel.HIGH;
            title = "IV 级 - 重度功能丧失";
            desc = `MIDAS得分 ${score}。显示偏头痛已严重影响您的日常生活和工作。属于高度致残性头痛，建议立即启动预防性治疗。`;
        } else if (score >= 11) {
            r = RiskLevel.MODERATE;
            title = "III 级 - 中度功能丧失";
            desc = `MIDAS得分 ${score}。头痛对生活造成了显著干扰。建议进行药物干预及生活方式调整。`;
        } else {
            r = RiskLevel.LOW;
            title = "I-II 级 - 轻度或无功能丧失";
            desc = `MIDAS得分 ${score}。目前头痛处于可控范围，建议继续保持观察记录。`;
        }
    } else if (diseaseType === DiseaseType.COGNITIVE) {
        // AD8 Scoring: >= 2 suggests impairment
        if (score >= 2) {
            r = RiskLevel.HIGH;
            title = "存在认知障碍风险";
            desc = `AD8筛查得分 ${score}/8。结果提示可能存在早期认知功能改变。这不代表确诊痴呆，但强烈建议进行全面的神经心理学测试及影像检查。`;
        } else {
            r = RiskLevel.LOW;
            title = "认知功能基本正常";
            desc = `AD8筛查得分 ${score}/8。未发现明显的认知衰退迹象。建议进行脑健康训练以维持现状。`;
        }
    } else {
        // Generic / Epilepsy
        if (score >= 5) {
            r = RiskLevel.HIGH;
            title = "高风险预警";
            desc = "根据症状描述，存在神经系统异常放电的高风险特征，需立即完善长程视频脑电图。";
        } else {
            r = RiskLevel.LOW;
            title = "风险较低";
            desc = "暂未发现典型的发作性疾病特征，建议持续关注症状变化。";
        }
    }

    setRisk(r);
    setReportTitle(title);
    setReportDesc(desc);

    // Mock LBS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => setNearestHospital("四川大学华西医院 (距离 3.2km)"),
            () => setNearestHospital("成都市第一人民医院 [华西协作] (距离 1.5km)")
        );
    } else {
        setNearestHospital("四川大学华西医院 (总院)");
    }
  }, [score, diseaseType]);

  const getRiskColor = () => {
    if (risk === RiskLevel.HIGH) return 'bg-red-500 text-white';
    if (risk === RiskLevel.MODERATE) return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <Layout headerTitle="专业评估报告" hideHeader>
      <div className="relative min-h-screen bg-slate-50 pb-8">
        {/* Header Risk Card */}
        <div className={`${getRiskColor()} pt-12 pb-24 px-6 rounded-b-[2.5rem] text-center shadow-lg relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="text-xs font-medium uppercase tracking-widest opacity-80 mb-2">RISK ASSESSMENT</div>
                <h2 className="text-3xl font-bold mb-1">{reportTitle}</h2>
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium mt-2">
                    量表评分: {score}
                </div>
            </div>
        </div>

        {/* Content Card */}
        <div className="mx-4 -mt-16 relative z-20 space-y-5 animate-slide-up">
            
            {/* 1. Analysis Box */}
            <div className="bg-white rounded-2xl shadow-card p-6 border border-slate-50">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    AI 智能临床解读
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">
                    {reportDesc}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                    <span>报告生成时间: {new Date().toLocaleString()}</span>
                    <span>No. {Math.floor(Math.random() * 100000)}</span>
                </div>
            </div>

            {/* 2. Action Triage: Green Channel OR Membership */}
            {risk === RiskLevel.HIGH ? (
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-card p-1 border border-red-100 overflow-hidden">
                     {/* Voucher Header */}
                     <div className="bg-red-500/10 px-4 py-3 flex justify-between items-center border-b border-red-100">
                         <span className="text-xs font-bold text-red-600 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            高风险就医凭证
                         </span>
                         <span className="text-[10px] text-red-400">有效期 24小时</span>
                     </div>
                     
                     <div className="p-5">
                         <div className="flex gap-4">
                            <div className="bg-slate-900 w-24 h-24 rounded-lg flex items-center justify-center text-white text-xs text-center p-2 shadow-inner">
                                [AI QR CODE]
                                <br/>
                                <span className="opacity-50 scale-75 block mt-1">仅限本人</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm mb-1">华西医联体 · 绿色通道</h4>
                                <p className="text-xs text-slate-500 mb-3 leading-tight">
                                    凭此码前往指定协作医院，可享受免重复问诊及优先影像检查权益。
                                </p>
                                <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                    推荐: {nearestHospital || '定位中...'}
                                </div>
                            </div>
                         </div>
                     </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-card p-5 border border-green-100 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <h4 className="font-bold text-green-800 text-sm mb-1">转为长期健康管理</h4>
                        <p className="text-xs text-green-700 leading-tight mb-2">
                            目前状况稳定。开启数字化管理会员，获取每周健康周报及专家远程随访。
                        </p>
                        <div className="text-xs text-slate-400 line-through">原价 ¥699/年</div>
                    </div>
                    <div className="text-center">
                         <span className="block text-xl font-bold text-brand-600 mb-1">¥299</span>
                         <Button size="sm" className="shadow-none bg-green-600 hover:bg-green-700">立即开通</Button>
                    </div>
                </div>
            )}

            <Button variant="outline" fullWidth onClick={onBackToHome} className="mt-4">返回首页</Button>
            
            <p className="text-center text-[10px] text-slate-300 pb-4">
                本报告仅供医学参考，不能替代医生面诊诊断
            </p>
        </div>
      </div>
    </Layout>
  );
};

export default ReportView;
