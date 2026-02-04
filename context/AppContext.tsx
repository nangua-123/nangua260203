
/**
 * @file AppContext.tsx
 * @description 全局状态容器 (Global State Container)
 * @author Neuro-Link Architect
 * 
 * 架构说明:
 * 1. 采用 useReducer + Context 实现轻量级 Redux 模式。
 * 2. 包含数据脱敏 (Masking) 与模拟加密 (AES) 逻辑，保障患者隐私。
 * 3. 支持多 Profile 管理（本人+家庭成员），通过 currentProfileId 切换上下文。
 * 4. 包含自动持久化机制 (localStorage)。
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, UserRole, FeatureKey, DiseaseType, ReferralData, HeadacheProfile, IoTStats, CognitiveStats, FamilyMember } from '../types';

// --- Security Utils (Simulated) ---
// 模拟 GDPR/HIPAA 合规的数据脱敏
const maskName = (name: string) => name ? name[0] + '*'.repeat(name.length - 1) : '';
const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

// 模拟端侧加密，实际场景应使用 WebCrypto API
const encryptData = (data: any) => {
    // console.log("[Security] Data Encrypted with AES-256:", JSON.stringify(data));
    return data; 
};

// --- State Definition ---
interface AppState {
  user: User; // 当前登录用户及家庭组数据
  riskScore: number; // 动态风险评分 (0-100)
  primaryCondition: DiseaseType; // 主诉病种
  lastDiagnosis: { reason: string; referral?: ReferralData } | null; // 最近一次 CDSS 诊断
  isLoading: boolean; // 全局 Loading 状态
}

// --- Initial State ---
const INITIAL_STATE: AppState = {
  user: {
    id: 'user_001',
    name: maskName('陈建国'),
    phone: maskPhone('13900000000'),
    role: UserRole.PATIENT,
    vipLevel: 0,
    unlockedFeatures: [],
    hasHardware: false,
    isElderlyMode: false,
    // 本人健康数据
    iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
    cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 },
    // 家庭成员列表 (Mock Data)
    familyMembers: [
       { 
         id: 'family_001', name: maskName('陈大强'), relation: '父亲', avatar: '👨‍🦳',
         iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
         cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 }
       },
       { 
         id: 'family_002', name: maskName('李淑芬'), relation: '母亲', avatar: '👵',
         iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
         cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 }
       }
    ],
    currentProfileId: 'user_001' // 默认选中本人
  },
  riskScore: 0,
  primaryCondition: DiseaseType.MIGRAINE,
  lastDiagnosis: null,
  isLoading: false,
};

// --- Persistence Key ---
const STORAGE_KEY = 'NEURO_LINK_STATE_V1';

// --- Actions ---
// 定义所有允许的状态变更操作
type Action =
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
  | { type: 'TOGGLE_ELDERLY_MODE' }
  // Family CRUD Actions
  | { type: 'ADD_FAMILY_MEMBER'; payload: { name: string; relation: string; avatar: string } }
  | { type: 'EDIT_FAMILY_MEMBER'; payload: { id: string; updates: Partial<FamilyMember> } }
  | { type: 'REMOVE_FAMILY_MEMBER'; payload: string }
  | { type: 'CLEAR_CACHE' };

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
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
      // 幂等性校验
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
        // 如果 ID 匹配本人
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, headacheProfile: secureProfile } };
        }
        // 否则查找家庭成员并更新
        const updatedFamily = state.user.familyMembers?.map(m => 
            m.id === id ? { ...m, headacheProfile: secureProfile } : m
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

    case 'UPDATE_COGNITIVE_STATS': {
        const { id, stats } = action.payload;
        // 辅助函数：合并统计数据
        const mergeStats = (prev: CognitiveStats | undefined, incoming: Partial<CognitiveStats>): CognitiveStats => {
            const base = prev || { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 };
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

    // --- Family Member Management ---
    case 'ADD_FAMILY_MEMBER': {
        const newId = `family_${Date.now()}`;
        const newMember: FamilyMember = {
            id: newId,
            name: action.payload.name, 
            relation: action.payload.relation,
            avatar: action.payload.avatar,
            // 初始化空数据状态
            iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
            cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 }
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
        
        // 边界处理：如果删除的是当前选中的 Profile，回退到主账号
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

    case 'CLEAR_CACHE':
        localStorage.removeItem(STORAGE_KEY);
        return INITIAL_STATE;
        
    default:
      return state;
  }
};

// --- Initializer for Persistence ---
const initState = (initial: AppState): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to load state from localStorage", e);
    }
    return initial;
};

// --- Context Setup ---
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: INITIAL_STATE,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, initState);

  // 状态变更自动持久化
  useEffect(() => {
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

// --- Custom Hook ---
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
