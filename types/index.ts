
export enum UserRole {
  PATIENT = 'PATIENT',           // 患者本人
  FAMILY = 'FAMILY',             // 家属 (看护者)
  DOCTOR_ASSISTANT = 'DOCTOR_ASSISTANT', // 医生助理 (华西协作)
}

export enum AuthProvider {
  PHONE = 'PHONE',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY'
}

// [NEW] 填表人身份 (用于动态文案替换)
export type FillerType = 'SELF' | 'FAMILY';

// [NEW] 登录表单状态接口
export interface LoginFormState {
  phone: string;
  code: string;
}

// [NEW] 第三方登录模拟响应接口
export interface ThirdPartyLoginRes {
  openid: string;
  nickname: string;
  avatar: string;
  provider: AuthProvider;
}

// 细粒度权限定义
export type Permission = 
  | 'VIEW_ALL_DATA'       // 查看所有数据
  | 'EDIT_PRESCRIPTION'   // 修改处方/用药
  | 'MANAGE_FAMILY'       // 管理家庭成员
  | 'GENERATE_QR'         // 生成代管二维码
  | 'VIEW_LIMITED_DATA'   // 查看受限数据 (家属)
  | 'RECEIVE_ALERTS'      // 接收预警
  | 'SYNC_DATA'           // 同步数据 (医助)
  | 'REMOTE_REMINDER'     // [NEW] 远程强制提醒 (安全围栏)
  | 'WRITE_FOLLOW_UP';    // 填写随访 (医助)

export enum DiseaseType {
  MIGRAINE = 'MIGRAINE', 
  EPILEPSY = 'EPILEPSY', 
  COGNITIVE = 'COGNITIVE', 
  UNKNOWN = 'UNKNOWN',
}

export enum RiskLevel {
  LOW = 'LOW', 
  MODERATE = 'MODERATE', 
  HIGH = 'HIGH', 
}

export type FeatureKey = 
  | 'ICE_BREAKING_MIGRAINE'  
  | 'VIP_MIGRAINE'           
  | 'VIP_EPILEPSY'           
  | 'VIP_COGNITIVE';         

export enum SharingScope {
  ONLY_ME = 'ONLY_ME',     
  DOCTOR = 'DOCTOR',       
  FAMILY = 'FAMILY',       
}

export interface PrivacySettings {
  allowCloudStorage: boolean;  
  sharingScope: SharingScope;  
  allowResearchUse: boolean;   
  lastUpdated: number;
}

export interface IoTStats {
  hr: number;      
  hrStandardDeviation: number; // [NEW] 心率变异度 (SDNN/HRV) - 医疗合规字段
  bpSys: number;   
  bpDia: number;   
  spo2: number;    
  isAbnormal: boolean; 
  isFallDetected: boolean; // [NEW] 跌倒检测状态位
  isSoundTriggered?: boolean; // [NEW] 声音识别触发 (持续抽搐声/呼救)
  lastUpdated: number;
}

// [NEW] HaaS 设备信息
export interface DeviceInfo {
  deviceId: string;
  modelName: string;
  batteryLevel: number;
  rentalExpireDate: number;
  status: 'ONLINE' | 'OFFLINE' | 'CHARGING';
}

// [NEW] 认知训练单次记录 (EMPI 归档结构)
export interface CognitiveTrainingRecord {
  id: string;
  timestamp: number;
  gameType: 'memory' | 'attention'; // 训练类型
  score: number;       // 综合得分
  durationSeconds: number; // 训练时长
  accuracy: number;    // 正确率 (0-100)
  difficultyLevel?: number; // 达到的难度等级
  reactionSpeedMs?: number; // 平均反应速度 (毫秒)
  isCompleted?: boolean; 
  status?: 'COMPLETED' | 'INVALID_DURATION'; // [HARD_REQUIREMENT] 强制状态标记
  reactionTimeAvg: number; // 平均反应耗时 (ms)
  errorPattern: string[];  // 错误类型分布 (Tags)
  stabilityIndex: number;  // 稳定性指数 (0-100)
}

