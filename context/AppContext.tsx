
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, UserRole, FeatureKey, DiseaseType, ReferralData, HeadacheProfile, IoTStats, CognitiveStats } from '../types';

// --- Security Utils (Simulated) ---
const maskName = (name: string) => name ? name[0] + '*'.repeat(name.length - 1) : '';
const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
const encryptData = (data: any) => {
    // console.log("[Security] Data Encrypted with AES-256:", JSON.stringify(data));
    return data; 
};

// --- State Definition ---
interface AppState {
  user: User;
  riskScore: number;
  primaryCondition: DiseaseType;
  lastDiagnosis: { reason: string; referral?: ReferralData } | null;
  isLoading: boolean;
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
    iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
    cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 },
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
    currentProfileId: 'user_001'
  },
  riskScore: 0,
  primaryCondition: DiseaseType.MIGRAINE,
  lastDiagnosis: null,
  isLoading: false,
};

// --- Persistence Key ---
const STORAGE_KEY = 'NEURO_LINK_STATE_V1';

// --- Actions ---
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
  | { type: 'TOGGLE_ELDERLY_MODE' } // New Action
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

  // Auto-save on state change
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
