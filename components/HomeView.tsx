
/**
 * @file HomeView.tsx
 * @description 应用首页 (Dashboard)
 * 
 * 视觉架构:
 * 1. 沉浸式顶栏 (Immersion Header): 展示用户信息、健康分环及会员状态。
 * 2. 金刚区 (King Kong District): 4个核心功能入口 (问诊/报告/家庭/设备)。
 * 3. 信息流 (Feed): 包含风险预警、智能推荐卡片及专病管理入口。
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, AppView, DiseaseType, IoTStats } from '../types';
import Button from './Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';

interface HomeViewProps {
  user: User;
  riskScore: number;
  hasDevice: boolean;
  onNavigate: (view: AppView) => void;
  primaryCondition: DiseaseType | null;
}

const HomeView: React.FC<HomeViewProps> = ({ user, riskScore, hasDevice, onNavigate, primaryCondition }) => {
  const { dispatch } = useApp();
  const [wavePath, setWavePath] = useState('');
  const { getRecommendedPackage, hasFeature } = usePayment();
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  // --- IoT Simulation Logic (设备数据模拟) ---
  const activeProfileId = user.currentProfileId || user.id;
  
  // 获取当前选中 Profile 的设备数据
  const currentIoTStats = useMemo(() => {
     if (user.id === activeProfileId) return user.iotStats;
     return user.familyMembers?.find(m => m.id === activeProfileId)?.iotStats;
  }, [user, activeProfileId]);

  // 获取推荐套餐 (Marketing)
  const recommendedPkg = getRecommendedPackage();
  const isPkgUnlocked = hasFeature(recommendedPkg.featureKey);

  // 计算显示分数与主题色
  const displayScore = riskScore > 0 ? riskScore : 95;
  const finalHealthScore = riskScore > 0 ? (100 - riskScore) : 95;
  const isCritical = finalHealthScore < 60; // 阈值：低于60分为高危

  const themeColor = isCritical ? 'bg-rose-600' : 'bg-[#1677FF]';

  // 模拟设备数据流 (Heartbeat)
  useEffect(() => {
    if (!hasDevice) return;

    const interval = setInterval(() => {
        // 随机生成生命体征
        const isAnomaly = Math.random() > 0.9;
        let hr = 75 + Math.floor(Math.random() * 20 - 10);
        if (isAnomaly) hr = Math.random() > 0.5 ? 135 : 55;

        const bpSys = 110 + Math.floor(Math.random() * 20);
        const bpDia = 75 + Math.floor(Math.random() * 10);
        const spo2 = 96 + Math.floor(Math.random() * 4);

        const stats: IoTStats = {
            hr, bpSys, bpDia, spo2,
            isAbnormal: hr > 120 || hr < 60,
            lastUpdated: Date.now()
        };

        // 更新状态
        dispatch({
            type: 'UPDATE_IOT_STATS',
            payload: { id: activeProfileId, stats }
        });

        // 触发异常弹窗 (Simulation)
        if (stats.isAbnormal) {
            setShowAlertModal(true);
            dispatch({
                type: 'SET_RISK_SCORE',
                payload: { score: 85, type: DiseaseType.EPILEPSY }
            });
        }

    }, 5000); 

    return () => clearInterval(interval);
  }, [hasDevice, activeProfileId]);

  // 癫痫波形动画 (SVG Path Generator)
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

  // --- Alert Modal (三级熔断预警) ---
  const AlertModal = () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border-2 border-red-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"></div>
              
              <div className="flex justify-center mb-6 mt-2">
                 <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-ping absolute opacity-50"></div>
                 <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl relative text-red-600 border border-red-200">
                    🆘
                 </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">三级熔断预警已触发</h3>
              <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                  监测到严重心率异常 ({currentIoTStats?.hr} bpm)<br/>
                  疑似<strong className="text-red-600">强直阵挛性发作</strong>，建议立即急救。
              </p>
              
              <div className="space-y-3">
                  <Button fullWidth className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/40 py-4 h-auto flex flex-col items-center justify-center gap-1" onClick={() => window.alert("模拟拨打 120 急救电话")}>
                      <span className="text-base font-black">📞 一键拨打 120</span>
                      <span className="text-[10px] opacity-80 font-normal">系统将自动播报患者位置</span>
                  </Button>
                  
                  <Button fullWidth variant="outline" className="border-slate-300 text-slate-700 h-auto py-3 flex flex-col gap-1" onClick={() => window.alert("已向紧急联系人发送 GPS 定位: 北纬30.67, 东经104.06")}>
                      <span className="text-sm font-black">📍 发送 GPS 定位</span>
                  </Button>

                  <button 
                     onClick={() => setShowAlertModal(false)}
                     className="mt-2 text-slate-400 text-xs font-bold underline decoration-slate-300 p-2"
                  >
                      我是本人，误报解除
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none">
      
      {/* 1. 沉浸式顶栏 (Immersion Header) */}
      <div className={`${themeColor} pt-[calc(1rem+env(safe-area-inset-top))] pb-16 px-5 transition-colors duration-500 relative`}>
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, white 10%, transparent 20%)' }}></div>
        
        {/* User Info Row */}
        <div className="flex justify-between items-start relative z-10 mb-6">
            <div className="flex items-center gap-3" onClick={() => onNavigate('profile')}>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 text-lg shadow-sm">
                    {user.name[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">{user.name}</h2>
                        <span className="bg-black/20 text-white/90 text-[9px] px-1.5 py-0.5 rounded font-bold backdrop-blur-sm flex items-center gap-1">
                            {user.vipLevel > 0 ? '👑 尊享会员' : '未认证'}
                            <span className="opacity-60">›</span>
                        </span>
                    </div>
                    <p className="text-[10px] text-white/70 mt-0.5">华西数字医疗档案 ID: {user.id.split('_')[1] || '8829'}</p>
                </div>
            </div>
            
            {/* Risk Ring (健康分圆环) */}
            <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                    <circle 
                        cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" 
                        strokeDasharray="276.4" 
                        strokeDashoffset={276.4 - (276.4 * finalHealthScore) / 100} 
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-white">{finalHealthScore}</span>
                    <span className="text-[7px] text-white/80 uppercase">健康分</span>
                </div>
            </div>
        </div>
      </div>

      {/* 2. 金刚区 (King Kong District) */}
      <div className="px-3 -mt-10 relative z-20 mb-2">
          <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 flex justify-between items-center">
              {[
                  { label: 'AI 问诊', icon: '🩺', color: 'text-[#1677FF]', bg: 'bg-blue-50', nav: 'chat' },
                  { label: '查报告', icon: '📄', color: 'text-emerald-500', bg: 'bg-emerald-50', nav: 'report' },
                  { label: '亲情号', icon: '👨‍👩‍👧', color: 'text-orange-500', bg: 'bg-orange-50', nav: 'service-family' },
                  { label: '租设备', icon: '⌚', color: 'text-purple-500', bg: 'bg-purple-50', nav: 'service-mall' },
              ].map((item, i) => (
                  <button key={i} onClick={() => onNavigate(item.nav as AppView)} className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
                      <div className={`w-11 h-11 rounded-full ${item.bg} flex items-center justify-center text-xl shadow-sm ${item.color}`}>
                          {item.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. 核心业务流 (Main Feed) */}
      <div className="px-3 space-y-3 pb-24">
        
        {/* 高风险提示条 (Critical Alert) */}
        {isCritical && (
            <div onClick={() => onNavigate('report')} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold">!</div>
                <div className="flex-1">
                    <div className="text-xs font-black text-rose-700">检测到健康风险异常</div>
                    <div className="text-[10px] text-rose-500">建议立即进行深度评估</div>
                </div>
                <button className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">去处理</button>
            </div>
        )}

        {/* 智能推荐卡片 (Marketing Placement) */}
        {!isPkgUnlocked && (
            <div className="bg-white rounded-xl p-4 shadow-sm relative overflow-hidden group" onClick={() => onNavigate('service-mall')}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">为您推荐</div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">{recommendedPkg.title}</h3>
                        <p className="text-[10px] text-slate-400">{recommendedPkg.features[0]} · {recommendedPkg.features[1]}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-lg font-black text-rose-500">¥{recommendedPkg.price}</span>
                        <span className="text-[9px] text-slate-300 line-through">¥{recommendedPkg.originalPrice || 999}</span>
                    </div>
                </div>
            </div>
        )}

        {/* 专病管理卡片组 (Disease Modules) */}
        <div className="grid grid-cols-2 gap-3">
            {/* 左列：癫痫监控 */}
            <div onClick={() => onNavigate('service-epilepsy')} className="bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[140px] border border-slate-50 active:scale-[0.98] transition-transform">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">🧠</span>
                        {hasDevice && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    </div>
                    <h4 className="text-[13px] font-black text-slate-800">生命守护</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">癫痫发作实时监测</p>
                </div>
                <div className="mt-2 h-10 w-full opacity-50">
                     <svg width="100%" height="100%" viewBox="0 0 160 40">
                        <path d={wavePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                </div>
            </div>

            {/* 右列：包含 头痛 和 认知 两个小卡 */}
            <div className="flex flex-col gap-3">
                <div onClick={() => onNavigate('service-headache')} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 text-lg">⚡</div>
                    <div>
                        <h4 className="text-[12px] font-black text-slate-800">诱因雷达</h4>
                        <p className="text-[9px] text-slate-400">偏头痛气象预警</p>
                    </div>
                </div>
                <div onClick={() => onNavigate('service-cognitive')} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">🧩</div>
                    <div>
                        <h4 className="text-[12px] font-black text-slate-800">记忆训练</h4>
                        <p className="text-[9px] text-slate-400">AD 认知康复</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 底部设备栏 (Device Status Card) */}
        <div onClick={() => onNavigate(hasDevice ? 'profile' : 'haas-checkout')} className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-2xl">⌚</div>
                <div>
                    <h4 className="text-[12px] font-black text-slate-800">我的智能装备</h4>
                    {hasDevice ? (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500">HR: {currentIoTStats?.hr || '--'}</span>
                            <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1 rounded">已连接</span>
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">暂无设备，点击租赁</p>
                    )}
                </div>
            </div>
            {!hasDevice && <span className="text-[11px] font-bold text-[#1677FF]">去申请 ›</span>}
        </div>

      </div>

      {showAlertModal && <AlertModal />}
    </div>
  );
};

export default HomeView;
