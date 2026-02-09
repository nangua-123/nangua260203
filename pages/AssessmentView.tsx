
import React, { useState, useEffect, useRef } from 'react';
import { DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { InteractiveMMSE } from '../components/InteractiveMMSE';
import { useApp } from '../context/AppContext';
import { DISEASE_CONTEXT_CONFIG } from '../config/DiseaseContextConfig';
import { SCALE_DEFINITIONS } from '../config/ScaleDefinitions';

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  
  // [NEW] Draft Restoration
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // [ROUTE LOCK] Security Check: Validate DiseaseType parameter
  useEffect(() => {
      // COGNITIVE uses a special component, others use ScaleDefinitions
      const config = DISEASE_CONTEXT_CONFIG[type];
      const scaleId = config?.assessmentScaleId;
      const isValid = (type && type !== DiseaseType.UNKNOWN) && (SCALE_DEFINITIONS[scaleId] || type === DiseaseType.COGNITIVE);
      
      if (!isValid) {
          console.warn("[AssessmentView] Security Block: Invalid or missing DiseaseType parameter or Scale Config.");
          // Fallback to generic if needed, or just warn
          // onBack(); 
      }
  }, [type, onBack]);

  // 1. Restore Draft
  useEffect(() => {
      const draft = state.assessmentDraft;
      if (draft && draft.diseaseType === type) {
          console.log("[Assessment] Restoring draft...");
          setAnswers(draft.answers);
          // Only restore step if valid
          if (draft.currentStep >= 0) setStep(draft.currentStep);
          showToast('已恢复上次未完成的进度', 'info');
      }
  }, []);

  // 2. Auto-Save Logic
  useEffect(() => {
      if (Object.keys(answers).length === 0 && step === 0) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
          dispatch({
              type: 'SAVE_ASSESSMENT_DRAFT',
              payload: {
                  diseaseType: type,
                  answers: answers,
                  currentStep: step,
                  lastUpdated: Date.now()
              }
          });
      }, 500);

      return () => {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
  }, [answers, step, type]);

  // [NEW] Dispatch to Interactive MMSE for Cognitive Disorder
  if (type === DiseaseType.COGNITIVE) {
      return <InteractiveMMSE onComplete={onComplete} onBack={onBack} />;
  }

  // Dynamic Scale Loading from Global Config
  const diseaseConfig = DISEASE_CONTEXT_CONFIG[type] || DISEASE_CONTEXT_CONFIG[DiseaseType.UNKNOWN];
  const scaleId = diseaseConfig.assessmentScaleId;
  const currentScale = SCALE_DEFINITIONS[scaleId];

  // Prevent rendering if invalid (Safety net)
  if (!currentScale) {
      return (
          <Layout headerTitle="配置加载失败" showBack onBack={onBack}>
              <div className="p-6 text-center text-slate-500">
                  无法加载量表配置 ({scaleId})
                  <Button className="mt-4" onClick={onBack}>返回</Button>
              </div>
          </Layout>
      );
  }

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
      let totalScore = 0;
      questions.forEach(q => {
          const ans = newAnswers[q.id] || 0;
          // Specialized logic for MIDAS: sum of days (Q1-Q5)
          if (currentScale.id === 'MIDAS' && q.id <= 5) {
              totalScore += ans;
          } else if (currentScale.id !== 'MIDAS') {
              // Standard weighted sum for others
              totalScore += ans * (q.weight || 1);
          }
      });
      
      // Clear draft on success
      dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });

      // UX Feedback
      setShowCompletionToast(true);
      showToast('测评已完成，报告生成中...', 'success');
      setTimeout(() => {
          onComplete(totalScore);
      }, 1500);
    }
  };

  const handleStepBack = () => {
      if (step > 0) {
          setStep(step - 1);
          setInputValue('');
          setErrorMsg(null);
      }
  };

  return (
    <Layout headerTitle="专业风险评估" showBack onBack={onBack}>
      <div className="p-6 pb-safe relative h-full flex flex-col">
        
        {/* Completion Toast */}
        {showCompletionToast && (
            <div className="absolute top-48 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in w-max">
                <span className="text-xl">📊</span>
                <span className="text-white text-xs font-bold">正在计算 {currentScale.title.split(' ')[0]} 评分...</span>
            </div>
        )}

        <div className="mb-6 flex-shrink-0">
           <div className="flex justify-between text-xs text-slate-400 mb-1">
               <span className="font-bold text-slate-500 truncate max-w-[200px]">{currentScale.title}</span>
               <span className="font-mono">{step + 1}/{questions.length}</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
           </div>
           <p className="text-[0.625rem] text-slate-400 mt-2 leading-tight">{currentScale.description}</p>
        </div>

        <div className={`bg-white rounded-2xl p-6 shadow-card flex-1 flex flex-col border border-slate-50 relative transition-opacity duration-300 ${showCompletionToast ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-shake shadow-lg z-20">
                    {errorMsg}
                </div>
            )}

            <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                {currentQ.text}
            </h3>

            <div className="flex-1 overflow-y-auto">
                {currentQ.type === 'choice' && (
                    <div className="space-y-3">
                        {currentQ.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNext(opt.value)}
                                className="w-full p-4 text-left border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all active:scale-[0.99] font-medium text-slate-600 flex justify-between items-center group"
                            >
                                <span>{opt.label}</span>
                                <span className="text-slate-300 group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === 'number' && (
                    <div className="space-y-6 mt-4">
                         <div className="flex items-center gap-3">
                             <input 
                                type="number" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0"
                                className="flex-1 text-4xl font-black text-center border-b-2 border-brand-200 py-2 focus:border-brand-600 outline-none bg-transparent text-brand-900 placeholder:text-slate-200"
                                autoFocus
                             />
                             <span className="text-slate-500 font-medium">{currentQ.suffix}</span>
                         </div>
                         <Button 
                            fullWidth 
                            onClick={() => handleNext(parseInt(inputValue || '0'))}
                            disabled={!inputValue}
                            className="mt-8"
                         >
                             下一题
                         </Button>
                    </div>
                )}

                {currentQ.type === 'slider' && (
                    <div className="space-y-8 px-2 mt-8">
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
                            <div className="flex justify-between text-xs text-slate-400 mt-4 font-mono">
                                <span>{currentQ.min}</span>
                                <span>{currentQ.max}</span>
                            </div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 py-1 rounded-lg font-bold text-lg shadow-lg">
                                {inputValue || '0'}
                            </div>
                        </div>
                        <Button fullWidth onClick={() => handleNext(parseInt(inputValue || '0'))} className="mt-8">
                            确认提交
                        </Button>
                    </div>
                )}
            </div>

            {step > 0 && (
                <button onClick={handleStepBack} className="absolute top-6 right-6 text-slate-300 text-xs font-bold px-2 py-1 hover:text-slate-500">
                    撤销
                </button>
            )}
        </div>
        
        <div className="mt-6 text-center space-y-3 flex-shrink-0">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[0.625rem] text-slate-400 leading-tight">
                    <span className="text-rose-500 font-bold">医疗免责声明：</span> 
                    本量表依据{diseaseConfig.displayName}临床指南修订。评测结果仅供筛查参考，不能替代线下医生的临床诊断。
                </p>
            </div>
            <div className="flex items-center justify-center gap-1 text-[0.625rem] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                华西神经内科 AI 数据中心支持
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentView;
