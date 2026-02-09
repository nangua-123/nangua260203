
/**
 * @file geminiService.ts
 * @description 华西医院神经内科 AI 核心服务层
 * @author Neuro-Link Architect
 * 
 * 包含：
 * 1. 模拟 LLM 问诊交互 (Mock) - [UPGRADED] 基于 DiseaseContextConfig 的动态调度
 * 2. 真实 Gemini Vision OCR (Real Integration)
 */

import { ChatMessage, HeadacheProfile, EpilepsyProfile, CognitiveProfile, DiseaseType, MedicalRecord } from "../types";
import { GoogleGenAI } from "@google/genai";
import { DISEASE_CONTEXT_CONFIG } from "../config/DiseaseContextConfig";

// --- Types & Interfaces ---

interface MockChatSession {
  step: number;        // 当前问诊节点
  totalSteps: number;  // 动态总节点数，根据病种调整
  diseaseType: DiseaseType; // 当前识别出的病种路径
  history: string[];   // 会话上下文快照
  estimatedRisk: number; // [NEW] 实时动态风险评分
}

// --- Utils ---

/**
 * [NEW] 敏感词熔断检测器
 * 用于 ChatView 前置拦截，若命中则阻断 AI 回复，转人工
 */
export const checkSensitiveKeywords = (text: string): boolean => {
    const dangerPatterns = /自残|自杀|呼吸困难|剧烈呕吐|意识丧失|不想活了|救命/;
    return dangerPatterns.test(text);
};

/**
 * 术语清洗器 (Terminology Sanitizer)
 * 将口语化的用户输入转换为标准的医学术语，确保病历归档的专业性。
 * @param text 原始文本
 * @returns 清洗后的医学文本
 */
const sanitizeTerminology = (text: string) => {
    return text
        .replace(/头痛/g, "血管性头痛/偏头痛")
        .replace(/发作/g, "临床发作事件")
        .replace(/看病/g, "就诊");
};

/**
 * 将 File 对象转换为 Base64 字符串 (用于 Vision API)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/xxx;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Core Logic ---

/**
 * 初始化问诊会话
 * @param systemInstruction 系统预设指令 (Prompt)
 * @param diseaseType 初始病种类型
 */
export const createChatSession = (systemInstruction: string, diseaseType: DiseaseType = DiseaseType.UNKNOWN): any => {
  return {
    step: 0,
    totalSteps: 5, // 默认初始步数，分诊后动态更新
    diseaseType: diseaseType,
    history: [],
    estimatedRisk: 10 // 初始基线分
  } as MockChatSession;
};

/**
 * [CLINICAL_CRITICAL] AI 响应生成核心
 * 根据 DiseaseContextConfig 动态注入 System Prompt 和 Suggested Options
 */
