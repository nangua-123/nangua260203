
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppView, DiseaseType } from './types';

// Import all functional components
import BottomNav from './components/common/BottomNav';
import HomeView from './pages/HomeView';
import ChatView from './pages/ChatView';
import AssessmentView from './pages/AssessmentView';
import ReportView from './pages/ReportView';
import { LoginView } from './pages/LoginView'; 
import { ProfileView } from './pages/ProfileView'; 
import { HeadacheServiceView, CognitiveServiceView, EpilepsyServiceView, FamilyServiceView } from './components/HealthServices';
import { HaaSRentalView, ServiceMallView } from './components/ServiceMarketplace';
import PrivacyPanel from './components/PrivacyPanel';
import { useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext'; // [NEW]
import { useIoTSimulation } from './hooks/useIoTSimulation';
import { GlobalSOS } from './components/GlobalSOS';

const AppContent: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [assessmentType, setAssessmentType] = useState<DiseaseType>(DiseaseType.MIGRAINE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useIoTSimulation();

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
    dispatch({ type: 'UNLOCK_FEATURE', payload: 'VIP_EPILEPSY' }); 
    dispatch({ type: 'BIND_HARDWARE', payload: true });
    handleNavigate('home');
  };

  const handleScoreUpdate = (score: number) => {
      dispatch({ type: 'SET_RISK_SCORE', payload: { score, type: assessmentType } });
      handleNavigate('report');
  };

  if (!state.isLoggedIn) {
      return (
        <div className="font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden">
             <LoginView />
        </div>
      );
  }

  // [SECURITY] 档案切换原子锁 (Physical Isolation)
  // 当处于切换状态时，强制卸载所有业务视图，显示安全隔离屏
  if (state.isSwitching) {
      return (
          <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen max-w-[430px] mx-auto shadow-2xl flex flex-col items-center justify-center z-[99999] relative">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-[#1677FF] rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-black text-slate-900">安全环境重构中...</h3>
              <p className="text-xs text-slate-500 mt-2">正在清除会话缓存与内存数据</p>
          </div>
      );
  }

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
                  onToggleElderly={() => dispatch({type: 'TOGGLE_ELDERLY_MODE'})}
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
      case 'privacy-settings': 
        return <div className="animate-slide-up"><PrivacyPanel onBack={() => handleNavigate('profile')} /></div>;
      default:
        return <HomeView user={state.user} riskScore={state.riskScore} hasDevice={state.user.hasHardware} onNavigate={handleNavigate} primaryCondition={state.primaryCondition} />;
    }
  };

  const showBottomNav = ['home', 'chat', 'profile'].includes(currentView);

  return (
    <div className={`font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden ${state.user.isElderlyMode ? 'text-lg' : ''}`}>
       {state.user.isElderlyMode && (
         <style>{`
           .btn { height: 60px !important; font-size: 1.25rem !important; }
         `}</style>
       )}
       
       {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-slate-800 text-white text-[10px] font-bold py-2 text-center z-[9999] animate-slide-up flex items-center justify-center gap-2">
             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             你的网络连接已断开，部分AI服务暂时不可用
          </div>
       )}
       
       <GlobalSOS />

       {renderContent()}
       
       {showBottomNav && (
         <BottomNav currentView={currentView} onNavigate={handleNavigate} />
       )}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;
