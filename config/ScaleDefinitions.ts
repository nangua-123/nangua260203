
export type QuestionType = 'choice' | 'number' | 'slider' | 'calculation' | 'naming';

export interface ScaleQuestion {
  id: number;
  text: string;
  type: QuestionType;
  options?: { label: string; value: number }[];
  min?: number;
  max?: number;
  suffix?: string;
  imageUrl?: string; // For 'naming' type
  weight: number;
  hint?: string; // For elderly or cognitive assist
}

export interface ScaleDefinition {
  id: string;
  title: string;
  description: string;
  questions: ScaleQuestion[];
}

export const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  'MIDAS': {
    id: 'MIDAS',
    title: '偏头痛致残评估 (WCH-MIDAS)',
    description: '请回顾过去 3 个月的情况，评估头痛对您生活的影响。',
    questions: [
      { id: 1, text: "过去3个月，有多少天您因头痛【完全无法】工作、上学或做家务？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 2, text: "过去3个月，有多少天您的工作或学习效率【降低了一半以上】？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 3, text: "过去3个月，有多少天您【没有】进行家务劳动？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 4, text: "过去3个月，有多少天您做家务的效率【降低了一半以上】？", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 5, text: "过去3个月，您共有多少天出现过头痛？(临床发作频率)", type: 'number', max: 90, suffix: "天", weight: 1 },
      { id: 6, text: "您通常头痛时的疼痛程度是多少？(VAS 0-10)", type: 'slider', min: 0, max: 10, weight: 0 } // Weight 0 means excluded from total score sum logic usually, handled separately
    ]
  },
  'QOLIE-31': {
    id: 'QOLIE-31',
    title: '癫痫发作与生活质量筛查',
    description: '请根据最近一次发作或近1个月情况如实评估。',
    questions: [
      { id: 1, text: "过去4周内，您出现过几次伴有意识丧失的发作？", type: 'choice', options: [{label: "0次", value: 0}, {label: "1次", value: 20}, {label: "2-3次", value: 40}, {label: "4次及以上", value: 60}], weight: 1 },
      { id: 2, text: "发作后，您通常需要多长时间恢复清醒？", type: 'choice', options: [{label: "<5分钟", value: 5}, {label: "5-30分钟", value: 15}, {label: ">30分钟", value: 30}], weight: 1 },
      { id: 3, text: "您是否担心因发作而受伤或发生意外？", type: 'choice', options: [{label: "从不", value: 0}, {label: "偶尔", value: 10}, {label: "经常/总是", value: 30}], weight: 1 },
      { id: 4, text: "发作是否影响了您的工作或社交活动？", type: 'choice', options: [{label: "无影响", value: 0}, {label: "轻微影响", value: 10}, {label: "严重影响", value: 40}], weight: 1 }
    ]
  },
  'MMSE': {
    id: 'MMSE',
    title: 'MMSE 认知功能简易评估',
    description: '本测试旨在评估定向力、记忆力及计算力，请在安静环境下进行。',
    questions: [
      { id: 1, text: "【定向力】今年的年份是？", type: 'choice', options: [{label: "2024年 (正确)", value: 1}, {label: "2023年", value: 0}, {label: "2025年", value: 0}, {label: "不知道", value: 0}], weight: 5 },
      { id: 2, text: "【计算力】请计算：100 减 7 等于多少？", type: 'calculation', options: [{label: "93 (正确)", value: 1}, {label: "90", value: 0}, {label: "92", value: 0}, {label: "不知道", value: 0}], weight: 5, hint: "请心算，不可使用计算器" },
      { id: 3, text: "【计算力】再减 7 等于多少？(93-7)", type: 'calculation', options: [{label: "86 (正确)", value: 1}, {label: "85", value: 0}, {label: "84", value: 0}, {label: "不知道", value: 0}], weight: 5 },
      { id: 4, text: "【记忆力】请记住这三个词：皮球、国旗、树木。一分钟后我会问您。", type: 'choice', options: [{label: "记住了", value: 0}], weight: 0, hint: "此题不计分，仅作记忆编码" },
      { id: 5, text: "【回忆】刚才让您记住的第三个词是什么？", type: 'choice', options: [{label: "树木 (正确)", value: 3}, {label: "皮球", value: 0}, {label: "国旗", value: 0}, {label: "忘记了", value: 0}], weight: 3 },
      { id: 6, text: "【命名】请辨认图片中的物品名称", type: 'naming', imageUrl: 'https://img.icons8.com/color/96/wrist-watch.png', options: [{label: "手表 (正确)", value: 1}, {label: "指南针", value: 0}, {label: "手镯", value: 0}], weight: 1 }
    ]
  },
  'GENERIC': {
    id: 'GENERIC',
    title: '神经内科通用问卷',
    description: '基础症状筛查',
    questions: [
      { id: 1, text: "您感到不适的主要部位是？", type: 'choice', options: [{label: "头部", value: 1}, {label: "肢体", value: 1}, {label: "全身", value: 1}], weight: 1 },
      { id: 2, text: "症状持续时间？", type: 'choice', options: [{label: "<1周", value: 1}, {label: "1-3个月", value: 2}, {label: ">3个月", value: 3}], weight: 1 }
    ]
  }
};
