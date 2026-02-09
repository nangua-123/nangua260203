
/**
 * @file geminiService.ts
 * @description 华西医院神经内科 AI 核心服务层
 * @author Neuro-Link Architect
 * 
 * 包含：
 * 1. 模拟 LLM 问诊交互 (Mock) - [REFACTORED] 基于 triage_config.ts 的配置驱动模式
 * 2. 真实 Gemini Vision OCR (Real Integration)
 */

import { ChatMessage, HeadacheProfile, EpilepsyProfile, CognitiveProfile, DiseaseType, MedicalRecord } from "../types";
import { GoogleGenAI } from "@google/genai";
import { DISEASE_CONTEXT_CONFIG } from "../config/DiseaseContextConfig";
import { TRIAGE_CONFIG, TriageStep } from "../config/triage_config";

// --- Types & Interfaces ---

interface MockChatSession {
  step: number;        // Visual step progress
  totalSteps: number;  // Dynamic total steps based on config
  diseaseType: DiseaseType; // Detected disease path
  history: string[];   // Chat history
  estimatedRisk: number; // Real-time risk score
  
  // [NEW] Config-Driven Logic State
  configSteps: TriageStep[]; // Loaded steps from config
  currentConfigIndex: number; // Index in configSteps
  structuredData: Record<string, string>; // Captured answers
}

// --- Utils ---

export const checkSensitiveKeywords = (text: string): boolean => {
    const dangerPatterns = /自残|自杀|呼吸困难|剧烈呕吐|意识丧失|不想活了|救命/;
    return dangerPatterns.test(text);
};

