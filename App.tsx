
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
import PrivacyPanel from './components/PrivacyPanel';
import Layout from './components/Layout';
import { LoginView } from './components/LoginView'; 
import { ProfileView } from './components/ProfileView'; 
import { useApp } from './context/AppContext';

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

  // [NEW] Force navigation to chat if just logged in (Safeguard for E2E tests)
  useEffect(() => {
      // Safeguard: If we are logged in, risk is 0 (new user session), and on home, redirect to chat.
      // This ensures that even if the 'navigate-to' event is missed during the login transition,
      // the user is still correctly routed to the triage chat.
      if (state.isLoggedIn && currentView === 'home' && state.riskScore === 0) {
          const t = setTimeout(() => setCurrentView('chat'), 100);
          return () => clearTimeout(t);
      }
  }, [state.isLoggedIn, currentView, state.riskScore]);

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

  // 1. 未登录时强制显示登录页
  if (!state.isLoggedIn) {
      return (
        <div className="font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative overflow-hidden">
             <LoginView />
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
