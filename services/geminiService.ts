
/**
 * @file geminiService.ts
 * @description 华西医院神经内科 AI 核心服务层
 * @author Neuro-Link Architect
 * 
 * 包含：
 * 1. 模拟 LLM 问诊交互 (Mock) - [ENHANCED] 支持语义模糊匹配与严格风险评分
 * 2. 真实 Gemini Vision OCR (Real Integration)
 * 3. [NEW] 多模态问诊支持 (Image/Video Understanding)
 * 4. [NEW] 综合健康周报生成 (Text Generation)
 */

import { ChatMessage, DiseaseType, MedicalRecord, User } from "../types/index";
import { GoogleGenAI } from "@google/genai";
import { DISEASE_CONTEXT_CONFIG } from "../config/DiseaseContextConfig";
import { TRIAGE_CONFIG, TriageStep, TriageOption } from "../config/triage_config";

// --- Types & Interfaces ---

export interface ChatAttachment {
    mimeType: string;
    data: string; // Base64
}

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

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Handle potentially missing prefix if needed, but standard readAsDataURL includes it.
        // We usually need just the base64 part for Gemini API if using inlineData.
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * [NEW] Semantic Matcher
 * Maps colloquial patient terms to clinical options using fuzzy logic.
 */
const semanticMatch = (input: string, options: TriageOption[]): TriageOption | null => {
    const text = input.toLowerCase();
    
    // 1. Direct label match (Exact or Substring)
    const directMatch = options.find(o => text.includes(o.label) || o.label.includes(text));
    if (directMatch) return directMatch;

    // 2. Keyword Mapping (Synonyms Dictionary)
    const synonymMap: Record<string, string[]> = {
        // Migraine
        'pulsating': ['跳着疼', '突突跳', '血管跳', '搏动', '咚咚', '撞击', '突突'],
        'pressing': ['紧', '箍', '压', '沉重', '带子', '帽子', '绑住'],
        'stabbing': ['刺痛', '针扎', '电击', '钻', '尖锐', '扎'],
        'nausea': ['吐', '反胃', '恶心', '吃不下', '想吐'],
        'photophobia': ['怕光', '刺眼', '睁不开', '太亮', '畏光'],
        'aura': ['看不清', '花眼', '闪光', '黑点', '锯齿', '模糊', '视力下降'],
        'chronic': ['天天', '每天', '经常', '老是', '频繁', '一直'],
        
        // Epilepsy
        'motor': ['抽', '抖', '僵硬', '乱动', '倒地', '强直', '痉挛', '抽风', '羊癫疯'],
        'absence': ['愣神', '发呆', '断片', '不动', '走神', '失去意识'],
        'unconscious': ['不知道', '不记得', '人事不省', '叫不答应', '晕', '昏迷'],
        'status_epilepticus': ['一直抽', '停不下来', '很久', '半小时'],
        
        // Cognitive / AD
        'recent': ['变笨', '记不住', '脑子不好使', '糊涂', '老忘事', '转头忘', '刚做过'],
        'lost': ['迷路', '走丢', '找不到家', '不认路', '不知道在哪', '找不着北', '回不去'],
        'behavior': ['脾气变了', '多疑', '骂人', '打人', '性格', '古怪'],
        'language': ['叫不出名', '话到嘴边', '不会说话', '表达不清'],
        
        // General
        'dull': ['胀', '闷', '昏沉', '隐隐']
    };

    for (const opt of options) {
        const keywords = synonymMap[opt.value] || [];
        // If any keyword is found in user text
        if (keywords.some(kw => text.includes(kw))) {
            return opt;
        }
    }

    // 3. Fallback: If option is "None" or "Unknown" and input suggests negation
    const negationKeywords = ['没', '无', '否', '不'];
    const hasNegation = negationKeywords.some(k => text.includes(k));
    if (hasNegation) {
        return options.find(o => o.value === 'none' || o.value === 'negative' || o.value === 'normal') || null;
    }

    return null;
};

// --- Core Logic ---

export const createChatSession = (systemInstruction: string, diseaseType: DiseaseType = DiseaseType.UNKNOWN): any => {
  return {
    step: 0,
    totalSteps: 8,
    diseaseType: diseaseType,
    history: [],
    estimatedRisk: 10, 
    configSteps: [],
    currentConfigIndex: -1,
    structuredData: {}
  } as MockChatSession;
};

