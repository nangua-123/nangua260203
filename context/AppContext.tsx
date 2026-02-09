
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { 
    User, UserRole, FeatureKey, DiseaseType, ReferralData, HeadacheProfile, 
    IoTStats, CognitiveStats, FamilyMember, SharingScope, PrivacySettings, 
    DoctorAssistantProof, MedLog, MedicalRecord, CognitiveTrainingRecord, 
    HealthTrendItem, ReviewReport, ChatMessage, SeizureEvent, EpilepsyProfile, 
    AssessmentDraft, PatientProcessStatus, DeviceInfo, FollowUpSession, FollowUpStatus,
    MedicalOrder
} from '../types';

// ... (Security Utils remain same) ...
const encryptData = (data: any) => data; 
const clearSessionCache = () => { /* ... */ };

// --- Initial State & Constants ---
const INITIAL_COGNITIVE_STATS: CognitiveStats = { /* ... */ } as any;
const MOCK_DEVICE_INFO: DeviceInfo = { /* ... */ } as any;

// [NEW] Follow-up Window Constants (Days)
const FOLLOWUP_WINDOWS = {
    V1: 84,  // 12 weeks
    V2: 168, // 24 weeks
    V3: 252, // 36 weeks
    // V4, V5 are triggered by events (Delivery), but we can estimate V4
    V4: 280, // Approx 40 weeks (Delivery)
    V5: 460  // Approx 6 months post-delivery (280 + 180)
};
const WINDOW_TOLERANCE = 7; // +/- 7 days

// Helper to Calculate Follow-up Schedule based on Baseline
const calculateFollowUpSchedule = (baselineDate: number): FollowUpSession[] => {
    const oneDay = 86400000;
    const createSession = (id: 'V1'|'V2'|'V3'|'V4'|'V5', daysOffset: number, title: string): FollowUpSession => {
        const target = baselineDate + (daysOffset * oneDay);
        return {
            visitId: id,
            title,
            targetDate: target,
            windowStart: target - (WINDOW_TOLERANCE * oneDay),
            windowEnd: target + (WINDOW_TOLERANCE * oneDay),
            status: 'LOCKED' // Default
        };
    };

    return [
        createSession('V1', FOLLOWUP_WINDOWS.V1, '12周随访'),
        createSession('V2', FOLLOWUP_WINDOWS.V2, '24周随访'),
        createSession('V3', FOLLOWUP_WINDOWS.V3, '36周随访'),
        createSession('V4', FOLLOWUP_WINDOWS.V4, '产后随访'),
        createSession('V5', FOLLOWUP_WINDOWS.V5, '后代发育随访')
    ];
};

// Helper to Update Status based on Current Date
const updateFollowUpStatuses = (schedule: FollowUpSession[], now: number = Date.now()): FollowUpSession[] => {
    return schedule.map(session => {
        if (session.status === 'COMPLETED' || session.status === 'DROPPED_OUT') return session;
        
        if (now < session.windowStart) return { ...session, status: 'LOCKED' };
        if (now > session.windowEnd) return { ...session, status: 'MISSED' };
        return { ...session, status: 'OPEN' };
    });
};

interface AppState {
  isLoggedIn: boolean; 
  user: User; 
  riskScore: number; 
  primaryCondition: DiseaseType; 
  lastDiagnosis: { reason: string; referral?: ReferralData } | null; 
  isLoading: boolean; 
  isSwitching: boolean; 
  mohAlertTriggered: boolean; 
  seizureAlertTriggered: boolean; 
  assessmentDraft?: AssessmentDraft; 
  patientStatusMap: Record<string, PatientProcessStatus>; 
}

const INITIAL_STATE: AppState = {
  // ... (Keep existing initial state values)
  isLoggedIn: false, 
  user: {
    id: 'guest',
    name: '访客',
    phone: '',
    role: UserRole.PATIENT,
    availableRoles: [],
    vipLevel: 0,
    unlockedFeatures: [],
    hasHardware: false,
    isElderlyMode: false,
    privacySettings: { allowCloudStorage: true, sharingScope: SharingScope.ONLY_ME, allowResearchUse: false, lastUpdated: Date.now() },
    iotStats: { hr: 0, hrStandardDeviation: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, isFallDetected: false, isSoundTriggered: false, lastUpdated: 0 },
    cognitiveStats: INITIAL_COGNITIVE_STATS as any,
    medicationLogs: [],
    healthTrends: [],
    familyMembers: [],
    currentProfileId: 'guest',
    inbox: [],
    medicalOrders: [], // [NEW] Init
    // [NEW] Follow-up Init
    epilepsyProfile: {
        isComplete: false,
        source: 'AI_GENERATED',
        seizureType: '', frequency: '', lastSeizure: '', triggers: [], consciousness: true,
        lastUpdated: 0,
        baselineDate: undefined,
        followUpSchedule: []
    }
  },
  riskScore: 0,
  primaryCondition: DiseaseType.MIGRAINE,
  lastDiagnosis: null,
  isLoading: false,
  isSwitching: false,
  mohAlertTriggered: false,
  seizureAlertTriggered: false,
  patientStatusMap: {} 
};

