
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, HeadacheProfile, DiseaseType, EpilepsyProfile, CognitiveProfile } from '../types';
import { createChatSession, sendMessageToAI, getTriageAnalysis } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import Layout from './Layout';
import Button from './Button';

interface ChatViewProps {
  onBack: () => void;
  onPaymentGate: (summary: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onBack, onPaymentGate }) => {
  const { state, dispatch } = useApp();
  
  // --- State for Chat ---
  const [activeDisease, setActiveDisease] = useState<DiseaseType>(DiseaseType.MIGRAINE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [showArchiveGen, setShowArchiveGen] = useState(false);
  const [latestOptions, setLatestOptions] = useState<string[]>([]);
  const [apiError, setApiError] = useState(false); // New Error State
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasTriggeredReport = useRef(false);

  // --- Context Caching Logic (localStorage) ---
  const STORAGE_KEY_PREFIX = 'huaxi_chat_history_';

  // Load history when disease type changes
  useEffect(() => {
    loadHistory(activeDisease);
  }, [activeDisease]);

  const loadHistory = (disease: DiseaseType) => {
    setMessages([]);
    setLatestOptions([]);
    setIsLoading(false);
    setIsAnalysing(false);
    setShowArchiveGen(false);
    setApiError(false);
    hasTriggeredReport.current = false;

    chatSessionRef.current = createChatSession("系统初始化", disease);

    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${disease}`);
    if (saved) {
        try {
            const parsedMsgs = JSON.parse(saved) as ChatMessage[];
            if (parsedMsgs.length > 0) {
                setMessages(parsedMsgs);
                chatSessionRef.current.step = Math.floor(parsedMsgs.length / 2);
                const lastMsg = parsedMsgs[parsedMsgs.length - 1];
                if (lastMsg.role === 'model' && lastMsg.suggestedOptions) {
                    setLatestOptions(lastMsg.suggestedOptions);
                }
                setTimeout(scrollToBottom, 100);
                return;
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
        }
    }
    handleSend("开始分诊", true);
  };

  const saveHistory = (newMessages: ChatMessage[]) => {
      const sliced = newMessages.slice(-15);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeDisease}`, JSON.stringify(sliced));
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isAnalysing, apiError]);

  const parseResponse = (rawText: string) => {
    let cleanText = rawText;
    let options: string[] = [];
    let triggerReport = false;

    const optionsMatch = rawText.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/i);
    if (optionsMatch) {
        options = optionsMatch[1].split(/[|、,]/).map(s => s.trim()).filter(s => s.length > 0);
        cleanText = cleanText.replace(optionsMatch[0], '');
    }

    if (rawText.includes("<ACTION>REPORT</ACTION>")) {
        triggerReport = true;
        cleanText = cleanText.replace(/<ACTION>\s*REPORT\s*<\/ACTION>/i, '');
    }

    return { cleanText: cleanText.trim(), options, triggerReport };
  };

  const handleSend = async (text: string, isSystemStart = false) => {
    let currentMsgs = messages;

    // 如果是从错误状态重试，不添加新消息，而是重发上一条
    if (!apiError && !isSystemStart) {
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: Date.now()
        };
        currentMsgs = [...messages, newMsg];
        setMessages(currentMsgs);
        saveHistory(currentMsgs);
    }
    
    setLatestOptions([]);
    setInput('');
    setIsLoading(true);
    setApiError(false);

    try {
      // API 熔断保护
      const rawResponse = await sendMessageToAI(chatSessionRef.current, text, currentMsgs);
      const { cleanText, options, triggerReport } = parseResponse(rawResponse);
      
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
      saveHistory(updatedMsgs);

      if (triggerReport && !hasTriggeredReport.current) {
         hasTriggeredReport.current = true;
         handleTriggerAnalysis(updatedMsgs); 
      }

    } catch (e) {
      console.error(e);
      setApiError(true); // Trigger Error UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAnalysis = async (fullHistory: ChatMessage[]) => {
    setIsAnalysing(true);
    
    setTimeout(async () => {
        try {
            const analysisJson = await getTriageAnalysis(fullHistory, activeDisease);
            const summary = JSON.parse(analysisJson);
            
            setShowArchiveGen(true);
            
            setTimeout(() => {
                if (summary.extractedProfile) {
                     const payload: any = { id: state.user.id, profile: summary.extractedProfile };
                     dispatch({ type: 'UPDATE_PROFILE', payload: payload });
                }
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${activeDisease}`);
                onPaymentGate(summary);
            }, 3000);

        } catch (e) {
            console.error("分析失败", e);
            setApiError(true);
        } finally {
            setIsAnalysing(false);
        }
    }, 1500);
  };

  const DiseaseTab = ({ type, label, icon }: { type: DiseaseType; label: string; icon: string }) => (
      <button 
        onClick={() => setActiveDisease(type)}
        disabled={isLoading || isAnalysing}
        className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeDisease === type 
            ? 'border-brand-600 text-brand-700 bg-brand-50/50' 
            : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
          <span>{icon}</span>
          {label}
      </button>
  );

  return (
    <Layout headerTitle="AI 专病门诊" showBack onBack={onBack} hideHeader={false} disableScroll={true}>
      <div className="flex flex-col h-full bg-slate-50 w-full relative">
        
        {!isAnalysing && !showArchiveGen && (
            <div className="flex bg-white border-b border-slate-100 z-20 shrink-0">
                <DiseaseTab type={DiseaseType.MIGRAINE} label="偏头痛" icon="⚡" />
                <DiseaseTab type={DiseaseType.EPILEPSY} label="癫痫" icon="🧠" />
                <DiseaseTab type={DiseaseType.COGNITIVE} label="认知/AD" icon="🧩" />
            </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth no-scrollbar">
          <div className="space-y-6 pb-4">
            
            <div className="flex justify-center">
                 <div className="bg-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-full font-medium">
                     当前接入：华西{activeDisease === DiseaseType.MIGRAINE ? '头痛' : activeDisease === DiseaseType.EPILEPSY ? '癫痫' : '认知'}中心 CDSS 知识库
                 </div>
            </div>

            {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                const showOptions = isLast && msg.role === 'model' && latestOptions.length > 0 && !isLoading && !isAnalysing && !showArchiveGen && !apiError;

                return (
                    <div key={msg.id} className="flex flex-col gap-3 animate-slide-up">
                        <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-3'}`}>
                            {msg.role === 'model' && (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 text-white
                                    ${activeDisease === DiseaseType.EPILEPSY ? 'bg-emerald-500' : activeDisease === DiseaseType.COGNITIVE ? 'bg-purple-500' : 'bg-brand-600'}
                                `}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h15m-15 3.75h15m-1.5-3.75h.008v.008h-.008v-.008zM3.75 20.25h16.5" />
                                    </svg>
                                </div>
                            )}
                            <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-brand-600 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                            }`}>
                                {msg.text}
                            </div>
                        </div>

                        {showOptions && (
                            <div className="pl-12 pr-4 space-y-2.5 w-full max-w-sm animate-fade-in">
                                {latestOptions.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSend(opt)}
                                        className="w-full bg-white hover:bg-brand-50 active:bg-brand-100 border border-brand-100 text-brand-600 font-bold py-3.5 px-5 rounded-xl shadow-sm text-left transition-all active:scale-[0.98] flex items-center justify-between group"
                                    >
                                        <span>{opt}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-brand-200 group-hover:text-brand-500">
                                            <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
          
            {isLoading && (
                <div className="flex justify-start items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                        ${activeDisease === DiseaseType.EPILEPSY ? 'bg-emerald-500' : activeDisease === DiseaseType.COGNITIVE ? 'bg-purple-500' : 'bg-brand-600'}
                    `}>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            {isAnalysing && !showArchiveGen && (
                <div className="flex justify-center py-4 animate-fade-in">
                    <div className="bg-brand-50 border border-brand-100 text-brand-700 px-6 py-3 rounded-full shadow-sm flex items-center gap-3 text-sm font-bold">
                        <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                        华西大脑正在生成您的分诊报告...
                    </div>
                </div>
            )}

            {/* Error UI */}
            {apiError && (
                 <div className="flex flex-col items-center justify-center py-6 animate-fade-in px-8 text-center">
                     <div className="text-3xl mb-2">📡</div>
                     <p className="text-sm font-bold text-slate-800 mb-1">华西 AI 服务暂不可用</p>
                     <p className="text-xs text-slate-400 mb-4">网络波动或云端服务繁忙，请稍后重试</p>
                     <Button size="sm" onClick={() => handleSend(messages[messages.length-1].text, true)}>重新连接</Button>
                 </div>
            )}
          </div>
        </div>
        
        {showArchiveGen && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 relative mb-8">
                     <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-t-brand-500 border-l-brand-500 rounded-full animate-spin"></div>
                     <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                         <span className="text-3xl">📋</span>
                     </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">华西标准数字档案生成中</h3>
                <p className="text-brand-300 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                    正在写入{activeDisease === DiseaseType.EPILEPSY ? '癫痫' : activeDisease === DiseaseType.COGNITIVE ? '认知' : '头痛'}专病数据库...
                </p>
                
                <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-brand-500 w-full animate-[loading_3s_ease-in-out_forwards] origin-left scale-x-0"></div>
                </div>
                <style>{`@keyframes loading { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }`}</style>
            </div>
        )}

        {!isAnalysing && !showArchiveGen && !apiError && (
            <div className="flex-none bg-white border-t border-slate-100 p-3 pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder={latestOptions.length > 0 ? "若上述选项无匹配，请手动输入..." : "请描述症状..."}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all font-medium"
                    disabled={isLoading}
                    />
                    <button 
                    onClick={() => handleSend(input)}
                    disabled={isLoading || !input.trim()}
                    className="bg-brand-600 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 hover:bg-brand-700 active:scale-95 transition-all shadow-md shadow-brand-500/30"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                    </button>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatView;