export interface CognitiveStats {
  totalSessions: number;  
  todaySessions: number;
  todayDuration: number; 
  totalDuration: number;  
  lastScore: number;      
  aiRating: string;       
  lastUpdated: number;
  dimensionStats: {
      memory: number;      // 记忆力
      attention: number;   // 专注力
      reaction: number;    // 反应速度
      stability: number;   // 稳定性
      flexibility: number; // 灵活性
  };
  trainingHistory?: CognitiveTrainingRecord[];
}

// [NEW] 结构化病历记录 (OCR 提取结果)
export interface MedicalRecord {
  id: string;
  date: string;       // 检查日期
  hospital: string;   // 医院名称
  diagnosis: string;  // 诊断结论
  indicators: {       // 核心指标
    name: string; 
    value: string | number; 
    trend?: 'up' | 'down' | 'flat';
  }[];
  rawImageUrl?: string; // 原始报告图
}

export interface HeadacheProfile {
  isComplete: boolean;
  source: 'USER_INPUT' | 'AI_GENERATED'; 
  onsetAge: number; 
  frequency: string; 
  familyHistory: boolean; 
  medicationHistory: string[]; 
  diagnosisType: string; 
  symptomsTags: string[]; 
  medicalRecords?: MedicalRecord[]; // [NEW] 关联的病历资产
  lastUpdated: number;
}

// [NEW] 癫痫发作事件结构
export interface SeizureEvent {
  id: string;
  timestamp: number;
  type: string; // '强直阵挛' | '失神' | '局灶'
  duration: number; // 秒
  triggers: string[]; // ['漏服药', '疲劳', ...]
  severity?: number; // 1-10
}

// [NEW] 临床级癫痫及高原研究数据模型 (West China Hospital Standard)
export interface EpilepsyResearchData {
    // ... (Reference existing fields, ensuring compatibility)
    demographics: any;
    highAltitudeHistory: any;
    seizureDetails: any;
    // ...
}

export interface MedicationDetail {
    id: string;
    drugName: string;
    startDate: string;
    dosage: {
        am: number;   // 早上剂量 (mg)
        noon: number; // 中午剂量 (mg)
        pm: number;   // 晚上剂量 (mg)
    };
    adverseEvents?: string[]; // 不良反应
    isCurrent: boolean; // 是否当前正在服用
}

// [NEW] 随访状态定义
export type FollowUpStatus = 'LOCKED' | 'PENDING' | 'OPEN' | 'COMPLETED' | 'MISSED' | 'DROPPED_OUT';

// [NEW] 随访节点定义
export interface FollowUpSession {
    visitId: 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
    title: string;
    targetDate: number; // 计划随访日期 (Timestamp)
    windowStart: number; // 窗口期开始
    windowEnd: number; // 窗口期结束
    status: FollowUpStatus;
    completionDate?: number; // 实际完成日期
    data?: any; // 随访表单数据快照
}

// 兼容旧版 Profile 接口，逐步迁移
export interface EpilepsyProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  seizureType: string; 
  frequency: string;   
  lastSeizure: string; 
  triggers: string[];  
  consciousness: boolean; 
  lastUpdated: number;
  seizureHistory?: SeizureEvent[];
  // [NEW] 挂载科研详细数据
  researchData?: EpilepsyResearchData;
  // [NEW] 随访基线日期 (V0 完成日)
  baselineDate?: number;
  // [NEW] 随访日程表
  followUpSchedule?: FollowUpSession[];
}

export interface CognitiveProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  mmseScoreEstimate: string;
  miniMentalScore?: number; // [NEW] MMSE 数字华佗版评分
  symptoms: string[];        
  adlScore: string;          
  caregiver: string;         
  lastUpdated: number;
}

export interface MedLog {
  id: string;
  timestamp: number;
  drugName: string;
  dosage: string;
  painScale?: number; // NRS 1-10
  concomitantSymptoms?: string[]; 
  seizureType?: string; 
  triggerFactors?: string[]; 
  painLevel?: number; 
  nature?: string[]; 
  symptoms?: string[]; 
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; 
  avatar: string;
  isElderly: boolean; 
  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;
  cognitiveProfile?: CognitiveProfile;
  iotStats?: IoTStats; 
  cognitiveStats?: CognitiveStats; 
  medicationLogs?: MedLog[];
}

