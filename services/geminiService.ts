
import { ChatMessage } from "../types";

// MOCK SERVICE
// 模拟华西医院分诊逻辑

interface MockChatSession {
  step: number;
  symptomType: string;
  history: string[];
}

export const createChatSession = (systemInstruction: string): any => {
  return {
    step: 0,
    symptomType: '',
    history: []
  } as MockChatSession;
};

export const sendMessageToAI = async (session: MockChatSession, message: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const msg = message.trim();
  let response = "";

  // 状态机逻辑
  if (msg === "开始分诊" || session.step === 0) {
      session.step = 1;
      response = `您好，我是华西神经内科AI数字助手。
为了给您提供精准的导诊建议，我需要询问几个关键问题。

请问您是为谁咨询？
<OPTIONS>为我自己|为父母|为子女|其他亲友</OPTIONS>`;
  } 
  else {
      switch (session.step) {
          case 1: // 身份确认 -> 问核心症状
              session.step = 2;
              response = `收到。请问${msg === '为我自己' ? '您' : '患者'}目前最主要的困扰或症状是什么？
<OPTIONS>经常头痛|记忆力下降|突然抽搐/晕厥|睡眠障碍|其他</OPTIONS>`;
              break;

          case 2: // 核心症状 -> 问细节
              session.step = 3;
              session.symptomType = msg;
              
              if (msg.includes("头痛")) {
                  response = `请描述头痛的具体位置和性质：
<OPTIONS>单侧跳痛|紧箍感/压迫感|面部/眼眶刺痛|全头剧烈炸痛</OPTIONS>`;
              } else if (msg.includes("记忆") || msg.includes("AD")) {
                  response = `请问记忆力下降的具体表现是？
<OPTIONS>刚发生的事记不住|在熟悉地方迷路|性格突变/多疑|不能胜任日常事务</OPTIONS>`;
              } else if (msg.includes("抽搐") || msg.includes("晕厥")) {
                  response = `发作时的状态是怎样的？
<OPTIONS>意识丧失/呼之不应|意识清楚/肢体麻木|发呆愣神|口吐白沫/抽搐</OPTIONS>`;
              } else if (msg.includes("睡眠")) {
                  response = `具体的睡眠困难表现为？
<OPTIONS>入睡难(>30分)|早醒|多梦/喊叫|白天嗜睡</OPTIONS>`;
              } else {
                  response = `请简要描述具体的不适感觉：
<OPTIONS>疼痛不适|功能障碍|感觉异常|情绪问题</OPTIONS>`;
              }
              break;

          case 3: // 细节 -> 问频率
              session.step = 4;
              response = `这种情况发生的频率如何？
<OPTIONS>偶尔(Rarely)|有时(Sometimes)|经常(Frequently)|每天(Daily)</OPTIONS>`;
              break;

          case 4: // 频率 -> 问病程
              session.step = 5;
              response = `这种情况出现大概多久了？
<OPTIONS>刚出现几天|持续数周|半年以内|超过1年</OPTIONS>`;
              break;

          case 5: // 病程 -> 结束 (CRITICAL STEP)
              session.step = 6;
              // 必须包含 <ACTION>REPORT</ACTION> 才能触发弹窗
              response = `了解了。综合您的描述，系统已生成初步的预检分诊档案。
正在为您匹配相关专家与量表...
<ACTION>REPORT</ACTION>`;
              break;

          default:
              // Fallback finish
              session.step = 6;
              response = `信息已记录。
<ACTION>REPORT</ACTION>`;
              break;
      }
  }

  session.history.push(`User: ${msg}`);
  session.history.push(`AI: ${response}`);
  return response;
};

// 生成模拟报告数据
export const getTriageAnalysis = async (conversationHistory: ChatMessage[]): Promise<string> => {
    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    const historyStr = JSON.stringify(conversationHistory);
    let disease = "UNKNOWN";
    let risk = 30;
    let summary = "建议进行常规神经内科检查。";

    // 简单的关键词匹配逻辑
    if (historyStr.includes("头痛")) {
        disease = "MIGRAINE";
        risk = historyStr.includes("每天") || historyStr.includes("炸痛") ? 85 : 45;
        summary = "患者主诉头痛，症状特征符合血管性头痛/偏头痛表现。建议进行疼痛评估与诱因筛查。";
    } else if (historyStr.includes("记忆") || historyStr.includes("迷路")) {
        disease = "COGNITIVE";
        risk = historyStr.includes("性格突变") ? 75 : 40;
        summary = "存在认知功能下降迹象，需警惕早期阿尔茨海默病(AD)风险，建议进行MMSE/MoCA量表筛查。";
    } else if (historyStr.includes("抽搐") || historyStr.includes("意识丧失")) {
        disease = "EPILEPSY";
        risk = 90;
        summary = "出现意识障碍或抽搐症状，属于神经内科高危预警，建议立即完善脑电图检查排除癫痫。";
    }

    return JSON.stringify({
        risk,
        disease,
        summary
    });
};
