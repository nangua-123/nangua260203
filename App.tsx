
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
import Button from './components/common/Button'; // Needed for Notification Overlay

const AppContent: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // [NEW] Cognitive Task Notification State
  const [pendingCognitiveTask, setPendingCognitiveTask] = useState<'N4' | 'N5' | null>(null);

  useIoTSimulation();

  // [Elderly Mode] Toggle global class
  useEffect(() => {
    if (state.user.isElderlyMode) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  }, [state.user.isElderlyMode]);

  // Online Check
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

  // [NEW] Global Cognitive Timer (AVLT-H Suspension Watchdog)
  useEffect(() => {
      const checkDraft = () => {
          const draft = state.assessmentDraft;
          // Only proceed if cognitive draft exists
          if (!draft || draft.diseaseType !== DiseaseType.COGNITIVE || !draft.answers['avlt_n3_timestamp']) {
              return;
          }

          const t0 = draft.answers['avlt_n3_timestamp'];
          const now = Date.now();
          const n4Target = t0 + 5 * 60 * 1000;
          const n5Target = t0 + 20 * 60 * 1000;
          const n4Done = draft.answers['avlt_n4_score'] !== undefined;
          const n5Done = draft.answers['avlt_n5_score'] !== undefined;

          // Check deadlines. Tolerance of +30 seconds so it triggers once reached.
          // Logic: If past target AND not done => Alert.
          let newTask: 'N4' | 'N5' | null = null;

          if (!n4Done && now >= n4Target) {
              newTask = 'N4';
          } else if (n4Done && !n5Done && now >= n5Target) {
              newTask = 'N5';
          }

          // Only trigger if not already on assessment view
          if (newTask && currentView !== 'assessment') {
              setPendingCognitiveTask(newTask);
          } else if (currentView === 'assessment') {
              // If user manually went back, clear alert
              setPendingCognitiveTask(null);
          }
      };

      const interval = setInterval(checkDraft, 3000); // Check every 3s
      return () => clearInterval(interval);
  }, [state.assessmentDraft, currentView]);

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

  // Handlers
  const handleTriageComplete = (summary: any) => {
    dispatch({ type: 'SET_RISK_SCORE', payload: { score: summary.risk || 85, type: DiseaseType.MIGRAINE } });
    handleNavigate('report');
  };

  const handleIntervention = () => handleNavigate('home');

  const handleAssetSync = () => {
    dispatch({ type: 'UNLOCK_FEATURE', payload: 'VIP_EPILEPSY' }); 
    dispatch({ type: 'BIND_HARDWARE', payload: true });
    handleNavigate('home');
  };

  const handleScoreUpdate = (score: number) => {
      dispatch({ type: 'SET_RISK_SCORE', payload: { score, type: state.primaryCondition } });
      handleNavigate('report');
  };

  const resumeAssessment = () => {
      setPendingCognitiveTask(null);
      handleNavigate('assessment');
  };

  if (!state.isLoggedIn) {
      return (
        <div className="font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden">
             <LoginView />
        </div>
      );
  }

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
      case 'home': return <HomeView user={state.user} riskScore={state.riskScore} hasDevice={state.user.hasHardware} onNavigate={handleNavigate} primaryCondition={state.primaryCondition} />;
      case 'chat': return <ChatView onBack={() => handleNavigate('home')} onPaymentGate={handleTriageComplete} />;
      case 'profile': return <ProfileView user={state.user} hasDevice={state.user.hasHardware} onNavigate={handleNavigate} onClearCache={() => { dispatch({type: 'CLEAR_CACHE'}); window.location.reload(); }} onToggleElderly={() => dispatch({type: 'TOGGLE_ELDERLY_MODE'})} />;
      case 'assessment': return <div className="animate-slide-up"><AssessmentView type={state.primaryCondition} onComplete={handleScoreUpdate} onBack={() => handleNavigate('home')} /></div>;
      case 'report': return <div className="animate-slide-up"><ReportView score={state.riskScore} diseaseType={state.primaryCondition} onBackToHome={() => handleNavigate('home')} onIntervention={handleIntervention} /></div>;
      case 'service-headache': return <div className="animate-slide-up"><HeadacheServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-cognitive': return <div className="animate-slide-up"><CognitiveServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-epilepsy': return <div className="animate-slide-up"><EpilepsyServiceView onBack={() => handleNavigate('home')} /></div>;
      case 'service-family': return <div className="animate-slide-up"><FamilyServiceView onBack={() => handleNavigate('profile')} /></div>;
      case 'service-mall': case 'payment': return <div className="animate-slide-up"><ServiceMallView onNavigate={handleNavigate} onBack={() => handleNavigate('home')} /></div>;
      case 'haas-checkout': return <div className="animate-slide-up"><HaaSRentalView onBack={() => handleNavigate('home')} onComplete={handleAssetSync} /></div>;
      case 'privacy-settings': return <div className="animate-slide-up"><PrivacyPanel onBack={() => handleNavigate('profile')} /></div>;
      default: return <HomeView user={state.user} riskScore={state.riskScore} hasDevice={state.user.hasHardware} onNavigate={handleNavigate} primaryCondition={state.primaryCondition} />;
    }
  };

  const showBottomNav = ['home', 'chat', 'profile'].includes(currentView);

  return (
    <div className={`font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden`}>
       {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-slate-800 text-white text-[10px] font-bold py-2 text-center z-[9999] animate-slide-up flex items-center justify-center gap-2">
             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             你的网络连接已断开，部分AI服务暂时不可用
          </div>
       )}
       
       <GlobalSOS />

       {/* [NEW] Cognitive Task Force Overlay */}
       {pendingCognitiveTask && (
           <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in text-center">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl mb-6 shadow-2xl animate-bounce">
                   ⏰
               </div>
               <h2 className="text-2xl font-black text-white mb-2">记忆回忆测试已就绪</h2>
               <p className="text-sm text-slate-300 mb-10 leading-relaxed">
                   距离您上次学习已过去 {pendingCognitiveTask === 'N4' ? '5' : '20'} 分钟。<br/>
                   为了保证评估准确性，请立即进行 <span className="text-white font-bold">{pendingCognitiveTask === 'N4' ? '短延迟' : '长延迟'}回忆</span>。
               </p>
               <Button fullWidth onClick={resumeAssessment} className="bg-[#1677FF] shadow-lg shadow-blue-500/40 py-4 h-14 text-lg">
                   立即开始 (N{pendingCognitiveTask === 'N4' ? '4' : '5'})
               </Button>
           </div>
       )}

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