// [NEW] 熔断审核报告
export interface ReviewReport {
    id: string;
    timestamp: number;
    triggerReason: 'KEYWORD_DETECTED' | 'RESPONSE_TIMEOUT' | 'MANUAL_INTERVENTION';
    riskLevel: 'CRITICAL';
    chatHistorySnapshot: ChatMessage[];
    status: 'PENDING' | 'RESOLVED';
    processorId?: string; // [New]
}

// 医生助理认证信息
export interface DoctorAssistantProof {
    hospitalName: string;
    employeeId: string;
    certificateUrl: string; // 模拟上传后的URL
    verified: boolean;
    reviewLogs?: ReviewReport[]; // [NEW] 关联的审核日志
}

// [NEW] 健康趋势数据点
export interface HealthTrendItem {
  date: string;
  score: number;
  label: string;
}

// [NEW] 量表测评草稿 (持久化中间态)
export interface AssessmentDraft {
    diseaseType: DiseaseType;
    answers: Record<string, any>; // [UPDATED] Relaxed type for complex forms
    currentStep: number;
    lastUpdated: number;
}

// [NEW] 医助处理状态
export interface PatientProcessStatus {
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED';
    processorName?: string;
    lastUpdated: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  idNumber?: string; // [NEW] 身份证号 (For Medical Report Export)
  avatar?: string; // 支持第三方头像
  authProvider?: AuthProvider; // 登录方式
  
  // [Modified] 核心角色字段
  role: UserRole; // 当前活跃角色
  availableRoles: UserRole[]; // 该账号已开通的所有角色列表
  fillerType?: FillerType; // [NEW] 填表人身份：本人或家属代填

  vipLevel: number; 
  unlockedFeatures: FeatureKey[]; 
  hasHardware: boolean;
  deviceInfo?: DeviceInfo; // [NEW] HaaS 硬件信息 
  isElderlyMode: boolean; 
  
  privacySettings: PrivacySettings;

  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;     
  cognitiveProfile?: CognitiveProfile;   
  
  iotStats?: IoTStats;             
  cognitiveStats?: CognitiveStats; 
  
  // [NEW] 用药记录 (用于MOH熔断监测)
  medicationLogs?: MedLog[];
  
  // [NEW] 全局健康趋势 (OCR联动)
  healthTrends?: HealthTrendItem[];

  familyMembers?: FamilyMember[];
  currentProfileId?: string; 

  // [NEW] 临床通知收件箱 (Assistant Push)
  inbox?: ChatMessage[];

  // 角色特定字段
  associatedPatientId?: string; // 家属角色：关联的患者ID
  assistantProof?: DoctorAssistantProof; // 医助角色：认证信息
}

export interface ReferralData {
  hospitalName: string;
  distance: string;
  address: string;
  recommends: string[]; 
  qrCodeValue: string; 
}

export interface ServicePackage {
  id: string;
  featureKey: FeatureKey; 
  title: string;
  price: number;
  originalPrice?: number;
  duration: string;
  features: string[];
  medicalValue: string; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
  timestamp: number;
  suggestedOptions?: string[]; 
  isClinicalPush?: boolean; // [NEW] 标记是否为医助推送
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
  | 'privacy-settings';

// --- [NEW] Config Engine Types ---
export interface FormFieldConfig {
    id: string;
    type: 'text' | 'number' | 'choice' | 'multiselect' | 'date' | 'group' | 'info';
    label: string;
    options?: { label: string; value: any; exclusion?: boolean }[];
    visibleIf?: Record<string, any>; // Simple equality check: { "gender": "FEMALE" }
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        regex?: string;
    };
    suffix?: string; // e.g. "years", "mg"
    children?: FormFieldConfig[]; // For nested groups
    hint?: string;
}

export interface FormSectionConfig {
    id: string;
    title: string;
    description?: string;
    fields: FormFieldConfig[];
}

export interface FormConfig {
    id: string;
    title: string;
    version: string;
    sections: FormSectionConfig[];
}
