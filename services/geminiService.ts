
import { ChatMessage, HeadacheProfile, EpilepsyProfile, CognitiveProfile, DiseaseType } from "../types";

// MOCK SERVICE
// 模拟华西医院分诊逻辑 - 神经内科 CDSS 标准版

interface MockChatSession {
  step: number;
  totalSteps: number; // [NEW] 总步数用于进度条
  diseaseType: DiseaseType;
  history: string[]; // Internal short-term memory
}

// 术语库处理
const sanitizeTerminology = (text: string) => {
    return text
        .replace(/头痛/g, "血管性头痛/偏头痛")
        .replace(/发作/g, "临床发作事件")
        .replace(/看病/g, "就诊");
};

// 初始化会话，支持专病类型
// [REFACTOR] 默认 5 步问诊流程
export const createChatSession = (systemInstruction: string, diseaseType: DiseaseType = DiseaseType.UNKNOWN): any => {
  return {
    step: 0,
    totalSteps: 5,
    diseaseType: diseaseType,
    history: []
  } as MockChatSession;
};

// 核心问诊逻辑
export const sendMessageToAI = async (session: MockChatSession, message: string, fullContext: ChatMessage[] = []): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  let response = "";

  // 0. 接诊 (Step 0 -> Step 1) - 严格对标 PRD 话术
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是您的专病数字医生。请问您目前最主要的困扰是什么？
<OPTIONS>记忆力明显下降|反复肢体抽搐/意识丧失|剧烈头痛/偏头痛|其他神经系统不适</OPTIONS>`;
  } 
  else {
      // 1. 自动病种识别 & 路由逻辑 (Step 1 -> Step 2)
      if (session.step === 1) {
          session.step = 2;
          if (/头痛|头晕|偏头痛|胀痛/.test(msg)) {
              session.diseaseType = DiseaseType.MIGRAINE;
              response = `已为您匹配【华西头痛中心】路径。
请点击选择疼痛的具体性质（无需输入）：
<OPTIONS>搏动性跳痛|紧箍感/压迫感|电击样刺痛|炸裂样剧痛</OPTIONS>`;
          } else if (/抽搐|抖动|发作|意识丧失|愣神|倒地/.test(msg)) {
              session.diseaseType = DiseaseType.EPILEPSY;
              response = `已为您匹配【华西癫痫中心】路径。
请选择最近一次发作时的目击表现：
<OPTIONS>意识丧失+肢体抽搐|仅发呆/愣神|肢体麻木/无力|跌倒/尿失禁</OPTIONS>`;
          } else if (/记忆|忘|迷路|性格|变笨|糊涂/.test(msg)) {
              session.diseaseType = DiseaseType.COGNITIVE;
              response = `已为您匹配【认知记忆门诊】路径。
除了记忆力问题，患者目前最明显的改变是？
<OPTIONS>出门迷路/分不清方向|性格突变/多疑|算不清账/无法购物|近期事情记不住</OPTIONS>`;
          } else {
              // 默认兜底
              session.diseaseType = DiseaseType.MIGRAINE;
              response = `症状已记录。为了更准确评估，请确认是否有以下情况：
<OPTIONS>是否伴有剧烈头痛？|是否曾出现短暂意识丧失？|是否经常忘记近期发生的事？</OPTIONS>`;
          }
      } 
      // 2. 核心信息采集 (Step 2 -> Step 5) - 只采集，不给结论
      else {
          session.step = Math.min(session.step + 1, 5); // 递增步数

          // 通用追问逻辑 (模拟不同病种的路径，但在 Step 5 统一结束)
          if (session.step < 5) {
              if (session.step === 3) {
                  response = `这种情况出现的频率是？
<OPTIONS>每天都会|每周2-3次|每月1-2次|偶尔/数月一次</OPTIONS>`;
              } else if (session.step === 4) {
                  response = `既往是否有相关确诊病史或用药史？
<OPTIONS>已确诊并服药|曾确诊但未服药|从未就诊|不清楚</OPTIONS>`;
              }
          } else {
              // Step 5: 采集完成，触发深度测评推荐
              // 严格对标 PRD: 不做分流判断，引导进入量表测评
              response = `基础信息采集完毕。
为了精准判断病情分级，建议进行【华西标准量表深度测评】。
<ACTION>OFFER_ASSESSMENT</ACTION>`;
          }
      }
  }

  session.history.push(`User: ${msg}`);
  session.history.push(`AI: ${sanitizeTerminology(response)}`);
  return sanitizeTerminology(response);
};

// 生成结构化病历 (支持多病种提取)
export const getTriageAnalysis = async (conversationHistory: ChatMessage[], diseaseType: DiseaseType = DiseaseType.MIGRAINE): Promise<string> => {
    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    const historyStr = JSON.stringify(conversationHistory);
    // 默认风险分，具体由 ReportView 结合 Assessment 分数决定
    // 此处仅生成摘要
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

// ... existing cognitive game assessment code ...
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
