
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

// Mock User Data
const INITIAL_USER: User = {
  id: 'user_001',
  name: '陈建国',
  phone: '13900000000',
  role: UserRole.PATIENT,
  vipLevel: 0,
  activeServices: []
};

// --- Profile View Component ---
const ProfileView: React.FC<{ user: User; hasDevice: boolean; onNavigate: (v: AppView) => void }> = ({ user, hasDevice, onNavigate }) => {
  return (
    <Layout headerTitle="个人中心" hideHeader>
      <div className="min-h-screen bg-slate-50 pb-24 relative">
        {/* Header */}
        <div className="bg-white p-6 pt-12 pb-8 border-b border-slate-50 shadow-sm">
           <div className="flex items-center gap-4">
             <div className={`w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl shadow-inner border-2 ${user.vipLevel > 0 ? 'border-amber-400' : 'border-white'}`}>
               👨‍🦳
             </div>
             <div>
               <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${user.vipLevel > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {user.vipLevel > 0 ? '华西尊享会员' : '普通用户'}
                  </span>
               </div>
             </div>
           </div>
        </div>

        {/* Dashboard */}
        <div className="p-5 space-y-4">
           {/* Device Card */}
           <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-slate-800 text-[13px]">我的智能设备</h3>
                 {!hasDevice && <button onClick={() => onNavigate('haas-checkout')} className="text-brand-600 text-[10px] font-bold bg-brand-50 px-2 py-1 rounded-lg">申请设备 +</button>}
              </div>
              {hasDevice ? (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">⌚</div>
                   <div>
                      <div className="text-[11px] font-black text-emerald-800">生命体征监测手环</div>
                      <div className="text-[9px] text-emerald-600 font-bold mt-0.5">运行中 · 电量 85%</div>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 text-center text-slate-400 text-[11px] font-bold border border-slate-100 border-dashed">
                   暂无绑定监测设备
                </div>
              )}
           </div>

           {/* Menu */}
           <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100">
              {[
                { label: '我的报告', icon: '📄', action: () => onNavigate('report') },
                { label: '亲情账号', icon: '👨‍👩‍👧', action: () => onNavigate('service-family') },
                { label: '服务订单', icon: '📦', action: () => onNavigate('service-mall') },
                { label: '系统设置', icon: '⚙️', action: () => {} }
              ].map((item, i) => (
                 <button key={i} onClick={item.action} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-3">
                       <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                       <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-slate-300">›</span>
                 </button>
              ))}
           </div>
        </div>
      </div>
    </Layout>
  );
};

const App: React.FC = () => {
  // State Machine
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [hasDevice, setHasDevice] = useState<boolean>(false);
  const [assessmentType, setAssessmentType] = useState<DiseaseType>(DiseaseType.MIGRAINE);

  // --- Navigation Handler ---
  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Listen for custom deep links
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

  // --- Logic Handlers (The Brain) ---

  // 1. Triage Logic: Chat -> Report
  const handleTriageComplete = (summary: any) => {
    // 强制设定为高风险以展示闭环逻辑
    setRiskScore(summary.risk || 85); 
    setAssessmentType(DiseaseType.MIGRAINE); // Mock mapping
    handleNavigate('report');
  };

  // 2. Report Logic: Report -> Home (Intervention)
  const handleIntervention = () => {
    handleNavigate('home');
  };

  // 3. Payment/Rental Logic: Mall -> Home (Asset Sync)
  const handleAssetSync = () => {
    setUser(u => ({ ...u, vipLevel: 1 }));
    setHasDevice(true);
    handleNavigate('home');
  };

  const handleScoreUpdate = (score: number) => {
      setRiskScore(score);
      handleNavigate('report');
  };

  // --- Render (The View) ---
  const renderContent = () => {
    switch (currentView) {
      // Tower 1: Health
      case 'home':
        return <HomeView 
                  user={user} 
                  riskScore={riskScore}
                  hasDevice={hasDevice}
                  onNavigate={handleNavigate} 
                  primaryCondition={DiseaseType.MIGRAINE} 
               />;
      
      // Tower 2: Chat
      case 'chat':
        return <ChatView onBack={() => handleNavigate('home')} onPaymentGate={handleTriageComplete} />;
      
      // Tower 3: Profile
      case 'profile':
        return <ProfileView user={user} hasDevice={hasDevice} onNavigate={handleNavigate} />;
      
      // Sub-views
      case 'assessment':
        return <AssessmentView type={assessmentType} onComplete={handleScoreUpdate} onBack={() => handleNavigate('home')} />;
      
      case 'report':
        return <ReportView 
                  score={riskScore} 
                  diseaseType={assessmentType} 
                  onBackToHome={() => handleNavigate('home')} 
                  onIntervention={handleIntervention}
               />;
      
      case 'service-headache':
        return <HeadacheServiceView onBack={() => handleNavigate('home')} />;
      
      case 'service-cognitive':
        return <CognitiveServiceView onBack={() => handleNavigate('home')} />;
      
      case 'service-epilepsy':
        return <EpilepsyServiceView onBack={() => handleNavigate('home')} />;

      case 'service-family':
        return <FamilyServiceView onBack={() => handleNavigate('profile')} />;
      
      case 'service-mall':
      case 'payment':
        return <ServiceMallView onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />;
      
      case 'haas-checkout':
        return <HaaSRentalView onBack={() => handleNavigate('home')} onComplete={handleAssetSync} />;
      
      default:
        return <HomeView user={user} riskScore={riskScore} hasDevice={hasDevice} onNavigate={handleNavigate} primaryCondition={DiseaseType.MIGRAINE} />;
    }
  };

  const showBottomNav = ['home', 'chat', 'profile'].includes(currentView);

  return (
    <div className="font-sans antialiased text-slate-900 bg-white min-h-screen max-w-[430px] mx-auto shadow-2xl relative">
       {renderContent()}
       
       {showBottomNav && (
         <BottomNav currentView={currentView} onNavigate={handleNavigate} />
       )}
    </div>
  );
};

export default App;
