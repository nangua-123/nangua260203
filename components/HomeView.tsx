
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

  // 模拟华西数字监护系统 80px 实时脑电监测波形
  useEffect(() => {
    let tick = 0;
    const generateWave = () => {
      tick += 0.2;
      const points = [];
      const width = 360; 
      for (let i = 0; i <= width; i += 8) {
        // 模拟脑电波特征：结合正弦波与随机高频扰动
        const y = 30 + Math.sin(tick + i * 0.05) * 10 + (Math.random() - 0.5) * 8;
        points.push(`${i},${y}`);
      }
      setWavePath(`M 0,30 L ${points.join(' L ')}`);
      requestAnimationFrame(generateWave);
    };
    const anim = requestAnimationFrame(generateWave);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="bg-[#F7F9FA] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none">
      {/* 1. 顶部紧凑看板：状态与任务矩阵 */}
      <div className="bg-white rounded-b-[40px] px-5 pt-[calc(1.2rem+env(safe-area-inset-top))] pb-6 shadow-soft border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-lg border-[3px] border-white shadow-sm">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">下午好，{user.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">华西数字监护中</span>
              </div>
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1677FF" strokeWidth="10" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-black text-slate-900">{healthScore}</span>
              <span className="text-[7px] font-bold text-brand-500 uppercase tracking-tighter">健康分</span>
            </div>
          </div>
        </div>

        {/* 2x2 今日行动任务矩阵 */}
        <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: '认知强化', done: true, sub: '已练习 15分钟' },
              { label: '处方用药', done: false, sub: '上次服药 08:00' },
              { label: '步数打卡', done: false, sub: '目标 5000 步' },
              { label: '发作登记', done: false, sub: '24小时内无发作' }
            ].map((t, i) => (
              <div key={i} className={`flex flex-col p-2.5 rounded-2xl border transition-all ${t.done ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${t.done ? 'bg-slate-300' : 'bg-brand-500'}`}></div>
                  <span className="text-[11px] font-black text-slate-800 tracking-tight">{t.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold pl-3.5 tracking-tight truncate">{t.sub}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 2. 核心业务 Tab 区域 */}
      <div className="px-5 mt-4 space-y-4">
        <div className="bg-white rounded-[32px] p-5 shadow-soft border border-white">
          <div className="flex bg-slate-50 p-1 rounded-xl mb-4">
            <button onClick={() => setActiveTab(DiseaseType.COGNITIVE)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === DiseaseType.COGNITIVE ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>大脑 4S 店</button>
            <button onClick={() => setActiveTab(DiseaseType.EPILEPSY)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === DiseaseType.EPILEPSY ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>癫痫哨兵</button>
            <button onClick={() => setActiveTab(DiseaseType.MIGRAINE)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === DiseaseType.MIGRAINE ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}>诱因雷达</button>
          </div>

          <div className="animate-slide-up">
            {activeTab === DiseaseType.COGNITIVE && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">康复进度 · 训练周报</h3>
                   <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 tracking-widest">进阶级</span>
                </div>
                {/* 紧凑双栏指标布局 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border-[0.5px] border-white shadow-sm">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">记忆广度</span>
                      <span className="text-[11px] font-black text-brand-500">75%</span>
                    </div>
                    <div className="w-full bg-white h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-500 w-3/4 h-full rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border-[0.5px] border-white shadow-sm">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">执行效能</span>
                      <span className="text-[11px] font-black text-brand-500">42%</span>
                    </div>
                    <div className="w-full bg-white h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-500 w-[42%] h-full rounded-full"></div>
                    </div>
                  </div>
                </div>
                <Button fullWidth onClick={() => onNavigate('service-cognitive')} className="py-4 text-[11px] tracking-[0.2em] shadow-none">继续开启今日康复</Button>
              </div>
            )}

            {activeTab === DiseaseType.EPILEPSY && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">实时脑电监测波形</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[8px] font-black uppercase">运行中</span>
                  </div>
                </div>
                {/* 实时波形 SVG */}
                <div className="h-20 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center shadow-inner">
                  <svg width="100%" height="60" viewBox="0 0 360 60" className="opacity-90">
                    <path d={wavePath} fill="none" stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 min-h-[48px] text-[11px] font-black text-slate-400 bg-slate-50 rounded-2xl active:bg-slate-100 transition-colors">异常记录</button>
                  <button onClick={() => onNavigate('service-epilepsy')} className="flex-[2] min-h-[48px] text-[11px] font-black text-white bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all">一键紧急通话</button>
                </div>
              </div>
            )}

            {activeTab === DiseaseType.MIGRAINE && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase px-1">近期诱因风险评估</h3>
                <div className="flex flex-wrap gap-2">
                  {['气压剧变 ●', '睡眠不足 ●', '声光刺激', '咖啡因摄入'].map((t, i) => (
                    <span key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${i < 2 ? 'text-brand-500 bg-brand-50 border-brand-100' : 'text-slate-400 bg-slate-50 border-white shadow-sm'}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="bg-brand-50/40 p-4 rounded-2xl border-[0.5px] border-brand-100 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">止痛药过度使用风险 (MOH)</span>
                    <span className="text-[8px] text-brand-400 font-bold mt-0.5">本月药物暴露量：极低</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white rounded-full overflow-hidden border border-brand-100">
                      <div className="bg-brand-500 w-1/4 h-full rounded-full"></div>
                    </div>
                    <span className="text-[9px] font-black text-brand-500 uppercase">安全</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. 设备中心：HaaS 租赁商城画廊 */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase">智能硬件中心 & 租赁商城</h4>
            <span className="text-[10px] font-black text-brand-500" onClick={() => onNavigate('profile')}>更多硬件 &rarr;</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            <div className="min-w-[240px] bg-white rounded-[28px] p-4 shadow-sm border border-slate-50 flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl relative shadow-inner">
                🧠
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <h5 className="text-[12px] font-black text-slate-800">脑电贴 Pro</h5>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">已连接 · 电量 88%</p>
              </div>
            </div>
            <div className="min-w-[190px] bg-gradient-to-br from-brand-600 to-brand-500 rounded-[28px] p-4 shadow-lg flex items-center gap-4 relative overflow-hidden active:scale-95 transition-all">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">⌚</div>
              <div className="z-10 flex flex-col">
                <h5 className="text-[12px] font-black text-white leading-tight">生命守护手环</h5>
                <p className="text-[10px] text-white/80 mt-1 font-black">首月免租 &rarr;</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 专家服务矩阵 (双栏紧凑) */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[11px] font-black text-slate-900 tracking-widest uppercase px-1">华西专家专供服务</h4>
          <div className="grid grid-cols-2 gap-3 pb-4">
            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-50 active:scale-95 transition-all h-40 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xl">📸</span>
                <span className="text-[9px] font-black text-brand-500 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100 uppercase tracking-tighter">专家复核</span>
              </div>
              <div>
                <h5 className="text-[13px] font-black text-slate-900 leading-tight">影像复核</h5>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight mb-3">专家人工复核阅片确认</p>
                <button className="text-[10px] font-black text-brand-500 bg-brand-50 px-4 min-h-[32px] rounded-full border border-brand-100 active:bg-brand-100">立即上传胶片</button>
              </div>
            </div>
            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-50 active:scale-95 transition-all h-40 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-2xl">📊</span>
                <div className="flex items-end gap-1 h-6">
                  <div className="w-1.5 h-3 bg-brand-100 rounded-sm"></div>
                  <div className="w-1.5 h-6 bg-brand-500 rounded-sm animate-pulse"></div>
                  <div className="w-1.5 h-4 bg-brand-200 rounded-sm"></div>
                </div>
              </div>
              <div>
                <h5 className="text-[13px] font-black text-slate-900 leading-tight">随访周报</h5>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight mb-3">本周健康趋势全维分析</p>
                <button className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 min-h-[32px] rounded-full border border-slate-100 active:bg-slate-200">查看最新报告</button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. 专家健康随诊建议模块 */}
        <div className="pt-2 pb-16 flex flex-col items-center gap-10">
          <div className="bg-[#E6F7FF]/50 rounded-[40px] px-8 py-6 border border-brand-100/30 w-full relative group shadow-soft">
            <div className="absolute -top-3 left-8 bg-brand-500 text-white text-[9px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest shadow-md">专家健康随诊建议</div>
            <p className="text-[12px] italic text-brand-700 leading-relaxed font-bold">
              “ 规律的康复训练不仅是动作的重复，更是大脑神经通路的重塑。今天的每一分坚持，都在为未来存入健康。请保持良好的睡眠与心态。”
            </p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shadow-sm border border-brand-50">👨‍⚕️</div>
                <span className="text-[10px] font-black text-brand-600">华西医院神经内科专家团队 · 寄语</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 opacity-30 pb-safe">
            <div className="w-10 h-10 bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-base">W</div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-slate-900">华西神经专病 AI 数字医院</span>
              <span className="text-[9px] font-medium text-slate-500 mt-1.5">四川大学华西医院神经内科医联体 · 官方数字科室</span>
            </div>
            <div className="mt-2 flex items-center gap-5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <span>隐私协议</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>技术支持</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>版本 1.5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
