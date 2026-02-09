
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiseaseType, FillerType, FormConfig, FormFieldConfig } from '../types';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { DISEASE_CONTEXT_CONFIG } from '../config/DiseaseContextConfig';
import { SCALE_DEFINITIONS, ScaleDefinition } from '../config/ScaleDefinitions';
import { 
    calculateScaleScore, 
    calculateMMSEScore, 
    calculateADLScore, 
    calculateEPDS, 
    calculateMoCAScore,
    calculateCognitiveDiagnosis,
    calculateCDRGlobal 
} from '../utils/scoringEngine';
import { InteractiveMMSE } from '../components/InteractiveMMSE';
import { processMedicalImage } from '../services/geminiService'; 
import CryptoJS from 'crypto-js';

// [NEW] Import mock configs for Baseline & Follow-up
import { EPILEPSY_V0_CONFIG } from '../config/forms/epilepsy_v0_config'; 
import { EPILEPSY_V1_CONFIG, EPILEPSY_V2_CONFIG, EPILEPSY_V3_CONFIG, EPILEPSY_V4_CONFIG, EPILEPSY_V5_CONFIG } from '../config/forms/epilepsy_followup_configs';
import { COGNITIVE_CDR_CONFIG } from '../config/forms/cognitive_cdr_config';
import { COGNITIVE_MMSE_CONFIG } from '../config/forms/cognitive_mmse_config';
import { COGNITIVE_ADL_CONFIG } from '../config/forms/cognitive_adl_config';
import { COGNITIVE_MOCA_CONFIG } from '../config/forms/cognitive_moca_config';
import { COGNITIVE_AVLTH_CONFIG } from '../config/forms/cognitive_avlth_config';
import { COGNITIVE_DST_CONFIG } from '../config/forms/cognitive_dst_config'; 

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

// --- Logic Helpers ---

const playDigitSequence = (text: string) => {
    const matches = text.match(/\d+/g);
    if (!matches || matches.length === 0) return;
    
    const sequencePart = text.split('.')[1] || text;
    const digits = sequencePart.match(/\d/g);

    if (!digits) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let delay = 0;
        digits.forEach((digit, index) => {
            const utter = new SpeechSynthesisUtterance(digit);
            utter.lang = 'zh-CN';
            utter.rate = 0.8; 
            setTimeout(() => {
                window.speechSynthesis.speak(utter);
            }, index * 1000); 
        });
        return true;
    }
    return false;
};

const playAVLTWords = () => {
    const words = ["大衣", "长裤", "头巾", "手套", "司机", "木工", "士兵", "律师", "海棠", "百合", "腊梅", "玉兰"];
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(words.join('... ')); 
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8; 
        window.speechSynthesis.speak(utterance);
        return true;
    }
    return false;
};

const DelayedRecallSuspension: React.FC<{ 
    targetDelayMinutes: number; 
    baseTime: number;
    onUnlock: () => void; 
    label: string;
    onLeave: () => void;
}> = ({ targetDelayMinutes, baseTime, onUnlock, label, onLeave }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const targetTime = baseTime + targetDelayMinutes * 60 * 1000;

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const diff = Math.ceil((targetTime - now) / 1000);
            if (diff <= 0) {
                onUnlock();
            } else {
                setTimeLeft(diff);
            }
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [targetTime, onUnlock]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in px-6">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 relative">
                ⏳
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-spin-slow" style={{ borderTopColor: '#6366f1' }}></div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">任务挂起中: {label}</h3>
            <div className="text-4xl font-mono font-black text-indigo-600 mb-4 tracking-wider">
                {formatTime(timeLeft)}
            </div>
            
            <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                为保证记忆测试准确性，请在倒计时结束前<br/>
                <span className="font-bold text-slate-700">不要进行其他语言类活动</span>。
            </p>

            <div className="w-full space-y-3">
                <Button fullWidth onClick={onLeave} variant="outline" className="border-slate-200 text-slate-600">
                    返回首页 (后台运行)
                </Button>
                <p className="text-[10px] text-slate-400">
                    * 倒计时结束时，APP 将强制弹窗提醒您回来继续。
                </p>
            </div>
        </div>
    );
};

