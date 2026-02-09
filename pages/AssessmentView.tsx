
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiseaseType, FillerType, FormConfig, FormFieldConfig } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { DISEASE_CONTEXT_CONFIG } from '../config/DiseaseContextConfig';
import { SCALE_DEFINITIONS, ScaleDefinition } from '../config/ScaleDefinitions';
import { calculateScaleScore } from '../utils/scoringEngine';
import { InteractiveMMSE } from '../components/InteractiveMMSE';
import CryptoJS from 'crypto-js';

// [NEW] Import mock config from TS file (Fixed import issue)
import { EPILEPSY_V0_CONFIG } from '../config/forms/epilepsy_v0_config'; 

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

// --- Logic Helpers ---

// [NEW] EPDS Scoring Engine
const calculateEPDSScore = (answers: Record<string, any>): number => {
    let score = 0;
    for (let i = 1; i <= 10; i++) {
        const val = answers[`epds_q${i}`];
        if (typeof val === 'number') {
            score += val;
        }
    }
    return score;
};

// --- Form Engine Sub-components ---

// 1. Dynamic Text Processor
const getLabelText = (label: string, fillerType: FillerType = 'SELF'): string => {
    if (fillerType === 'SELF') return label;
    return label.replace(/您/g, '患者').replace(/你/g, '患者').replace(/Your/g, "Patient's");
};

// 2. Logic Engine
const checkVisibility = (field: FormFieldConfig, answers: Record<string, any>): boolean => {
    if (!field.visibleIf) return true;
    return Object.entries(field.visibleIf).every(([key, value]) => answers[key] === value);
};

