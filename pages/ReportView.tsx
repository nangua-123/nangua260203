
import React, { useEffect, useState, useRef } from 'react';
import { RiskLevel, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext'; // [NEW]

// Declare Chart.js type for TypeScript
declare const Chart: any;

interface ReportViewProps {
  score: number;
  diseaseType: DiseaseType;
  onBackToHome: () => void;
  onIntervention?: () => void;
}

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
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [reportTitle, setReportTitle] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // 0分代表未测评/基础模式 -> 低风险处理
  const actualScore = score || 5; 

  useEffect(() => {
    // 风险分级逻辑
    if (actualScore >= 60) {
        setRisk(RiskLevel.HIGH);
        setReportTitle("高风险 · 需就医");
        // PRD Req: "重症...强制弹窗'紧急就诊提醒'（仅医疗预警，无商业引导）"
        setTimeout(() => setShowEmergencyModal(true), 800);
    } else if (actualScore >= 30) {
        setRisk(RiskLevel.MODERATE);
        setReportTitle("中度风险 · 需关注");
    } else {
        setRisk(RiskLevel.LOW);
        setReportTitle("低风险 · 正常");
    }

    // Chart.js 渲染
    if (canvasRef.current && typeof Chart !== 'undefined') {
        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        const color = actualScore >= 60 ? '#EF4444' : (actualScore >= 30 ? '#F59E0B' : '#10B981');
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Today'],
                datasets: [{
                    label: 'Risk',
                    data: [30, 35, 40, 38, 45, 50, actualScore],
                    borderColor: color,
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [actualScore]);

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
        <div className={`${theme.bg} pt-12 pb-20 px-6 rounded-b-[40px] text-center shadow-lg transition-colors duration-500`}>
            <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] mb-2">CLINICAL RISK ASSESSMENT</div>
            <h2 className="text-3xl font-black text-white mb-2">{reportTitle}</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">华西 AI 评分</span>
                <span className="text-white text-xl font-black">{actualScore}</span>
            </div>
        </div>

        <div className="px-5 -mt-14 relative z-10 space-y-5 animate-slide-up">
            
            {/* 2. 重症路径：就医凭证 & 协作医院 (PRD Req: "含深度测评报告、线上病史的就医二维码") */}
            {risk === RiskLevel.HIGH && (
                <>
                    <div className="bg-white rounded-[24px] p-6 shadow-xl border-t-4 border-rose-500 text-center relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-bold">点击保存/打印</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Offline Medical Pass</div>
                        <div className="w-48 h-48 bg-slate-900 mx-auto rounded-xl p-3 flex items-center justify-center mb-4 shadow-lg">
                            {/* 模拟二维码 */}
                            <div className="w-full h-full bg-white rounded flex items-center justify-center text-slate-900 font-mono text-xs break-all px-2 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HuaxiMedicalPass')] bg-contain bg-no-repeat bg-center">
                            </div>
                        </div>
                        <div className="text-sm font-black text-slate-800">线下就诊绿色通道凭证</div>
                        <p className="text-[10px] text-slate-500 mt-1 mb-4">已包含您的深度测评报告及 AI 病史摘要</p>
                    </div>

                    {/* PRD Req: "LBS 算法自动匹配协作医院... 全免费" */}
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
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <div className="font-bold text-xs text-slate-800">成都市第三人民医院</div>
                            <div className="text-[10px] text-slate-500 mt-1">距离 4.1km · 脑血管病中心</div>
                        </div>
                    </div>

                    {/* PRD Req: "就诊前准备清单" & "针对性检查建议清单" */}
                    <div className="bg-rose-50 rounded-[24px] p-5 border border-rose-100">
                        <h4 className="font-black text-rose-800 text-sm mb-2">📋 就诊前准备清单</h4>
                        <ul className="text-[11px] text-rose-700 space-y-2 list-disc list-inside mb-4">
                            <li>携带身份证 / 医保卡原件</li>
                            <li>携带既往 CT/MRI 胶片及报告</li>
                            <li>记录近 3 天发作频率 (可导出 App 记录)</li>
                            <li>建议家属陪同就诊</li>
                        </ul>
                        <div className="h-px bg-rose-200 w-full mb-3"></div>
                        <h4 className="font-black text-rose-800 text-sm mb-2">💊 建议检查项目 (仅供参考)</h4>
                        <ul className="text-[11px] text-rose-700 space-y-1 list-none">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-rose-400 rounded-full"></span> 3.0T 头颅 MRI 平扫
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-rose-400 rounded-full"></span> 长程视频脑电图 (24h)
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* 3. 轻症路径：健康科普 & 基础干预 (PRD Req: "享受线上全免费功能... 推送个性化健康科普") */}
            {risk !== RiskLevel.HIGH && (
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

      </div>
    </Layout>
  );
};

export default ReportView;
