
import { ChatMessage, HeadacheProfile, EpilepsyProfile, CognitiveProfile, DiseaseType } from "../types";

// MOCK SERVICE
// 模拟华西医院分诊逻辑 - 神经内科 CDSS 标准版

interface MockChatSession {
  step: number;
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
export const createChatSession = (systemInstruction: string, diseaseType: DiseaseType = DiseaseType.MIGRAINE): any => {
  return {
    step: 0,
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

  // 0. 通用破冰
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      const diseaseName = session.diseaseType === DiseaseType.MIGRAINE ? '头痛' 
                        : session.diseaseType === DiseaseType.EPILEPSY ? '癫痫' 
                        : '认知记忆';
      
      response = `您好，我是华西神经内科 AI 数字助理（${diseaseName}专病版）。
本次对话将遵循华西 CDSS 临床路径。请确认患者身份：
<OPTIONS>为我自己|为父母|为子女|其他亲友</OPTIONS>`;
  } 
  else {
      // 1. 根据病种分流逻辑
      switch (session.diseaseType) {
          
          // --- A. 偏头痛路径 ---
          case DiseaseType.MIGRAINE:
              switch (session.step) {
                  case 1: // 身份 -> 主诉
                      session.step = 2;
                      response = `已建立头痛专病档案。请简述主要临床表现：
<OPTIONS>经常偏头痛|单侧搏动痛|眼眶周围痛|全头紧箍感</OPTIONS>`;
                      break;
                  case 2: // 主诉 -> 性质 (VAS)
                      session.step = 3;
                      response = `请描述疼痛的具体性质（VAS 评分参考）：
<OPTIONS>搏动性跳痛|紧箍感/压迫感|电击样刺痛|炸裂样剧痛</OPTIONS>`;
                      break;
                  case 3: // 性质 -> 频率
                      session.step = 4;
                      response = `近 3 个月平均每月发作天数？
<OPTIONS><1天/月|1-4天/月|5-14天/月|>15天/月</OPTIONS>`;
                      break;
                  case 4: // 频率 -> 诱因/伴随
                      session.step = 5;
                      response = `发作前是否有预兆或诱因？
<OPTIONS>畏光/畏声|视觉闪光|月经期|天气变化/熬夜</OPTIONS>`;
                      break;
                  default:
                      session.step = 6;
                      response = `信息已记录。正在生成偏头痛专病分析报告...
<ACTION>REPORT</ACTION>`;
                      break;
              }
              break;

          // --- B. 癫痫路径 (Epilepsy) ---
          case DiseaseType.EPILEPSY:
              switch (session.step) {
                  case 1: // 身份 -> 发作形态
                      session.step = 2;
                      response = `已进入癫痫发作管理流程。请描述最近一次发作时的目击表现：
<OPTIONS>意识丧失+肢体抽搐|仅发呆/愣神|肢体麻木/无力|跌倒/尿失禁</OPTIONS>`;
                      break;
                  case 2: // 形态 -> 意识状态 (局灶 vs 全面)
                      session.step = 3;
                      response = `发作过程中，患者对周围环境有反应吗？（呼之能应吗？）
<OPTIONS>完全呼之不应|意识清楚但无法言语|意识模糊/混乱|不确定</OPTIONS>`;
                      break;
                  case 3: // 意识 -> 频率
                      session.step = 4;
                      response = `此类情况发生的频率是？
<OPTIONS>首发(第1次)|<1次/年|1-11次/年|≥1次/月</OPTIONS>`;
                      break;
                  case 4: // 频率 -> 诱因/用药
                      session.step = 5;
                      response = `是否有明确诱因或正在服药？
<OPTIONS>漏服抗癫痫药|熬夜/疲劳|闪光刺激|规律服药中</OPTIONS>`;
                      break;
                  default:
                      session.step = 6;
                      response = `华西癫痫中心 CDSS 分析完毕。正在生成发作风险评估...
<ACTION>REPORT</ACTION>`;
                      break;
              }
              break;

          // --- C. 认知障碍路径 (Cognitive/AD) ---
          case DiseaseType.COGNITIVE:
              switch (session.step) {
                  case 1: // 身份 -> 核心症状
                      session.step = 2;
                      response = `已启动记忆与认知门诊预检。患者最明显的改变是？
<OPTIONS>近期事情记不住|出门迷路/分不清方向|性格突变/多疑|算不清账/无法购物</OPTIONS>`;
                      break;
                  case 2: // 症状 -> ADL (日常生活能力)
                      session.step = 3;
                      response = `目前的生活自理能力如何？
<OPTIONS>完全自理|需协助(做饭/洗衣)|需部分照料(穿衣/洗澡)|完全依赖照料</OPTIONS>`;
                      break;
                  case 3: // ADL -> 病程
                      session.step = 4;
                      response = `这种衰退情况持续多久了？
<OPTIONS><6个月(快速进展)|1-2年(缓慢加重)|>3年|忽好忽坏</OPTIONS>`;
                      break;
                  case 4: // 病程 -> 精神行为 (BPSD)
                      session.step = 5;
                      response = `是否伴有情绪或行为异常？
<OPTIONS>淡漠/不爱说话|暴躁/易怒|幻觉/妄想|夜间游荡/睡眠倒错</OPTIONS>`;
                      break;
                  default:
                      session.step = 6;
                      response = `认知域功能评估完毕。系统正在测算 AD8 风险指数...
<ACTION>REPORT</ACTION>`;
                      break;
              }
              break;

          default:
              response = `系统正在升级中。`;
              break;
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
    let risk = 30;
    let summary = "";
    let extractedProfile: any = {}; // Generic container

    // --- 提取逻辑分流 ---
    if (diseaseType === DiseaseType.MIGRAINE) {
        risk = historyStr.includes(">15天") || historyStr.includes("炸裂") ? 85 : 45;
        summary = "[华西头痛中心] 患者主诉符合血管性头痛特征。疑似慢性偏头痛或紧张性头痛。建议进行 TCD 及焦虑量表评估。";
        
        extractedProfile = {
            isComplete: true,
            source: 'AI_GENERATED',
            lastUpdated: Date.now(),
            onsetAge: 30, 
            frequency: historyStr.includes(">15天") ? '>15天/月' : '1-4天/月',
            familyHistory: false,
            diagnosisType: historyStr.includes("搏动") ? '典型偏头痛' : '未分类头痛',
            symptomsTags: historyStr.includes("畏光") ? ["畏光畏声", "搏动性"] : ["头痛"]
        } as HeadacheProfile;

    } else if (diseaseType === DiseaseType.EPILEPSY) {
        risk = historyStr.includes("≥1次/月") || historyStr.includes("意识丧失") ? 90 : 50;
        summary = "[华西癫痫中心] 监测到痫性发作特征。若伴有意识丧失，建议立即完善长程视频脑电图 (V-EEG) 及血药浓度检测，排查耐药性癫痫可能。";
        
        extractedProfile = {
            isComplete: true,
            source: 'AI_GENERATED',
            seizureType: historyStr.includes("意识丧失") ? '全面性强直-阵挛发作 (GTCS)' : '局灶性发作',
            frequency: historyStr.includes("≥1次/月") ? '频发 (>1次/月)' : '偶发',
            lastSeizure: '近期',
            triggers: historyStr.includes("漏服") ? ['药物依从性差'] : (historyStr.includes("熬夜") ? ['睡眠剥夺'] : []),
            consciousness: historyStr.includes("意识丧失") || historyStr.includes("呼之不应"),
            lastUpdated: Date.now()
        } as EpilepsyProfile;

    } else if (diseaseType === DiseaseType.COGNITIVE) {
        risk = historyStr.includes("迷路") || historyStr.includes("完全依赖") ? 80 : 40;
        summary = "[华西认知障碍诊疗中心] 存在认知域功能减退指征。ADL 评分显示生活能力受损。需警惕阿尔茨海默病 (AD) 中期风险，建议完善海马 MRI。";
        
        extractedProfile = {
            isComplete: true,
            source: 'AI_GENERATED',
            mmseScoreEstimate: historyStr.includes("迷路") ? '15-20分 (中度)' : '21-26分 (轻度)',
            symptoms: historyStr.includes("性格") ? ['人格改变', '记忆减退'] : ['记忆减退'],
            adlScore: historyStr.includes("完全依赖") ? '重度依赖' : '轻度受损',
            caregiver: historyStr.includes("子女") ? '子女照料' : '未知',
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

// --- New: Cognitive Game Assessment ---
export const generateCognitiveAssessment = async (score: number, accuracy: number, gameType: 'memory' | 'attention'): Promise<{rating: string; advice: string}> => {
    // Mock AI delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    let rating = 'B';
    let advice = '';

    if (gameType === 'memory') {
        if (score > 100) { rating = 'S'; advice = '海马体空间记忆能力极佳，建议维持当前训练强度。'; }
        else if (score > 60) { rating = 'A'; advice = '短期记忆功能正常，可尝试增加干扰项进行进阶训练。'; }
        else { rating = 'C'; advice = '注意广度略显不足，建议从基础图形匹配开始，每日训练 15 分钟。'; }
    } else {
        if (accuracy < 10) { rating = 'S'; advice = '视觉搜索速度惊人，前额叶执行功能表现优异。'; } // accuracy here is actually time in seconds for attention game
        else if (accuracy < 25) { rating = 'A'; advice = '注意力维持良好，反应速度处于同龄人中上水平。'; }
        else { rating = 'C'; advice = '存在注意力分散迹象，建议加强舒尔特方格专注练习。'; }
    }

    return { rating, advice };
};
