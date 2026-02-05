
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DiseaseType } from '../types';
import { createChatSession, sendMessageToAI } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { PaywallModal } from '../components/business/payment/PaywallModal'; // 复用支付组件
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
  
  // Progress (Dynamic: Based on specific disease path logic from geminiService)
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5); // Default, updated by AI session

  // Assessment Offer State (Soft Offer)
  const [showAssessmentOffer, setShowAssessmentOffer] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    // 更新动态步数 (Initial state)
    setTotalSteps(chatSessionRef.current.totalSteps || 5);
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
      
      // Update dynamic steps (Critical: Sync with Service Logic)
      // Service sets totalSteps based on disease: Epilepsy=4, Migraine=6, Default=5
      setCurrentStep(chatSessionRef.current.step);
      if (chatSessionRef.current.totalSteps) {
          setTotalSteps(chatSessionRef.current.totalSteps);
      }

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

  // --- Handlers & Fixes ---
  const handleUnlockAssessment = () => {
      // [FIX] Explicitly set showPayModal to true
      setShowPayModal(true);
  };

  const handleAssessmentPaid = () => {
      // 支付成功，跳转到测评页
      const event = new CustomEvent('navigate-to', { detail: 'assessment' });
      window.dispatchEvent(event);
  };

  const handleSkip = () => {
      // [Compliance] 用户自愿选择免费基础服务
      // 修正逻辑：使用 AI 问诊过程中动态计算的风险评分，不再硬编码为 0
      const currentRisk = chatSessionRef.current?.estimatedRisk || 15;
      
      dispatch({ type: 'SET_RISK_SCORE', payload: { score: currentRisk, type: activeDisease } });
      const event = new CustomEvent('navigate-to', { detail: 'report' }); // 直接看基础报告，不回首页
      window.dispatchEvent(event);
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
      {/* [Layout Fix] Add padding-bottom to accommodate BottomNav (approx 60px + safe area) */}
      <div className="flex flex-col h-full bg-[#F7F8FA] w-full relative pb-[calc(60px+env(safe-area-inset-bottom))]">
        
        {/* --- 1. Custom Header with Dynamic Progress Bar --- */}
        <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center px-2 h-14">
                 <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-800 active:opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                 </button>
                 <div className="flex-1 px-2">
                     <div className="flex justify-between items-end mb-1.5">
                         {/* [Typography Update] 12px -> 14px (Requirement 3) */}
                         <span className="text-[14px] font-bold text-slate-900">{getDiseaseLabel(activeDisease)}</span>
                         {/* [Typography Update] 10px -> 12px (Requirement 3) */}
                         <span className="text-[12px] text-brand-600 font-bold">
                             {currentStep >= totalSteps ? '问诊完成' : `进度 ${currentStep}/${totalSteps}`}
                         </span>
                     </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                         <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${currentStep >= totalSteps ? 'bg-emerald-500' : 'bg-brand-500'}`}
                            style={{ width: `${Math.min((currentStep / totalSteps) * 100, 100)}%` }}
                         ></div>
                     </div>
                 </div>
                 <div className="w-4"></div>
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth no-scrollbar">
          <div className="space-y-6 pb-4">
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
                    {/* Render Options: Only if no assessment offer is showing */}
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

            {/* --- 2. Assessment Offer Card (Soft Offer) --- */}
            {/* [Optimization] 非强制弹窗，改为信息流末尾的卡片，提供明确的免费选项 */}
            {showAssessmentOffer && (
                <div className="bg-white border border-slate-100 rounded-[24px] p-6 text-center animate-slide-up shadow-lg mx-2 mb-10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-300 to-brand-600"></div>
                    <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-brand-100">
                        📊
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">问诊基础采集已完成</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed px-2">
                        您可以选择生成<span className="text-slate-900 font-bold">免费基础报告</span>，或进行深度医疗分级测评。
                    </p>
                    
                    <div className="space-y-3">
                        {/* 1元付费入口 - 视觉强调但非唯一 */}
                        <Button fullWidth onClick={handleUnlockAssessment} className="shadow-lg shadow-brand-500/20 py-4 h-auto flex items-center justify-center gap-2">
                            <span className="text-sm">深度分级测评 (含MIDAS量表)</span>
                            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">¥1.00</span>
                        </Button>

                        {/* 免费跳过入口 - 按钮形式，而非隐蔽的文字链接 */}
                        <Button 
                            fullWidth 
                            variant="outline" 
                            onClick={handleSkip}
                            className="border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 py-3"
                        >
                            跳过，查看免费基础建议
                        </Button>
                    </div>
                    <p className="text-[9px] text-slate-300 mt-4">依据《互联网诊疗监管细则》，您拥有完全的自主选择权</p>
                </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {!showAssessmentOffer && !isLoading && latestOptions.length === 0 && (
            <div className="flex-none bg-white border-t border-slate-100 p-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
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
