
import React, { useState } from 'react';
import { User, UserRole, DiseaseType, AppView } from './types';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import AssessmentView from './components/AssessmentView';
import ReportView from './components/ReportView';
import Button from './components/Button';
import BottomNav from './components/BottomNav';
import { CognitiveServiceView, HeadacheServiceView, EpilepsyServiceView, FamilyServiceView } from './components/HealthServices';

// Mock User
const INITIAL_USER: User = {
  id: 'u1',
  name: '陈先生',
  phone: '138****0000',
  role: UserRole.PATIENT,
  vipLevel: 0,
  activeServices: []
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  
  // Feature State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [assessmentScore, setAssessmentScore] = useState(0);
  
  // 核心状态：用户当前的主诉或拟诊方向，用于驱动首页 Dashboard 的个性化展示
  const [primaryCondition, setPrimaryCondition] = useState<DiseaseType | null>(null);

  const handleLogin = () => {
    setUser(INITIAL_USER);
    setCurrentView('home'); 
  };

  const handlePaymentSuccess = () => {
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = (score: number) => {
    setAssessmentScore(score);
    // 评估完成后，锁定用户的主诉方向，首页将变成专病模式
    if (primaryCondition === DiseaseType.UNKNOWN || !primaryCondition) {
        // Fallback if not set
    }
    setCurrentView('report');
  };

  const handleBackToHomeFromReport = () => {
    setCurrentView('home');
  }

  const handleClosePayment = () => {
      setCurrentView('home');
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-brand-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">华西 Neuro-Link</h1>
        <p className="text-slate-500 mb-10 text-center">神经专病 AI 数字医院</p>
        
        <div className="w-full max-w-sm space-y-4">
            <input type="tel" placeholder="手机号码" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
            <div className="flex gap-2">
                <input type="text" placeholder="验证码" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-500" />
                <button className="px-4 text-brand-600 font-medium text-sm">获取验证码</button>
            </div>
            <Button fullWidth onClick={handleLogin} className="mt-4">
                立即登录
            </Button>
            <p className="text-xs text-slate-400 text-center mt-4">
                登录即代表同意 <span className="text-brand-600">用户协议</span> 与 <span className="text-brand-600">隐私政策</span>
            </p>
        </div>
      </div>
    );
  }

  const showBottomNav = ['home', 'chat', 'profile', 'service-cognitive', 'service-headache', 'service-epilepsy', 'service-family'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-50 relative">
        {currentView === 'home' && user && (
            <HomeView 
                user={user} 
                onNavigate={setCurrentView} 
                primaryCondition={primaryCondition} // Pass the condition to drive personalization
            />
        )}
        
        {/* Services */}
        {currentView === 'service-cognitive' && <CognitiveServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-headache' && <HeadacheServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-epilepsy' && <EpilepsyServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-family' && <FamilyServiceView onBack={() => setCurrentView('home')} />}

        {/* Chat */}
        {currentView === 'chat' && (
            <ChatView 
                onBack={() => setCurrentView('home')} 
                onPaymentGate={(summary) => {
                    setAiSummary(summary);
                    let disease = DiseaseType.UNKNOWN;
                    const d = (summary.disease || '').toUpperCase();
                    if (d.includes('MIGRAINE')) disease = DiseaseType.MIGRAINE;
                    else if (d.includes('COGNITIVE')) disease = DiseaseType.COGNITIVE;
                    else if (d.includes('EPILEPSY')) disease = DiseaseType.EPILEPSY;
                    
                    setPrimaryCondition(disease); // Set the detected disease context
                    setCurrentView('payment');
                }} 
            />
        )}

        {currentView === 'profile' && (
             <div className="flex flex-col items-center justify-center h-screen text-slate-400">
                 <p>个人中心 (开发中)</p>
                 <Button variant="ghost" onClick={() => setCurrentView('login')}>退出登录</Button>
             </div>
        )}

        {/* Payment Gate */}
        {currentView === 'payment' && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleClosePayment}></div>
                <div className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-2xl p-6 relative z-10 animate-slide-up shadow-2xl">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">华西专业评估通道</h3>
                        <button onClick={handleClosePayment} className="bg-slate-100 p-2 rounded-full text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl p-5 mb-6 border border-brand-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
                             <div className="text-xs font-bold text-brand-600 uppercase tracking-wide">AI Triage Result</div>
                        </div>
                        <div className="text-sm text-slate-700 font-medium leading-relaxed">
                            {aiSummary?.summary || '症状特征需结合专业量表进行二次确认。'}
                        </div>
                        <div className="mt-3 flex gap-2">
                             <span className="text-[10px] bg-white border border-brand-200 text-brand-600 px-2 py-1 rounded-md">
                                 风险指数: {aiSummary?.risk || '待定'}
                             </span>
                             <span className="text-[10px] bg-white border border-brand-200 text-brand-600 px-2 py-1 rounded-md">
                                 拟诊: {primaryCondition === 'MIGRAINE' ? '偏头痛' : primaryCondition === 'EPILEPSY' ? '癫痫' : primaryCondition === 'COGNITIVE' ? '认知障碍' : '待查'}
                             </span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm text-slate-600">
                            <span>专业量表评估费</span>
                            <span className="line-through">¥ 29.00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-600">
                            <span>AI 预诊报告费</span>
                            <span className="line-through">¥ 9.90</span>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                            <span className="text-slate-800 font-bold">华西数字诊疗补贴后</span>
                            <div className="flex items-baseline gap-1 text-accent-600">
                                <span className="text-sm font-bold">¥</span>
                                <span className="text-4xl font-bold tracking-tight">1.00</span>
                            </div>
                        </div>
                    </div>

                    <Button fullWidth variant="primary" onClick={handlePaymentSuccess} className="shadow-xl shadow-brand-200 py-4 text-lg">
                        立即支付 ¥1.00 并解锁
                    </Button>
                </div>
            </div>
        )}

        {currentView === 'assessment' && (
            <AssessmentView 
                type={primaryCondition || DiseaseType.UNKNOWN} 
                onBack={() => setCurrentView('home')}
                onComplete={handleAssessmentComplete}
            />
        )}

        {currentView === 'report' && (
            <ReportView 
                score={assessmentScore}
                diseaseType={primaryCondition || DiseaseType.UNKNOWN}
                onBackToHome={handleBackToHomeFromReport}
            />
        )}

        {showBottomNav && <BottomNav currentView={currentView} onNavigate={setCurrentView} />}
    </div>
  );
};

export default App;
