
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
  bpSys: number;   
  bpDia: number;   
  spo2: number;    
  isAbnormal: boolean; 
  lastUpdated: number;
}

export interface CognitiveStats {
  totalSessions: number;  
  todaySessions: number;  
  totalDuration: number;  
  lastScore: number;      
  aiRating: string;       
  lastUpdated: number;
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
  lastUpdated: number;
}

export interface EpilepsyProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  seizureType: string; 
  frequency: string;   
  lastSeizure: string; 
  triggers: string[];  
  consciousness: boolean; 
  lastUpdated: number;
}

export interface CognitiveProfile {
  isComplete: boolean;
  source: 'AI_GENERATED';
  mmseScoreEstimate: string; 
  symptoms: string[];        
  adlScore: string;          
  caregiver: string;         
  lastUpdated: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; 
  avatar: string;
  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;
  cognitiveProfile?: CognitiveProfile;
  iotStats?: IoTStats; 
  cognitiveStats?: CognitiveStats; 
}

// 医生助理认证信息
export interface DoctorAssistantProof {
    hospitalName: string;
    employeeId: string;
    certificateUrl: string; // 模拟上传后的URL
    verified: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string; // 支持第三方头像
  authProvider?: AuthProvider; // 登录方式
  
  // [Modified] 核心角色字段
  role: UserRole; // 当前活跃角色
  availableRoles: UserRole[]; // 该账号已开通的所有角色列表

  vipLevel: number; 
  unlockedFeatures: FeatureKey[]; 
  hasHardware: boolean; 
  isElderlyMode: boolean; 
  
  privacySettings: PrivacySettings;

  headacheProfile?: HeadacheProfile;
  epilepsyProfile?: EpilepsyProfile;     
  cognitiveProfile?: CognitiveProfile;   
  
  iotStats?: IoTStats;             
  cognitiveStats?: CognitiveStats; 

  familyMembers?: FamilyMember[];
  currentProfileId?: string; 

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
}

export interface MedLog {
  id: string;
  timestamp: number;
  drugName: string;
  dosage: string;
  painLevel: number; 
  nature: string[]; 
  symptoms: string[]; 
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
