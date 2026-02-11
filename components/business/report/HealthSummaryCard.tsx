
import React, { useState } from 'react';
import { User, DiseaseType } from '../../../types';
import { generateHealthSummary } from '../../../services/geminiService';
import Button from '../../common/Button';
import { useToast } from '../../../context/ToastContext';

interface HealthSummaryCardProps {
    user: User;
    riskScore: number;
    diseaseType: DiseaseType;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ user, riskScore, diseaseType }) => {
    const { showToast } = useToast();
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // [NEW] Check for latest doctor note (within 7 days)
    const latestNote = user.doctorNotes && user.doctorNotes.length > 0 
        ? user.doctorNotes[0] 
        : null;
    
    const hasRecentNote = latestNote && (Date.now() - latestNote.timestamp < 7 * 24 * 60 * 60 * 1000);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generateHealthSummary(user, riskScore, diseaseType);
            setSummary(result);
            showToast('AI 周报生成成功', 'success');
        } catch (e) {
            showToast('生成失败，请重试', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpeak = () => {
        const textToRead = hasRecentNote ? `医生批注：${latestNote.content}` : summary;
        if (!textToRead) return;
        
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utter = new SpeechSynthesisUtterance(textToRead.replace(/\*/g, '')); // Clean markdown for TTS
        utter.lang = 'zh-CN';
        utter.rate = 1.0;
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
        setIsSpeaking(true);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[24px] p-5 shadow-sm border border-indigo-100 relative overflow-hidden print:border-slate-800">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg shadow-sm">
                        🤖
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-indigo-900">AI 综合健康周报</h4>
                        <p className="text-[10px] text-indigo-500 font-bold">华西专家系统 (CDSS) 驱动</p>
                    </div>
                </div>
                {(summary || hasRecentNote) && (
                    <button 
                        onClick={handleSpeak}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-indigo-200 text-indigo-700 animate-pulse' : 'bg-white text-indigo-400 hover:bg-indigo-50'}`}
                    >
                        {isSpeaking ? '🔇' : '🔊'}
                    </button>
                )}
            </div>

            <div className="relative z-10 min-h-[100px]">
                {/* [NEW] Doctor Note Display (High Priority) */}
                {hasRecentNote && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 relative animate-slide-up">
                        <div className="absolute -left-1 top-4 w-1 h-8 bg-emerald-500 rounded-r"></div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                                👨‍⚕️ {latestNote.doctorName} <span className="bg-emerald-200 text-emerald-800 text-[9px] px-1.5 rounded font-medium">已复核</span>
                            </span>
                            <span className="text-[9px] text-emerald-600/60 font-mono">
                                {new Date(latestNote.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            {latestNote.content}
                        </p>
                    </div>
                )}

                {!summary && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <p className="text-xs text-slate-500 mb-4 px-4 leading-relaxed">
                            AI 将整合您的心率监测、用药记录及量表数据，生成本周健康总结。
                        </p>
                        <Button 
                            size="sm" 
                            onClick={handleGenerate} 
                            className="bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                        >
                            ✨ 生成 AI 周报
                        </Button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                        <p className="text-xs font-bold text-indigo-600 animate-pulse">正在分析多维数据...</p>
                        <p className="text-[10px] text-slate-400 mt-1">关联知识库: 华西神经内科诊疗指南 v2024</p>
                    </div>
                )}

                {summary && (
                    <div className="animate-fade-in">
                        <div className="prose prose-sm prose-indigo max-w-none text-xs text-slate-700 leading-relaxed bg-white/60 p-4 rounded-xl border border-indigo-50/50 shadow-inner">
                            {/* Simple Markdown Renderer */}
                            {summary.split('\n').map((line, i) => {
                                if (line.startsWith('**')) return <h5 key={i} className="font-black text-indigo-900 mt-3 mb-1 text-[13px]">{line.replace(/\*\*/g, '')}</h5>;
                                if (line.trim().startsWith('-')) return <li key={i} className="ml-4 list-disc marker:text-indigo-300">{line.replace('-', '')}</li>;
                                return <p key={i} className="mb-1">{line}</p>;
                            })}
                        </div>
                        <div className="flex justify-end mt-3 gap-2 no-print">
                            <button onClick={handleGenerate} className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors">
                                <span>🔄</span> 重新生成
                            </button>
                        </div>
                        <div className="mt-2 text-[9px] text-slate-300 text-center">
                            * AI 生成内容仅供参考，不作为最终诊断依据
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