export const sendMessageToAI = async (
    session: MockChatSession, 
    message: string, 
    fullContext: ChatMessage[] = [],
    attachment?: ChatAttachment
): Promise<string> => {
  
  if (attachment) {
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const modelName = 'gemini-3-flash-preview'; 
          
          let prompt = message;
          if (!prompt) {
              if (attachment.mimeType.startsWith('video')) {
                  prompt = "请分析这段视频中的运动特征。如果是发作视频，请描述发作类型（如强直、阵挛、自动症）以及持续时间。如果是步态视频，请分析是否存在共济失调或偏瘫步态。";
              } else {
                  prompt = "请分析这张医学图片。如果是检查报告，请提取结论；如果是体征照片（如舌苔、面部），请描述可见的异常特征。";
              }
          }

          const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                  parts: [
                      { text: prompt },
                      { 
                          inlineData: {
                              mimeType: attachment.mimeType,
                              data: attachment.data
                          }
                      }
                  ]
              },
              config: {
                  systemInstruction: "你是一位华西医院的神经内科专家 AI。你的任务是分析上传的影像资料，提取具有临床意义的特征。请保持客观、专业，避免给出确诊结论，而是提供‘可能的临床征象’。",
                  maxOutputTokens: 500,
              }
          });

          const analysis = response.text || "无法解析影像内容，请重新上传清晰文件。";
          session.history.push(`User sent attachment: ${attachment.mimeType}`);
          session.history.push(`AI Analysis: ${analysis}`);
          
          return `【AI 视觉分析】\n${analysis}\n\n(以上分析仅供参考，请以线下医生查体为准)`;

      } catch (error) {
          console.error("Gemini Multimodal Error:", error);
          return "抱歉，影像分析服务暂时不可用，请稍后重试或使用文字描述。";
      }
  }

  // --- Standard Text Triage Logic (Mock) ---
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  let response = "";

  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是您的专病数字医生。请问您目前最主要的困扰是什么？
<OPTIONS>记忆力明显下降|反复肢体抽搐/意识丧失|剧烈头痛/偏头痛|其他神经系统不适</OPTIONS>`;
  } 
  else {
      if (session.currentConfigIndex === -1) {
          let detectedType = DiseaseType.MIGRAINE; 

          if (/头痛|头晕|偏头痛|胀痛/.test(msg)) {
              detectedType = DiseaseType.MIGRAINE;
          } else if (/抽搐|抖动|发作|意识丧失|愣神|倒地|癫痫/.test(msg)) {
              detectedType = DiseaseType.EPILEPSY;
          } else if (/记忆|忘|迷路|性格|变笨|糊涂|老人|认知/.test(msg)) {
              detectedType = DiseaseType.COGNITIVE;
          }

          session.diseaseType = detectedType;
          session.configSteps = TRIAGE_CONFIG[detectedType] || [];
          session.totalSteps = session.configSteps.length + 2; 
          session.currentConfigIndex = 0; 
          
          session.estimatedRisk = detectedType === DiseaseType.EPILEPSY ? 30 : 10;

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
          
          session.step = 2; 
      } 
      else {
          const prevStepIndex = session.currentConfigIndex;
          const prevStep = session.configSteps[prevStepIndex];
          
          if (prevStep) {
              const selectedOption = semanticMatch(msg, prevStep.options);
              if (selectedOption) {
                  session.estimatedRisk += selectedOption.riskWeight;
                  session.structuredData[prevStep.id] = selectedOption.value;
                  if (selectedOption.isCritical) {
                      session.estimatedRisk += 30; 
                  }
              }
          }

          session.currentConfigIndex++;
          const nextStep = session.configSteps[session.currentConfigIndex];

          if (nextStep) {
              session.step++;
              const optionsStr = nextStep.options.map(o => o.label).join('|');
              response = `${nextStep.question}
