
import React, { useState, useEffect } from 'react';
import { User, AppView, DiseaseType, DeviceInfo } from '../types';
import Button from './Button';

interface HomeViewProps {
  user: User;
  onNavigate: (view: AppView) => void;
  primaryCondition: DiseaseType | null;
}

const HomeView: React.FC<HomeViewProps> = ({ user, onNavigate, primaryCondition = DiseaseType.COGNITIVE }) => {
  const [healthScore] = useState(82);
  const [wavePath, setWavePath] = useState('');

  // 1. 风险指示灯颜色逻辑
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const getRiskText = (score: number) => {
    if (score >= 80) return '良好';
    if (score >= 60) return '中等';
    return '高风险';
  };

  // 2. 癫痫实时脑电波模拟 (60px 高度)
  useEffect(() => {
    let tick = 0;
    const generateWave = () => {
      tick += 0.2;
      const points = [];
      const width = 200; // 适配卡片内宽度
      for (let i = 0; i <= width; i += 5) {
        const y = 30 + Math.sin(tick + i * 0.1) * 12 + (Math.random() - 0.5) * 6;
        points.push(`${i},${y}`);
      }
      setWavePath(`M 0,30 L ${points.join(' L ')}`);
      requestAnimationFrame(generateWave);
    };
    const anim = requestAnimationFrame(generateWave);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="bg-[#F7F8FA] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none">
      {/* 顶部看板：健康分与今日任务 */}
      <div className="bg-white rounded-b-[32px] px-5 pt-[calc(1.2rem+env(safe-area-inset-top))] pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-lg border-[2px] border-white shadow-sm">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">你好，{user.name}</h2>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mt-1 ${getRiskColor(healthScore)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span className="text-[10px] font-bold">风险：{getRiskText(healthScore)}</span>
              </div>
            </div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1677FF" strokeWidth="10" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-black text-slate-900">{healthScore}</span>
              <span className="text-[7px] font-bold text-slate-400">评分</span>
            </div>
          </div>
        </div>

        {/* 今日行动微任务 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['药物提醒 08:00', '步数打卡 3k', '发作记录(无)'].map((task, i) => (
            <div key={i} className="flex-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 核心区：双栏工具箱 */}
      <div className="px-5 mt-4 space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[13px] font-black text-slate-900 tracking-wider">专病工具箱</h4>
          <span className="text-[10px] text-brand-500 font-bold" onClick={() => onNavigate('chat')}>AI 分诊 &rarr;</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 癫痫卡片 */}
          <div 
            onClick={() => onNavigate('service-epilepsy')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h5 className="text-[12px] font-black text-slate-800">癫痫哨兵</h5>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">监测中</span>
            </div>
            <div className="h-[60px] bg-slate-50 rounded-lg flex items-center overflow-hidden border border-slate-100">
              <svg width="100%" height="40" viewBox="0 0 200 40">
                <path d={wavePath} fill="none" stroke="#1677FF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[9px] text-slate-400 mt-2">传感器信号：强</p>
          </div>

          {/* AD卡片 */}
          <div 
            onClick={() => onNavigate('service-cognitive')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h5 className="text-[12px] font-black text-slate-800">大脑 4S 店</h5>
              <span className="text-[8px] font-black text-brand-500">Lvl.2</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-slate-600 mb-1">今日训练进度</div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full w-[30%] rounded-full"></div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2">综合得分：72分</p>
          </div>

          {/* 偏头痛卡片 */}
          <div 
            onClick={() => onNavigate('service-headache')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex flex-col active:scale-[0.97] transition-all"
          >
            <h5 className="text-[12px] font-black text-slate-800 mb-2">诱因雷达</h5>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-400">当前气压</span>
                <span className="text-[9px] font-bold text-emerald-500">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-400">预测经期</span>
                <span className="text-[9px] font-bold text-slate-600">非期</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-400">诱因风险</span>
                <span className="text-[9px] font-bold text-amber-500">低</span>
              </div>
            </div>
          </div>

          {/* 亲情账号 */}
          <div 
            onClick={() => onNavigate('service-family')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 flex flex-col active:scale-[0.97] transition-all justify-between"
          >
            <h5 className="text-[12px] font-black text-slate-800">亲情监护</h5>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👨‍🦳</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[9px] font-bold truncate">陈大强 (父亲)</div>
                <div className="text-[7px] text-emerald-500 font-bold">实时监护中</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设备中心：IoT Hub */}
      <div className="px-5 mt-5 space-y-3">
        <h4 className="text-[13px] font-black text-slate-900 tracking-wider px-1">智能装备状态</h4>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
          <div className="min-w-[200px] bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-lg">🧠</div>
            <div className="flex-1">
              <div className="text-[11px] font-black text-slate-800">脑电头带 Pro</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] text-emerald-500 font-bold">已连接</span>
                <span className="text-[9px] text-slate-400 font-bold">电量 80%</span>
              </div>
            </div>
          </div>
          <div className="min-w-[200px] bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-lg">⌚</div>
            <div className="flex-1">
              <div className="text-[11px] font-black text-slate-800">生命监测手环</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] text-emerald-500 font-bold">已连接</span>
                <span className="text-[9px] text-slate-400 font-bold">电量 92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 增值服务：专家影像复核 */}
      <div className="px-5 mt-6 mb-20">
        <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-5 shadow-lg group active:scale-[0.98] transition-all">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none">
            <div className="absolute top-2 left-2 text-[24px] font-black text-white">WCH</div>
            <div className="absolute bottom-2 right-2 text-[24px] font-black text-white rotate-12">华西</div>
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h4 className="text-white font-black text-[16px] mb-1">华西专家影像复核</h4>
              <p className="text-slate-400 text-[10px] font-bold">官方专家人工阅片 · 48小时内出报告</p>
            </div>
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-brand-500/50 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 合规标注页脚 */}
      <div className="mt-auto px-10 pb-[calc(80px+env(safe-area-inset-bottom))] text-center opacity-30 pointer-events-none">
        <p className="text-[9px] text-slate-500 leading-relaxed font-bold">
          所有建议仅供医学参考，不能替代医生面诊诊断<br/>
          最终处方权归线下接诊医生所有<br/>
          四川大学华西医院神经内科医联体 · 官方数字医院
        </p>
      </div>
    </div>
  );
};

export default HomeView;
