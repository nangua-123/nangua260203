
import { DiseaseType } from '../types';

export interface DiseaseConfig {
  /** 界面显示的中文名称 */
  displayName: string;
  /** 关联的专业量表 ID (e.g., MMSE, MIDAS) */
  assessmentScaleId: string;
  /** 发送给 LLM 的系统级提示词 (System Instruction) */
  aiPromptRole: string;
  /** 触发红色紧急预警的风险评分阈值 (0-100) */
  emergencyThreshold: number;
  /** 首页/侧边栏推荐的快捷工具 ID 列表 */
  recommendedTools: string[];
}

/**
 * 全站病种逻辑配置中心 (Single Source of Truth)
 * 任何涉及病种差异化的逻辑（AI人设、量表路由、阈值判断）均应读取此配置
 */
export const DISEASE_CONTEXT_CONFIG: Record<DiseaseType, DiseaseConfig> = {
  [DiseaseType.MIGRAINE]: {
    displayName: '偏头痛',
    assessmentScaleId: 'MIDAS', // [CHECK: Migraine -> MIDAS]
    aiPromptRole: '你是一位华西医院头痛中心专家，擅长诊断偏头痛、丛集性头痛及药物过度使用性头痛。在问诊时，请重点关注疼痛性质（搏动/压迫）、持续时间及是否伴有视觉先兆。',
    emergencyThreshold: 60,
    recommendedTools: ['weather_radar', 'pain_log', 'relax_audio']
  },
  [DiseaseType.EPILEPSY]: {
    displayName: '癫痫',
    assessmentScaleId: 'QOLIE-31',
    aiPromptRole: '你是一位华西癫痫中心专家，专注于发作分类与共患病管理。请以严谨的态度询问发作频率、意识状态及发作后表现。若识别到持续状态风险，需立即给出急救建议。',
    emergencyThreshold: 70, // 癫痫风险阈值较高
    recommendedTools: ['seizure_diary', 'wave_monitor', 'sos_alert']
  },
  [DiseaseType.COGNITIVE]: {
    displayName: '认知障碍/AD',
    assessmentScaleId: 'MMSE', // [CHECK: Cognitive -> MMSE]
    aiPromptRole: '你是一位华西记忆门诊专家，擅长阿尔茨海默病(AD)及轻度认知障碍(MCI)的早期筛查。考虑到患者可能存在理解困难，请务必使用通俗易懂、短促且极具耐心的语言进行交流。',
    emergencyThreshold: 60,
    recommendedTools: ['memory_game', 'schulte_grid', 'family_guard']
  },
  [DiseaseType.UNKNOWN]: {
    displayName: '神经内科通用',
    assessmentScaleId: 'GENERIC',
    aiPromptRole: '你是一位三甲医院神经内科全科医生，负责初诊分流。请通过询问主要症状，将患者引导至头痛、癫痫或认知障碍专科。',
    emergencyThreshold: 50,
    recommendedTools: ['symptom_check']
  }
};
