
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

// --- [NEW] 隐私权限相关定义 ---

export enum SharingScope {
  ONLY_ME = 'ONLY_ME',     // 仅自己可见
  DOCTOR = 'DOCTOR',       // 授权医生可见
  FAMILY = 'FAMILY',       // 家属可见
}

export interface PrivacySettings {
  allowCloudStorage: boolean;  // 医疗数据加密存储权限
  sharingScope: SharingScope;  // 数据分享范围
  allowResearchUse: boolean;   // 允许匿名科研使用 (扩展项)
  lastUpdated: number;
}

// ---------------------------

// --- IoT 设备实时数据 ---
export interface IoTStats {
  hr: number;      // 心率
  bpSys: number;   // 收缩压
  bpDia: number;   // 舒张压
  spo2: number;    // 血氧
  isAbnormal: boolean; // 是否异常
  lastUpdated: number;
}

// --- 认知训练进度 ---
export interface CognitiveStats {
  totalSessions: number;  // 累计训练次数
  todaySessions: number;  // 今日次数
  totalDuration: number;  // 累计时长(秒)
  lastScore: number;      // 最近一次得分
  aiRating: string;       // AI 综合评价 (S/A/B/C)
  lastUpdated: number;
}

// --- 头痛专病档案 ---
export interface HeadacheProfile {
  isComplete: boolean;
  source: 'USER_INPUT' | 'AI_GENERATED'; 
  onsetAge: number; 
  frequency: string; 
  familyHistory: boolean; 
  medicationHistory: string[]; 
  diagnosisType: string; 
  symptomsTags: string[]; 
  lastUpdated: number;
}

// --- 新增：癫痫专病档案 ---
export interface EpilepsyProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  seizureType: string; // 发作类型 (全面性/局灶性)
  frequency: string;   // 发作频率
  lastSeizure: string; // 上次发作时间
  triggers: string[];  // 诱因 (熬夜/漏服药)
  consciousness: boolean; // 是否伴随意识丧失
  lastUpdated: number;
}

// --- 新增：认知障碍专病档案 ---
export interface CognitiveProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  mmseScoreEstimate: string; // MMSE 预估分区间
  symptoms: string[];        // 核心症状 (迷路/遗忘/性格改变)
  adlScore: string;          // 日常生活能力 (ADL) 状态
  caregiver: string;         // 照料者情况
  lastUpdated: number;
}

// --- 新增：家庭成员 ---
export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // e.g. "父亲"
  avatar: string;
  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;
  cognitiveProfile?: CognitiveProfile;
  iotStats?: IoTStats; // 独立设备数据
  cognitiveStats?: CognitiveStats; // 独立训练数据
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  vipLevel: number; // 0: 普通, 1: 会员
  unlockedFeatures: FeatureKey[]; // 已解锁的原子权益列表
  hasHardware: boolean; // 是否绑定了HaaS设备
  isElderlyMode: boolean; // [NEW] 老年模式状态
  
  // [NEW] 隐私设置
  privacySettings: PrivacySettings;

  // 扩展字段
  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;     // 新增
  cognitiveProfile?: CognitiveProfile;   // 新增
  
  iotStats?: IoTStats;             // [IoT]
  cognitiveStats?: CognitiveStats; // [Cognitive]

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
  | 'service-family' | 'service-mall' | 'haas-checkout'
  | 'privacy-settings'; // [NEW] 隐私设置页路由