// --- Form Engine Sub-components ---

const getLabelText = (label: string, fillerType: FillerType = 'SELF'): string => {
    if (fillerType === 'SELF') return label;
    // [Updated] Enhanced regex for better Family mode adaptation
    return label
        .replace(/您/g, '患者')
        .replace(/你/g, '患者')
        .replace(/Your/g, "Patient's")
        .replace(/请问/g, '');
};

const checkVisibility = (field: FormFieldConfig, answers: Record<string, any>): boolean => {
    if (!field.visibleIf) return true;
    return Object.entries(field.visibleIf).every(([key, value]) => {
        // Handle > < logic for numbers if value is string like "<2500"
        if (typeof value === 'string' && (value.startsWith('<') || value.startsWith('>'))) {
            const operator = value[0];
            const threshold = parseFloat(value.substring(1));
            const answer = parseFloat(answers[key]);
            if (isNaN(answer)) return false;
            return operator === '<' ? answer < threshold : answer > threshold;
        }
        return answers[key] === value;
    });
};

const checkDSTTermination = (answers: Record<string, any>, currentLevel: number): boolean => {
    for (let i = 1; i < currentLevel; i++) {
        const keyA = `dst_${i}a`;
        const keyB = `dst_${i}b`;
        if (answers[keyA] !== undefined && answers[keyB] !== undefined) {
            if (answers[keyA] === 0 && answers[keyB] === 0) {
                return true; 
            }
        }
    }
    return false;
};