const FormRenderer: React.FC<{
    config: FormConfig;
    answers: Record<string, any>;
    setAnswer: (key: string, val: any, exclusion?: boolean) => void;
    currentSectionIndex: number;
    fillerType: FillerType;
}> = ({ config, answers, setAnswer, currentSectionIndex, fillerType }) => {
    const section = config.sections[currentSectionIndex];

    // [NEW] Real-time Dosage Calculation Logic
    // Detect if we are in Medication section by checking for specific fields
    const morning = parseFloat(answers['morning_mg'] || '0');
    const noon = parseFloat(answers['noon_mg'] || '0');
    const night = parseFloat(answers['night_mg'] || '0');
    const dailyTotal = morning + noon + night;

    if (!section) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-4">{section.title}</h3>
            
            {section.fields.map(field => {
                if (!checkVisibility(field, answers)) return null;

                const label = getLabelText(field.label, fillerType);

                // [NEW] Info Type Rendering (used for hints or calculated displays)
                if (field.type === 'info') {
                    return (
                        <div key={field.id} className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                            <span>ℹ️</span> {label}
                        </div>
                    );
                }

                // [NEW] Group Wrapper (Generic)
                if (field.type === 'group') {
                    return (
                        <div key={field.id} className="border-t border-slate-100 pt-4 mt-2">
                            <h4 className="text-sm font-black text-slate-700 mb-2">{label}</h4>
                        </div>
                    );
                }

                return (
                    <div key={field.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-100">
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            {label}
                            {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* Input Type: Text/Number */}
                        {(field.type === 'text' || field.type === 'number') && (
                            <div className="flex items-center gap-2">
                                <input
                                    type={field.type}
                                    value={answers[field.id] || ''}
                                    onChange={(e) => setAnswer(field.id, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors font-medium text-slate-800"
                                    placeholder="点击输入"
                                />
                                {field.suffix && <span className="text-slate-400 text-xs font-bold">{field.suffix}</span>}
                            </div>
                        )}

                        {/* Input Type: Choice */}
                        {field.type === 'choice' && (
                            <div className="grid grid-cols-2 gap-3">
                                {field.options?.map(opt => {
                                    const isSelected = answers[field.id] === opt.value;
                                    return (
                                        <button
                                            key={String(opt.value)}
                                            onClick={() => setAnswer(field.id, opt.value, opt.exclusion)}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border break-words leading-tight ${isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Input Type: Multiselect */}
                        {field.type === 'multiselect' && (
                            <div className="flex flex-wrap gap-2">
                                {field.options?.map(opt => {
                                    const currentVal = (answers[field.id] || []) as any[];
                                    const isSelected = currentVal.includes(opt.value);
                                    
                                    const handleSelect = () => {
                                        if (opt.exclusion) {
                                            // Exclusive option clears others
                                            setAnswer(field.id, [opt.value]);
                                        } else {
                                            // Normal toggle, remove exclusive options first
                                            let newVal = isSelected 
                                                ? currentVal.filter(v => v !== opt.value)
                                                : [...currentVal.filter(v => !field.options?.find(o => o.value === v)?.exclusion), opt.value];
                                            setAnswer(field.id, newVal);
                                        }
                                    };

                                    return (
                                        <button
                                            key={String(opt.value)}
                                            onClick={handleSelect}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* [NEW] Date Picker Shim */}
                        {field.type === 'date' && (
                            <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-500"
                                onChange={(e) => setAnswer(field.id, e.target.value)}
                                value={answers[field.id] || ''}
                            />
                        )}
                    </div>
                );
            })}

            {/* [NEW] Calculation Display for Dosage */}
            {section.id === 'medication' && dailyTotal > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-6 py-2 rounded-full shadow-xl animate-slide-up flex items-center gap-2">
                    <span className="text-lg">💊</span>
                    <span className="text-xs font-bold">当前日总剂量: <span className="text-lg font-black">{dailyTotal}</span> mg/d</span>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  
  const isEpilepsyResearch = type === DiseaseType.EPILEPSY;

  // --- Engine State ---
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [exclusionFlags, setExclusionFlags] = useState<string[]>([]);
  
  // --- Legacy State ---
  const [legacyStep, setLegacyStep] = useState(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Draft Restoration
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      // Load Config
      if (isEpilepsyResearch) {
          // [NEW] Use imported JSON config
          setFormConfig(EPILEPSY_V0_CONFIG as any);
          
          const draft = state.assessmentDraft;
          if (draft && draft.diseaseType === type) {
              setAnswers(draft.answers);
              setCurrentSection(draft.currentStep || 0);
              showToast('已恢复上次进度', 'info');
          }
      }
  }, [type, isEpilepsyResearch]);

  // Auto-Save Effect
  useEffect(() => {
      if (Object.keys(answers).length === 0) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
          dispatch({
              type: 'SAVE_ASSESSMENT_DRAFT',
              payload: {
                  diseaseType: type,
                  answers: answers,
                  currentStep: isEpilepsyResearch ? currentSection : legacyStep,
                  lastUpdated: Date.now()
              }
          });
      }, 800);
      return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [answers, currentSection, legacyStep]);

  // --- Handlers ---

  const handleEngineAnswer = (key: string, value: any, exclusion: boolean = false) => {
      setAnswers(prev => ({ ...prev, [key]: value }));
      if (exclusion) {
          setExclusionFlags(prev => [...prev, key]);
      }
  };

  const handleNextSection = () => {
      if (!formConfig) return;
      
      // Validation Logic
      const section = formConfig.sections[currentSection];
      for (const field of section.fields) {
          if (checkVisibility(field, answers) && field.validation?.required) {
              if (answers[field.id] === undefined || answers[field.id] === '') {
                  showToast(`请填写: ${field.label}`, 'error');
                  return;
              }
              // [NEW] Regex Validation
              if (field.validation.regex) {
                  const reg = new RegExp(field.validation.regex);
                  if (!reg.test(String(answers[field.id]))) {
                      showToast(`格式错误: ${field.label}`, 'error');
                      return;
                  }
              }
          }
      }

      if (currentSection < formConfig.sections.length - 1) {
          setCurrentSection(prev => prev + 1);
          window.scrollTo(0, 0);
      } else {
          // --- Finish & Encryption Logic ---
          
          // 1. Calculate EPDS Score
          const epdsScore = calculateEPDSScore(answers);
          const psychRiskFlag = epdsScore >= 9;

          // 2. Prepare Payload
          const finalPayload = {
              ...answers,
              _meta: {
                  completedAt: Date.now(),
                  exclusionFlags,
                  epdsScore,
                  psych_risk_flag: psychRiskFlag
              }
          };

          // 3. [NEW] AES Encryption
          const payloadStr = JSON.stringify(finalPayload);
          const encrypted = CryptoJS.AES.encrypt(payloadStr, "WCH-NEURO-2026").toString();

          // 4. Update Global State
          // Update referral Data with encrypted code for QR generation
          dispatch({
              type: 'SET_DIAGNOSIS',
              payload: {
                  reason: psychRiskFlag ? "EPDS评分≥9，提示产后抑郁风险" : "基础档案建立完成",
                  referral: {
                      hospitalName: "华西医院 (数据中心)",
                      distance: "云端归档",
                      address: "encrypted_storage",
                      recommends: psychRiskFlag ? ["心理门诊复查"] : [],
                      qrCodeValue: encrypted // Store Encrypted Data in QR
                  }
              }
          });

          showToast('数据已加密归档，正在生成凭证...', 'success');
          dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });
          
          setTimeout(() => {
              onComplete(psychRiskFlag ? 60 : 90); // Score based on risk
          }, 1500);
      }
  };

  // --- Render ---

  // 1. Interactive MMSE (Special Case)
  if (type === DiseaseType.COGNITIVE) {
      return <InteractiveMMSE onComplete={onComplete} onBack={onBack} />;
  }

  // 2. New Form Engine (Epilepsy)
  if (isEpilepsyResearch && formConfig) {
      const progress = ((currentSection + 1) / formConfig.sections.length) * 100;
      const fillerType = (state.user.role === 'FAMILY' ? 'FAMILY' : 'SELF') as FillerType;

      return (
        <Layout headerTitle={formConfig.title} showBack onBack={onBack}>
            <div className="p-6 pb-safe min-h-full flex flex-col">
                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="font-bold text-slate-600">进度</span>
                        <span className="font-mono">{currentSection + 1}/{formConfig.sections.length}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 pb-16">
                    <FormRenderer 
                        config={formConfig} 
                        answers={answers} 
                        setAnswer={handleEngineAnswer} 
                        currentSectionIndex={currentSection}
                        fillerType={fillerType}
                    />
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                    {currentSection > 0 && (
                        <Button variant="outline" onClick={() => setCurrentSection(p => p - 1)} className="flex-1 bg-white">上一步</Button>
                    )}
                    <Button fullWidth onClick={handleNextSection} className="flex-[2] shadow-xl shadow-indigo-500/20">
                        {currentSection === formConfig.sections.length - 1 ? '加密提交' : '下一步'}
                    </Button>
                </div>
            </div>
        </Layout>
      );
  }

  // 3. Legacy Scale Renderer (Migraine/Others)
  const diseaseConfig = DISEASE_CONTEXT_CONFIG[type] || DISEASE_CONTEXT_CONFIG[DiseaseType.UNKNOWN];
  const scaleId = diseaseConfig.assessmentScaleId;
  const currentScale = SCALE_DEFINITIONS[scaleId];

  if (!currentScale) return <div>Configuration Error</div>;

  const questions = currentScale.questions;
  const currentQ = questions[legacyStep];
  const legacyProgress = ((legacyStep + 1) / questions.length) * 100;

  const handleLegacyNext = (val: number) => {
      const newAnswers = { ...answers, [currentQ.id]: val };
      setAnswers(newAnswers);
      setInputValue(''); // Reset input value
      
      if (legacyStep < questions.length - 1) {
          setLegacyStep(p => p + 1);
      } else {
          // Cast newAnswers to Record<number, number> for legacy calculation compatibility
          const result = calculateScaleScore(currentScale, newAnswers as unknown as Record<number, number>);
          dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });
          setShowCompletionToast(true);
          showToast(`测评完成`, 'success');
          setTimeout(() => onComplete(result.score), 1500);
      }
  };

  const handleStepBack = () => {
      if (legacyStep > 0) {
          setLegacyStep(p => p - 1);
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
               <span className="font-mono">{legacyStep + 1} / {questions.length}</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${legacyProgress}%` }}></div>
           </div>
        </div>
        
        <div className={`bg-white rounded-2xl p-6 shadow-card flex-1 flex flex-col border border-slate-50 relative transition-opacity duration-300 ${showCompletionToast ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-6">{currentQ.text}</h3>
            <div className="flex-1 space-y-3">
                {currentQ.options?.map((opt, idx) => (
                    <button key={idx} onClick={() => handleLegacyNext(opt.value)} className="w-full p-4 text-left border border-slate-200 rounded-xl hover:bg-brand-50 font-medium text-slate-600">
                        {opt.label}
                    </button>
                ))}
                {currentQ.type === 'slider' && (
                    <div className="pt-4">
                        <input type="range" min={currentQ.min} max={currentQ.max} className="w-full h-2 bg-slate-200 rounded-lg" onChange={(e) => setInputValue(e.target.value)} />
                        <Button fullWidth onClick={() => handleLegacyNext(parseInt(inputValue || '0'))} className="mt-6">确认</Button>
                    </div>
                )}
            </div>
            
            {legacyStep > 0 && (
                <button onClick={handleStepBack} className="absolute top-6 right-6 text-slate-300 text-xs font-bold px-2 py-1 hover:text-slate-500">
                    撤销上一步
                </button>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentView;
