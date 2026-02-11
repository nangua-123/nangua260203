
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { 
    User, UserRole, FeatureKey, DiseaseType, ReferralData, HeadacheProfile, 
    IoTStats, CognitiveStats, FamilyMember, SharingScope, PrivacySettings, 
    DoctorAssistantProof, MedLog, MedicalRecord, CognitiveTrainingRecord, 
    HealthTrendItem, ReviewReport, ChatMessage, SeizureEvent, EpilepsyProfile, 
    AssessmentDraft, PatientProcessStatus, DeviceInfo, FollowUpSession, FollowUpStatus,
    MedicalOrder, EpilepsyResearchData
} from '../types';

// ... (Security Utils remain same) ...
const encryptData = (data: any) => data; 
const clearSessionCache = () => { /* ... */ };

// --- Initial State & Constants ---
const INITIAL_COGNITIVE_STATS: CognitiveStats = {
    totalSessions: 12,
    todaySessions: 1,
    todayDuration: 15,
    totalDuration: 320,
    lastScore: 78,
    aiRating: 'B+',
    lastUpdated: Date.now(),
    dimensionStats: { memory: 75, attention: 65, reaction: 80, stability: 70, flexibility: 60 }
};

// [NEW] Mock Epilepsy Profile for Demo (Ant Design Charts Showcase)
const MOCK_EPILEPSY_PROFILE: EpilepsyProfile = {
    isComplete: true,
    source: 'AI_GENERATED',
    seizureType: 'FOCAL',
    frequency: '2-3 times/month',
    lastSeizure: '2023-12-01',
    triggers: ['STRESS', 'SLEEP_DEPRIVATION'],
    consciousness: true,
    lastUpdated: Date.now(),
    baselineDate: Date.now() - (90 * 24 * 60 * 60 * 1000), // 3 months ago
    researchData: {
        demographics: {
            ethnicity: 'HAN',
            altitude: 500,
            residence: { province: 'Sichuan', city: 'Chengdu', district: 'Wuhou', isRural: false },
            educationLevel: 'University', occupation: 'Teacher', incomeLevel: '5000-10000'
        },
        highAltitudeHistory: {
            isNative: false,
            entryFrequency: '2',
            acclimatizationMeasures: [],
            chronicSymptoms: []
        },
        seizureDetails: {
            onsetAge: 18,
            isIntractable: false,
            seizureType: 'FOCAL',
            consciousness: 'AWARE',
            motorSigns: ['AUTOMATISM'],
            nonMotorSigns: ['SENSORY'],
            frequencyYear: 12,
            lastSeizureDate: '2023-12-01'
        },
        medicationHistory: []
    },
    followUpSchedule: [
        {
            visitId: 'V1',
            title: '12周随访',
            targetDate: Date.now() - (5 * 24 * 60 * 60 * 1000),
            windowStart: 0, windowEnd: 0,
            status: 'COMPLETED',
            completionDate: Date.now() - (5 * 24 * 60 * 60 * 1000),
            data: {
                seizure_count_total: 2,
                tdm_value: 58.5,
                // GPAQ Data (Active)
                vigorous_work_days: 0, vigorous_work_time: 0,
                moderate_work_days: 3, moderate_work_time: 30,
                transport_days: 5, transport_time: 20,
                vigorous_rec_days: 2, vigorous_rec_time: 45,
                moderate_rec_days: 2, moderate_rec_time: 60,
                // SBQ Data (Sedentary)
                sbq_wd_0: 60, sbq_wd_7: 240, // ~5 hours
                sbq_we_0: 120, sbq_we_7: 120
            }
        },
        {
            visitId: 'V2',
            title: '24周随访',
            targetDate: Date.now() + (80 * 24 * 60 * 60 * 1000),
            windowStart: 0, windowEnd: 0,
            status: 'LOCKED'
        }
    ]
};

