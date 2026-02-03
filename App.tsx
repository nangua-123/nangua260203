
import React, { useState, useEffect } from 'react';
import { User, UserRole, DiseaseType, AppView } from './types';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import AssessmentView from './components/AssessmentView';
import ReportView from './components/ReportView';
import Button from './components/Button';
import BottomNav from './components/BottomNav';
import { CognitiveServiceView, HeadacheServiceView, EpilepsyServiceView, FamilyServiceView } from './components/HealthServices';
import { ServiceMallView, HaaSRentalView } from './components/ServiceMarketplace';

// 模拟初始化用户
const INITIAL_USER: User = {
  id: 'u1',
  name: '陈建国',
  phone: '138****0000',
  role: UserRole.PATIENT,
  vipLevel: 0,
  activeServices: []
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  
  // 业务状态
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [assessmentScore, setAssessmentScore] = useState(0);
  
  // 用户当前确定的主诉方向
  const [primaryCondition, setPrimaryCondition] = useState<DiseaseType | null>(null);

  // 全局导航监听器
  useEffect(() => {
    const handleNavigation = (e: CustomEvent) => {
        const targetView = e.detail as AppView;
        if (targetView) {
            setCurrentView(targetView);
        }
    };
    window.addEventListener('navigate-to', handleNavigation as EventListener);
    return () => {
        window.removeEventListener('navigate-to', handleNavigation as EventListener);
    };
  }, []);

  const handleLogin = () => {
    setUser(INITIAL_USER);
    setCurrentView('home'); 
  };

  const handlePaymentSuccess = () => {
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = (score: number) => {
    setAssessmentScore(score);
    setCurrentView('report');
  };

  const handleBackToHomeFromReport = () => {
    setCurrentView('home');
  }

  const handleClosePayment = () => {
      setCurrentView('home');
  }

  // 登录界面
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 max-w-[430px] mx-auto">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-brand-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">华西 Neuro-Link</h1>
        <p className="text-slate-400 mb-10 text-center font-bold uppercase tracking-widest text-[10px]">神经专病 AI 数字医院</p>
        
        <div className="w-full space-y-4">
            <input type="tel" placeholder="请输入手机号码" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-brand-500 transition-colors font-medium text-sm" />
            <div className="flex gap-2">
                <input type="text" placeholder="验证码" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-brand-500 font-medium text-sm" />
                <button className="px-4 text-brand-600 font-black text-sm whitespace-nowrap active:opacity-60">获取验证码</button>
            </div>
            <Button fullWidth onClick={handleLogin} className="mt-4 py-4 text-sm tracking-[0.4em]">
                立即登录
            </Button>
            <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
                登录即代表您同意华西数字医院的 <br/> <span className="text-brand-600 font-bold underline">用户协议</span> 与 <span className="text-brand-600 font-bold underline">隐私政策</span>
            </p>
        </div>
      </div>
    );
  }

  const showBottomNav = ['home', 'chat', 'profile', 'service-cognitive', 'service-headache', 'service-epilepsy', 'service-family', 'service-mall'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-50 relative">
        {currentView === 'home' && user && (
            <HomeView 
                user={user} 
                onNavigate={setCurrentView} 
                primaryCondition={primaryCondition} 
            />
        )}
        
        {/* 专病服务详情 */}
        {currentView === 'service-cognitive' && <CognitiveServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-headache' && <HeadacheServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-epilepsy' && <EpilepsyServiceView onBack={() => setCurrentView('home')} />}
        {currentView === 'service-family' && <FamilyServiceView onBack={() => setCurrentView('home')} />}

        {/* 服务商城与结算 */}
        {currentView === 'service-mall' && <ServiceMallView onNavigate={setCurrentView} onBack={() => setCurrentView('home')} />}
        {currentView === 'haas-checkout' && <HaaSRentalView onBack={() => setCurrentView('service-epilepsy')} onComplete={() => setCurrentView('home')} />}

        {/* AI 数字门诊 */}
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
                    
                    setPrimaryCondition(disease); 
                    setCurrentView('payment');
                }} 
            />
        )}

        {currentView === 'profile' && (
             <div className="flex flex-col items-center justify-center h-screen text-slate-400 max-w-[430px] mx-auto bg-white">
                 <div className="text-4xl mb-4">👤</div>
                 <p className="font-black uppercase tracking-widest text-sm">个人中心数据同步中</p>
                 <Button variant="ghost" onClick={() => setCurrentView('login')} className="mt-8 font-black text-red-500">退出当前账号</Button>
             </div>
        )}

        {/* 支付验证网关 (1元评估) */}
        {currentView === 'payment' && (
            <div className="fixed inset-0 z-50 flex items-end justify-center max-w-[430px] mx-auto">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClosePayment}></div>
                <div className="bg-white w-full rounded-t-[40px] p-8 relative z-10 animate-slide-up shadow-2xl">
                    <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">华西专业评估通道</h3>
                        <button onClick={handleClosePayment} className="bg-slate-50 p-2 rounded-full text-slate-400 active:scale-90 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="bg-brand-50/40 rounded-3xl p-6 mb-8 border border-brand-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                             <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                             <div className="text-[10px] font-black text-brand-600 uppercase tracking-widest">AI 分诊结论</div>
                        </div>
                        <div className="text-[13px] text-slate-700 font-bold leading-relaxed">
                            {aiSummary?.summary || '症状初步识别完成，需结合专业量表进行二次临床确认。'}
                        </div>
                        <div className="mt-4 flex gap-2">
                             <span className="text-[9px] font-black bg-white border border-brand-200 text-brand-600 px-3 py-1.5 rounded-xl">
                                 风险指数: {aiSummary?.risk || '待定'}
                             </span>
                             <span className="text-[9px] font-black bg-white border border-brand-200 text-brand-600 px-3 py-1.5 rounded-xl">
                                 拟诊: {primaryCondition === 'MIGRAINE' ? '偏头痛' : primaryCondition === 'EPILEPSY' ? '癫痫' : primaryCondition === 'COGNITIVE' ? '认知障碍' : '待查'}
                             </span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 px-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>专业量表筛查评估费</span>
                            <span className="line-through text-slate-300">¥ 29.00</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>AI 预诊档案报告费</span>
                            <span className="line-through text-slate-300">¥ 9.90</span>
                        </div>
                        <div className="flex justify-between items-end pt-5 border-t border-slate-50">
                            <span className="text-slate-900 font-black text-sm">华西数字诊疗补贴后</span>
                            <div className="flex items-baseline gap-1 text-brand-600">
                                <span className="text-xs font-black">¥</span>
                                <span className="text-4xl font-black tracking-tighter">1.00</span>
                            </div>
                        </div>
                    </div>

                    <Button fullWidth variant="primary" onClick={handlePaymentSuccess} className="shadow-xl shadow-brand-500/20 py-5 text-base tracking-[0.2em]">
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