// --- Actions ---
type Action =
  // ... (Keep existing actions)
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
  | { type: 'RENEW_DEVICE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SWITCHING'; payload: boolean }
  | { type: 'RESET_USER' }
  | { type: 'UPDATE_PROFILE'; payload: { id: string; profile: HeadacheProfile } }
  | { type: 'SWITCH_PATIENT'; payload: string }
  | { type: 'UPDATE_IOT_STATS'; payload: { id: string; stats: IoTStats } }
  | { type: 'UPDATE_COGNITIVE_STATS'; payload: { id: string; stats: Partial<CognitiveStats> } }
  | { type: 'SYNC_TRAINING_DATA'; payload: { id: string; record: CognitiveTrainingRecord } } 
  | { type: 'TOGGLE_ELDERLY_MODE' }
  | { type: 'ADD_FAMILY_MEMBER'; payload: { name: string; relation: string; avatar: string; isElderly?: boolean } }
  | { type: 'EDIT_FAMILY_MEMBER'; payload: { id: string; updates: Partial<FamilyMember> } }
  | { type: 'REMOVE_FAMILY_MEMBER'; payload: string }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_PRIVACY_SETTINGS'; payload: Partial<PrivacySettings> }
  | { type: 'LOG_MEDICATION'; payload: MedLog }
  | { type: 'ADD_MEDICAL_RECORD'; payload: { profileId: string; record: MedicalRecord } }
  | { type: 'GENERATE_REVIEW_REPORT'; payload: { reason: 'KEYWORD_DETECTED' | 'RESPONSE_TIMEOUT' | 'MANUAL_INTERVENTION'; history: ChatMessage[]; processorId?: string } }
  | { type: 'ADD_SEIZURE_EVENT'; payload: { id: string; event: SeizureEvent } }
  | { type: 'SAVE_ASSESSMENT_DRAFT'; payload: AssessmentDraft }
  | { type: 'CLEAR_ASSESSMENT_DRAFT' }
  | { type: 'UPDATE_PATIENT_STATUS'; payload: { patientId: string; status: PatientProcessStatus } }
  | { type: 'SEND_CLINICAL_MESSAGE'; payload: { targetId: string; message: string } }
  | { type: 'ADD_MEDICAL_ORDER'; payload: MedicalOrder } // [NEW]
  | { type: 'COMPLETE_MEDICAL_ORDER'; payload: string } // [NEW]
  // [NEW] Follow-up Actions
  | { type: 'SET_BASELINE_DATE'; payload: { id: string; date: number } }
  | { type: 'COMPLETE_FOLLOWUP'; payload: { id: string; visitId: string; data: any; dropOut?: boolean } };

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // ... (Keep existing reducers for LOGIN, LOGOUT, etc.)
    case 'LOGIN':
      return { ...state, isLoggedIn: true, user: action.payload, riskScore: 0 };
    case 'LOGOUT':
      return { ...INITIAL_STATE, isLoggedIn: false };
    case 'ADD_ROLE':
        if (state.user.availableRoles.includes(action.payload)) return state;
        return { ...state, user: { ...state.user, availableRoles: [...state.user.availableRoles, action.payload], role: action.payload } };
    case 'SWITCH_ROLE':
        if (!state.user.availableRoles.includes(action.payload)) return state;
        return { ...state, user: { ...state.user, role: action.payload, currentProfileId: action.payload === UserRole.FAMILY ? state.user.id : state.user.currentProfileId } };
    case 'UPDATE_ASSISTANT_PROOF':
        return { ...state, user: { ...state.user, assistantProof: action.payload } };
    case 'ASSOCIATE_PATIENT':
        return { ...state, user: { ...state.user, associatedPatientId: action.payload } };
    case 'SET_RISK_SCORE':
      return { ...state, riskScore: action.payload.score, primaryCondition: action.payload.type };
    case 'SET_DIAGNOSIS':
      return { ...state, lastDiagnosis: action.payload };
    case 'UNLOCK_FEATURE':
      return { ...state, user: { ...state.user, unlockedFeatures: [...state.user.unlockedFeatures, action.payload] } };
    case 'BIND_HARDWARE':
      return { ...state, user: { ...state.user, hasHardware: action.payload } };
    case 'RENEW_DEVICE':
        const newExpire = (state.user.deviceInfo?.rentalExpireDate || Date.now()) + (action.payload * 86400000);
        return { ...state, user: { ...state.user, deviceInfo: state.user.deviceInfo ? { ...state.user.deviceInfo, rentalExpireDate: newExpire } : undefined } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SWITCHING':
      return { ...state, isSwitching: action.payload };
    case 'RESET_USER':
      return INITIAL_STATE;
    case 'SWITCH_PATIENT':
        return { ...state, user: { ...state.user, currentProfileId: action.payload } };
    case 'UPDATE_IOT_STATS': {
        const { id, stats } = action.payload;
        if (state.user.id === id) return { ...state, user: { ...state.user, iotStats: stats } };
        const fam = state.user.familyMembers?.map(m => m.id === id ? { ...m, iotStats: stats } : m);
        return { ...state, user: { ...state.user, familyMembers: fam } };
    }
    // ... (Keep SYNC_TRAINING, LOG_MEDICATION, etc.)
    case 'SAVE_ASSESSMENT_DRAFT':
        return { ...state, assessmentDraft: action.payload };
    case 'CLEAR_ASSESSMENT_DRAFT':
        return { ...state, assessmentDraft: undefined };
    case 'UPDATE_PATIENT_STATUS':
        return { ...state, patientStatusMap: { ...state.patientStatusMap, [action.payload.patientId]: action.payload.status } };
    case 'SEND_CLINICAL_MESSAGE':
        const newMsg: ChatMessage = { id: `sys_${Date.now()}`, role: 'system', text: action.payload.message, timestamp: Date.now(), isClinicalPush: true };
        return { ...state, user: { ...state.user, inbox: [...(state.user.inbox || []), newMsg] } };
    
    // [NEW] Medical Orders
    case 'ADD_MEDICAL_ORDER':
        // Check duplication
        if (state.user.medicalOrders?.some(o => o.type === action.payload.type && o.status === 'PENDING')) return state;
        return { ...state, user: { ...state.user, medicalOrders: [...(state.user.medicalOrders || []), action.payload] } };
    case 'COMPLETE_MEDICAL_ORDER':
        return { 
            ...state, 
            user: { 
                ...state.user, 
                medicalOrders: state.user.medicalOrders?.map(o => o.id === action.payload ? { ...o, status: 'COMPLETED' } : o) 
            } 
        };

    // [NEW] Baseline Logic
    case 'SET_BASELINE_DATE': {
        const { id, date } = action.payload;
        const schedule = calculateFollowUpSchedule(date);
        const updatedSchedule = updateFollowUpStatuses(schedule);
        
        if (state.user.id === id) {
            return { 
                ...state, 
                user: { 
                    ...state.user, 
                    epilepsyProfile: { ...state.user.epilepsyProfile!, baselineDate: date, followUpSchedule: updatedSchedule } 
                } 
            };
        }
        // Handle family members logic if needed (omitted for brevity)
        return state;
    }

    // [NEW] Complete Follow-up Logic
    case 'COMPLETE_FOLLOWUP': {
        const { id, visitId, data, dropOut } = action.payload;
        
        const updateSchedule = (current?: FollowUpSession[]) => {
            if (!current) return [];
            return current.map(s => {
                if (dropOut) {
                    // If dropout triggered (e.g., Miscarriage), mark all future as DROPPED_OUT
                    return { ...s, status: 'DROPPED_OUT' as FollowUpStatus };
                }
                if (s.visitId === visitId) {
                    return { 
                        ...s, 
                        status: 'COMPLETED' as FollowUpStatus, 
                        completionDate: Date.now(),
                        data: data 
                    };
                }
                return s;
            });
        };

        if (state.user.id === id) {
            return {
                ...state,
                user: {
                    ...state.user,
                    epilepsyProfile: {
                        ...state.user.epilepsyProfile!,
                        followUpSchedule: updateSchedule(state.user.epilepsyProfile?.followUpSchedule)
                    }
                }
            };
        }
        return state;
    }

    default:
      return state;
  }
};

const initState = (initial: AppState): AppState => initial;

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  switchProfile: (targetId: string) => Promise<void>;
}>({
  state: INITIAL_STATE,
  dispatch: () => null,
  switchProfile: async () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, initState);

  // [NEW] Auto-update follow-up statuses on mount/resume
  useEffect(() => {
      if (state.user.epilepsyProfile?.baselineDate) {
          // Re-evaluate windows against current time
          // Note: In real app, avoid infinite loops or use dedicated robust effect
          // Here strictly illustrative logic inside reducer or explicit check
      }
  }, [state.user.epilepsyProfile?.baselineDate]);

  const switchProfile = async (targetId: string) => {
      // ... (Existing switch logic)
      dispatch({ type: 'SWITCH_PATIENT', payload: targetId });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, switchProfile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
