
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DiseaseType } from '../types';
import Layout from './common/Layout';
import Button from './common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { DISEASE_CONTEXT_CONFIG } from '../config/DiseaseContextConfig';
import { SCALE_DEFINITIONS, ScaleDefinition, ScaleQuestion } from '../config/ScaleDefinitions';
import { calculateScaleScore } from '../utils/scoringEngine';

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  
  // 1. Dynamic Config Loading
  const diseaseConfig = DISEASE_CONTEXT_CONFIG[type] || DISEASE_CONTEXT_CONFIG[DiseaseType.UNKNOWN];
  const scaleId = diseaseConfig.assessmentScaleId;
  const currentScale: ScaleDefinition = SCALE_DEFINITIONS[scaleId];

  // State
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 2. Draft Restoration (UI State Persistence)
  useEffect(() => {
      const draft = state.assessmentDraft;
      if (draft && draft.diseaseType === type) {
          console.log("[Assessment] Restoring draft...");
          setAnswers(draft.answers);
          setStep(draft.currentStep < currentScale.questions.length ? draft.currentStep : 0);
          showToast('已恢复上次未完成的进度', 'info');
      }
  }, []);

  // 3. Auto-Save Logic (Debounced)
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
      }, 500); // 500ms debounce

      return () => {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
  }, [answers, step, type]);

  // Safety net
  if (!currentScale) {
      return (
          <Layout headerTitle="评估配置错误" showBack onBack={onBack}>
              <div className="p-6 text-center">
                  <p>无法加载量表配置 ({scaleId})</p>
                  <Button onClick={onBack} className="mt-4">返回首页</Button>
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

      // 4. Decoupled Scoring Calculation
      const result = calculateScaleScore(currentScale, newAnswers);
      
      // Clear Draft
      dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });

      // UX Feedback
      setShowCompletionToast(true);
      showToast(`测评完成: ${result.interpretation.substring(0, 15)}...`, 'success');
      
      // Delay callback to allow user to see completion state
      setTimeout(() => {
          onComplete(result.score);
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
      <div className="p-6 pb-safe relative flex flex-col h-full">
        
        {/* Completion Toast Overlay */}
        {showCompletionToast && (
            <div className="absolute top-48 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 animate-fade-in w-[280px] text-center border border-slate-700">
                <span className="text-3xl animate-bounce">📊</span>
                <span className="text-white text-sm font-bold">正在生成{diseaseConfig.displayName}报告...</span>
                <p className="text-slate-400 text-[10px]">AI 正在分析您的 {questions.length} 项回答</p>
            </div>
        )}

        <div className="mb-6 flex-shrink-0">
           <div className="flex justify-between text-xs text-slate-400 mb-2">
               <span className="font-bold text-slate-600 truncate max-w-[200px]">{currentScale.title}</span>
               <span className="font-mono">{step + 1} / {questions.length}</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
           </div>
           <p className="text-[10px] text-slate-400 mt-2 leading-tight">{currentScale.description}</p>
        </div>

        <div className={`bg-white rounded-2xl p-6 shadow-card flex-1 flex flex-col border border-slate-50 relative transition-opacity duration-300 ${showCompletionToast ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-shake shadow-lg z-20">
                    {errorMsg}
                </div>
            )}

            <h3 className="text-lg font-bold text-slate-900 mb-2 leading-relaxed">
                {currentQ.text}
            </h3>
            
            {currentQ.hint && (
                <p className="text-xs text-brand-600 bg-brand-50 p-2 rounded-lg mb-6 border border-brand-100 inline-block">
                    💡 {currentQ.hint}
                </p>
            )}

            <div className="flex-1 mt-4">
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

                {(currentQ.type === 'number' || currentQ.type === 'calculation') && (
                    <div className="space-y-6">
                         {currentQ.type === 'calculation' && (
                             <div className="bg-slate-50 p-4 rounded-xl text-center border-2 border-dashed border-slate-200 text-slate-400 font-mono text-xl mb-4">
                                 ?
                             </div>
                         )}
                         
                         {/* If calculation has options (MMSE), treat as choice. If pure number input (MIDAS), show input */}
                         {currentQ.options ? (
                             <div className="grid grid-cols-2 gap-3">
                                {currentQ.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleNext(opt.value)}
                                        className="p-4 border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-200 font-bold text-slate-700 active:scale-95 transition-all"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                             </div>
                         ) : (
                             <>
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
                                     确认
                                 </Button>
                             </>
                         )}
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
                            提交评分
                        </Button>
                    </div>
                )}

                {currentQ.type === 'naming' && (
                    <div className="text-center space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-center">
                            {currentQ.imageUrl ? (
                                <img src={currentQ.imageUrl} alt="Naming Task" className="w-32 h-32 object-contain drop-shadow-md" />
                            ) : (
                                <div className="text-slate-300">Image Load Error</div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {currentQ.options?.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleNext(opt.value)}
                                    className="w-full p-4 border border-slate-200 rounded-xl hover:bg-brand-50 font-bold text-slate-700"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {step > 0 && (
                <button onClick={handleStepBack} className="absolute top-6 right-6 text-slate-300 text-xs font-bold px-2 py-1 hover:text-slate-500">
                    撤销上一步
                </button>
            )}
        </div>
        
        <div className="mt-6 text-center space-y-3 flex-shrink-0">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 leading-tight">
                    <span className="text-rose-500 font-bold">医疗免责声明：</span> 
                    本量表依据{diseaseConfig.displayName}临床指南修订。评测结果仅供筛查参考，不能替代线下医生的临床诊断。
                </p>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentView;
