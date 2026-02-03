
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
  LOW = 'LOW', // Green
  MODERATE = 'MODERATE', // Yellow
  HIGH = 'HIGH', // Red
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  vipLevel: number; 
  activeServices: ('MIGRAINE_VIP' | 'EPILEPSY_VIP' | 'COGNITIVE_VIP')[]; // Active subscriptions
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
  timestamp: number;
  suggestedOptions?: string[]; 
}

export interface AssessmentResult {
  id: string;
  diseaseType: DiseaseType;
  score: number;
  riskLevel: RiskLevel;
  date: string;
  hospitalRecommendation?: {
    name: string;
    distance: string;
    level: string; 
  };
}

// --- Medical Records Types ---

// Cognitive Training
export interface TrainingRecord {
  id: string;
  gameId: 'memory' | 'attention';
  score: number;
  date: string; // ISO date
  metrics: {
    reactionTime?: number; // ms
    accuracy?: number; // %
  };
}

// Headache Diary (Clinical Standard)
export interface HeadacheLog {
  id: string;
  startTime: string;
  durationHours: number;
  painLevel: number; // VAS 0-10
  nature: string[]; // 性质：跳痛、胀痛等
  triggers: string[];
  medication: string; // 止痛药名称
  medicationEffect: 'effective' | 'partial' | 'ineffective' | 'none';
}

// Epilepsy Care (Clinical Standard)
export interface SeizureLog {
  id: string;
  timestamp: string;
  durationSeconds: number;
  type: 'generalized' | 'focal' | 'unknown'; // 强直阵挛、局灶性等
  symptoms: string[]; // 抽搐、意识丧失、口吐白沫
  postIctal: string[]; // 发作后状态：头痛、嗜睡
}

export interface MedicationTask {
  id: string;
  name: string;
  dosage: string;
  time: string; // "08:00"
  taken: boolean;
  takenTime?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  condition: string;
  lastUpdate: string;
  deviceStatus?: 'offline' | 'online' | 'charging' | 'sos';
  alertSettings?: {
    lowBattery: boolean;
    seizureDetected: boolean;
    deviceOffline: boolean;
  };
}

// Device Status for HaaS
export interface DeviceInfo {
  id: string;
  status: 'unbound' | 'shipping' | 'active';
  battery: number;
  lastSync: string;
  model: string;
  signalStrength?: 'weak' | 'moderate' | 'strong'; 
  syncFrequency?: string; 
  activeAlerts?: string[]; 
  wearingQuality?: number; // 0-100
}

// Added specific health module views
export type AppView = 'login' | 'home' | 'chat' | 'payment' | 'assessment' | 'report' | 'profile' | 'service-cognitive' | 'service-epilepsy' | 'service-headache' | 'service-family';