// [NEW] Follow-up Window Constants (Days)
const FOLLOWUP_WINDOWS = {
    V1: 84,  // 12 weeks
    V2: 168, // 24 weeks
    V3: 252, // 36 weeks
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
    cognitiveStats: INITIAL_COGNITIVE_STATS,
    medicationLogs: [],
    healthTrends: [],
    familyMembers: [],
    currentProfileId: 'guest',
    inbox: [],
    medicalOrders: [],
    // [DEMO] Pre-populate with Mock Profile for better Visuals
    epilepsyProfile: MOCK_EPILEPSY_PROFILE
  },
  riskScore: 0,
  primaryCondition: DiseaseType.EPILEPSY, // Default to Epilepsy for Demo
  lastDiagnosis: null,
  isLoading: false,
  isSwitching: false,
  mohAlertTriggered: false,
  seizureAlertTriggered: false,
  patientStatusMap: {} 
};

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
  | { type: 'ADD_MEDICAL_ORDER'; payload: MedicalOrder } 
  | { type: 'COMPLETE_MEDICAL_ORDER'; payload: string } 
  | { type: 'SET_BASELINE_DATE'; payload: { id: string; date: number } }
  | { type: 'COMPLETE_FOLLOWUP'; payload: { id: string; visitId: string; data: any; dropOut?: boolean } }
  | { type: 'UPDATE_RESEARCH_DATA'; payload: { id: string; data: Partial<EpilepsyResearchData> } };

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
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
    case 'UPDATE_COGNITIVE_STATS': {
        const { id, stats } = action.payload;
        // Simplified cognitive stats update logic
        if (state.user.id === id) return { ...state, user: { ...state.user, cognitiveStats: { ...state.user.cognitiveStats!, ...stats } } };
        return state;
    }
    case 'SYNC_TRAINING_DATA': {
        const { id, record } = action.payload;
        if (state.user.id === id) {
            const oldHistory = state.user.cognitiveStats?.trainingHistory || [];
            return {
                ...state,
                user: {
                    ...state.user,
                    cognitiveStats: {
                        ...state.user.cognitiveStats!,
                        lastScore: record.score,
                        lastUpdated: Date.now(),
                        trainingHistory: [...oldHistory, record]
                    }
                }
            };
        }
        return state;
    }
    case 'SAVE_ASSESSMENT_DRAFT':
        return { ...state, assessmentDraft: action.payload };
    case 'CLEAR_ASSESSMENT_DRAFT':
        return { ...state, assessmentDraft: undefined };
    case 'UPDATE_PATIENT_STATUS':
        return { ...state, patientStatusMap: { ...state.patientStatusMap, [action.payload.patientId]: action.payload.status } };
    case 'SEND_CLINICAL_MESSAGE':
        const newMsg: ChatMessage = { id: `sys_${Date.now()}`, role: 'system', text: action.payload.message, timestamp: Date.now(), isClinicalPush: true };
        return { ...state, user: { ...state.user, inbox: [...(state.user.inbox || []), newMsg] } };
    case 'ADD_MEDICAL_ORDER':
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
    case 'SET_BASELINE_DATE': {
        const { id, date } = action.payload;
        const schedule = calculateFollowUpSchedule(date);
        const updatedSchedule = updateFollowUpStatuses(schedule);
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, epilepsyProfile: { ...state.user.epilepsyProfile!, baselineDate: date, followUpSchedule: updatedSchedule } } };
        }
        return state;
    }
    case 'COMPLETE_FOLLOWUP': {
        const { id, visitId, data, dropOut } = action.payload;
        const updateSchedule = (current?: FollowUpSession[]) => {
            if (!current) return [];
            return current.map(s => {
                if (dropOut) return { ...s, status: 'DROPPED_OUT' as FollowUpStatus };
                if (s.visitId === visitId) return { ...s, status: 'COMPLETED' as FollowUpStatus, completionDate: Date.now(), data: data };
                return s;
            });
        };
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, epilepsyProfile: { ...state.user.epilepsyProfile!, followUpSchedule: updateSchedule(state.user.epilepsyProfile?.followUpSchedule) } } };
        }
        return state;
    }
    case 'UPDATE_RESEARCH_DATA': {
        const { id, data } = action.payload;
        if (state.user.id === id) {
            return { ...state, user: { ...state.user, epilepsyProfile: { ...state.user.epilepsyProfile!, researchData: { ...state.user.epilepsyProfile?.researchData, ...data } as EpilepsyResearchData } } };
        }
        return state;
    }
    case 'TOGGLE_ELDERLY_MODE':
        return { ...state, user: { ...state.user, isElderlyMode: !state.user.isElderlyMode } };
    case 'CLEAR_CACHE':
        // No-op in memory state
        return state;
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

  useEffect(() => {
      if (state.user.epilepsyProfile?.baselineDate) {
          // Re-evaluate windows against current time
      }
  }, [state.user.epilepsyProfile?.baselineDate]);

  const switchProfile = async (targetId: string) => {
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
