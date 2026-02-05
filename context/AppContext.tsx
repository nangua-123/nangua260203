
/**
 * @file AppContext.tsx
 * @description 全局状态容器 (Global State Container)
 * @author Neuro-Link Architect
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, UserRole, FeatureKey, DiseaseType, ReferralData, HeadacheProfile, IoTStats, CognitiveStats, FamilyMember, SharingScope, PrivacySettings, DoctorAssistantProof, MedLog, MedicalRecord, CognitiveTrainingRecord } from '../types';

// --- Security Utils (Simulated) ---
const maskName = (name: string) => name ? name[0] + '*'.repeat(name.length - 1) : '';
const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

const encryptData = (data: any) => {
    return data; 
};

// --- State Definition ---
interface AppState {
  isLoggedIn: boolean; // 登录状态
  user: User; // 当前登录用户及家庭组数据
  riskScore: number; 
  primaryCondition: DiseaseType; 
  lastDiagnosis: { reason: string; referral?: ReferralData } | null; 
  isLoading: boolean; 
  mohAlertTriggered: boolean; // [NEW] MOH 熔断预警状态
}

// --- Initial State ---
const INITIAL_STATE: AppState = {
  isLoggedIn: false, 
  user: {
    id: 'guest',
    name: '访客',
    phone: '',
    role: UserRole.PATIENT, // 默认占位
    availableRoles: [], // [NEW] 初始无角色
    vipLevel: 0,
    unlockedFeatures: [],
    hasHardware: false,
    isElderlyMode: false,
    privacySettings: {
        allowCloudStorage: true,
        sharingScope: SharingScope.ONLY_ME, 
        allowResearchUse: false,
        lastUpdated: Date.now()
    },
    iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, isFallDetected: false, isSoundTriggered: false, lastUpdated: 0 },
    cognitiveStats: { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, trainingHistory: [] },
    medicationLogs: [],
    familyMembers: [],
    currentProfileId: 'guest' 
  },
  riskScore: 0,
  primaryCondition: DiseaseType.MIGRAINE,
  lastDiagnosis: null,
  isLoading: false,
  mohAlertTriggered: false
};

// --- Persistence Key ---
const STORAGE_KEY = 'NEURO_LINK_STATE_V3_MULTI_ROLE';

// --- Actions ---
type Action =
  | { type: 'LOGIN'; payload: User } 
  | { type: 'LOGOUT' } 
  | { type: 'ADD_ROLE'; payload: UserRole } 
  | { type: 'SWITCH_ROLE'; payload: UserRole } 
  | { type: 'UPDATE_ASSISTANT_PROOF'; payload: DoctorAssistantProof } 
  | { type: 'ASSOCIATE_PATIENT'; payload: string } 
  | { type: 'SET_RISK_SCORE'; payload: { score: number; type: DiseaseType } }
  | { type: 'SET_DIAGNOSIS'; payload: { reason: string; referral?: ReferralData } }
  | { type: 'UNLOCK_FEATURE'; payload: FeatureKey }
  | { type: 'BIND_HARDWARE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_USER' }
  | { type: 'UPDATE_PROFILE'; payload: { id: string; profile: HeadacheProfile } }
  | { type: 'SWITCH_PATIENT'; payload: string }
  | { type: 'UPDATE_IOT_STATS'; payload: { id: string; stats: IoTStats } }
  | { type: 'UPDATE_COGNITIVE_STATS'; payload: { id: string; stats: Partial<CognitiveStats> } }
  | { type: 'SYNC_TRAINING_DATA'; payload: { id: string; record: CognitiveTrainingRecord } } // [NEW] Train_Data_Sync
  | { type: 'TOGGLE_ELDERLY_MODE' }
  | { type: 'ADD_FAMILY_MEMBER'; payload: { name: string; relation: string; avatar: string; isElderly?: boolean } }
  | { type: 'EDIT_FAMILY_MEMBER'; payload: { id: string; updates: Partial<FamilyMember> } }
  | { type: 'REMOVE_FAMILY_MEMBER'; payload: string }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_PRIVACY_SETTINGS'; payload: Partial<PrivacySettings> }
  | { type: 'LOG_MEDICATION'; payload: MedLog }
  | { type: 'ADD_MEDICAL_RECORD'; payload: { profileId: string; record: MedicalRecord } };

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return {
          ...state,
          isLoggedIn: true,
          user: action.payload,
          riskScore: action.payload.role === UserRole.PATIENT ? 0 : state.riskScore
      };
    case 'LOGOUT':
      localStorage.removeItem(STORAGE_KEY);
      return { ...INITIAL_STATE, isLoggedIn: false };

    // [NEW] 角色管理逻辑
    case 'ADD_ROLE':
        if (state.user.availableRoles.includes(action.payload)) return state;
        return {
            ...state,
            user: {
                ...state.user,
                availableRoles: [...state.user.availableRoles, action.payload],
                role: action.payload // 添加后自动切换到新角色
            }
        };

    case 'SWITCH_ROLE':
        if (!state.user.availableRoles.includes(action.payload)) return state;
        return {
            ...state,
            user: {
                ...state.user,
                role: action.payload,
                // 切换到家属时，重置 currentProfileId
                currentProfileId: action.payload === UserRole.FAMILY ? state.user.id : state.user.currentProfileId
            }
        };

    case 'UPDATE_ASSISTANT_PROOF':
        return {
            ...state,
            user: {
                ...state.user,
                assistantProof: action.payload
            }
        };
      
    case 'ASSOCIATE_PATIENT':
        return {
            ...state,
            user: {
                ...state.user,
                associatedPatientId: action.payload,
                // 模拟关联后，自动添加一个 FamilyMember 表示该患者
                familyMembers: [
                    ...(state.user.familyMembers || []),
                    {
                        id: action.payload,
                        name: '关联患者(陈建国)',
                        relation: '被监护人',
                        avatar: '👴',
                        isElderly: true,
                        iotStats: { hr: 75, bpSys: 120, bpDia: 80, spo2: 98, isAbnormal: false, isFallDetected: false, isSoundTriggered: false, lastUpdated: Date.now() },
                        cognitiveStats: { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, trainingHistory: [] }
                    }
                ]
            }
        };

    case 'SET_RISK_SCORE':
      return {
        ...state,
        riskScore: action.payload.score,
        primaryCondition: action.payload.type,
      };
    case 'SET_DIAGNOSIS':
      return {
        ...state,
        lastDiagnosis: action.payload,
      };
    case 'UNLOCK_FEATURE':
      if (state.user.unlockedFeatures.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          unlockedFeatures: [...state.user.unlockedFeatures, action.payload],
          vipLevel: action.payload.startsWith('VIP') ? 1 : state.user.vipLevel,
        },
      };
    case 'BIND_HARDWARE':
      return {
        ...state,
        user: {
          ...state.user,
          hasHardware: action.payload,
        },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_USER':
      return INITIAL_STATE;
      
    case 'UPDATE_PROFILE': {
        const { id, profile } = action.payload;
        const secureProfile = encryptData(profile);
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, headacheProfile: secureProfile } };
        }
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, headacheProfile: secureProfile } : m
        ) || [];
        return { ...state, user: { ...state.user, familyMembers: updatedFamily } };
    }

    case 'ADD_MEDICAL_RECORD': {
        const { profileId, record } = action.payload;
        const updateProfileWithRecord = (profile: HeadacheProfile | undefined) => {
            const currentProfile = profile || { 
                isComplete: false, source: 'USER_INPUT', onsetAge: 0, frequency: '', 
                familyHistory: false, medicationHistory: [], diagnosisType: '', symptomsTags: [], lastUpdated: Date.now() 
            };
            return {
                ...currentProfile,
                medicalRecords: [...(currentProfile.medicalRecords || []), record],
                lastUpdated: Date.now()
            };
        };

        if (state.user.id === profileId) {
            return {
                ...state,
                user: {
                    ...state.user,
                    headacheProfile: updateProfileWithRecord(state.user.headacheProfile)
                }
            };
        }
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === profileId ? { ...m, headacheProfile: updateProfileWithRecord(m.headacheProfile) } : m
        ) || [];
        return { ...state, user: { ...state.user, familyMembers: updatedFamily } };
    }

    case 'SWITCH_PATIENT':
        return { ...state, user: { ...state.user, currentProfileId: action.payload } };

    case 'UPDATE_IOT_STATS': {
        const { id, stats } = action.payload;
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, iotStats: stats } };
        }
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, iotStats: stats } : m
        ) || [];
        return { ...state, user: { ...state.user, familyMembers: updatedFamily } };
    }

    // [NEW] 训练数据同步至全病程档案
    case 'SYNC_TRAINING_DATA': {
        const { id, record } = action.payload;
        
        const appendRecord = (stats: CognitiveStats | undefined): CognitiveStats => {
            const current = stats || { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, trainingHistory: [] };
            const history = current.trainingHistory || [];
            return {
                ...current,
                lastScore: record.score,
                totalSessions: current.totalSessions + 1,
                todaySessions: current.todaySessions + 1,
                todayDuration: current.todayDuration + Math.ceil(record.durationSeconds / 60),
                totalDuration: current.totalDuration + record.durationSeconds,
                trainingHistory: [...history, record], // Append JSON record
                lastUpdated: Date.now()
            };
        };

        if (state.user.id === id) {
            return { 
                ...state, 
                user: { ...state.user, cognitiveStats: appendRecord(state.user.cognitiveStats) } 
            };
        }
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, cognitiveStats: appendRecord(m.cognitiveStats) } : m
        ) || [];
        return { ...state, user: { ...state.user, familyMembers: updatedFamily } };
    }

    case 'UPDATE_COGNITIVE_STATS': {
        const { id, stats } = action.payload;
        const mergeStats = (prev: CognitiveStats | undefined, incoming: Partial<CognitiveStats>): CognitiveStats => {
            const base = prev || { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, trainingHistory: [] };
            return { ...base, ...incoming, lastUpdated: Date.now() };
        };

        if (state.user.id === id) {
            return { 
                ...state, 
                user: { ...state.user, cognitiveStats: mergeStats(state.user.cognitiveStats, stats) } 
            };
        }
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, cognitiveStats: mergeStats(m.cognitiveStats, stats) } : m
        ) || [];
        return { ...state, user: { ...state.user, familyMembers: updatedFamily } };
    }

    case 'TOGGLE_ELDERLY_MODE':
        return {
            ...state,
            user: {
                ...state.user,
                isElderlyMode: !state.user.isElderlyMode
            }
        };

    case 'ADD_FAMILY_MEMBER': {
        const newId = `family_${Date.now()}`;
        const newMember: FamilyMember = {
            id: newId,
            name: action.payload.name, 
            relation: action.payload.relation,
            avatar: action.payload.avatar,
            isElderly: action.payload.isElderly || false,
            iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, isFallDetected: false, isSoundTriggered: false, lastUpdated: 0 },
            cognitiveStats: { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, trainingHistory: [] }
        };
        return {
            ...state,
            user: {
                ...state.user,
                familyMembers: [...(state.user.familyMembers || []), newMember]
            }
        };
    }

    case 'EDIT_FAMILY_MEMBER': {
        const { id, updates } = action.payload;
        const updatedMembers = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, ...updates } : m
        ) || [];
        return {
            ...state,
            user: { ...state.user, familyMembers: updatedMembers }
        };
    }

    case 'REMOVE_FAMILY_MEMBER': {
        const removeId = action.payload;
        const filteredMembers = state.user.familyMembers?.filter(m => m.id !== removeId) || [];
        let nextProfileId = state.user.currentProfileId;
        if (state.user.currentProfileId === removeId) {
            nextProfileId = state.user.id;
        }

        return {
            ...state,
            user: {
                ...state.user,
                familyMembers: filteredMembers,
                currentProfileId: nextProfileId
            }
        };
    }

    case 'UPDATE_PRIVACY_SETTINGS': {
        return {
            ...state,
            user: {
                ...state.user,
                privacySettings: {
                    ...state.user.privacySettings,
                    ...action.payload,
                    lastUpdated: Date.now()
                }
            }
        };
    }

    case 'LOG_MEDICATION': {
        const newLog = action.payload;
        const currentLogs = state.user.medicationLogs || [];
        const allLogs = [newLog, ...currentLogs];
        
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;
        
        const count24h = allLogs.filter(l => l.timestamp > now - oneDay).length;
        const count7d = allLogs.filter(l => l.timestamp > now - sevenDays).length;
        
        const isMOHTriggered = count24h > 3 || count7d > 10;

        return {
            ...state,
            user: {
                ...state.user,
                medicationLogs: allLogs
            },
            mohAlertTriggered: isMOHTriggered
        };
    }

    case 'CLEAR_CACHE':
        localStorage.removeItem(STORAGE_KEY);
        return INITIAL_STATE;
        
    default:
      return state;
  }
};

const initState = (initial: AppState): AppState => {
    return initial;
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: INITIAL_STATE,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, initState);

  useEffect(() => {
      try {
          if (state.isLoggedIn) {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          }
      } catch (e) {
          console.error("Failed to persist state", e);
      }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
