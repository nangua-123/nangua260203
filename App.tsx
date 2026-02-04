
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppView, DiseaseType } from './types';

// Import all functional components
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import AssessmentView from './components/AssessmentView';
import ReportView from './components/ReportView';
import { HeadacheServiceView, CognitiveServiceView, EpilepsyServiceView, FamilyServiceView } from './components/HealthServices';
import { HaaSRentalView, ServiceMallView } from './components/ServiceMarketplace';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';

// Mock User Data for fallback
const INITIAL_USER: User = {
  id: 'user_001',
  name: '陈建国',
  phone: '13900000000',
  role: UserRole.PATIENT,
  vipLevel: 0,
  unlockedFeatures: [],
  hasHardware: false
};

// --- Profile View Component (Refined) ---
const ProfileView: React.FC<{ user: User; hasDevice: boolean; onNavigate: (v: AppView) => void; onClearCache: () => void }> = ({ user, hasDevice, onNavigate, onClearCache }) => {
  return (
    <Layout headerTitle="个人中心" hideHeader>
      <div className="min-h-screen bg-slate-50 pb-24 relative animate-fade-in">
        {/* Header */}
        <div className="relative bg-slate-900 pt-16 pb-24 px-6 overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           
           <div className="relative z-10 flex items-center gap-5">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl border-[3px] ${user.vipLevel > 0 ? 'bg-gradient-to-br from-amber-200 to-amber-500 border-amber-200 text-amber-900' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
               👨‍🦳
             </div>
             <div>
               <h2 className="text-xl font-black text-white">{user.name}</h2>
               <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${user.vipLevel > 0 ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {user.vipLevel > 0 ? '华西尊享会员 (Level 1)' : '普通注册用户'}
                  </span>
               </div>
             </div>
           </div>

           {hasDevice && (
             <div className="mt-8 flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="relative w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-black text-emerald-400 tracking-wider uppercase">实时链路已接通</div>
                  <div className="text-[9px] text-slate-400 font-medium">华西神经内科数据中心 · 24ms 低延迟</div>
                </div>
             </div>
           )}
        </div>

        {/* Dashboard Content */}
        <div className="px-5 -mt-16 relative z-20 space-y-4">
           {/* Device Card */}
           <div className="bg-white rounded-[24px] p-5 shadow-lg shadow-slate-200/50 border border-slate-50">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-slate-800 text-[13px]">我的智能设备</h3>
                 {!hasDevice && <button onClick={() => onNavigate('haas-checkout')} className="text-brand-600 text-[10px] font-bold bg-brand-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">申请设备 +</button>}
              </div>
              {hasDevice ? (
                <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-4 border border-emerald-100 flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-emerald-50">⌚</div>
                   <div>
                      <div className="text-[12px] font-black text-emerald-900">生命体征监测手环 Pro</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        运行中 · 电量 85%
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 border-dashed flex flex-col items-center gap-2">
                   <span className="text-2xl opacity-30">🔌</span>
                   <span className="text-slate-400 text-[11px] font-bold">暂无绑定监测设备</span>
                </div>
              )}
           </div>

           {/* Menu */}
           <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-50">
              {[
                { label: '我的健康报告', icon: '📄', action: () => onNavigate('report') },
                { label: '亲情账号管理', icon: '👨‍👩‍👧', action: () => onNavigate('service-family') },
                { label: '服务订单中心', icon: '📦', action: () => onNavigate('service-mall') },
                { label: '清除本地缓存', icon: '🗑️', action: onClearCache }
              ].map((item, i) => (
                 <button key={i} onClick={item.action} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-3">
                       <span className="text-lg group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                       <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-slate-300 text-lg">›</span>
                 </button>
              ))}
           </div>
        </div>
      </div>
    </Layout>
  );
};

const App: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [assessmentType, setAssessmentType] = useState<DiseaseType>(DiseaseType.MIGRAINE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state from Context to local logic where necessary, though Context is single source of truth now.
  // We use `state.user` directly.

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleDeepLink = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && typeof customEvent.detail === 'string') {
            handleNavigate(customEvent.detail as AppView);
        }
    };
    window.addEventListener('navigate-to', handleDeepLink);
    return () => window.removeEventListener('navigate-to', handleDeepLink);
  }, []);

  const handleTriageComplete = (summary: any) => {
    dispatch({ type: 'SET_RISK_SCORE', payload: { score: summary.risk || 85, type: DiseaseType.MIGRAINE } });
    setAssessmentType(DiseaseType.MIGRAINE); 
    handleNavigate('report');
  };

  const handleIntervention = () => {
    handleNavigate('home');
  };

  const handleAssetSync = () => {
    dispatch({ type: 'UNLOCK_FEATURE', payload: 'VIP_EPILEPSY' }); // Example unlock
    dispatch({ type: 'BIND_HARDWARE', payload: true });
    handleNavigate('home');
  };

  const handleScoreUpdate = (score: number) => {
      dispatch({ type: 'SET_RISK_SCORE', payload: { score, type: assessmentType } });
      handleNavigate('report');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeView 
                  user={state.user} 
                  riskScore={state.riskScore}
                  hasDevice={state.user.hasHardware}
                  onNavigate={handleNavigate} 
                  primaryCondition={state.primaryCondition} 
               />;
      case 'chat':
        return <ChatView onBack={() => handleNavigate('home')} onPaymentGate={handleTriageComplete} />;
      case 'profile':
        return <ProfileView 
                  user={state.user} 
                  hasDevice={state.user.hasHardware} 
                  onNavigate={handleNavigate} 
                  onClearCache={() => { dispatch({type: 'CLEAR_CACHE'}); window.location.reload(); }}
               />;
      case 'assessment':
        return <div className="animate-slide-up"><AssessmentView type={assessmentType} onComplete={handleScoreUpdate} onBack={() => handleNavigate('home')} /></div>;
      case 'report':
        return <div className="animate-slide-up"><ReportView score={state.riskScore} diseaseType={assessmentType} onBackToHome={() => handleNavigate('home')} onIntervention={handleIntervention} /></div>;
      case 'service-headache':
        return <div className="animate-slide-up"><HeadacheServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-cognitive':
        return <div className="animate-slide-up"><CognitiveServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-epilepsy':
        return <div className="animate-slide-up"><EpilepsyServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-family':
        return <div className="animate-slide-up"><FamilyServiceView onBack={() => handleNavigate('profile')} /></div>;
      case 'service-mall':
      case 'payment':
        return <div className="animate-slide-up"><ServiceMallView onNavigate={handleNavigate} onBack={() => handleNavigate('home')} /></div>;
      case 'haas-checkout':
        return <div className="animate-slide-up"><HaaSRentalView onBack={() => handleNavigate('home')} onComplete={handleAssetSync} /></div>;
      default:
        return <HomeView user={state.user} riskScore={state.riskScore} hasDevice={state.user.hasHardware} onNavigate={handleNavigate} primaryCondition={state.primaryCondition} />;
    }
  };

  const showBottomNav = ['home', 'chat', 'profile'].includes(currentView);

  return (
    <div className="font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden">
       {/* Global Offline Warning */}
       {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-slate-800 text-white text-[10px] font-bold py-2 text-center z-[9999] animate-slide-up flex items-center justify-center gap-2">
             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             网络连接已断开，部分 AI 服务不可用
          </div>
       )}
       
       {renderContent()}
       
       {showBottomNav && (
         <BottomNav currentView={currentView} onNavigate={handleNavigate} />
       )}
    </div>
  );
};

export default App;
