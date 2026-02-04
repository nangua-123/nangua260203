
export enum UserRole {
  PATIENT = 'PATIENT',
  FAMILY = 'FAMILY',
}

export enum DiseaseType {
  MIGRAINE = 'MIGRAINE', // 偏头痛
  EPILEPSY = 'EPILEPSY', // 癫痫
  COGNITIVE = 'COGNITIVE', // 认知障碍(AD)
  UNKNOWN = 'UNKNOWN',
}

export enum RiskLevel {
  LOW = 'LOW', // 绿色
  MODERATE = 'MODERATE', // 黄色
  HIGH = 'HIGH', // 红色
}

// 具体权益标识符
export type FeatureKey = 
  | 'ICE_BREAKING_MIGRAINE'  // 1元破冰：偏头痛处方
  | 'VIP_MIGRAINE'           // 偏头痛年卡
  | 'VIP_EPILEPSY'           // 癫痫年卡
  | 'VIP_COGNITIVE';         // 认知障碍年卡

// --- 新增：头痛专病档案 ---
export interface HeadacheProfile {
  isComplete: boolean;
  source: 'USER_INPUT' | 'AI_GENERATED'; // 档案来源
  onsetAge: number; // 首发年龄
  frequency: string; // 发作频率
  familyHistory: boolean; // 家族史
  medicationHistory: string[]; // 用药史
  diagnosisType: string; // 诊断类型 (e.g. 无先兆偏头痛)
  symptomsTags: string[]; // 伴随症状标签 (AI 提取) e.g. ["畏光", "搏动性跳痛"]
  lastUpdated: number;
}

// --- 新增：家庭成员 ---
export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // e.g. "父亲"
  avatar: string;
  headacheProfile?: HeadacheProfile;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  vipLevel: number; // 0: 普通, 1: 会员
  unlockedFeatures: FeatureKey[]; // 已解锁的原子权益列表
  hasHardware: boolean; // 是否绑定了HaaS设备
  
  // 扩展字段
  headacheProfile?: HeadacheProfile;
  familyMembers?: FamilyMember[];
  currentProfileId?: string; // 当前选中的患者ID (自身或家属)
}

// 转诊数据实体
export interface ReferralData {
  hospitalName: string;
  distance: string;
  address: string;
  recommends: string[]; // 建议检查项，如 "3.0T MRI"
  qrCodeValue: string; // 唯一就诊码
}

// 商业化服务包定义
export interface ServicePackage {
  id: string;
  featureKey: FeatureKey; // 对应的权益Key
  title: string;
  price: number;
  originalPrice?: number;
  duration: string;
  features: string[];
  medicalValue: string; // 医疗价值主张
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
  timestamp: number;
  suggestedOptions?: string[]; 
}

// 临床记录实体
export interface MedLog {
  id: string;
  timestamp: number;
  drugName: string;
  dosage: string;
  painLevel: number; // VAS 0-10
  nature: string[]; // 疼痛性质
  symptoms: string[]; // 伴随症状
}

export interface Prescription {
  doctor: string;
  hospital: string;
  validUntil: string;
  preventative: string;
  acute: string;
}

export type AppView = 
  | 'login' | 'home' | 'chat' | 'payment' | 'assessment' | 'report' | 'profile' 
  | 'service-cognitive' | 'service-epilepsy' | 'service-headache' 
  | 'service-family' | 'service-mall' | 'haas-checkout';