const sanitizeTerminology = (text: string) => {
    return text
        .replace(/头痛/g, "血管性头痛/偏头痛")
        .replace(/发作/g, "临床发作事件")
        .replace(/看病/g, "就诊");
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Core Logic ---

/**
 * Initialize Chat Session
 */
export const createChatSession = (systemInstruction: string, diseaseType: DiseaseType = DiseaseType.UNKNOWN): any => {
  return {
    step: 0,
    totalSteps: 8, // Default, updated after intent recognition
    diseaseType: diseaseType,
    history: [],
    estimatedRisk: 10, // Baseline risk
    
    // Config Init
    configSteps: [],
    currentConfigIndex: -1,
    structuredData: {}
  } as MockChatSession;
};

/**
 * [CLINICAL_CRITICAL] AI Response Core
 * Refactored to use TRIAGE_CONFIG for decision tree logic
 */
export const sendMessageToAI = async (session: MockChatSession, message: string, fullContext: ChatMessage[] = []): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  let response = "";

  // [Phase 0] Greeting & Triage Start
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是您的专病数字医生。请问您目前最主要的困扰是什么？
<OPTIONS>记忆力明显下降|反复肢体抽搐/意识丧失|剧烈头痛/偏头痛|其他神经系统不适</OPTIONS>`;
  } 
  else {
      // [Phase 1] Intent Recognition & Config Loading
      if (session.currentConfigIndex === -1) {
          
          // Rule Engine: Map keyword to DiseaseType
          let detectedType = DiseaseType.MIGRAINE; // Default fallback

          if (/头痛|头晕|偏头痛|胀痛/.test(msg)) {
              detectedType = DiseaseType.MIGRAINE;
          } else if (/抽搐|抖动|发作|意识丧失|愣神|倒地/.test(msg)) {
              detectedType = DiseaseType.EPILEPSY;
          } else if (/记忆|忘|迷路|性格|变笨|糊涂|老人/.test(msg)) {
              detectedType = DiseaseType.COGNITIVE;
          }

          // Hydrate Session with Config
          session.diseaseType = detectedType;
          session.configSteps = TRIAGE_CONFIG[detectedType] || [];
          session.totalSteps = session.configSteps.length + 2; // +2 for intro and ending
          session.currentConfigIndex = 0; // Point to first question
          
          // Initial Risk Baseline
          session.estimatedRisk = detectedType === DiseaseType.EPILEPSY ? 30 : 10;

          // Generate Response for the *First* Config Step
          const firstStep = session.configSteps[0];
          const config = DISEASE_CONTEXT_CONFIG[detectedType];
          
          if (firstStep) {
              const optionsStr = firstStep.options.map(o => o.label).join('|');
              response = `已为您匹配${config.displayName}诊疗路径。
${firstStep.question}
<OPTIONS>${optionsStr}</OPTIONS>`;
          } else {
              response = "抱歉，无法匹配到相关病种路径，请联系人工客服。";
          }
          
          session.step = 2; // Visual progress
      } 
      // [Phase 2] Config-Driven Triage Loop
      else {
          // 1. Process *Previous* Step Answer (Calculate Risk)
          const prevStepIndex = session.currentConfigIndex;
          const prevStep = session.configSteps[prevStepIndex];
          
          if (prevStep) {
              // Fuzzy match user answer to options
              const selectedOption = prevStep.options.find(opt => msg.includes(opt.label) || msg === opt.label);
              if (selectedOption) {
                  // [LOGIC] Accumulate Risk
                  session.estimatedRisk += selectedOption.riskWeight;
                  session.structuredData[prevStep.id] = selectedOption.value;
                  
                  // Critical Flag Check
                  if (selectedOption.isCritical) {
                      session.estimatedRisk += 20; // Extra penalty for critical signs
                  }
              }
          }

          // 2. Advance to Next Step
          session.currentConfigIndex++;
          const nextStep = session.configSteps[session.currentConfigIndex];

          if (nextStep) {
              session.step++;
              const optionsStr = nextStep.options.map(o => o.label).join('|');
              response = `${nextStep.question}
<OPTIONS>${optionsStr}</OPTIONS>`;
          } else {
              // [Phase 3] Completion & Handover
              const config = DISEASE_CONTEXT_CONFIG[session.diseaseType];
              
              // Dynamic Tools Recommendation
              let actionButtons = config.recommendedTools.map(toolId => {
                  switch(toolId) {
                      case 'weather_radar': return '诱因分析';
                      case 'pain_log': return '记录用药';
                      case 'relax_audio': return '缓解指南';
                      case 'seizure_diary': return '发作日志';
                      case 'wave_monitor': return '安全检查';
                      case 'sos_alert': return '紧急呼叫';
                      case 'memory_game': return '大脑训练';
                      case 'schulte_grid': return '专注练习';
                      case 'family_guard': return '我的足迹';
                      default: return '查看详情';
                  }
              }).join('|');

              response = `初步问诊结束。
基于您的回答，系统评估风险指数为 ${session.estimatedRisk}。
建议立即进行【${config.assessmentScaleId}】深度测评以获取详细医疗建议。
<OPTIONS>${actionButtons}</OPTIONS>
<ACTION>OFFER_ASSESSMENT</ACTION>`;
          }
      }
  }

  // Risk Score Clamping
  session.estimatedRisk = Math.min(95, Math.max(5, session.estimatedRisk));

  session.history.push(`User: ${msg}`);
  session.history.push(`AI: ${sanitizeTerminology(response)}`);
  return sanitizeTerminology(response);
};

/**
 * Generate Structured Medical Summary (Triage Analysis)
 * Used for ReportView and Referral Logic
 */
export const getTriageAnalysis = async (conversationHistory: ChatMessage[], diseaseType: DiseaseType = DiseaseType.MIGRAINE): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Construct summary based on DiseaseType and parsed history keywords
    let risk = 50; 
    let summaryText = "";
    const historyStr = conversationHistory.map(m => m.text).join(' ');

    if (diseaseType === DiseaseType.MIGRAINE) {
        const isChronic = historyStr.includes('> 15天') || historyStr.includes('几乎每天');
        const isMOH = historyStr.includes('> 10天');
        summaryText = `患者主诉头痛。${isChronic ? '发作频率高，提示慢性化倾向。' : ''} ${isMOH ? '存在药物过度使用风险(MOH)。' : ''} 伴随症状典型。`;
        risk = isChronic || isMOH ? 75 : 40;
    } else if (diseaseType === DiseaseType.EPILEPSY) {
        const isStatus = historyStr.includes('> 5分钟') || historyStr.includes('> 30分钟');
        summaryText = `监测到痫性发作特征。${isStatus ? '曾有持续状态风险，需警惕。' : ''} 建议完善长程视频脑电图。`;
        risk = isStatus ? 85 : 60;
    } else if (diseaseType === DiseaseType.COGNITIVE) {
        const isLost = historyStr.includes('迷路') || historyStr.includes('走丢');
        summaryText = `存在认知域功能减退指征。${isLost ? '有定向力障碍(迷路史)，属高危信号。' : ''} 需进一步行 MMSE/MoCA 量表评估。`;
        risk = isLost ? 80 : 50;
    }

    return JSON.stringify({
        risk,
        disease: diseaseType,
        summary: summaryText,
        preliminary_summary: summaryText
    });
};

/**
 * Cognitive Game Assessment Generator
 */
export const generateCognitiveAssessment = async (score: number, accuracy: number, gameType: 'memory' | 'attention'): Promise<{rating: string; advice: string}> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    let rating = 'B';
    let advice = '';
    
    if (gameType === 'memory') {
        if (score > 100) { rating = 'S'; advice = '海马体空间记忆能力极佳。'; }
        else { rating = 'C'; advice = '注意广度略显不足。'; }
    } else {
        if (accuracy < 10) { rating = 'S'; advice = '视觉搜索速度惊人。'; }
        else { rating = 'C'; advice = '存在注意力分散迹象。'; }
    }
    return { rating, advice };
};

/**
 * [REAL] Medical OCR Processing
 */
export const processMedicalImage = async (file: File): Promise<MedicalRecord> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const base64Data = await fileToBase64(file);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { 
                        inlineData: { 
                            mimeType: file.type, 
                            data: base64Data 
                        } 
                    },
                    { 
                        text: `You are an expert medical AI assistant for West China Hospital. Analyze this medical report/image.
                        Task 1: Extract basic metadata.
                        Task 2: Analyze MRI findings specifically for Epilepsy pathology if present.
                        Map findings to these exact keys (multiple allowed):
                        - softening (软化灶)
                        - hs (海马硬化)
                        - fcd (皮质发育不良)
                        - tumor (脑肿瘤)
                        - heterotopia (灰质异位)
                        - vascular (脑血管畸形)
                        - hemorrhage (出血灶)
                        - scar (瘢痕)
                        - none (无异常/未做)
                        Return valid JSON ONLY:
                        { 
                          "reportDate": "YYYY-MM-DD", 
                          "diagnosis": "string (brief conclusion)", 
                          "riskFactor": "number (0-100 integer)",
                          "hospital": "string",
                          "mri_lesion_nature": ["string"]
                        }
                        If not legible, return diagnosis="Error", riskFactor=0.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        if (!result.diagnosis || result.diagnosis === "Error" || typeof result.riskFactor !== 'number') {
             throw new Error("Invalid medical content");
        }

        return {
            id: `ocr_${Date.now()}`,
            date: result.reportDate || new Date().toISOString().split('T')[0],
            hospital: result.hospital || 'AI 识别来源',
            diagnosis: result.diagnosis,
            indicators: [
                { name: '智能风险指数', value: result.riskFactor, trend: 'flat' },
                { name: 'MRI_PATHOLOGY_TAGS', value: (result.mri_lesion_nature || []).join(','), trend: 'flat' }
            ],
            rawImageUrl: URL.createObjectURL(file)
        };

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw new Error("无法识别该检查单，请确保图片清晰且包含关键指标");
    }
};