<OPTIONS>${optionsStr}</OPTIONS>`;
          } else {
              const config = DISEASE_CONTEXT_CONFIG[session.diseaseType];
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

  session.estimatedRisk = Math.min(99, Math.max(5, session.estimatedRisk));

  session.history.push(`User: ${msg}`);
  session.history.push(`AI: ${sanitizeTerminology(response)}`);
  return sanitizeTerminology(response);
};

export const getTriageAnalysis = async (conversationHistory: ChatMessage[], diseaseType: DiseaseType = DiseaseType.MIGRAINE): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    let risk = 50; 
    let summaryText = "";
    const historyStr = conversationHistory.map(m => m.text).join(' ');

    if (diseaseType === DiseaseType.MIGRAINE) {
        const isChronic = historyStr.includes('> 15天') || historyStr.includes('几乎每天');
        const isMOH = historyStr.includes('> 10天');
        summaryText = `患者主诉头痛。${isChronic ? '发作频率高，提示慢性化倾向。' : ''} ${isMOH ? '存在药物过度使用风险(MOH)。' : ''} 伴随症状典型。`;
        risk = isChronic || isMOH ? 75 : 40;
    } else if (diseaseType === DiseaseType.EPILEPSY) {
        const isStatus = historyStr.includes('> 5分钟') || historyStr.includes('> 30分钟') || historyStr.includes('持续');
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

export const processMedicalImage = async (file: File): Promise<MedicalRecord> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const base64Data = await fileToBase64(file);
        
        // Note: gemini-2.5-flash-image DOES NOT support JSON mode via config.responseMimeType.
        // We must request JSON in the prompt and parse it manually.
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
                        Return valid JSON ONLY (No Markdown, No Code Blocks). Structure:
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
            }
            // Removed incorrect config: responseMimeType: "application/json"
        });

        let jsonText = response.text || "{}";
        // Clean up markdown code blocks if the model includes them despite instructions
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        
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

/**
 * [NEW] Generate Weekly Health Summary using Gemini
 * Aggregates user IoT data, logs, and profile info to generate a natural language report.
 */
export const generateHealthSummary = async (user: User, riskScore: number, diseaseType: DiseaseType): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Use gemini-3-flash-preview for fast text generation
        const modelName = 'gemini-3-flash-preview';

        // 1. Aggregate Data
        const oneDay = 86400000;
        const last7DaysStart = Date.now() - (7 * oneDay);
        
        // Vitals snapshot
        const hr = user.iotStats?.hr || '未知';
        const bp = user.iotStats?.bpSys && user.iotStats?.bpDia ? `${user.iotStats.bpSys}/${user.iotStats.bpDia}` : '未知';
        const abn = user.iotStats?.isAbnormal ? '存在异常' : '无明显异常';
        
        // Logs
        let recentEventCount = 0;
        let recentMedCount = 0;
        
        if (diseaseType === DiseaseType.EPILEPSY) {
            recentEventCount = user.epilepsyProfile?.seizureHistory?.filter(s => s.timestamp > last7DaysStart).length || 0;
        } else if (diseaseType === DiseaseType.MIGRAINE) {
            // Count pain logs > 5
            recentEventCount = user.medicationLogs?.filter(l => l.timestamp > last7DaysStart && (l.painScale || 0) > 5).length || 0;
        }
        recentMedCount = user.medicationLogs?.filter(l => l.timestamp > last7DaysStart).length || 0;

        // 2. Construct Prompt
        const prompt = `
        Role: You are a senior Neurologist at West China Hospital (华西医院).
        Task: Generate a "Weekly Health Summary" (健康周报) for a patient.
        
        Patient Profile:
        - Disease Type: ${diseaseType}
        - Current Risk Score: ${riskScore} (High score > 60 indicates high risk)
        - Recent Vitals (Avg): HR ${hr} bpm, BP ${bp} mmHg. Status: ${abn}.
        - Recent Clinical Events (Seizures/Severe Pain): ${recentEventCount} times in last 7 days.
        - Medication Adherence: Logged ${recentMedCount} times in last 7 days.
        
        Requirements:
        1. Language: Simplified Chinese (Professional yet empathetic).
        2. Format: Use Markdown.
           - **本周状态评估**: A brief summary of stability.
           - **关键数据解读**: Explain the HR, Events, and Meds in clinical context.
           - **华西专家建议**: Actionable advice based on the risk score and adherence.
        3. Length: Concise, under 250 words.
        4. Tone: Encouraging but alert if risk is high.
        `;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: prompt }] },
            config: {
                temperature: 0.7, // Creativity balance
            }
        });

        return response.text || "无法生成报告，请稍后重试。";

    } catch (error) {
        console.error("Gemini Summary Gen Error:", error);
        return "AI 服务暂时繁忙，无法生成周报。请根据图表数据自行监测。";
    }
};
