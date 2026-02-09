
import React, { useState, useEffect, useMemo } from 'react';
import { DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { InteractiveMMSE } from '../components/InteractiveMMSE'; // [NEW] Import

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

// --- 1. Scale Definition Architecture ---

interface ScaleQuestion {
  id: number;
  text: string;
  type: 'choice' | 'number' | 'slider';
  options?: { label: string; value: number }[];
  min?: number;
  max?: number;
  suffix?: string;
  weight: number; // [CRITICAL] Weight for dynamic scoring
}

interface ScaleDefinition {
  title: string;
  description: string;
  questions: ScaleQuestion[];
}

// --- 2. Scale Registry (The Knowledge Base) ---

const ScaleRegistry: Record<string, ScaleDefinition> = {
  [DiseaseType.MIGRAINE]: {
    title: "偏头痛残疾评估 (MIDAS)",
    description: "请回顾过去 3 个月的情况，评估头痛对您生活的影响。",
    questions: [
      { id: 1, text: "过去3个月，有多少天您因头痛【完全无法】工作、上学或做家务？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 2, text: "过去3个月，有多少天您的工作或学习效率【降低了一半以上】？(不含完全无法工作的天数)", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 3, text: "过去3个月，有多少天您【没有】进行家务劳动？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 4, text: "过去3个月，有多少天您做家务的效率【降低了一半以上】？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 5, text: "过去3个月，有多少天您因头痛漏掉了家庭或社交活动？", type: 'number', max: 90, suffix: "天", weight: 1 },
      // VAS Score is typically distinct from MIDAS disability days sum, setting weight to 0 to exclude from total score
      { id: 6, text: "您通常头痛时的疼痛程度是多少？(VAS 0-10)", type: 'slider', min: 0, max: 10, weight: 0 }
    ]
  },
  // [MODIFIED] COGNITIVE uses specialized component, removed from registry to avoid confusion, or keep as fallback? 
  // Keeping keys here but Logic will bypass for InteractiveMMSE
  [DiseaseType.EPILEPSY]: {
    title: "癫痫发作影响评估 (Seizure Impact)",
    description: "请根据最近一次发作或近3个月情况如实评估。",
    questions: [
      { id: 1, text: "近三个月内的发作频率", type: 'choice', options: [{label: "无发作", value: 0}, {label: "<1次/月", value: 2}, {label: "1-4次/月", value: 5}, {label: ">1次/周", value: 10}], weight: 1 },
      { id: 2, text: "发作平均持续时间", type: 'choice', options: [{label: "<1分钟", value: 1}, {label: "1-5分钟", value: 3}, {label: ">5分钟", value: 5}], weight: 1 },
      { id: 3, text: "发作时的意识状态", type: 'choice', options: [{label: "意识清醒", value: 0}, {label: "意识模糊", value: 3}, {label: "意识丧失", value: 5}], weight: 1 },
      { id: 4, text: "是否伴有肢体抽搐或跌倒", type: 'choice', options: [{label: "无", value: 0}, {label: "有", value: 5}], weight: 1 }
    ]
  }
};

// --- Component Implementation ---

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCompletionToast, setShowCompletionToast] = useState(false);

  // [ROUTE LOCK] Security Check: Validate DiseaseType parameter
  useEffect(() => {
      // Allow COGNITIVE even if not in standard registry because it has special handler
      const isValid = (type && type !== DiseaseType.UNKNOWN) && (ScaleRegistry[type] || type === DiseaseType.COGNITIVE);
      
      if (!isValid) {
          console.warn("[AssessmentView] Security Block: Invalid or missing DiseaseType parameter.");
          onBack(); // Force return to home
      }
  }, [type, onBack]);

  // [NEW] Dispatch to Interactive MMSE for Cognitive Disorder
  if (type === DiseaseType.COGNITIVE) {
      return <InteractiveMMSE onComplete={onComplete} onBack={onBack} />;
  }

  // Dynamic Scale Loading
  const currentScale = ScaleRegistry[type];

  // Prevent rendering if invalid (Safety net)
  if (!currentScale) return null;

  const questions = currentScale.questions;
  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleNext = (val: number) => {
    // Basic validation
    if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
        setErrorMsg("请完成此题后继续");
        return;
    }

    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);
    setInputValue('');
    setErrorMsg(null);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Final submission check
      if (Object.keys(newAnswers).length < questions.length) {
         setErrorMsg("请完成所有必答题");
         return;
      }

      // [DYNAMIC ENGINE] Weighted Score Calculation
      // Formula: Sum(Answer_i * Weight_i)
      let totalScore = 0;
      questions.forEach(q => {
          const ans = newAnswers[q.id] || 0;
          totalScore += ans * q.weight;
      });
      
      // UX Feedback
      setShowCompletionToast(true);
      showToast('测评已完成，报告生成中...', 'success');
      setTimeout(() => {
          onComplete(totalScore);
      }, 1500);
    }
  };

  return (
    <Layout headerTitle="专业风险评估" showBack onBack={onBack}>
      <div className="p-6 pb-safe relative">
        
        {/* Completion Toast */}
        {showCompletionToast && (
            <div className="absolute top-48 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in w-max">
                <span className="text-xl">📊</span>
                <span className="text-white text-xs font-bold">正在计算 {currentScale.title.split(' ')[0]} 评分...</span>
            </div>
        )}

        <div className="mb-6">
           <div className="flex justify-between text-xs text-slate-400 mb-1">
               <span className="font-bold text-slate-500 truncate max-w-[200px]">{currentScale.title}</span>
               <span>{step + 1}/{questions.length}</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
           </div>
           <p className="text-[10px] text-slate-400 mt-2">{currentScale.description}</p>
        </div>

        <div className={`bg-white rounded-2xl p-6 shadow-card min-h-[360px] flex flex-col border border-slate-50 relative transition-opacity duration-300 ${showCompletionToast ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-shake shadow-lg z-20">
                    {errorMsg}
                </div>
            )}

            <h3 className="text-lg font-bold text-slate-800 mb-8 leading-relaxed">
                {currentQ.text}
            </h3>

            <div className="flex-1">
                {currentQ.type === 'choice' && (
                    <div className="space-y-3">
                        {currentQ.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNext(opt.value)}
                                className="w-full p-4 text-left border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all active:scale-[0.99] font-medium text-slate-600"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === 'number' && (
                    <div className="space-y-6">
                         <div className="flex items-center gap-3">
                             <input 
                                type="number" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0"
                                className="flex-1 text-3xl font-bold text-center border-b-2 border-brand-200 py-2 focus:border-brand-600 outline-none bg-transparent text-brand-900 placeholder:text-slate-200"
                                autoFocus
                             />
                             <span className="text-slate-500 font-medium">{currentQ.suffix}</span>
                         </div>
                         <Button 
                            fullWidth 
                            onClick={() => handleNext(parseInt(inputValue || '0'))}
                            disabled={!inputValue}
                         >
                             下一题
                         </Button>
                    </div>
                )}

                {currentQ.type === 'slider' && (
                    <div className="space-y-8 px-2">
                        <div className="relative pt-6">
                            <input 
                                type="range" 
                                min={currentQ.min} 
                                max={currentQ.max} 
                                step="1"
                                defaultValue={0}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-4">
                                <span>0</span>
                                <span>{(currentQ.max || 10)/2}</span>
                                <span>{currentQ.max}</span>
                            </div>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 py-1 rounded-lg font-bold text-lg shadow-lg">
                                {inputValue || '0'}
                            </div>
                        </div>
                        <Button fullWidth onClick={() => handleNext(parseInt(inputValue || '0'))}>
                            确认提交
                        </Button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-8 text-center space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 leading-tight">
                    <span className="text-rose-500 font-bold">医疗免责声明：</span> 
                    本量表依据华西医院神经内科临床标准修订。评测结果仅供筛查参考，不能替代线下医生的临床诊断。如遇紧急情况请立即就医。
                </p>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                华西神经内科 AI 数据中心支持
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentView;
