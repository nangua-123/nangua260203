
/**
 * @file geminiService.ts
 * @description 华西医院神经内科 AI 核心服务层 (Mock)
 * @author Neuro-Link Architect
 * 
 * 本服务负责模拟 LLM 的多轮问诊交互、医学术语清洗及 CDSS 临床路径分流。
 * 目前采用“规则引擎 + 状态机”混合模式，未来可无缝替换为真实 Gemini API。
 */

import { ChatMessage, HeadacheProfile, EpilepsyProfile, CognitiveProfile, DiseaseType, MedicalRecord } from "../types";

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
 * 发送消息给 AI (CDSS 状态机模拟)
 * 
 * 逻辑流程:
 * 1. Step 0->1: 主动接诊
 * 2. Step 1->2: 基于正则(Regex)的 NLP 意图识别与分诊路由
 *    [Dynamic] 根据病种调整 totalSteps (癫痫4步急救优先，头痛6步详查)
 * 3. Step 2->N: 核心医学信息采集 (症状/频率/病史/先兆)
 * 4. Step N:    触发深度评估 (Commercial Hook)
 * 
 * @param session 当前会话状态
 * @param message 用户输入
 * @param fullContext 完整聊天记录
 */
export const sendMessageToAI = async (session: MockChatSession, message: string, fullContext: ChatMessage[] = []): Promise<string> => {
  // 模拟网络延迟 (RRT Simulation)
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  
  // --- [NEW] 动态风险评分逻辑 (Dynamic Risk Scoring) ---
  // 基于用户回复的关键词调整 estimatedRisk
  
  // 1. 严重程度关键词
  if (/剧烈|炸裂|难以忍受|丧失|抽搐|倒地/.test(msg)) session.estimatedRisk += 30;
  else if (/搏动|电击|紧箍|麻木/.test(msg)) session.estimatedRisk += 15;
  
  // 2. 频率关键词
  if (/每天|总是|频繁/.test(msg)) session.estimatedRisk += 25;
  else if (/每周|经常/.test(msg)) session.estimatedRisk += 15;
  else if (/每月|偶尔/.test(msg)) session.estimatedRisk += 5;
  
  // 3. 病史关键词
  if (/已确诊|服药/.test(msg)) session.estimatedRisk += 10;
  
  // ----------------------------------------------------

  let response = "";

  // [Phase 0] 接诊阶段
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是您的专病数字医生。请问您目前最主要的困扰是什么？
<OPTIONS>记忆力明显下降|反复肢体抽搐/意识丧失|剧烈头痛/偏头痛|其他神经系统不适</OPTIONS>`;
  } 
  else {
      // [Phase 1] 智能分诊路由 (Intent Recognition) & 动态路径规划
      if (session.step === 1) {
          session.step = 2;
          // 规则引擎：关键词匹配 -> 路由至对应 CDSS 路径
          if (/头痛|头晕|偏头痛|胀痛/.test(msg)) {
              session.diseaseType = DiseaseType.MIGRAINE;
              session.totalSteps = 6; // [Dynamic] 偏头痛需要更详细的先兆问询
              session.estimatedRisk = 30; // 偏头痛基线分
              response = `已为您匹配【华西头痛中心】路径。
请点击选择疼痛的具体性质（无需输入）：
<OPTIONS>搏动性跳痛|紧箍感/压迫感|电击样刺痛|炸裂样剧痛</OPTIONS>`;
          } else if (/抽搐|抖动|发作|意识丧失|愣神|倒地/.test(msg)) {
              session.diseaseType = DiseaseType.EPILEPSY;
              session.totalSteps = 4; // [Dynamic] 癫痫强调快速急救分流，缩短问诊
              session.estimatedRisk = 60; // 癫痫基线分 (高危)
              response = `已为您匹配【华西癫痫中心】路径。
请选择最近一次发作时的目击表现：
<OPTIONS>意识丧失+肢体抽搐|仅发呆/愣神|肢体麻木/无力|跌倒/尿失禁</OPTIONS>`;
          } else if (/记忆|忘|迷路|性格|变笨|糊涂/.test(msg)) {
              session.diseaseType = DiseaseType.COGNITIVE;
              session.totalSteps = 5; // 标准 5 步
              session.estimatedRisk = 40; // 认知障碍基线分
              response = `已为您匹配【认知记忆门诊】路径。
除了记忆力问题，患者目前最明显的改变是？
<OPTIONS>出门迷路/分不清方向|性格突变/多疑|算不清账/无法购物|近期事情记不住</OPTIONS>`;
          } else {
              // Fallback
              session.diseaseType = DiseaseType.MIGRAINE;
              session.totalSteps = 5;
              session.estimatedRisk = 20;
              response = `症状已记录。为了更准确评估，请确认是否有以下情况：
<OPTIONS>是否伴有剧烈头痛？|是否曾出现短暂意识丧失？|是否经常忘记近期发生的事？</OPTIONS>`;
          }
      } 
      // [Phase 2] 结构化信息采集 (Data Collection)
      else {
          session.step = Math.min(session.step + 1, session.totalSteps); // 动态步进控制

          if (session.step < session.totalSteps) {
              if (session.step === 3) {
                  response = `这种情况出现的频率是？
<OPTIONS>每天都会|每周2-3次|每月1-2次|偶尔/数月一次</OPTIONS>`;
              } else if (session.step === 4) {
                  response = `既往是否有相关确诊病史或用药史？
<OPTIONS>已确诊并服药|曾确诊但未服药|从未就诊|不清楚</OPTIONS>`;
              } else if (session.step === 5) {
                  // [Dynamic] 仅偏头痛路径会进入第 5 步询问
                  response = `发作前是否有视觉先兆（如眼前闪光、暗点、视野缺损）？
<OPTIONS>每次都有|偶尔有|完全没有|不确定</OPTIONS>`;
              }
          } else {
              // [Phase 3] 采集结束，触发转化 (Conversion)
              response = `基础信息采集完毕。
为了精准判断病情分级，建议进行【华西标准量表深度测评】。
<ACTION>OFFER_ASSESSMENT</ACTION>`;
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
 * [NEW] 医疗影像 OCR 结构化处理 (Gemini Vision 模拟)
 * @param file 上传的图片文件
 * @returns 结构化病历数据
 */
export const processMedicalImage = async (file: File): Promise<MedicalRecord> => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 这里在真实场景中会调用 ai.models.generateContent 传入 imagePart
    
    // Mock Response
    return {
        id: `rec_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        hospital: '四川大学华西医院 (AI识别)',
        diagnosis: '无先兆偏头痛 (MIdAS Grade IV)',
        indicators: [
            { name: 'VAS', value: Math.floor(Math.random() * 4 + 6), trend: 'up' }, // Random 6-10
            { name: '发作频率', value: '4次/月', trend: 'flat' }
        ],
        rawImageUrl: URL.createObjectURL(file) 
    };
};
