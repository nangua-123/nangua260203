
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, UserRole, FeatureKey, DiseaseType, ReferralData } from '../types';

// --- State Definition ---
interface AppState {
  user: User;
  riskScore: number;
  primaryCondition: DiseaseType;
  lastDiagnosis: { reason: string; referral?: ReferralData } | null; // 新增诊断记录
  isLoading: boolean;
}

// --- Initial State ---
const INITIAL_STATE: AppState = {
  user: {
    id: 'user_001',
    name: '陈建国',
    phone: '13900000000',
    role: UserRole.PATIENT,
    vipLevel: 0,
    unlockedFeatures: [], // 初始无任何权益
    hasHardware: false,
  },
  riskScore: 0, // 0 表示未评估
  primaryCondition: DiseaseType.MIGRAINE,
  lastDiagnosis: null,
  isLoading: false,
};

// --- Actions ---
type Action =
  | { type: 'SET_RISK_SCORE'; payload: { score: number; type: DiseaseType } }
  | { type: 'SET_DIAGNOSIS'; payload: { reason: string; referral?: ReferralData } } // 新增 Action
  | { type: 'UNLOCK_FEATURE'; payload: FeatureKey }
  | { type: 'BIND_HARDWARE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_USER' };

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
      // 避免重复解锁
      if (state.user.unlockedFeatures.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          unlockedFeatures: [...state.user.unlockedFeatures, action.payload],
          // 如果是 VIP 类型的权益，自动提升 VIP 等级
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
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

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