const FormRenderer: React.FC<{
    config: FormConfig;
    answers: Record<string, any>;
    setAnswer: (key: string, val: any, exclusion?: boolean) => void;
    currentSectionIndex: number;
    fillerType: FillerType;
    onLeave: () => void;
    onTermination?: () => void; 
}> = ({ config, answers, setAnswer, currentSectionIndex, fillerType, onLeave, onTermination }) => {
    const section = config.sections[currentSectionIndex];
    const { showToast } = useToast();
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeFileField, setActiveFileField] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        showToast('AI 正在分析影像病灶性质...', 'info');

        try {
            const record = await processMedicalImage(file);
            setAnswer(fieldId, record.rawImageUrl); 

            const tagsIndicator = record.indicators.find(i => i.name === 'MRI_PATHOLOGY_TAGS');
            if (tagsIndicator && tagsIndicator.value) {
                const tags = (tagsIndicator.value as string).split(',').map(s => s.trim());
                if (tags.length > 0 && tags[0] !== '') {
                    const targetField = section.fields.find(f => f.id === 'mri_lesion_nature');
                    if (targetField && targetField.type === 'multiselect') {
                        setAnswer('mri_lesion_nature', tags);
                        showToast(`已自动识别并勾选 ${tags.length} 个病灶特征`, 'success');
                    }
                }
            } else {
                showToast('影像上传成功 (未识别到特定病灶标签)', 'success');
            }

        } catch (error) {
            console.error(error);
            showToast('识别失败，请手动选择', 'error');
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileUpload = (fieldId: string) => {
        setActiveFileField(fieldId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const isDST = config.id === 'dst_backward';
    if (isDST) {
        const itemIndex = currentSectionIndex; 
        if (checkDSTTermination(answers, itemIndex)) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-shake">
                    <div className="text-4xl mb-4">🛑</div>
                    <h3 className="text-xl font-black text-red-600 mb-2">测试熔断终止</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        检测到该难度双项测试均失败 (0分)<br/>
                        根据 CRF 标准，测试已自动结束。
                    </p>
                    <Button fullWidth onClick={onTermination} className="bg-red-600 shadow-red-500/30">
                        提交当前成绩
                    </Button>
                </div>
            );
        }
    }

    const isN1N3 = section.id === 'avlt_n1_n3';
    const isN4 = section.id === 'avlt_n4'; 
    const isN5 = section.id === 'avlt_n5'; 
    const n3StartTime = answers['avlt_n3_timestamp'];
    
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!n3StartTime) return;
        const now = Date.now();
        
        if (isN4) {
            if (now < n3StartTime + 5 * 60 * 1000) setIsLocked(true);
        } else if (isN5) {
            if (now < n3StartTime + 20 * 60 * 1000) setIsLocked(true);
        }
    }, [isN4, isN5, n3StartTime]);

    if (isLocked && n3StartTime) {
        return (
            <DelayedRecallSuspension
                targetDelayMinutes={isN4 ? 5 : 20}
                baseTime={n3StartTime}
                label={isN4 ? "短延迟回忆 (N4)" : "长延迟回忆 (N5)"}
                onUnlock={() => {
                    setIsLocked(false);
                    showToast('⏳ 记忆提取窗口已开启，请立即作答！', 'success');
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }}
                onLeave={onLeave}
            />
        );
    }

    if (!section) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-900 mb-4">{section.title}</h3>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => activeFileField && handleFileChange(e, activeFileField)} 
            />

            {isN1N3 && (
                <div className="flex gap-3 mb-6">
                    <button 
                        onClick={() => {
                            const played = playAVLTWords();
                            if(played) showToast('正在播放词表...', 'info');
                            else showToast('当前浏览器不支持TTS，请人工朗读', 'error');
                        }}
                        className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold text-xs border border-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span>🔊</span> 播放词表 (TTS)
                    </button>
                </div>
            )}

            {section.fields.map(field => {
                if (!checkVisibility(field, answers)) return null;

                const label = getLabelText(field.label, fillerType);

                if (field.type === 'info') {
                    return (
                        <div key={field.id} className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-xs font-bold flex flex-col gap-2 leading-relaxed">
                            <div className="flex items-center gap-2">
                                <span className="shrink-0">ℹ️</span> 
                                <span>{label}</span>
                            </div>
                            {field.hint && <div className="text-[10px] opacity-80 pl-6">{field.hint}</div>}
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

                const isDSTItem = isDST && field.id.startsWith('dst_') && field.label.includes('.');

                return (
                    <div key={field.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-100">
                        <div className="flex justify-between items-start mb-3">
                            <label className="block text-sm font-bold text-slate-700 flex-1 mr-2">
                                {label}
                                {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {isDSTItem && (
                                <button
                                    onClick={() => playDigitSequence(label)}
                                    className="bg-indigo-50 text-indigo-600 p-2 rounded-full active:scale-90 transition-transform"
                                    title="播放数字序列"
                                >
                                    🔊
                                </button>
                            )}

                            {field.type === 'multiselect' && answers[field.id] && Array.isArray(answers[field.id]) && (
                                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                    已选: {answers[field.id].length}
                                </span>
                            )}
                        </div>
                        
                        {field.hint && !isDSTItem && <p className="text-[10px] text-slate-400 mb-3">{field.hint}</p>}
                        {isDSTItem && field.hint && <p className="text-[10px] text-emerald-600 font-mono mb-3 bg-emerald-50 inline-block px-2 py-0.5 rounded">{field.hint}</p>}

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
                                <div 
                                    onClick={() => !isAnalyzing && triggerFileUpload(field.id)}
                                    className={`h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs flex-col gap-2 cursor-pointer hover:bg-slate-100 transition-all ${answers[field.id] ? 'border-brand-200 bg-brand-50' : ''}`}
                                >
                                    {isAnalyzing && activeFileField === field.id ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <span className="text-brand-600 font-bold">AI 智能分析中...</span>
                                        </div>
                                    ) : answers[field.id] ? (
                                        <div className="relative w-full h-full p-2">
                                            <img src={answers[field.id]} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                <span className="text-white font-bold">点击更换</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-2xl">📷</span>
                                            <span>点击拍照 / 上传图片</span>
                                        </>
                                    )}
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
                            <div className="grid grid-cols-3 gap-2">
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
                                            className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border truncate ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
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
        </div>
    );
};

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  
  const isEpilepsyResearch = type === DiseaseType.EPILEPSY;
  const isCognitiveResearch = type === DiseaseType.COGNITIVE;

  // --- Engine State ---
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // --- Legacy State ---
  const [legacyStep, setLegacyStep] = useState(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      // [NEW] Follow-up Logic for Epilepsy
      if (isEpilepsyResearch) {
          // Check if user has baseline date. If not, load V0.
          const epiProfile = state.user.epilepsyProfile;
          if (!epiProfile?.baselineDate) {
              setFormConfig(EPILEPSY_V0_CONFIG as any);
          } else {
              // Find the first 'OPEN' or 'PENDING' visit
              const schedule = epiProfile.followUpSchedule || [];
              const targetVisit = schedule.find(s => s.status === 'OPEN' || s.status === 'PENDING');
              
              if (targetVisit) {
                  switch(targetVisit.visitId) {
                      case 'V1': setFormConfig(EPILEPSY_V1_CONFIG as any); break;
                      case 'V2': setFormConfig(EPILEPSY_V2_CONFIG as any); break;
                      case 'V3': setFormConfig(EPILEPSY_V3_CONFIG as any); break;
                      case 'V4': setFormConfig(EPILEPSY_V4_CONFIG as any); break;
                      case 'V5': setFormConfig(EPILEPSY_V5_CONFIG as any); break;
                      default: setFormConfig(EPILEPSY_V0_CONFIG as any); // Fallback
                  }
                  showToast(`正在加载 ${targetVisit.title} 表单`, 'info');
              } else {
                  // If all completed or none open, maybe show V0 review or fallback
                  setFormConfig(EPILEPSY_V0_CONFIG as any); 
              }
          }
      } else if (isCognitiveResearch) {
          const fillerType = (state.user.role === 'FAMILY' ? 'FAMILY' : 'SELF');
          const cdrConfigRaw = COGNITIVE_CDR_CONFIG;
          
          const validCdrSections = cdrConfigRaw.sections.filter(s => {
              if (fillerType === 'FAMILY') return s.id.includes('informant');
              return s.id.includes('subject');
          });
          
          const mergedConfig = {
              id: "cognitive_bundle",
              title: "认知障碍综合评估 (MoCA+ADL+AVLT+DST+CDR)",
              version: "3.6",
              sections: [
                  ...COGNITIVE_MOCA_CONFIG.sections,
                  ...COGNITIVE_ADL_CONFIG.sections,
                  ...COGNITIVE_DST_CONFIG.sections, 
                  ...COGNITIVE_AVLTH_CONFIG.sections, 
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
  }, [type, isEpilepsyResearch, isCognitiveResearch, state.user.role, state.user.epilepsyProfile]);

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
  };

  const handleFinish = () => {
      let finalScore = 0;
      let psychRiskFlag = false;
      let scoreDetail = "";
      
      let encrypted = "";
      let recommendations: string[] = [];

      if (isEpilepsyResearch) {
          const epds = calculateEPDS(answers as any);
          psychRiskFlag = epds.isRisk;
          finalScore = psychRiskFlag ? 60 : 90;
          scoreDetail = `EPDS Score: ${epds.score}`;
          
          // [NEW] Logic to update Baseline if V0
          if (formConfig?.id === 'EPILEPSY_V0') {
              dispatch({
                  type: 'SET_BASELINE_DATE',
                  payload: { id: state.user.id, date: Date.now() }
              });
          }
      } else if (isCognitiveResearch) {
          const mmseResult = calculateMMSEScore(answers);
          const mocaResult = calculateMoCAScore(answers);
          const adlResult = calculateADLScore(answers);
          
          const cdrResult = calculateCDRGlobal(answers);
          const cdrGlobal = cdrResult.globalScore; 
          
          const avltN5 = answers['avlt_n5_score'] || 0;
          
          let dstScore = 0;
          Object.keys(answers).forEach(k => {
              if (k.startsWith('dst_') && typeof answers[k] === 'number') dstScore += answers[k];
          });

          const tmtbData = state.user.cognitiveStats?.trainingHistory?.find(h => h.gameType === 'attention' && h.id.startsWith('tmtb_')); 
          const tmtbTime = tmtbData ? tmtbData.durationSeconds : 0; 

          const diag = calculateCognitiveDiagnosis(
              mmseResult.score,
              mocaResult.score,
              cdrGlobal, 
              adlResult.barthel
          );

          finalScore = mocaResult.score; 
          scoreDetail = `${diag.diagnosis} | MoCA:${mocaResult.score}, CDR:${cdrGlobal}, ADL:${adlResult.barthel}`;
          recommendations = diag.alerts;

          if (diag.riskLevel !== 'LOW') psychRiskFlag = true;

          const fullPayload = {
              patient_id: state.user.id,
              timestamp: Date.now(),
              scales: {
                  mmse: { score: mmseResult.score, breakdown: mmseResult.breakdown },
                  moca: { score: mocaResult.score, raw: mocaResult.rawScore },
                  adl: { barthel: adlResult.barthel, lawton: adlResult.lawton },
                  cdr: { global: cdrGlobal, domains: cdrResult.domainScores }, 
                  avlt: { n5_recall: avltN5 },
                  dst: { backward_score: dstScore },
                  tmt_b: { time_seconds: tmtbTime }
              },
              diagnosis: diag,
              meta: {
                  education_years: answers['education_years'],
                  assessor: 'AI_CDSS_V2.4'
              }
          };

          const payloadStr = JSON.stringify(fullPayload);
          encrypted = CryptoJS.AES.encrypt(payloadStr, "WCH-NEURO-2026").toString();
      } else {
          const payloadStr = JSON.stringify({ ...answers, _meta: { completedAt: Date.now() } });
          encrypted = CryptoJS.AES.encrypt(payloadStr, "WCH-NEURO-2026").toString();
      }

      dispatch({
          type: 'SET_DIAGNOSIS',
          payload: {
              reason: psychRiskFlag ? (scoreDetail || "高风险提示") : "基础档案建立完成",
              referral: {
                  hospitalName: "华西医院 (数据中心)",
                  distance: "云端归档",
                  address: "encrypted_storage",
                  recommends: recommendations.length > 0 ? recommendations : (psychRiskFlag ? ["心理门诊复查", "认知干预"] : []),
                  qrCodeValue: encrypted 
              }
          }
      });

      showToast('数据已加密归档，正在生成凭证...', 'success');
      dispatch({ type: 'CLEAR_ASSESSMENT_DRAFT' });
      
      setTimeout(() => {
          onComplete(finalScore);
      }, 1500);
  };

  const handleNextSection = () => {
      if (!formConfig) return;
      
      const section = formConfig.sections[currentSection];
      for (const field of section.fields) {
          if (checkVisibility(field, answers) && field.validation?.required) {
              if (answers[field.id] === undefined || (Array.isArray(answers[field.id]) && answers[field.id].length === 0) || answers[field.id] === '') {
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
          handleFinish();
      }
  };

  if (type === DiseaseType.COGNITIVE && !formConfig) {
      return <InteractiveMMSE onComplete={onComplete} onBack={onBack} />;
  }

  if (formConfig) {
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
                        onLeave={onBack}
                        onTermination={handleFinish}
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
  }

  // Legacy fallback
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
      setInputValue(''); 
      
      if (legacyStep < questions.length - 1) {
          setLegacyStep(p => p + 1);
      } else {
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