export const sendMessageToAI = async (session: MockChatSession, message: string, fullContext: ChatMessage[] = []): Promise<string> => {
  // 模拟网络延迟 (RRT Simulation)
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  
  // --- [Risk Engine] 动态风险评分逻辑 ---
  if (/剧烈|炸裂|难以忍受|丧失|抽搐|倒地|迷路|不认识/.test(msg)) session.estimatedRisk += 30;
  else if (/搏动|电击|紧箍|麻木|忘记/.test(msg)) session.estimatedRisk += 15;
  
  if (/每天|总是|频繁/.test(msg)) session.estimatedRisk += 25;
  
  if (/已确诊|服药/.test(msg)) session.estimatedRisk += 10;
  // ------------------------------------

  let response = "";

  // [Phase 0] 接诊阶段
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是您的专病数字医生。请问您目前最主要的困扰是什么？
<OPTIONS>记忆力明显下降|反复肢体抽搐/意识丧失|剧烈头痛/偏头痛|其他神经系统不适</OPTIONS>`;
  } 
  else {
      // [Phase 1] 智能分诊路由 (Intent Recognition)
      if (session.step === 1) {
          session.step = 2;
          
          // 规则引擎：关键词匹配 -> 路由至对应 CDSS 路径
          if (/头痛|头晕|偏头痛|胀痛/.test(msg)) {
              session.diseaseType = DiseaseType.MIGRAINE;
              session.totalSteps = 6;
              session.estimatedRisk = 30;
          } else if (/抽搐|抖动|发作|意识丧失|愣神|倒地/.test(msg)) {
              session.diseaseType = DiseaseType.EPILEPSY;
              session.totalSteps = 4; // 癫痫问诊更简短，快速进入监测
              session.estimatedRisk = 60;
          } else if (/记忆|忘|迷路|性格|变笨|糊涂|老人/.test(msg)) {
              session.diseaseType = DiseaseType.COGNITIVE;
              session.totalSteps = 5;
              session.estimatedRisk = 40;
          } else {
              // Default
              session.diseaseType = DiseaseType.MIGRAINE;
          }

          // [INJECTION] 读取配置中心，获取 AI 人设与显示名称
          const config = DISEASE_CONTEXT_CONFIG[session.diseaseType];
          
          if (session.diseaseType === DiseaseType.COGNITIVE) {
              // [AD Mode] 简单短句，安抚，怀旧疗法
              response = `好的，我明白了。
我是${config.displayName}的数字助手。
别担心，我们慢慢聊。
除了记性不好，平时出门会迷路吗？
<OPTIONS>偶尔迷路|经常找不到家|在家里也迷糊|方向感还好</OPTIONS>`;
          } else if (session.diseaseType === DiseaseType.EPILEPSY) {
              // [Epilepsy Mode] 安全第一，严谨
              response = `已为您匹配${config.displayName}急救与管理路径。
为了评估风险，请务必如实告知：
最近一次发作是在什么时候？
<OPTIONS>24小时内|一周内|一个月前|半年前</OPTIONS>`;
          } else {
              // [Migraine Mode] 详细症状，诱因探索
              response = `已为您匹配${config.displayName}诊疗路径。
请点击选择疼痛的具体性质（无需输入）：
<OPTIONS>搏动性跳痛|紧箍感/压迫感|电击样刺痛|炸裂样剧痛</OPTIONS>`;
          }
      } 
      // [Phase 2] 结构化信息采集 (Data Collection) - 基于病种上下文
      else {
          session.step = Math.min(session.step + 1, session.totalSteps); // 动态步进控制

          const config = DISEASE_CONTEXT_CONFIG[session.diseaseType];

          if (session.step < session.totalSteps) {
              
              // --- 偏头痛逻辑 (Migraine Logic) ---
              if (session.diseaseType === DiseaseType.MIGRAINE) {
                  if (session.step === 3) {
                      response = `发作频率是怎样的？这对判断是否为"慢性偏头痛"很重要。
<OPTIONS>每天都会|每周2-3次|每月1-2次|偶尔/数月一次</OPTIONS>`;
                  } else if (session.step === 4) {
                      response = `是否服用过止痛药？(评估MOH风险)
<OPTIONS>经常服用(>10天/月)|偶尔服用|从未服用|已在预防性治疗</OPTIONS>`;
                  } else {
                      response = `发作前是否有视觉先兆（如眼前闪光、暗点、视野缺损）？
<OPTIONS>每次都有|偶尔有|完全没有|不确定</OPTIONS>`;
                  }
              }
              // --- 癫痫逻辑 (Epilepsy Logic) ---
              else if (session.diseaseType === DiseaseType.EPILEPSY) {
                  if (session.step === 3) {
                      response = `【重要】您是否正在规律服用抗癫痫药物(ASM)？漏服药是诱发持续状态的主要原因。
<OPTIONS>严格规律服药|偶尔漏服|经常漏服/自行减量|从未服药</OPTIONS>`;
                  } else {
                      response = `最近生活环境是否安全？有没有接触闪光、熬夜或情绪激动？
<OPTIONS>经常熬夜/疲劳|情绪波动大|接触闪光刺激|作息规律/环境安全</OPTIONS>`;
                  }
              }
              // --- 认知障碍逻辑 (Cognitive Logic) ---
              else if (session.diseaseType === DiseaseType.COGNITIVE) {
                  if (session.step === 3) {
                      // 短句，回忆引导
                      response = `以前的事情记得清楚吗？
比如年轻时候的工作，或者老房子的样子。
<OPTIONS>记得很清楚|也有些模糊了|完全不记得|时好时坏</OPTIONS>`;
                  } else {
                      // 侧重照护
                      response = `现在家里是谁在照顾您？
是老伴，还是子女呢？
<OPTIONS>老伴照顾|子女照顾|保姆/护工|自己独居</OPTIONS>`;
                  }
              }
              else {
                  response = `这种情况出现的频率是？
<OPTIONS>每天都会|每周2-3次|每月1-2次|偶尔/数月一次</OPTIONS>`;
              }

          } else {
              // [Phase 3] 采集结束，触发转化 (Conversion)
              // [DYNAMIC TOOLS] 根据病种注入特定的 Action Button (来自配置中心)
              
              let actionButtons = config.recommendedTools.map(toolId => {
                  // Map tool IDs to human-readable buttons
                  switch(toolId) {
                      case 'weather_radar': return '诱因分析';
                      case 'pain_log': return '记录用药';
                      case 'relax_audio': return '缓解指南';
                      case 'seizure_diary': return '发作日志';
                      case 'wave_monitor': return '安全检查';
                      case 'sos_alert': return '紧急呼叫';
                      case 'memory_game': return '大脑训练';
                      case 'schulte_grid': return '专注练习';
                      case 'family_guard': return '我的足迹'; // 或者是 '呼叫家属'
                      default: return '查看详情';
                  }
              }).join('|');

              // Fallback if empty (should not happen with correct config)
              if (!actionButtons) actionButtons = "查看报告|完善档案";

              if (session.diseaseType === DiseaseType.COGNITIVE) {
                  response = `好的，情况我都记下来了。
我们来做一个有趣的小游戏，测测脑力吧？
很简单，别紧张。
<OPTIONS>${actionButtons}</OPTIONS>
<ACTION>OFFER_ASSESSMENT</ACTION>`;
              } else if (session.diseaseType === DiseaseType.EPILEPSY) {
                  response = `基础信息采集完毕。
为了您的安全，建议立即开启【发作监测】或进行【${config.assessmentScaleId}】风险评估。
<OPTIONS>${actionButtons}</OPTIONS>
<ACTION>OFFER_ASSESSMENT</ACTION>`;
              } else {
                  response = `基础信息采集完毕。
为了精准判断病情分级，建议进行【${config.assessmentScaleId} 深度测评】。
<OPTIONS>${actionButtons}</OPTIONS>
<ACTION>OFFER_ASSESSMENT</ACTION>`;
              }
          }
      }
  }

  // 风险分值截断 (5-95)
  session.estimatedRisk = Math.min(95, Math.max(5, session.estimatedRisk));

  session.history.push(`User: ${msg}`);
  session.history.push(`AI: ${sanitizeTerminology(response)}`);
  return sanitizeTerminology(response);
};

/**
 * 生成结构化病历摘要
 * 用于 ReportView 展示及转诊凭证生成
 */
export const getTriageAnalysis = async (conversationHistory: ChatMessage[], diseaseType: DiseaseType = DiseaseType.MIGRAINE): Promise<string> => {
    // 模拟 AI 思考时间
    await new Promise(resolve => setTimeout(resolve, 1500));

    // const historyStr = JSON.stringify(conversationHistory); // 实际场景中会发送给 LLM
    
    // Mock Result Generator
    let risk = 50; 
    let summary = "";
    let extractedProfile: any = {}; 
    
    if (diseaseType === DiseaseType.MIGRAINE) {
        summary = "患者主诉符合血管性头痛特征，伴随症状明显。";
        extractedProfile = {
            isComplete: true, source: 'AI_GENERATED', lastUpdated: Date.now(),
            onsetAge: 30, frequency: '待评估', familyHistory: false,
            diagnosisType: '疑似偏头痛', symptomsTags: ["头痛", "搏动性"]
        } as HeadacheProfile;
    } else if (diseaseType === DiseaseType.EPILEPSY) {
        summary = "监测到痫性发作特征，建议完善脑电图。";
        extractedProfile = {
            isComplete: true, source: 'AI_GENERATED', seizureType: '待定',
            frequency: '待定', lastSeizure: '近期', triggers: [], consciousness: true,
            lastUpdated: Date.now()
        } as EpilepsyProfile;
    } else if (diseaseType === DiseaseType.COGNITIVE) {
        summary = "存在认知域功能减退指征。";
        extractedProfile = {
            isComplete: true, source: 'AI_GENERATED', mmseScoreEstimate: '待测',
            symptoms: ['记忆减退'], adlScore: '待测', caregiver: '未知',
            lastUpdated: Date.now()
        } as CognitiveProfile;
    }

    return JSON.stringify({
        risk,
        disease: diseaseType,
        summary,
        extractedProfile
    });
};

/**
 * 认知游戏评估生成器
 * @param score 游戏得分
 * @param accuracy 准确率/耗时
 * @param gameType 游戏类型
 */
export const generateCognitiveAssessment = async (score: number, accuracy: number, gameType: 'memory' | 'attention'): Promise<{rating: string; advice: string}> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    let rating = 'B';
    let advice = '';
    
    // 简单的评分逻辑规则
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
 * [REAL] 医疗影像 OCR 结构化处理 (Gemini Vision Integration)
 * @param file 上传的图片文件
 * @returns 结构化病历数据 {MedicalRecord}
 */
export const processMedicalImage = async (file: File): Promise<MedicalRecord> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const base64Data = await fileToBase64(file);
        
        // 调用 Gemini Vision 模型进行多模态分析
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
                        text: `You are an expert medical AI assistant. Analyze this medical report image. 
                        Extract data into the following JSON structure exactly:
                        { 
                          "reportDate": "string (YYYY-MM-DD)", 
                          "diagnosis": "string (brief clinical conclusion)", 
                          "riskFactor": "number (0-100 integer, 100 being most critical/severe)",
                          "hospital": "string (hospital name if visible, else '未知机构')"
                        }
                        If the image is not a legible medical report or lacks clinical indicators, return diagnosis as "Error" and riskFactor as 0.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        // 校验关键字段
        if (!result.diagnosis || result.diagnosis === "Error" || typeof result.riskFactor !== 'number') {
             throw new Error("Invalid medical content");
        }

        return {
            id: `ocr_${Date.now()}`,
            date: result.reportDate || new Date().toISOString().split('T')[0],
            hospital: result.hospital || 'AI 识别来源',
            diagnosis: result.diagnosis,
            indicators: [
                // 映射 riskFactor 到 indicators[0].value，以便 AppContext 自动提取为趋势数据
                { name: '智能风险指数', value: result.riskFactor, trend: 'flat' }
            ],
            rawImageUrl: URL.createObjectURL(file)
        };

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw new Error("无法识别该检查单，请确保图片清晰且包含关键指标");
    }
};
