
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
  const [waveData, setWaveData] = useState<number[]>(Array(30).fill(25));

  // 模拟平滑且具有“医疗专业感”的脑电实时波形 (SVG 路径模拟)
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 0.35;
      setWaveData(prev => {
        const base = Math.sin(tick) * 12 + Math.sin(tick * 0.5) * 5 + 30;
        const noise = Math.random() * 3;
        return [...prev.slice(1), base + noise];
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const device: DeviceInfo = {
    id: 'WCH-EEG-001',
    status: 'active',
    battery: 88,
    lastSync: '刚刚',
    model: '脑电贴 Pro',
    signalStrength: 'strong',
    wearingQuality: 95
  };

  return (
    <div className="bg-[#F7F9FA] pb-12 animate-fade-in font-sans">
      {/* 1. 紧凑型健康看板：整合个人信息与核心分值 */}
      <div className="bg-white rounded-b-[40px] px-5 pt-10 pb-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-b border-slate-50 relative z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-lg border-[3px] border-white shadow-sm">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{user.name}，下午好</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">WCH Digital Guardian</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Live Monitor</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* 健康分环 - 紧凑尺寸 */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1677FF" strokeWidth="8" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-slate-900 tracking-tighter">{healthScore}</span>
              <span className="text-[8px] font-bold text-brand-500 uppercase tracking-widest">Score</span>
            </div>
          </div>

          {/* 任务 2x2 网格 - 空间极致压缩 */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { label: '认知强化', done: true, sub: '已完成' },
              { label: '处方用药', done: false, sub: '上次 08:00' },
              { label: '步数打卡', done: false, sub: '目标 5k' },
              { label: '发作登记', done: false, sub: '暂无记录' }
            ].map((t, i) => (
              <div key={i} className={`flex flex-col p-2 rounded-xl border transition-all ${t.done ? 'bg-slate-50 border-slate-50' : 'bg-white border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className={`w-1 h-1 rounded-full ${t.done ? 'bg-slate-300' : 'bg-brand-500'}`}></div>
                  <span className={`text-[10px] font-bold truncate ${t.done ? 'text-slate-300' : 'text-slate-700'}`}>{t.label}</span>
                </div>
                <span className="text-[8px] text-slate-400 font-medium pl-2.5">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 动态专病工具箱 - 卡片化与双栏重构 */}
      <div className="px-5 mt-4 space-y-4">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)] border border-white">
          <div className="flex bg-[#F5F8FA] p-1 rounded-xl mb-5">
            {Object.values(DiseaseType).filter(v => v !== DiseaseType.UNKNOWN).map(type => (
              <button 
                key={type}
                onClick={() => setActiveTab(type)} 
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === type ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}
              >
                {type === DiseaseType.COGNITIVE ? '认知复康' : type === DiseaseType.EPILEPSY ? '癫痫哨兵' : '诱因雷达'}
              </button>
            ))}
          </div>

          <div className="min-h-[145px] animate-slide-up">
            {activeTab === DiseaseType.COGNITIVE && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">大脑 4S 养护店 <span className="text-[9px] bg-brand-50 text-brand-500 px-1.5 py-0.5 rounded ml-1 font-black">Lvl.2</span></h3>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Active Care</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-white">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500">记忆广度</span>
                      <span className="text-[10px] font-bold text-brand-500">75%</span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100/50">
                      <div className="bg-gradient-to-r from-brand-500 to-brand-400 w-3/4 h-full rounded-full"></div>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2 font-medium">AI评价：状态极佳</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-white">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500">执行效率</span>
                      <span className="text-[10px] font-bold text-brand-500">42%</span>
                    </div>
                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100/50">
                      <div className="bg-gradient-to-r from-brand-500 to-brand-400 w-[42%] h-full rounded-full"></div>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-2 font-medium">建议增加计算练习</p>
                  </div>
                </div>
                <Button fullWidth onClick={() => onNavigate('service-cognitive')} className="py-3 text-[11px] tracking-[0.2em] shadow-none">继续开启今日康复</Button>
              </div>
            )}

            {activeTab === DiseaseType.EPILEPSY && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">生命守护哨兵</h3>
                  <div className="text-[9px] font-black text-brand-500 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">算法增强模式</div>
                </div>
                <div className="h-20 bg-brand-50/50 rounded-2xl overflow-hidden flex items-center px-2 border border-brand-50">
                  <svg width="100%" height="60" viewBox="0 0 240 60" className="opacity-90">
                    <path d={`M ${waveData.map((v, i) => `${(240/29)*i} ${60-v}`).join(' L ')}`} fill="none" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-3 text-[10px] font-bold text-slate-400 bg-slate-50 rounded-full transition-colors active:bg-slate-100">异常记录</button>
                  <button onClick={() => onNavigate('service-epilepsy')} className="flex-[2] py-3 text-[10px] font-bold text-white bg-brand-500 rounded-full shadow-lg shadow-brand-500/20 active:scale-95 transition-transform">一键呼叫医生</button>
                </div>
              </div>
            )}

            {activeTab === DiseaseType.MIGRAINE && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">诱因雷达详情</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { l: '气压异常', c: 'bg-brand-50 border-brand-100 text-brand-600' },
                    { l: '睡眠不足', c: 'bg-brand-50 border-brand-100 text-brand-600' },
                    { l: '生理期', c: 'bg-slate-50 border-white text-slate-400' },
                    { l: '咖啡因', c: 'bg-slate-50 border-white text-slate-400' }
                  ].map((t, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${t.c} active:scale-95`}>
                      {t.l} {i < 2 && '●'}
                    </span>
                  ))}
                </div>
                <div className="bg-brand-50/40 p-4 rounded-2xl border border-brand-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">止痛药风险 (MOH)</span>
                    <span className="text-[8px] text-brand-400 font-medium mt-1">本月药物暴露量：极低</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white rounded-full overflow-hidden">
                      <div className="bg-brand-500 w-1/4 h-full"></div>
                    </div>
                    <span className="text-[10px] font-black text-brand-500">SAFE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. 支撑区：设备中心与 HaaS 商城 (画廊式横滚) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">智能硬件 & HaaS 租赁</h4>
            <span className="text-[10px] font-bold text-brand-500">商城 &rarr;</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            <div className="min-w-[210px] bg-white rounded-[28px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-3">
              <div className="w-11 h-11 bg-brand-50 rounded-2xl flex items-center justify-center text-xl relative">
                🧠
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="flex-1 overflow-hidden">
                <h5 className="text-[11px] font-bold text-slate-800 truncate">脑电贴 Pro</h5>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">已同步 · 电量 {device.battery}%</p>
              </div>
            </div>
            <div className="min-w-[170px] bg-gradient-to-br from-brand-500 to-brand-600 rounded-[28px] p-4 shadow-md flex items-center gap-3 active:scale-95 transition-all overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full blur-xl -translate-x-1 translate-y-1"></div>
              <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center text-xl">⌚</div>
              <div>
                <h5 className="text-[11px] font-bold text-white leading-tight">租赁商城</h5>
                <p className="text-[9px] text-white/80 mt-1 font-bold">¥19.9/月起 &rarr;</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 底层：高阶医事服务 (双栏卡片化) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase px-1">华西专家专供服务</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 active:scale-[0.98] transition-all flex flex-col justify-between h-36 group">
              <div className="flex justify-between items-start">
                <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                <span className="text-[8px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded uppercase">Recheck</span>
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-slate-900">影像复核</h5>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight mb-2">华西专家二次确认阅片</p>
                <button className="text-[9px] font-bold text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">立即上传胶片</button>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 active:scale-[0.98] transition-all flex flex-col justify-between h-36">
              <div className="flex justify-between items-start">
                <span className="text-2xl">📊</span>
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-3 bg-brand-100 rounded-sm"></div>)}
                </div>
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-slate-900">随访报告</h5>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight mb-2">生成结构化诊疗数据</p>
                <button className="text-[9px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">查看往期周报</button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. 底部温情关怀：填充留白并提升沉淀感 */}
        <div className="pt-8 pb-10 flex flex-col items-center gap-8">
          <div className="bg-[#E6F4FF]/50 rounded-[32px] px-6 py-5 border border-brand-100/30 w-full relative group">
            <div className="absolute -top-2.5 left-6 bg-brand-500 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">Today's Quote</div>
            <p className="text-[11px] italic text-brand-700/80 leading-relaxed font-medium">
              “ 规律的康复训练不仅是动作的重复，更是大脑神经通路的重塑。每一秒的坚持都是对未来最慷慨的投资。”
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] shadow-sm">👨‍⚕️</div>
              <span className="text-[9px] font-black text-brand-600">华西神经内科专家团队 · 寄语</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 opacity-30">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">W</div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-slate-900">West China Neuro-Link</span>
              <span className="text-[8px] font-medium text-slate-500 mt-1">四川大学华西医院神经内科 · 蚂蚁数字医疗标准</span>
            </div>
            <div className="mt-4 flex gap-4 text-[8px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
