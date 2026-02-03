
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { createChatSession, sendMessageToAI, getTriageAnalysis } from '../services/geminiService';
import Layout from './Layout';

interface ChatViewProps {
  onBack: () => void;
  onPaymentGate: (summary: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onBack, onPaymentGate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  
  const [latestOptions, setLatestOptions] = useState<string[]>([]);
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasTriggeredReport = useRef(false);

  // Initialize Chat
  useEffect(() => {
    const systemPrompt = "System Init"; 
    chatSessionRef.current = createChatSession(systemPrompt);
    handleSend("开始分诊");
  }, []);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (scrollRef.current) {
        // Use timeout to ensure DOM has updated
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isAnalysing, latestOptions]);

  const parseResponse = (rawText: string) => {
    let cleanText = rawText;
    let options: string[] = [];
    let triggerReport = false;

    // Extract Options
    const optionsMatch = rawText.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/i);
    if (optionsMatch) {
        options = optionsMatch[1].split(/[|、,]/).map(s => s.trim()).filter(s => s.length > 0);
        cleanText = cleanText.replace(optionsMatch[0], '');
    }

    // Extract Report Action
    if (rawText.includes("<ACTION>REPORT</ACTION>")) {
        triggerReport = true;
        cleanText = cleanText.replace(/<ACTION>\s*REPORT\s*<\/ACTION>/i, '');
    }

    return { cleanText: cleanText.trim(), options, triggerReport };
  };

  const handleSend = async (text: string) => {
    const isSystemStart = text === "开始分诊";
    
    // 1. Add User Message
    if (!isSystemStart) {
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMsg]);
    }
    
    setLatestOptions([]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Call AI
      const rawResponse = await sendMessageToAI(chatSessionRef.current, text);
      const { cleanText, options, triggerReport } = parseResponse(rawResponse);
      
      // 3. Add AI Message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        timestamp: Date.now(),
        suggestedOptions: options
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setLatestOptions(options);

      // 4. Handle Report Trigger
      if (triggerReport && !hasTriggeredReport.current) {
         hasTriggeredReport.current = true;
         handleTriggerAnalysis( [...messages, aiMsg] ); // Pass full history
      }

    } catch (e) {
      console.error(e);
      // Error handling...
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAnalysis = async (fullHistory: ChatMessage[]) => {
    // Show "System Analyzing" state
    setIsAnalysing(true);
    
    // Simulate system processing delay
    setTimeout(async () => {
        try {
            const analysisJson = await getTriageAnalysis(fullHistory);
            const summary = JSON.parse(analysisJson);
            
            // Trigger the Payment Gate in App.tsx
            onPaymentGate(summary);
        } catch (e) {
            console.error("Analysis failed", e);
            onPaymentGate({ risk: 50, disease: 'UNKNOWN', summary: '建议进一步检查。' });
        } finally {
            setIsAnalysing(false);
        }
    }, 1500);
  };

  return (
    <Layout headerTitle="AI 数字门诊" showBack onBack={onBack} hideHeader={false} disableScroll={true}>
      <div className="flex flex-col h-full bg-slate-50 w-full relative">
        
        {/* Chat Area - Flex Grow to take available space */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth no-scrollbar">
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                const showOptions = isLast && msg.role === 'model' && latestOptions.length > 0 && !isLoading && !isAnalysing;

                return (
                    <div key={msg.id} className="flex flex-col gap-3 animate-slide-up">
                        <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-3'}`}>
                            {msg.role === 'model' && (
                                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
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

                        {/* Options Buttons */}
                        {showOptions && (
                            <div className="pl-12 pr-4 space-y-2.5 w-full max-w-sm animate-fade-in">
                                {latestOptions.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSend(opt)}
                                        className="w-full bg-white hover:bg-brand-50 active:bg-brand-100 border border-brand-100 text-brand-600 font-medium py-3.5 px-5 rounded-xl shadow-sm text-left transition-all active:scale-[0.98] flex items-center justify-between group"
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
          
            {/* Loading / Typing Indicator */}
            {isLoading && (
                <div className="flex justify-start items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h15m-15 3.75h15m-1.5-3.75h.008v.008h-.008v-.008zM3.75 20.25h16.5" />
                         </svg>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                         <div className="flex space-x-1">
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-150"></span>
                         </div>
                    </div>
                </div>
            )}

            {/* System Analyzing Indicator */}
            {isAnalysing && (
                <div className="flex justify-center py-4 animate-fade-in">
                    <div className="bg-brand-50 border border-brand-100 text-brand-700 px-6 py-3 rounded-full shadow-sm flex items-center gap-3 text-sm font-bold">
                        <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                        华西大脑正在生成分诊报告...
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom via Flex layout */}
        {!isAnalysing && (
            <div className="flex-none bg-white border-t border-slate-100 p-3 pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder={latestOptions.length > 0 ? "手动输入其他情况..." : "请详细描述您的症状..."}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
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
