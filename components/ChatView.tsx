
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, HeadacheProfile } from '../types';
import { createChatSession, sendMessageToAI, getTriageAnalysis } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import Layout from './Layout';

interface ChatViewProps {
  onBack: () => void;
  onPaymentGate: (summary: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onBack, onPaymentGate }) => {
  const { state, dispatch } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  
  // New State for Archive Animation
  const [showArchiveGen, setShowArchiveGen] = useState(false);
  
  const [latestOptions, setLatestOptions] = useState<string[]>([]);
  
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasTriggeredReport = useRef(false);

  // 初始化问诊对话
  useEffect(() => {
    const systemPrompt = "系统初始化"; 
    chatSessionRef.current = createChatSession(systemPrompt);
    handleSend("开始分诊");
  }, []);

  // 自动滚动到底部
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
  }, [messages, isLoading, isAnalysing, latestOptions]);

  const parseResponse = (rawText: string) => {
    let cleanText = rawText;
    let options: string[] = [];
    let triggerReport = false;

    // 解析对话中的选项标记
    const optionsMatch = rawText.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/i);
    if (optionsMatch) {
        options = optionsMatch[1].split(/[|、,]/).map(s => s.trim()).filter(s => s.length > 0);
        cleanText = cleanText.replace(optionsMatch[0], '');
    }

    // 解析报告触发标记
    if (rawText.includes("<ACTION>REPORT</ACTION>")) {
        triggerReport = true;
        cleanText = cleanText.replace(/<ACTION>\s*REPORT\s*<\/ACTION>/i, '');
    }

    return { cleanText: cleanText.trim(), options, triggerReport };
  };

  const handleSend = async (text: string) => {
    const isSystemStart = text === "开始分诊";
    
    // 1. 添加用户消息
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
      // 2. 调用 AI 接口
      const rawResponse = await sendMessageToAI(chatSessionRef.current, text);
      const { cleanText, options, triggerReport } = parseResponse(rawResponse);
      
      // 3. 添加 AI 消息
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        timestamp: Date.now(),
        suggestedOptions: options
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setLatestOptions(options);

      // 4. 处理报告生成触发
      if (triggerReport && !hasTriggeredReport.current) {
         hasTriggeredReport.current = true;
         handleTriggerAnalysis( [...messages, aiMsg] ); 
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAnalysis = async (fullHistory: ChatMessage[]) => {
    // 进入系统分析状态
    setIsAnalysing(true);
    
    setTimeout(async () => {
        try {
            const analysisJson = await getTriageAnalysis(fullHistory);
            const summary = JSON.parse(analysisJson);
            
            // 触发档案生成动画
            setShowArchiveGen(true);
            
            // 模拟 3秒 的建档过程，然后写入 Context 并跳转
            setTimeout(() => {
                if (summary.extractedProfile) {
                     dispatch({
                         type: 'UPDATE_PROFILE',
                         payload: {
                             id: state.user.id, // 默认更新当前用户，实际逻辑可由 Chat 确定为谁咨询
                             profile: summary.extractedProfile as HeadacheProfile
                         }
                     });
                }
                
                // 跳转
                onPaymentGate(summary);
                
            }, 3000);

        } catch (e) {
            console.error("分析失败", e);
            onPaymentGate({ risk: 50, disease: 'UNKNOWN', summary: '建议进一步完善专业量表。' });
        } finally {
            setIsAnalysing(false);
        }
    }, 1500);
  };

  return (
    <Layout headerTitle="AI 数字门诊" showBack onBack={onBack} hideHeader={false} disableScroll={true}>
      <div className="flex flex-col h-full bg-slate-50 w-full relative">
        
        {/* 对话展示区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth no-scrollbar">
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                const showOptions = isLast && msg.role === 'model' && latestOptions.length > 0 && !isLoading && !isAnalysing && !showArchiveGen;

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

                        {/* 交互选项按钮 */}
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
          
            {/* 输入中指示器 */}
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

            {/* 系统分析指示器 */}
            {isAnalysing && !showArchiveGen && (
                <div className="flex justify-center py-4 animate-fade-in">
                    <div className="bg-brand-50 border border-brand-100 text-brand-700 px-6 py-3 rounded-full shadow-sm flex items-center gap-3 text-sm font-bold">
                        <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                        华西大脑正在生成您的分诊报告...
                    </div>
                </div>
            )}
          </div>
        </div>
        
        {/* --- 档案生成全屏覆盖动画 --- */}
        {showArchiveGen && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 relative mb-8">
                     {/* 旋转的光环 */}
                     <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-t-brand-500 border-l-brand-500 rounded-full animate-spin"></div>
                     <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                         <span className="text-3xl">📋</span>
                     </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">华西标准数字档案生成中</h3>
                <p className="text-brand-300 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                    AI 正在提取临床特征向量...
                </p>
                
                {/* 模拟进度条 */}
                <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-brand-500 w-full animate-[loading_3s_ease-in-out_forwards] origin-left scale-x-0"></div>
                </div>
                
                {/* 滚动的数据流文字 */}
                <div className="mt-8 text-[10px] text-slate-500 font-mono space-y-1 opacity-60">
                    <div className="animate-slide-up" style={{animationDelay:'0.5s'}}>Extracting Symptoms: [跳痛, 畏光]... OK</div>
                    <div className="animate-slide-up" style={{animationDelay:'1.2s'}}>Mapping ICD-10 Code: G43.0... OK</div>
                    <div className="animate-slide-up" style={{animationDelay:'2.0s'}}>Encrypting User Profile... OK</div>
                </div>

                <style>{`
                    @keyframes loading {
                        0% { transform: scaleX(0); }
                        100% { transform: scaleX(1); }
                    }
                `}</style>
            </div>
        )}

        {/* 输入控制区 */}
        {!isAnalysing && !showArchiveGen && (
            <div className="flex-none bg-white border-t border-slate-100 p-3 pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder={latestOptions.length > 0 ? "若上述选项无匹配，请手动输入..." : "请详细描述您当前的不适..."}
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
