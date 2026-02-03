
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
  const [activeTab, setActiveTab] = useState<DiseaseType>(primaryCondition || DiseaseType.COGNITIVE);
  const [wavePath, setWavePath] = useState('');

  // 模拟生命守护 80px 实时正弦波
  useEffect(() => {
    let tick = 0;
    const generateWave = () => {
      tick += 0.15;
      const points = [];
      for (let i = 0; i <= 240; i += 10) {
        const y = 30 + Math.sin(tick + i * 0.05) * 15 + Math.random() * 2;
        points.push(`${i},${y}`);
      }
      setWavePath(`M 0,30 L ${points.join(' L ')}`);
      requestAnimationFrame(generateWave);
    };
    const anim = requestAnimationFrame(generateWave);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="bg-[#F7F9FA] min-h-full">
      {/* 1. 紧凑看板：合并欢迎与健康分 */}
      <div className="bg-white rounded-b-[40px] px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 shadow-card border-b border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-lg border-[3px] border-white shadow-sm">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">下午好，{user.name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Care Active</span>
              </div>
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1677FF" strokeWidth="10" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <span className="absolute text-sm font-black text-slate-900">{healthScore}</span>
          </div>
        </div>

        {/* 2x2 极简任务磁贴 */}
        <div className="grid grid-cols-2 gap-2">
            {[
              { label: '认知强化', done: true, sub: '今日已完成' },
              { label: '处方用药', done: false, sub: '上次 08:00' },
              { label: '步数目标', done: false, sub: '已走 3.2k' },
              { label: '发作登记', done: false, sub: '24h内无' }
            ].map((t, i) => (
              <div key={i} className={`flex flex-col p-2.5 rounded-2xl border ${t.done ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${t.done ? 'bg-slate-300' : 'bg-brand-500'}`}></div>
                  <span className="text-[11px] font-bold text-slate-800">{t.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium pl-3.5">{t.sub}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 2. 核心专病工具箱 - 磁吸布局 */}
      <div className="px-5 mt-4 space-y-4">
        <div className="bg-white rounded-[28px] p-5 shadow-card border-[0.5px] border-gray-100">
          <div className="flex bg-[#F5F8FA] p-1 rounded-xl mb-5">
            <button onClick={() => setActiveTab(DiseaseType.COGNITIVE)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === DiseaseType.COGNITIVE ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>认知训练</button>
            <button onClick={() => setActiveTab(DiseaseType.EPILEPSY)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === DiseaseType.EPILEPSY ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>癫痫哨兵</button>
            <button onClick={() => setActiveTab(DiseaseType.MIGRAINE)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === DiseaseType.MIGRAINE ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>诱因雷达</button>
          </div>

          <div className="min-h-[140px] animate-slide-up">
            {activeTab === DiseaseType.COGNITIVE && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">大脑 4S 养护进度</h3>
                   <span className="text-[10px] font-bold text-brand-500 tracking-tighter">Lvl.2</span>
                </div>
                {/* 双栏化改造：压扁模块 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border-[0.5px] border-white">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[9px] font-bold text-slate-500">记忆广度</span>
                      <span className="text-[11px] font-black text-brand-500">75%</span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100">
                      <div className="bg-brand-500 w-3/4 h-full"></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border-[0.5px] border-white">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[9px] font-bold text-slate-500">执行效能</span>
                      <span className="text-[11px] font-black text-brand-500">42%</span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100">
                      <div className="bg-brand-500 w-[42%] h-full"></div>
                    </div>
                  </div>
                </div>
                <Button fullWidth onClick={() => onNavigate('service-cognitive')} className="py-3.5 text-[11px] tracking-widest shadow-none">继续开启今日康复</Button>
              </div>
            )}

            {activeTab === DiseaseType.EPILEPSY && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">生命守护实时波形</h3>
                  <div className="flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                    <span className="w-1 h-1 bg-brand-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-brand-500">GUARDING</span>
                  </div>
                </div>
                {/* 80px 实时正弦波 */}
                <div className="h-20 bg-brand-50/50 rounded-2xl overflow-hidden border border-brand-50 flex items-center">
                  <svg width="100%" height="60" viewBox="0 0 240 60" className="opacity-80">
                    <path d={wavePath} fill="none" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 min-h-[44px] text-[11px] font-black text-slate-400 bg-slate-50 rounded-full">异常记录</button>
                  <button onClick={() => onNavigate('service-epilepsy')} className="flex-[2] min-h-[44px] text-[11px] font-black text-white bg-brand-500 rounded-full shadow-lg shadow-brand-500/20">一键紧急通话</button>
                </div>
              </div>
            )}

            {activeTab === DiseaseType.MIGRAINE && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase px-1">偏头痛诱因雷达</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { l: '气压剧变', c: 'text-brand-500 bg-brand-50 border-brand-100' },
                    { l: '睡眠不足', c: 'text-brand-500 bg-brand-50 border-brand-100' },
                    { l: '声光刺激', c: 'text-slate-400 bg-slate-50 border-white' },
                    { l: '咖啡因', c: 'text-slate-400 bg-slate-50 border-white' }
                  ].map((t, i) => (
                    <span key={i} className={`px-3 py-2 rounded-full text-[10px] font-bold border transition-all ${t.c}`}>
                      {t.l} {i < 2 && '●'}
                    </span>
                  ))}
                </div>
                <div className="bg-brand-50/40 p-4 rounded-2xl border-[0.5px] border-brand-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">止痛药风险 (MOH) 暴露指数</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white rounded-full overflow-hidden">
                      <div className="bg-brand-500 w-1/4 h-full"></div>
                    </div>
                    <span className="text-[9px] font-black text-brand-500">SAFE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. 支撑区：设备中心 (画廊式横滚) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">智能装备 & HaaS 租赁</h4>
            <span className="text-[10px] font-bold text-brand-500">全部设备 &rarr;</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            <div className="min-w-[220px] bg-white rounded-[24px] p-4 shadow-sm border-[0.5px] border-gray-100 flex items-center gap-3">
              <div className="w-11 h-11 bg-brand-50 rounded-2xl flex items-center justify-center text-xl relative">
                🧠
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h5 className="text-[11px] font-bold text-slate-800">脑电贴 Pro</h5>
                <p className="text-[9px] text-slate-400 font-medium">电量 88% · 已连接</p>
              </div>
            </div>
            {/* 租赁商城：呼吸灯动效 */}
            <div className="min-w-[180px] bg-gradient-to-br from-brand-500 to-brand-600 rounded-[24px] p-4 shadow-md flex items-center gap-3 relative overflow-hidden group active:scale-95 transition-all">
              <div className="absolute inset-0 bg-white/10 animate-pulse opacity-50"></div>
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-xl">⌚</div>
              <div className="z-10">
                <h5 className="text-[11px] font-bold text-white leading-tight">租赁商城</h5>
                <p className="text-[9px] text-white/80 mt-1 font-bold">首月免租 &rarr;</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 底层：高阶医事服务 (双栏紧凑) */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase px-1">华西专家专供服务</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[24px] p-4 shadow-sm border-[0.5px] border-gray-100 active:scale-95 transition-all h-36 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xl">📸</span>
                <span className="text-[8px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded uppercase">Expert</span>
              </div>
              <div>
                <h5 className="text-[11px] font-black text-slate-900">影像复核</h5>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight mb-2">华西专家人工复核确认</p>
                <button className="text-[9px] font-black text-brand-500 bg-brand-50 px-3 min-h-[28px] rounded-full border border-brand-100">上传胶片</button>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-4 shadow-sm border-[0.5px] border-gray-100 active:scale-95 transition-all h-36 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xl">📊</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-3 bg-brand-100 rounded-sm"></div>
                  <div className="w-1.5 h-5 bg-brand-500 rounded-sm"></div>
                  <div className="w-1.5 h-2 bg-brand-200 rounded-sm"></div>
                </div>
              </div>
              <div>
                <h5 className="text-[11px] font-black text-slate-900">随访报告</h5>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight mb-2">本周健康趋势数据分析</p>
                <button className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 min-h-[28px] rounded-full border border-slate-100">查看周报</button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. 底部兜底模块：消除真空感 */}
        <div className="pt-8 pb-12 flex flex-col items-center gap-10">
          <div className="bg-[#E6F7FF]/60 rounded-[32px] px-6 py-5 border-[0.5px] border-brand-100/50 w-full relative group">
            <div className="absolute -top-3 left-6 bg-brand-500 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">Daily Advice</div>
            <p className="text-[11px] italic text-brand-700 leading-relaxed font-medium">
              “ 规律的康复训练是重塑大脑神经网络的唯一途径，今天的每一分努力都在为未来存入健康。”
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] shadow-sm">👨‍⚕️</div>
                <span className="text-[9px] font-black text-brand-600">专家团队随诊寄语</span>
              </div>
              <span className="text-[8px] text-slate-400 font-bold uppercase">2023.10.27</span>
            </div>
          </div>
          
          {/* 页脚沉淀感优化 */}
          <div className="flex flex-col items-center gap-3 opacity-30 pb-[env(safe-area-inset-bottom)]">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">W</div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-slate-900">West China Neuro-Link</span>
              <span className="text-[8px] font-medium text-slate-500 mt-1">四川大学华西医院神经内科医联体 · 数字科室</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[9px] text-slate-400 font-black">
              <span className="flex items-center gap-1">📍 成都市国学巷37号</span>
              <span className="flex items-center gap-1">📞 028-85422114</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
