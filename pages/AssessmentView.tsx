
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiseaseType, FillerType, FormConfig, FormFieldConfig } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { DISEASE_CONTEXT_CONFIG } from '../config/DiseaseContextConfig';
import { SCALE_DEFINITIONS, ScaleDefinition } from '../config/ScaleDefinitions';
import { calculateScaleScore, calculateMMSEScore, calculateADLScore, calculateEPDS, calculateMoCAScore } from '../utils/scoringEngine';
import { InteractiveMMSE } from '../components/InteractiveMMSE';
import CryptoJS from 'crypto-js';

// [NEW] Import mock configs
import { EPILEPSY_V0_CONFIG } from '../config/forms/epilepsy_v0_config'; 
import { CDR_INTERVIEW_CONFIG } from '../config/forms/cdr_interview_config';
import { COGNITIVE_MMSE_CONFIG } from '../config/forms/cognitive_mmse_config';
import { COGNITIVE_ADL_CONFIG } from '../config/forms/cognitive_adl_config';
import { COGNITIVE_MOCA_CONFIG } from '../config/forms/cognitive_moca_config';

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

// --- Form Engine Sub-components ---

const getLabelText = (label: string, fillerType: FillerType = 'SELF'): string => {
    if (fillerType === 'SELF') return label;
    return label.replace(/您/g, '患者').replace(/你/g, '患者').replace(/Your/g, "Patient's");
};

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
    onAVLTUnlock?: () => void; 
}> = ({ config, answers, setAnswer, currentSectionIndex, fillerType, onAVLTUnlock }) => {
    const section = config.sections[currentSectionIndex];

    const morning = parseFloat(answers['morning_mg'] || '0');
    const noon = parseFloat(answers['noon_mg'] || '0');
    const night = parseFloat(answers['night_mg'] || '0');
    const dailyTotal = morning + noon + night;

    // [NEW] AVLT-H Logic Handling
    const isN4 = section.id === 'avlt_n4'; // 5 min delay
    const isN5 = section.id === 'avlt_n5'; // 20 min delay
    const n3StartTime = answers['avlt_n3_timestamp'];
    
    // Timer State (kept minimal for this change context)
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (isN4 && n3StartTime) {
            const elapsed = Date.now() - n3StartTime;
            if (elapsed < 5 * 60 * 1000) setIsLocked(true);
        } else if (isN5 && n3StartTime) {
            const elapsed = Date.now() - n3StartTime;
            if (elapsed < 20 * 60 * 1000) setIsLocked(true);
        }
    }, [isN4, isN5, n3StartTime]);

    if (!section) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-4">{section.title}</h3>
            
            {section.fields.map(field => {
                if (!checkVisibility(field, answers)) return null;

                const label = getLabelText(field.label, fillerType);

                if (field.type === 'info') {
                    return (
                        <div key={field.id} className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                            <span>ℹ️</span> {label}
                        </div>
                    );
                }

                if (field.type === 'group') {
                    return (
                        <div key={field.id} className="border-t border-slate-100 pt-4 mt-2">
                            <h4 className="text-sm font-black text-slate-700 mb-2">{label}</h4>
                            {field.children?.map(child => (
                                <div key={child.id} className="mb-3 pl-2 border-l-2 border-slate-100">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">{getLabelText(child.label, fillerType)}</label>
                                    {/* Simplified renderer for children choice/number only for now */}
                                    <div className="flex gap-2">
                                        {child.type === 'number' && (
                                            <input
                                                type="number"
                                                value={answers[child.id] || ''}
                                                onChange={(e) => setAnswer(child.id, parseFloat(e.target.value))}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs w-20"
                                                placeholder={child.hint || "输入"}
                                            />
                                        )}
                                        {child.options?.map(opt => (
                                            <button
                                                key={String(opt.value)}
                                                onClick={() => setAnswer(child.id, opt.value)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${answers[child.id] === opt.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }

                return (
                    <div key={field.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-100">
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            {label}
                            {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {(field.type === 'text' || field.type === 'number') && (
                            <div className="flex items-center gap-2">
                                <input
                                    type={field.type}
                                    value={answers[field.id] || ''}
                                    onChange={(e) => setAnswer(field.id, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors font-medium text-slate-800"
                                    placeholder={field.hint || "点击输入"}
                                />
                                {field.suffix && <span className="text-slate-400 text-xs font-bold">{field.suffix}</span>}
                            </div>
                        )}

                        {field.type === 'file' && (
                            <div className="flex flex-col gap-2">
                                <div className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs flex-col gap-1 cursor-pointer hover:bg-slate-100">
                                    <span className="text-2xl">📷</span>
                                    <span>点击上传图片</span>
                                </div>
                                {field.hint && <span className="text-[10px] text-slate-400">{field.hint}</span>}
                            </div>
                        )}

                        {field.type === 'choice' && (
                            <div className="grid grid-cols-1 gap-2">
                                {field.options?.map(opt => {
                                    const isSelected = answers[field.id] === opt.value;
                                    const handleClick = () => {
                                        setAnswer(field.id, opt.value, opt.exclusion);
                                        if (field.id === 'avlt_n3_complete' && opt.value === 1) {
                                            setAnswer('avlt_n3_timestamp', Date.now());
                                        }
                                    };

                                    return (
                                        <button
                                            key={String(opt.value)}
                                            onClick={handleClick}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border break-words leading-tight text-left flex justify-between ${isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            <span>{opt.label}</span>
                                            {isSelected && <span>✔</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {field.type === 'multiselect' && (
                            <div className="flex flex-wrap gap-2">
                                {field.options?.map(opt => {
                                    const currentVal = (answers[field.id] || []) as any[];
                                    const isSelected = currentVal.includes(opt.value);
                                    
                                    const handleSelect = () => {
                                        if (opt.exclusion) {
                                            setAnswer(field.id, [opt.value], true); 
                                        } else {
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
  const isCognitiveResearch = type === DiseaseType.COGNITIVE;

  // --- Engine State ---
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [exclusionFlags, setExclusionFlags] = useState<string[]>([]);
  
  // --- Legacy State ---
  const [legacyStep, setLegacyStep] = useState(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  
  // Draft Restoration
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      // Load Config based on Disease Type
      if (isEpilepsyResearch) {
          setFormConfig(EPILEPSY_V0_CONFIG as any);
      } else if (isCognitiveResearch) {
          const fillerType = (state.user.role === 'FAMILY' ? 'FAMILY' : 'SELF');
          const cdrConfigRaw = CDR_INTERVIEW_CONFIG;
          
          const validCdrSections = cdrConfigRaw.sections.filter(s => {
              if (fillerType === 'FAMILY') return s.id.includes('informant');
              return s.id.includes('subject');
          });
          
          // Merge logic: Combine MMSE, ADL, and CDR (and now MoCA)
          // For demonstration, replacing MMSE with MoCA or appending it
          const mergedConfig = {
              id: "cognitive_bundle",
              title: "认知障碍综合评估 (MoCA+ADL+CDR)",
              version: "3.1",
              sections: [
                  ...COGNITIVE_MOCA_CONFIG.sections, // Using MoCA instead of MMSE as requested
                  ...COGNITIVE_ADL_CONFIG.sections,
                  ...validCdrSections
              ]
          };
          setFormConfig(mergedConfig as any);
      }

      // Restore Draft
      const draft = state.assessmentDraft;
      if (draft && draft.diseaseType === type) {
          setAnswers(draft.answers);
          setCurrentSection(draft.currentStep || 0);
          showToast('已恢复上次进度', 'info');
      }
  }, [type, isEpilepsyResearch, isCognitiveResearch, state.user.role]);

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
                  currentStep: isEpilepsyResearch || isCognitiveResearch ? currentSection : legacyStep,
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
          
          // 1. Calculate Scores
          let finalScore = 0;
          let psychRiskFlag = false;
          let scoreDetail = "";

          if (isEpilepsyResearch) {
              const epds = calculateEPDS(answers as any);
              psychRiskFlag = epds.isRisk;
              finalScore = psychRiskFlag ? 60 : 90;
          } else if (isCognitiveResearch) {
              // Calculate MoCA & ADL
              const mocaResult = calculateMoCAScore(answers);
              const adlResult = calculateADLScore(answers);
              finalScore = mocaResult.score;
              scoreDetail = `MoCA: ${mocaResult.score} (${mocaResult.interpretation}), Barthel: ${adlResult.barthelScore}`;
              
              if (mocaResult.level !== 'NORMAL') psychRiskFlag = true;
          }

          // 2. Prepare Payload
          const finalPayload = {
              ...answers,
              _meta: {
                  completedAt: Date.now(),
                  exclusionFlags,
                  psych_risk_flag: psychRiskFlag,
                  score_detail: scoreDetail
              }
          };

          // 3. AES Encryption
          const payloadStr = JSON.stringify(finalPayload);
          const encrypted = CryptoJS.AES.encrypt(payloadStr, "WCH-NEURO-2026").toString();

          // 4. Update Global State
          dispatch({
              type: 'SET_DIAGNOSIS',
              payload: {
                  reason: psychRiskFlag ? (scoreDetail || "高风险提示") : "基础档案建立完成",
                  referral: {
                      hospitalName: "华西医院 (数据中心)",
                      distance: "云端归档",
                      address: "encrypted_storage",
                      recommends: psychRiskFlag ? ["心理门诊复查", "认知干预"] : [],
                      qrCodeValue: encrypted
                  }
              }
          });

          showToast('数据已加密归档，正在生成凭证...', 'success');
          dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });
          
          setTimeout(() => {
              onComplete(finalScore);
          }, 1500);
      }
  };

  // --- Render ---

  // Fallback for non-configured types
  if (!formConfig) return <div>Configuration Error</div>;

  const progress = ((currentSection + 1) / formConfig.sections.length) * 100;
  const fillerType = (state.user.role === 'FAMILY' ? 'FAMILY' : 'SELF') as FillerType;

  return (
    <Layout headerTitle={formConfig.title} showBack onBack={onBack}>
        <div className="p-6 pb-safe min-h-full flex flex-col">
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="font-bold text-slate-600">进度</span>
                    <span className="font-mono">{currentSection + 1}/{formConfig.sections.length}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex-1 pb-16">
                <FormRenderer 
                    config={formConfig} 
                    answers={answers} 
                    setAnswer={handleEngineAnswer} 
                    currentSectionIndex={currentSection}
                    fillerType={fillerType}
                    onAVLTUnlock={() => showToast('测试继续', 'success')}
                />
            </div>

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
};

export default AssessmentView;
