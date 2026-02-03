
import React, { useState, useEffect } from 'react';
import { User, AppView, DiseaseType } from '../types';
import Button from './Button';

interface HomeViewProps {
  user: User;
  riskScore: number;
  hasDevice: boolean;
  onNavigate: (view: AppView) => void;
  primaryCondition: DiseaseType | null;
}

const HomeView: React.FC<HomeViewProps> = ({ user, riskScore, hasDevice, onNavigate, primaryCondition }) => {
  const [wavePath, setWavePath] = useState('');
  
  // Use passed risk score or default to safe if 0
  const displayScore = riskScore > 0 ? riskScore : 95;
  const isHighRisk = displayScore < 60 || riskScore > 80; // Assuming specific logic: if using "RiskScore" as 0-100 risk probability
  // Correction: Let's assume input is "Health Score". 
  // If we assume input is "Risk Score" (from Triage): Higher is worse.
  // If we assume input is "Health Score" (default): Higher is better.
  // Let's standardise: If it came from Triage (85%), it's Risk. If it's default (0), we show Health 95.
  
  const finalHealthScore = riskScore > 0 ? (100 - riskScore) : 95;
  
  const getRiskStatus = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: '健康', ring: 'stroke-emerald-500' };
    if (score >= 60) return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: '亚健康', ring: 'stroke-amber-500' };
    return { color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', text: '高风险', ring: 'stroke-rose-500' };
  };

  const status = getRiskStatus(finalHealthScore);

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

  return (
    <div className="bg-[#F7F8FA] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none">
      
      {/* 顶部看板 Dashboard */}
      <div className={`bg-white rounded-b-[32px] px-5 pt-[calc(1.2rem+env(safe-area-inset-top))] pb-6 shadow-sm transition-colors duration-500 ${finalHealthScore < 60 ? 'bg-red-50/50' : ''}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border-[2.5px] shadow-sm ${user.vipLevel > 0 ? 'border-amber-400 text-amber-600' : 'border-white'}`}>
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">你好，{user.name}</h2>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mt-1 ${status.bg} ${status.border} ${status.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                <span className="text-[10px] font-bold">状态：{status.text}</span>
              </div>
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" className={`transition-all duration-1000 ${status.ring}`} strokeWidth="10" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * finalHealthScore) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-[18px] font-black ${finalHealthScore < 60 ? 'text-rose-600' : 'text-slate-900'}`}>{finalHealthScore}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">健康分</span>
            </div>
          </div>
        </div>

        {/* 1元解锁高亮转化金条 (高风险且未付费) */}
        {finalHealthScore < 80 && user.vipLevel === 0 ? (
          <div 
            onClick={() => onNavigate('payment')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-3 flex items-center justify-between shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer animate-pulse-fast"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">!</div>
              <div>
                <p className="text-white font-black text-[12px]">检测到健康风险异常</p>
                <p className="text-white/80 text-[9px] font-medium">专家建议立即进行深度评估</p>
              </div>
            </div>
            <div className="bg-white px-3 py-1 rounded-full text-rose-600 text-[11px] font-black">¥1 解锁</div>
          </div>
        ) : (
          <div 
            onClick={() => onNavigate('chat')}
            className="bg-white border border-brand-100 rounded-2xl p-3 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 text-lg">🩺</div>
              <div>
                <p className="text-slate-800 font-black text-[12px]">AI 每日健康自查</p>
                <p className="text-slate-400 text-[9px]">更新今日体征数据</p>
              </div>
            </div>
            <span className="text-slate-300">›</span>
          </div>
        )}
      </div>

      {/* 核心业务区 */}
      <div className="px-5 mt-5 space-y-4">
        <h4 className="text-[13px] font-black text-slate-900 tracking-wider">专病管理工具箱</h4>
        <div className="grid grid-cols-2 gap-4">
          
          {/* 癫痫卡片 */}
          <div 
            onClick={() => onNavigate('service-epilepsy')}
            className="bg-white rounded-2xl p-4 shadow-card border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-[12px] font-black text-slate-800">生命守护 (癫痫)</h5>
              {hasDevice ? (
                  <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">监测中</span>
              ) : (
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">未连接</span>
              )}
            </div>
            <div className="h-[60px] bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
               {hasDevice ? (
                 <svg width="100%" height="40" viewBox="0 0 160 40">
                    <path d={wavePath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                 </svg>
               ) : (
                 <span className="text-[9px] text-slate-400">点击租赁设备</span>
               )}
            </div>
            <p className="text-[9px] text-slate-400 mt-3 font-medium">
                {hasDevice ? '实时脑电稳定性：极佳' : '全天候发作预警'}
            </p>
          </div>

          {/* AD卡片 */}
          <div 
            onClick={() => onNavigate('service-cognitive')}
            className="bg-white rounded-2xl p-4 shadow-card border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-[12px] font-black text-slate-800">大脑4S店 (AD)</h5>
              <span className="text-[8px] font-black text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">进阶级</span>
            </div>
            <div className="flex-1 flex flex-col justify-center py-2">
              <p className="text-[9px] font-bold text-slate-500 mb-1.5 tracking-tight">今日认知训练任务</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full w-[30%] rounded-full transition-all duration-700"></div>
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-black text-brand-500">
                <span>30%</span>
                <span>目标 15分钟</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">累计康复 125 天</p>
          </div>

          {/* 偏头痛卡片 */}
          <div 
            onClick={() => onNavigate('service-headache')}
            className="bg-white rounded-2xl p-4 shadow-card border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <h5 className="text-[12px] font-black text-slate-800 mb-3">诱因雷达 (头痛)</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-400">气压状态</span>
                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">稳定</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-400">生理期</span>
                <span className="text-[9px] font-black text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">安全期</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-400">诱因暴露</span>
                <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">低风险</span>
              </div>
            </div>
          </div>

          {/* 亲情账号 */}
          <div 
            onClick={() => onNavigate('service-family')}
            className="bg-white rounded-2xl p-4 shadow-card border border-slate-50 flex flex-col active:scale-[0.97] transition-all justify-between"
          >
            <h5 className="text-[12px] font-black text-slate-800">亲情账户中心</h5>
            <div className="flex items-center gap-2.5 mt-2 p-1.5 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm shadow-sm">👨‍🦳</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[9px] font-black truncate">父亲 (陈大强)</div>
                <div className="text-[8px] text-emerald-500 font-bold">健康监护中</div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">查看 2 位关联亲友</p>
          </div>
        </div>
      </div>

      {/* 设备中心 IoT Hub */}
      <div className="px-5 mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-black text-slate-900 tracking-wider">我的智能装备</h4>
          <button onClick={() => onNavigate('service-mall')} className="text-brand-500 text-[10px] font-black bg-brand-50 px-3 py-1 rounded-lg active:scale-95 transition-all">租赁管理</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <div className="min-w-[180px] bg-white rounded-2xl p-3 border border-slate-100 flex items-center gap-3 shadow-soft">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">🧠</div>
            <div className="flex-1">
              <div className="text-[11px] font-black text-slate-800">脑电头带 Pro</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-slate-400 font-bold">未连接</span>
              </div>
            </div>
          </div>
          <div 
             onClick={() => onNavigate('haas-checkout')}
             className={`min-w-[180px] bg-white rounded-2xl p-3 border transition-all flex items-center gap-3 shadow-soft ${hasDevice ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}
          >
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">⌚</div>
            <div className="flex-1">
              <div className="text-[11px] font-black text-slate-800">生命监测手环</div>
              <div className="flex items-center justify-between mt-1">
                 {hasDevice ? (
                     <span className="text-[9px] text-emerald-500 font-bold">已连接</span>
                 ) : (
                     <span className="text-[9px] text-brand-500 font-bold">申请租赁 ›</span>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 合规标注页脚 */}
      <div className="mt-auto px-10 pb-[calc(80px+env(safe-area-inset-bottom))] pt-8 text-center opacity-30 pointer-events-none">
        <p className="text-[9px] text-slate-500 leading-relaxed font-bold tracking-tight">
          所有建议均为辅助决策 (CDSS)，仅供医学参考<br/>
          最终处方权及诊断结论归线下接诊医生所有<br/>
          四川大学华西医院神经内科医联体 · 官方数字科室
        </p>
      </div>
    </div>
  );
};

export default HomeView;
