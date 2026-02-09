
/**
 * @file HomeView.tsx
 * @description 应用首页 (Dashboard)
 * 
 * 视觉架构:
 * 1. 沉浸式顶栏 (Immersion Header): 展示用户信息、健康分环及会员状态。
 * 2. 金刚区 (King Kong District): 4个核心功能入口 (问诊/报告/家庭/设备)。
 * 3. 信息流 (Feed): 包含风险预警、智能推荐卡片及专病管理入口。
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, AppView, DiseaseType, IoTStats, CognitiveStats, UserRole, FamilyMember, MedicalOrder } from '../types';
import Button from '../components/common/Button';
import { usePayment } from '../hooks/usePayment';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext'; // [NEW]
import { NonDrugToolkit } from '../components/business/headache/NonDrugToolkit';
import { useRole } from '../hooks/useRole';
import { NotificationInbox } from '../components/NotificationInbox'; // [NEW] Import

// Declare Chart.js type for TypeScript
declare const Chart: any;

interface HomeViewProps {
  user: User;
  riskScore: number;
  hasDevice: boolean;
  onNavigate: (view: AppView) => void;
  primaryCondition: DiseaseType | null;
}

// [NEW] Medical Task Card (OrderTaskConsumer)
const MedicalTaskCard: React.FC<{ order: MedicalOrder; onAction: () => void }> = ({ order, onAction }) => (
    <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-4 shadow-md border-l-4 border-indigo-500 animate-slide-up mb-3 active:scale-[0.99] transition-transform">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕️</span>
                <div>
                    <h4 className="text-sm font-black text-indigo-900">{order.title}</h4>
                    <p className="text-[0.6rem] text-indigo-500 font-bold">医嘱下达于: {new Date(order.issuedAt).toLocaleTimeString()}</p>
                </div>
            </div>
            <span className="bg-white/50 text-indigo-600 text-[0.6rem] font-bold px-2 py-0.5 rounded border border-indigo-100">
                {order.doctorName}
            </span>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-tight">{order.description}</p>
        <Button size="sm" className="bg-indigo-600 shadow-indigo-500/20 w-full h-9" onClick={onAction}>
            立即执行
        </Button>
    </div>
);

// [NEW] Bluetooth Pairing Modal (Existing code reused, wrapped for clarity)
const BluetoothPairingModal: React.FC<{ onClose: () => void; onConnected: () => void }> = ({ onClose, onConnected }) => {
    const [step, setStep] = useState<'scanning' | 'list' | 'connecting'>('scanning');
    const [foundDevices, setFoundDevices] = useState<{id: string, name: string, signal: number}[]>([]);

    useEffect(() => {
        if (step === 'scanning') {
            const timer = setTimeout(() => {
                setFoundDevices([
                    { id: 'dev_01', name: 'Neuro-Link 癫痫监测贴', signal: -45 },
                    { id: 'dev_02', name: 'Cogni-Band 认知头带', signal: -68 }
                ]);
                setStep('list');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleConnect = () => {
        setStep('connecting');
        setTimeout(() => {
            onConnected();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up max-w-[430px] mx-auto min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">
                        {step === 'scanning' ? '正在搜索设备...' : step === 'list' ? '发现可用设备' : '正在建立连接'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
                </div>

                {step === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="relative">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl text-[#1677FF] relative z-10">
                                📡
                            </div>
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute -inset-4 bg-blue-500 rounded-full animate-pulse opacity-10"></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-6 font-bold">请确保设备已开机并靠近手机</p>
                    </div>
                )}

                {step === 'list' && (
                    <div className="space-y-3">
                        {foundDevices.map(dev => (
                            <div key={dev.id} onClick={handleConnect} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">
                                        ⌚
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800">{dev.name}</div>
                                        <div className="text-[0.625rem] text-emerald-500 font-bold">信号强度: 极佳</div>
                                    </div>
                                </div>
                                <Button size="sm" className="h-8 px-4 text-[0.625rem]">连接</Button>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'connecting' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#1677FF] rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-black text-slate-800">正在握手...</p>
                        <p className="text-xs text-slate-400 mt-1">正在同步历史监测数据</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = ({ user, riskScore, hasDevice, onNavigate, primaryCondition }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast(); 
  const { checkPermission } = useRole(); 
  const { mohAlertTriggered, seizureAlertTriggered } = state; 

  const [wavePath, setWavePath] = useState('');
  const { getRecommendedPackage, hasFeature } = usePayment();
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  // [UX Polish] Modals State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false); 
  const [showInbox, setShowInbox] = useState(false); // [NEW] Inbox visibility
  
  // --- Elderly Mode Config ---
  const isElderly = user.isElderlyMode;
  const touchClass = isElderly ? 'min-h-[64px] py-3' : '';
  const textClass = isElderly ? 'font-black text-base' : 'font-bold text-[0.6875rem]';
  
  // --- IoT Simulation Logic ---
  const activeProfileId = user.currentProfileId || user.id;
  const isManagedView = user.role === UserRole.FAMILY && user.currentProfileId !== user.id;
  const managedPatient = isManagedView ? user.familyMembers?.find(m => m.id === user.currentProfileId) : null;

  // 获取当前选中 Profile 的设备数据
  const currentIoTStats = useMemo(() => {
     if (user.id === activeProfileId) return user.iotStats;
     return user.familyMembers?.find(m => m.id === activeProfileId)?.iotStats;
  }, [user, activeProfileId]);

  // [HaaS] Expiration Logic
  const rentalExpireDate = user.deviceInfo?.rentalExpireDate;
  const daysUntilExpire = rentalExpireDate 
      ? Math.ceil((rentalExpireDate - Date.now()) / (1000 * 60 * 60 * 24)) 
      : 99;
  const isRentalExpiring = hasDevice && daysUntilExpire <= 3;

  // [NEW] Offline Detection Logic
  const isOffline = useMemo(() => {
      if (!currentIoTStats?.lastUpdated) return true;
      return (Date.now() - currentIoTStats.lastUpdated) > 60000;
  }, [currentIoTStats?.lastUpdated]);

  const timeAgoStr = useMemo(() => {
      if (!currentIoTStats?.lastUpdated) return '未连接';
      const diff = Date.now() - currentIoTStats.lastUpdated;
      if (diff < 60000) return '刚刚';
      const mins = Math.floor(diff / 60000);
      return `${mins}分钟前`;
  }, [currentIoTStats?.lastUpdated, isOffline]); 

  const currentCognitiveStats = useMemo(() => {
      if (user.id === activeProfileId) return user.cognitiveStats;
      return user.familyMembers?.find(m => m.id === activeProfileId)?.cognitiveStats;
  }, [user, activeProfileId]);

  const recommendedPkg = getRecommendedPackage();
  const isPkgUnlocked = hasFeature(recommendedPkg.featureKey);
  const isAssessmentPaid = hasFeature('ICE_BREAKING_MIGRAINE') || hasFeature('VIP_MIGRAINE') || hasFeature('VIP_EPILEPSY') || hasFeature('VIP_COGNITIVE');
  const isPredictedScore = riskScore > 0 && !isAssessmentPaid;
  const displayScore = riskScore > 0 ? riskScore : 95;
  const finalHealthScore = riskScore > 0 ? (100 - riskScore) : 95;
  const isCritical = finalHealthScore < 60; 
  const isEpilepsy = primaryCondition === DiseaseType.EPILEPSY;
  
  let themeColor = 'bg-[#1677FF]';
  if (isRentalExpiring) {
      themeColor = 'bg-[#FF4D4F]'; // [HaaS] Critical override for expiration
  } else if (isManagedView) {
      themeColor = 'bg-emerald-500';
  } else if (isCritical || isEpilepsy) {
      themeColor = 'bg-[#FF4D4F]';
  }

  // [NEW] Mock Doctor Order Injection (Simulate Backend Push)
  useEffect(() => {
      if (riskScore > 60 && !hasDevice && state.user.medicalOrders?.length === 0) {
          const timer = setTimeout(() => {
              dispatch({
                  type: 'ADD_MEDICAL_ORDER',
                  payload: {
                      id: `ord_${Date.now()}`,
                      type: 'DEVICE_RENTAL',
                      title: '建议佩戴监测设备',
                      description: '根据最新问诊评估，王教授建议您开启24h发作监测以辅助诊断。',
                      priority: 'HIGH',
                      status: 'PENDING',
                      targetView: 'haas-checkout',
                      issuedAt: Date.now(),
                      doctorName: '王德强 教授'
                  }
              });
              showToast('收到一条新的医嘱建议', 'info');
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [riskScore, hasDevice]);

  // [NEW] Order Task Action
  const handleOrderAction = (order: MedicalOrder) => {
      onNavigate(order.targetView);
  };

  useEffect(() => {
      if (currentIoTStats?.isAbnormal && !showAlertModal && !isOffline) {
          setShowAlertModal(true);
      }
  }, [currentIoTStats?.isAbnormal, isOffline]);

  // Wave Animation
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

  const handleRecordSubmit = (hr: string) => { 
      const val = parseInt(hr);
      if (val > 0) {
          const stats: IoTStats = {
            hr: val, bpSys: 120, bpDia: 80, spo2: 98,
            hrStandardDeviation: 30, // Default for manual entry
            isAbnormal: false, 
            isFallDetected: false,
            lastUpdated: Date.now()
          };
          dispatch({ type: 'UPDATE_IOT_STATS', payload: { id: activeProfileId, stats } });
          setShowRecordModal(false);
          showToast('录入成功，AI 风险模型已更新', 'success');
      }
  };
  
  const handlePairingSuccess = () => {
      setShowPairingModal(false);
      dispatch({ type: 'BIND_HARDWARE', payload: true });
      showToast('设备配对成功，实时监测已开启', 'success');
      // If there was a pending DEVICE_RENTAL order, complete it
      const pendingOrder = user.medicalOrders?.find(o => o.type === 'DEVICE_RENTAL' && o.status === 'PENDING');
      if (pendingOrder) {
          dispatch({ type: 'COMPLETE_MEDICAL_ORDER', payload: pendingOrder.id });
      }
  };

  const kingKongItems = [
      { label: 'AI 问诊', icon: '🩺', color: 'text-[#1677FF]', bg: 'bg-blue-50', nav: 'chat' },
      { label: '查报告', icon: '📄', color: 'text-emerald-500', bg: 'bg-emerald-50', nav: 'report' },
      { label: '亲情号', icon: '👨‍👩‍👧', color: 'text-orange-500', bg: 'bg-orange-50', nav: 'service-family' },
      { label: '租设备', icon: '⌚', color: 'text-purple-500', bg: 'bg-purple-50', nav: 'service-mall' },
  ].filter(item => !isElderly || item.nav !== 'service-mall');

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden pb-safe select-none relative">
      
      {/* 1. Header with Inbox Bell */}
      <div className={`${themeColor} pt-[calc(1rem+env(safe-area-inset-top))] pb-16 px-5 transition-colors duration-500 relative`}>
         <div className="relative z-10 flex justify-between items-start mb-6">
             <div className="flex items-center gap-3">
                 <h2 className="text-base font-bold text-white">{user.name}</h2>
             </div>
             {/* [NEW] Bell Icon for Inbox */}
             <div 
                onClick={() => setShowInbox(true)}
                className="relative bg-white/20 p-2 rounded-full backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
             >
                 <span className="text-white text-lg">🔔</span>
                 {(user.inbox?.length || 0) > 0 && (
                     <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white/20 animate-pulse"></span>
                 )}
             </div>
         </div>
         <div className="absolute top-[calc(1rem+env(safe-area-inset-top)+3rem)] right-5 text-white text-sm font-black opacity-80">
             {finalHealthScore} 分
         </div>
      </div>

      {/* 2. King Kong District */}
      <div className="px-3 -mt-10 relative z-20 mb-2">
          <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 flex justify-between items-center">
              {kingKongItems.map((item, i) => (
                  <button key={i} onClick={() => onNavigate(item.nav as AppView)} className={`flex flex-col items-center gap-2 active:opacity-70 transition-opacity ${isElderly ? 'flex-1' : ''}`}>
                      <div className={`w-11 h-11 rounded-full ${item.bg} flex items-center justify-center text-xl shadow-sm ${item.color} ${isElderly ? 'w-14 h-14 text-2xl' : ''}`}>
                          {item.icon}
                      </div>
                      <span className={`text-slate-700 ${textClass}`}>{item.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. Feed */}
      <div className="px-3 space-y-3 pb-24">
        
        {/* [NEW] Medical Order Tasks (High Priority) */}
        {user.medicalOrders?.filter(o => o.status === 'PENDING').map(order => (
            <MedicalTaskCard key={order.id} order={order} onAction={() => handleOrderAction(order)} />
        ))}

        {/* Existing Alerts & Tools */}
        {mohAlertTriggered && !isManagedView && (
            <div className={`bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3 animate-slide-up shadow-sm ${touchClass}`}>
                <div className="text-xl">⚠️</div>
                <div>
                    <h4 className={`text-orange-800 ${isElderly ? 'text-lg font-black' : 'text-xs font-black'}`}>警告：检测到用药频繁</h4>
                    <p className={`text-orange-700 leading-tight mt-1 ${isElderly ? 'text-sm' : 'text-[0.625rem]'}`}>
                        近24小时用药&gt;3次，存在“药物过度使用性头痛”风险。
                    </p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3">
            <div onClick={() => onNavigate('service-epilepsy')} className={`bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between border border-slate-50 active:scale-[0.98] transition-transform ${isElderly ? 'min-h-[160px]' : 'min-h-[140px]'}`}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">🧠</span>
                    </div>
                    <h4 className={`text-slate-800 ${isElderly ? 'text-lg font-black' : 'text-[0.8125rem] font-black'}`}>生命守护</h4>
                    <p className={`text-slate-400 mt-0.5 ${isElderly ? 'text-sm' : 'text-[0.625rem]'}`}>癫痫发作实时监测</p>
                </div>
                <div className="mt-2 h-10 w-full opacity-50">
                     <svg width="100%" height="100%" viewBox="0 0 160 40">
                        <path d={wavePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div onClick={() => onNavigate('service-headache')} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 text-lg">⚡</div>
                    <div>
                        <h4 className={`text-slate-800 ${isElderly ? 'text-base font-black' : 'text-[12px] font-black'}`}>诱因雷达</h4>
                        <p className="text-[9px] text-slate-400">偏头痛气象预警</p>
                    </div>
                </div>
                <div onClick={() => onNavigate('service-cognitive')} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-50 active:scale-[0.98] transition-transform flex-1">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">🧩</div>
                    <div>
                        <h4 className={`text-slate-800 ${isElderly ? 'text-base font-black' : 'text-[12px] font-black'}`}>记忆训练</h4>
                        <p className="text-[9px] text-slate-400">AD 认知康复</p>
                    </div>
                </div>
            </div>
        </div>

        {/* [Optimization] 设备状态与手动录入降级交互 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3" onClick={() => onNavigate(hasDevice ? 'profile' : 'haas-checkout')}>
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-2xl">⌚</div>
                <div>
                    <h4 className={`text-slate-800 ${isElderly ? 'text-base font-black' : 'text-[12px] font-black'}`}>我的智能装备</h4>
                    {hasDevice ? (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500">HR: {currentIoTStats?.hr || '--'}</span>
                            <span className={`text-[10px] bg-emerald-50 px-1 rounded ${isOffline ? 'text-slate-400 bg-slate-100' : 'text-emerald-500'}`}>
                                {isOffline ? '离线' : '已连接'}
                            </span>
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">暂无设备，点击租赁</p>
                    )}
                </div>
            </div>
            {!hasDevice && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowRecordModal(true); }}
                    className="text-[10px] font-bold text-[#1677FF] bg-blue-50 px-3 py-1.5 rounded-full active:scale-95"
                >
                    📝 手动录入
                </button>
            )}
        </div>

      </div>

      {/* Modals */}
      {showInbox && <NotificationInbox onClose={() => setShowInbox(false)} />}
      
      {showPairingModal && (
          <BluetoothPairingModal 
              onClose={() => setShowPairingModal(false)}
              onConnected={handlePairingSuccess}
          />
      )}
      
      {showRecordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRecordModal(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-[24px] p-6 relative z-10 animate-slide-up shadow-2xl">
                <h3 className="text-lg font-black text-slate-900 mb-4 text-center">手动录入生命体征</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">当前静息心率 (BPM)</label>
                        <input 
                            type="number" 
                            autoFocus
                            placeholder="75"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xl font-bold text-center focus:border-brand-500 outline-none"
                            onBlur={(e) => handleRecordSubmit(e.target.value)}
                        />
                    </div>
                    <Button fullWidth onClick={() => setShowRecordModal(false)}>取消</Button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default HomeView;
