
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DiseaseType } from '../types';
import { createChatSession, sendMessageToAI, getTriageAnalysis } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import Layout from './Layout';
import Button from './Button';
import { PaywallModal } from './business/payment/PaywallModal'; // 复用支付组件
import { usePayment } from '../hooks/usePayment';

interface ChatViewProps {
  onBack: () => void;
  onPaymentGate: (summary: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onBack, onPaymentGate }) => {
  const { state, dispatch } = useApp();
  const { PACKAGES } = usePayment();
  
  // --- State ---
  const [activeDisease, setActiveDisease] = useState<DiseaseType>(DiseaseType.UNKNOWN);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestOptions, setLatestOptions] = useState<string[]>([]);
  const [apiError, setApiError] = useState(false);
  
  // Progress & Feedback (PRD Req: "问诊进度3/5")
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(5); 
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Assessment Offer State
  const [showAssessmentOffer, setShowAssessmentOffer] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Context Caching Logic ---
  const STORAGE_KEY = 'huaxi_chat_history_unified_v4';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setMessages([]);
    setLatestOptions([]);
    setIsLoading(false);
    setShowAssessmentOffer(false);
    setApiError(false);
    setCurrentStep(0);

    chatSessionRef.current = createChatSession("系统初始化", DiseaseType.UNKNOWN);
    // 直接开始分诊，AI 主动接诊
    handleSend("开始分诊", true);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, showAssessmentOffer]);

  // Toast Auto-Close (PRD Req: "3秒自动关闭")
  useEffect(() => {
      if (showFeedbackToast) {
          const timer = setTimeout(() => setShowFeedbackToast(false), 3000);
          return () => clearTimeout(timer);
      }
  }, [showFeedbackToast]);

  const parseResponse = (rawText: string) => {
    let cleanText = rawText;
    let options: string[] = [];
    let triggerOffer = false;

    const optionsMatch = rawText.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/i);
    if (optionsMatch) {
        options = optionsMatch[1].split(/[|、,]/).map(s => s.trim()).filter(s => s.length > 0);
        cleanText = cleanText.replace(optionsMatch[0], '');
    }

    if (rawText.includes("<ACTION>OFFER_ASSESSMENT</ACTION>")) {
        triggerOffer = true;
        cleanText = cleanText.replace(/<ACTION>\s*OFFER_ASSESSMENT\s*<\/ACTION>/i, '');
    }

    return { cleanText: cleanText.trim(), options, triggerOffer };
  };

  const handleSend = async (text: string, isSystemStart = false) => {
    let currentMsgs = messages;
    setLatestOptions([]);

    if (!apiError && !isSystemStart) {
        const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() };
        currentMsgs = [...messages, newMsg];
        setMessages(currentMsgs);
        
        // PRD Req: "信息已提交，正在分析"
        setFeedbackMsg("信息已提交，正在分析");
        setShowFeedbackToast(true);
    }
    
    setInput('');
    setIsLoading(true);
    setApiError(false);

    try {
      const rawResponse = await sendMessageToAI(chatSessionRef.current, text, currentMsgs);
      
      // Update disease type
      if (chatSessionRef.current.diseaseType !== DiseaseType.UNKNOWN) {
          setActiveDisease(chatSessionRef.current.diseaseType);
      }
      
      // Update step for Progress Bar
      setCurrentStep(chatSessionRef.current.step);

      const { cleanText, options, triggerOffer } = parseResponse(rawResponse);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        timestamp: Date.now(),
        suggestedOptions: options
      };
      
      const updatedMsgs = [...currentMsgs, aiMsg];
      setMessages(updatedMsgs);
      setLatestOptions(options);

      if (triggerOffer) {
         setShowAssessmentOffer(true);
      }

    } catch (e) {
      console.error(e);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleUnlockAssessment = () => {
      // 点击付费，弹出支付框
      setShowPayModal(true);
  };

  const handleAssessmentPaid = () => {
      // 支付成功，跳转到测评页
      // 使用 window event 通知 App.tsx 跳转
      const event = new CustomEvent('navigate-to', { detail: 'assessment' });
      window.dispatchEvent(event);
  };

  const handleSkip = () => {
      // PRD Req: "用户若不购买该深度测评，可正常享受线上基础免费功能"
      // 这里跳过测评，直接去首页或简单的基础报告
      // 我们设定 riskScore = 0 (表示未测评/基础) 并跳转首页
      dispatch({ type: 'SET_RISK_SCORE', payload: { score: 0, type: activeDisease } });
      const event = new CustomEvent('navigate-to', { detail: 'home' });
      window.dispatchEvent(event);
      
      // 可以加个 Toast 提示进入基础模式
      setTimeout(() => alert("已为您开启基础免费服务模式"), 500);
  };

  const getDiseaseLabel = (type: DiseaseType) => {
      switch (type) {
          case DiseaseType.MIGRAINE: return '华西头痛中心';
          case DiseaseType.EPILEPSY: return '华西癫痫中心';
          case DiseaseType.COGNITIVE: return '认知/记忆门诊';
          default: return '华西神经内科';
      }
  };

  const getTargetPackage = () => {
      return PACKAGES.ICE_BREAKING_MIGRAINE; 
  };

  return (
    <Layout headerTitle="" showBack={false} hideHeader={true} disableScroll={true}>
      <div className="flex flex-col h-full bg-[#F7F8FA] w-full relative">
        
        {/* --- 1. Custom Header with Progress Bar (PRD Req) --- */}
        <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center px-2 h-14">
                 <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-800 active:opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                 </button>
                 <div className="flex-1 px-2">
                     <div className="flex justify-between items-end mb-1.5">
                         <span className="text-[12px] font-bold text-slate-900">{getDiseaseLabel(activeDisease)}</span>
                         <span className="text-[10px] text-brand-600 font-bold">
                             问诊进度 {Math.min(currentStep, totalSteps)}/{totalSteps} (剩余{Math.max(0, totalSteps - currentStep)}步)
                         </span>
                     </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                         <div 
                            className="bg-brand-500 h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${Math.min((currentStep / totalSteps) * 100, 100)}%` }}
                         ></div>
                     </div>
                 </div>
                 <div className="w-4"></div>
            </div>
        </div>

        {/* --- Feedback Toast (PRD Req: 3s auto close) --- */}
        {showFeedbackToast && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fade-in transition-opacity duration-300">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[12px] font-medium">{feedbackMsg}</span>
            </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth no-scrollbar">
          <div className="space-y-6 pb-32">
            {messages.map((msg, index) => (
                <div key={msg.id} className="flex flex-col gap-3 animate-slide-up">
                    <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-3'}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                                <span className="text-xl">👨‍⚕️</span>
                            </div>
                        )}
                        <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-[#1677FF] text-white rounded-tr-sm shadow-brand-500/20' 
                            : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                    {/* Render Options: Only for the last AI message if offers exist and not showing assessment */}
                    {index === messages.length - 1 && msg.role === 'model' && latestOptions.length > 0 && !showAssessmentOffer && (
                        <div className="pl-14 pr-2 space-y-2.5 w-full animate-fade-in">
                            {latestOptions.map((opt, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => !isLoading && handleSend(opt)}
                                    disabled={isLoading}
                                    className="w-full bg-white hover:bg-brand-50 active:bg-brand-100 border border-brand-100 text-brand-600 font-bold py-3.5 px-5 rounded-xl shadow-sm text-left transition-all active:scale-[0.98] flex items-center justify-between group"
                                >
                                    <span className="text-[13px]">{opt}</span>
                                    <span className="text-slate-300 group-hover:text-brand-400">›</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start items-center gap-3 pl-1">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">👨‍⚕️</div>
                    <div className="flex gap-1.5 bg-white px-5 py-4 rounded-2xl border border-slate-50 shadow-sm">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                </div>
            )}

            {/* --- 2. Assessment Offer Card (End of Flow) --- */}
            {/* PRD Req: "仅在初步信息采集完成页面清晰标注测评入口及费用，尊重用户自主选择" */}
            {showAssessmentOffer && (
                <div className="bg-gradient-to-b from-brand-50 to-white border border-brand-100 rounded-[24px] p-6 text-center animate-slide-up shadow-xl mx-2 mb-10">
                    <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
                        📋
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">基础信息采集完毕</h3>
                    <p className="text-xs text-slate-500 mb-8 leading-relaxed px-4">
                        为了给您提供精准的医疗分级建议，建议进行华西标准量表深度测评。
                    </p>
                    
                    <div className="space-y-4">
                        {/* 1元付费入口 */}
                        <Button fullWidth onClick={handleUnlockAssessment} className="shadow-lg shadow-brand-500/20 py-4 h-auto flex items-center justify-center gap-2">
                            <span>开始深度测评</span>
                            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">¥1.00</span>
                        </Button>

                        {/* 免费跳过入口 (PRD Req: "可正常享受线上基础免费功能") */}
                        <button 
                            onClick={handleSkip}
                            className="text-slate-400 text-xs font-bold underline decoration-slate-300 p-2 hover:text-slate-600 transition-colors"
                        >
                            暂不测评，直接享受基础免费服务
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Input Area (Manual Fallback) */}
        {!showAssessmentOffer && !isLoading && latestOptions.length === 0 && (
            <div className="flex-none bg-white border-t border-slate-100 p-3 pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="手动输入症状细节..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none focus:border-brand-500 transition-all"
                    />
                    <button onClick={() => handleSend(input)} className="bg-[#1677FF] text-white w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-95">
                        ↑
                    </button>
                </div>
            </div>
        )}

        {/* Payment Modal */}
        <PaywallModal 
            visible={showPayModal} 
            pkg={getTargetPackage()} 
            onClose={() => setShowPayModal(false)}
            onSuccess={handleAssessmentPaid}
        />
      </div>
    </Layout>
  );
};

export default ChatView;
