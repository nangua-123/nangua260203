
import { ScaleDefinition } from '../config/ScaleDefinitions';
import { DiseaseType, MedLog, SeizureEvent } from '../types';

// ... (Existing Interfaces: ClinicalResult, DiagnosisOutput, CSIResult, GPAQResult, SBQResult) ...
export interface ClinicalResult {
  score: number;
  maxScore: number;
  level: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  interpretation: string;
  reportTitle: string;
  alerts?: string[];
  meta?: any;
}

export interface DiagnosisOutput {
    diagnosis: string;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    cdrScore: number;
    mocaScore: number;
    mmseScore: number;
    adlIndex: string; 
    alerts: string[];
    recommendations: string[];
}

export interface CSIResult {
    score: number;
    trend: 'STABLE' | 'FLUCTUATING' | 'DETERIORATING';
    flags: string[];
}

export interface GPAQResult {
    totalMETs: number; 
    level: 'HIGH' | 'MODERATE' | 'LOW';
    breakdown: {
        workMETs: number;
        transportMETs: number;
        recMETs: number;
    };
}

export interface SBQResult {
    weekdayMinutes: number;
    weekendMinutes: number;
    averageDailyMinutes: number;
    risk: 'SEDENTARY_DANGER' | 'NORMAL';
}

// [NEW] Child Development Analysis Result
export interface ChildDevelopmentResult {
    isRisk: boolean;
    riskSource: 'DDST' | 'HISTORY' | 'BOTH' | 'NONE';
    ddstResult: 'NORMAL' | 'SUSPECT' | 'ABNORMAL' | 'UNKNOWN';
    growthStatus: string;
    alerts: string[];
}

// ... (Existing Helpers: getCDRDomainScore) ...
const getCDRDomainScore = (answers: Record<string, any>, prefix: string): number => {
    let sum = 0;
    let count = 0;
    Object.keys(answers).forEach(k => {
        if (k.startsWith(prefix) && typeof answers[k] === 'number') {
            sum += answers[k];
            count++;
        }
    });
    if (count === 0) return 0;
    const avg = sum / count;
    const steps = [0, 0.5, 1, 2, 3];
    return steps.reduce((prev, curr) => Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev);
};

// ... (Existing: calculateCSI) ...
export const calculateCSI = (
    diseaseType: DiseaseType,
    medLogs: MedLog[] = [],
    seizureHistory: SeizureEvent[] = [],
    currentAssessmentScore: number,
    environmentalFactors?: { returnFrequency?: number }
): CSIResult => {
    let csi = 100;
    const flags: string[] = [];
    const now = Date.now();
    const oneDay = 86400000;
    const last7DaysStart = now - (7 * oneDay);
    const last30DaysStart = now - (30 * oneDay);

    if (diseaseType === DiseaseType.MIGRAINE) {
        const recentMedDays = medLogs.filter(l => l.timestamp >= last7DaysStart).map(l => new Date(l.timestamp).setHours(0,0,0,0)).sort((a, b) => a - b);
        const uniqueDays = Array.from(new Set(recentMedDays));
        let hasConsecutive3 = false;
        if (uniqueDays.length >= 3) {
            for (let i = 0; i < uniqueDays.length - 2; i++) {
                if ((uniqueDays[i+1] - uniqueDays[i] === oneDay) && (uniqueDays[i+2] - uniqueDays[i+1] === oneDay)) { hasConsecutive3 = true; break; }
            }
        }
        if (hasConsecutive3) { csi -= 15; flags.push("HIGH_FLUCTUATION: 连续3日用药"); }
        const recentLogs = medLogs.filter(l => l.timestamp >= last30DaysStart);
        if (recentLogs.length > 0) {
            const avgPain = recentLogs.reduce((acc, curr) => acc + (curr.painScale || 0), 0) / recentLogs.length;
            csi -= (avgPain * 2.5);
        }
        csi -= Math.max(0, (recentLogs.length - 2) * 3);
    } else if (diseaseType === DiseaseType.EPILEPSY) {
        const recentSeizures = seizureHistory.filter(s => s.timestamp >= last30DaysStart);
        if (recentSeizures.length > 0) {
            csi -= (recentSeizures.length * 15); 
            flags.push(`近期发作 ${recentSeizures.length} 次`);
            if (recentSeizures.length >= 2) {
                const sorted = recentSeizures.sort((a,b) => b.timestamp - a.timestamp);
                if (sorted[0].timestamp - sorted[1].timestamp < oneDay) { csi -= 10; flags.push("CLUSTER_RISK: 丛集性发作"); }
            }
        }
        const hasGTCS = recentSeizures.some(s => s.type.includes('强直') || s.type.includes('大发作'));
        if (hasGTCS) { csi -= 10; flags.push("SEVERITY: 强直阵挛"); }
        if (environmentalFactors?.returnFrequency && environmentalFactors.returnFrequency >= 3) { csi -= 5; flags.push("ALTITUDE_RISK: 频繁往返高原"); }
    }
    csi -= (currentAssessmentScore * 0.2); 
    csi = Math.floor(Math.max(0, Math.min(100, csi)));
    let trend: CSIResult['trend'] = 'STABLE';
    if (csi < 60) trend = 'DETERIORATING'; else if (flags.length > 0) trend = 'FLUCTUATING';
    return { score: csi, trend, flags };
};

// ... (Existing: calculateGPAQScore, calculateSBQScore) ...
export const calculateGPAQScore = (answers: Record<string, any>): GPAQResult => {
    const getVal = (key: string) => typeof answers[key] === 'number' ? answers[key] : 0;
    const workVigorousMETs = getVal('vigorous_work_days') * getVal('vigorous_work_time') * 8.0;
    const workModerateMETs = getVal('moderate_work_days') * getVal('moderate_work_time') * 4.0;
    const transportMETs = getVal('transport_days') * getVal('transport_time') * 4.0;
    const recVigorousMETs = getVal('vigorous_rec_days') * getVal('vigorous_rec_time') * 8.0;
    const recModerateMETs = getVal('moderate_rec_days') * getVal('moderate_rec_time') * 4.0;
    const totalMETs = workVigorousMETs + workModerateMETs + transportMETs + recVigorousMETs + recModerateMETs;
    let level: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    const totalVigorousDays = getVal('vigorous_work_days') + getVal('vigorous_rec_days');
    if ((totalVigorousDays >= 3 && totalMETs >= 1500) || totalMETs >= 3000) level = 'HIGH';
    else if (totalMETs >= 600) level = 'MODERATE';
    return { totalMETs: Math.round(totalMETs), level, breakdown: { workMETs: Math.round(workVigorousMETs + workModerateMETs), transportMETs: Math.round(transportMETs), recMETs: Math.round(recVigorousMETs + recModerateMETs) } };
};

export const calculateSBQScore = (answers: Record<string, any>): SBQResult => {
    let wdSum = 0; let weSum = 0;
    for (let i = 0; i < 9; i++) { wdSum += (answers[`sbq_wd_${i}`] || 0); weSum += (answers[`sbq_we_${i}`] || 0); }
    const avgDaily = Math.round(((wdSum * 5) + (weSum * 2)) / 7);
    return { weekdayMinutes: wdSum, weekendMinutes: weSum, averageDailyMinutes: avgDaily, risk: wdSum > 480 ? 'SEDENTARY_DANGER' : 'NORMAL' };
};

// [UPDATED] Logic: Analyze Child Development (V5) with Historical Context (V4)
export const analyzeChildDevelopment = (
    answers: Record<string, any>,
    history?: Record<string, any> // V4 Data (Mother complications, birth weight)
): ChildDevelopmentResult => {
    const ddstResult = (answers['ddst_result'] || 'UNKNOWN') as 'NORMAL' | 'SUSPECT' | 'ABNORMAL' | 'UNKNOWN';
    const alerts: string[] = [];
    let isRisk = false;
    let riskSource: ChildDevelopmentResult['riskSource'] = 'NONE';

    // 1. Current V5 DDST Check
    if (ddstResult === 'ABNORMAL') {
        isRisk = true;
        riskSource = 'DDST';
        alerts.push('DDST 筛查结果异常 (发育迟缓风险)');
        if (answers['ddst_abnormal_desc']) {
            alerts.push(`异常描述: ${answers['ddst_abnormal_desc']}`);
        }
    } else if (ddstResult === 'SUSPECT') {
        isRisk = true;
        riskSource = 'DDST';
        alerts.push('DDST 筛查结果可疑，建议近期复查');
    }

    // 2. Current V5 Growth Check
    const age = answers['child_age_month'] || 6;
    const weight = answers['current_weight'];
    if (weight && age <= 12) {
        if (weight < 6) alerts.push('体重偏低 (营养风险)'); // Rough threshold
    }

    // 3. Historical Risk Factors (V4 Linkage)
    if (history) {
        // A. Birth Weight Check
        const birthWeight = history['birth_weight'];
        if (birthWeight && birthWeight < 2500) {
            isRisk = true;
            riskSource = riskSource === 'DDST' ? 'BOTH' : 'HISTORY';
            alerts.push(`极低出生体重儿 (${birthWeight}g) - 需重点关注神经发育`);
        }

        // B. Maternal Complications Check
        const complications = history['complications'] as string[];
        if (complications && Array.isArray(complications)) {
            const highRisks = complications.filter(c => ['HEMORRHAGE', 'EMBOLISM', 'RUPTURE', 'INFECTION'].includes(c));
            if (highRisks.length > 0) {
                // If there are high risks, we flag it, but it might not mean the child is currently abnormal.
                // However, for CDSS, we add a "History Alert".
                alerts.push(`母体高危妊娠史: ${highRisks.join(', ')}`);
            }
        }
        
        // C. Malformation
        if (history['has_malformation']) {
             isRisk = true;
             riskSource = riskSource === 'DDST' ? 'BOTH' : 'HISTORY';
             alerts.push(`出生缺陷史: ${history['malformation_desc'] || '未描述'}`);
        }
    }

    return {
        isRisk,
        riskSource,
        ddstResult,
        growthStatus: isRisk ? '需医疗干预/密切随访' : '发育指标正常',
        alerts
    };
};

// ... (Existing: calculateTMTBScore, calculateMMSEScore, calculateMoCAScore, etc.) ...
export const calculateTMTBScore = (seconds: number, age: number = 60, educationYears: number = 12): { score: number; rating: string } => {
    let baselineMean = 75; let cutoff = 180;
    if (age < 35) { baselineMean = 45; cutoff = 90; } else if (age < 55) { baselineMean = 60; cutoff = 120; } else if (age < 70) { baselineMean = 75; cutoff = 180; } else { baselineMean = 95; cutoff = 240; }
    let adjustedSeconds = seconds; if (educationYears < 12) { adjustedSeconds = seconds * 0.9; }
    let score = 0; if (adjustedSeconds <= baselineMean) { score = 100 - ((adjustedSeconds / baselineMean) * 15); } else { const range = cutoff - baselineMean; const over = adjustedSeconds - baselineMean; score = 85 - ((over / range) * 45); }
    score = Math.floor(Math.max(0, Math.min(100, score)));
    let rating = 'NORMAL'; if (score < 40) rating = 'IMPAIRED (SEVERE)'; else if (score < 60) rating = 'IMPAIRED (MILD)'; else if (score < 80) rating = 'BORDERLINE';
    return { score, rating };
};

export const calculateMMSEScore = (answers: Record<string, any>): { score: number; breakdown: any } => {
    let score = 0; const breakdown = { orientation: 0, registration: 0, attention: 0, recall: 0, language: 0 };
    ['ori_time_year', 'ori_time_season', 'ori_time_month', 'ori_time_date', 'ori_time_day', 'ori_place_province', 'ori_place_district', 'ori_place_street', 'ori_place_floor', 'ori_place_spot'].forEach(k => { if (answers[k] === 1) { score++; breakdown.orientation++; } });
    ['reg_ball', 'reg_flag', 'reg_tree'].forEach(k => { if (answers[k] === 1) { score++; breakdown.registration++; } });
    const targets = [93, 86, 79, 72, 65]; for (let i = 1; i <= 5; i++) { if (parseFloat(answers[`calc_${i}`]) === targets[i-1]) { score++; breakdown.attention++; } }
    ['recall_ball', 'recall_flag', 'recall_tree'].forEach(k => { if (answers[k] === 1) { score++; breakdown.recall++; } });
    ['lang_name_watch', 'lang_name_pencil', 'lang_repetition', 'lang_read', 'lang_write', 'lang_draw', 'lang_command_take', 'lang_command_fold', 'lang_command_put'].forEach(k => { if (answers[k] === 1) { score++; breakdown.language++; } });
    return { score, breakdown };
};

export const calculateMoCAScore = (answers: Record<string, any>): { score: number; rawScore: number; appliedCorrection: boolean } => {
    let rawScore = 0;
    const sumFields = (keys: string[]) => keys.forEach(k => { if (answers[k] === 1) rawScore++; });
    sumFields(['moca_trail', 'moca_cube', 'clock_contour', 'clock_numbers', 'clock_hands']);
    if (answers['moca_cube_score'] === 1) rawScore++; 
    sumFields(['name_lion', 'name_rhino', 'name_camel', 'moca_naming']); 
    sumFields(['digit_fwd', 'digit_bwd', 'tap_task']);
    let calcCorrect = 0; const targets = [93, 86, 79, 72, 65]; for (let i = 1; i <= 5; i++) { if (parseFloat(answers[`calc_${i}`]) === targets[i-1]) calcCorrect++; }
    if (calcCorrect >= 4) rawScore += 3; else if (calcCorrect >= 2) rawScore += 2; else if (calcCorrect === 1) rawScore += 1;
    sumFields(['rep_1', 'rep_2']); sumFields(['abs_1', 'abs_2']);
    sumFields(['recall_face', 'recall_velvet', 'recall_church', 'recall_daisy', 'recall_red']);
    sumFields(['ori_date', 'ori_month', 'ori_year', 'ori_day', 'ori_place', 'ori_city']);
    const eduYears = parseFloat(answers['years_of_education'] || answers['education_years'] || '13');
    let finalScore = rawScore; let appliedCorrection = false;
    if (eduYears <= 12 && rawScore < 30) { finalScore = Math.min(30, rawScore + 1); appliedCorrection = true; }
    return { score: finalScore, rawScore, appliedCorrection };
};

export const calculateCDRGlobal = (answers: Record<string, any>): { globalScore: number; domainScores: any } => {
    const M = getCDRDomainScore(answers, 'inf_mem_'); const O = getCDRDomainScore(answers, 'inf_ori_'); const J = getCDRDomainScore(answers, 'inf_jud_'); const C = getCDRDomainScore(answers, 'inf_comm_'); const H = getCDRDomainScore(answers, 'inf_home_'); const P = getCDRDomainScore(answers, 'inf_care_');
    const secondaries = [O, J, C, H, P];
    let cdr = M; 
    if (M === 0.5) { const countGreaterOrEq1 = secondaries.filter(s => s >= 1).length; if (countGreaterOrEq1 >= 3) cdr = 1; else cdr = 0.5; }
    else if (M === 0) { const countGreaterOrEq05 = secondaries.filter(s => s >= 0.5).length; if (countGreaterOrEq05 >= 2) cdr = 0.5; else cdr = 0; }
    else { const countEqualM = secondaries.filter(s => s === M).length; const countHigher = secondaries.filter(s => s > M).length; if (countEqualM >= 3 || countHigher >= 3) { cdr = M; } else { const countLower = secondaries.filter(s => s < M).length; if (countLower >= 3) cdr = M; } }
    return { globalScore: cdr, domainScores: { M, O, J, C, H, P } };
};

export const calculateADLScore = (answers: Record<string, any>): { barthel: number; lawton: number; risk: string } => {
    let barthel = 0; ['adl_feeding', 'adl_bathing', 'adl_grooming', 'adl_dressing', 'adl_bowel', 'adl_bladder', 'adl_toilet', 'adl_transfer', 'adl_mobility', 'adl_stairs'].forEach(k => { barthel += (answers[k] || 0); });
    let lawton = 0; ['iadl_phone', 'iadl_shopping', 'iadl_food', 'iadl_housework', 'iadl_laundry', 'iadl_transport', 'iadl_meds', 'iadl_finance'].forEach(k => { lawton += (answers[k] || 0); });
    let risk = "INDEPENDENT"; if (barthel < 40) risk = "SEVERE_DEPENDENCY"; else if (barthel < 60 || lawton < 5) risk = "MODERATE_DEPENDENCY"; else if (barthel < 100) risk = "MILD_DEPENDENCY";
    return { barthel, lawton, risk };
};

export const calculateCognitiveDiagnosis = (mmseRaw: number, mocaRaw: number, cdrGlobal: number, barthel: number): DiagnosisOutput => {
    const alerts: string[] = []; const recommendations: string[] = [];
    if (barthel < 60) { alerts.push("⚠️ 护理风险警报：中度功能依赖 (MODERATE_DEPENDENCY)"); recommendations.push("需家属 24 小时监护"); }
    let diagnosis = "认知功能评估完成"; let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    if (mocaRaw < 10 || cdrGlobal >= 2) { diagnosis = "重度认知受损 (Severe Dementia)"; riskLevel = "HIGH"; alerts.push("符合重度痴呆临床指征"); recommendations.push("建议立即前往神经内科记忆门诊就医"); } 
    else if (mocaRaw >= 18 && mocaRaw <= 25) { diagnosis = "轻度认知障碍 (MCI)"; riskLevel = "MODERATE"; recommendations.push("建议每 6 个月随访一次"); } 
    else if (mocaRaw >= 26 && mmseRaw >= 27) { diagnosis = "认知功能正常 (Normal)"; riskLevel = "LOW"; recommendations.push("保持健康生活方式，定期自测"); } 
    else { diagnosis = "中度认知受损 (Moderate)"; riskLevel = "HIGH"; recommendations.push("建议完善头颅 MRI 及血液生化检查"); }
    return { diagnosis, riskLevel, cdrScore: cdrGlobal, mocaScore: mocaRaw, mmseScore: mmseRaw, adlIndex: barthel < 60 ? "DEPENDENT" : "INDEPENDENT", alerts, recommendations };
};

export const calculateScaleScore = (scaleDef: ScaleDefinition, answers: Record<number, number>): ClinicalResult => {
  let totalScore = 0; scaleDef.questions.forEach(q => { totalScore += (answers[q.id] || 0); });
  let level: ClinicalResult['level'] = 'NORMAL'; let interpretation = "未见明显异常。"; let reportTitle = `${scaleDef.title} 报告`;
  if (scaleDef.id === 'MIDAS') { if (totalScore >= 21) { level = 'SEVERE'; interpretation = "IV级（重度致残）"; } else if (totalScore >= 11) { level = 'MODERATE'; interpretation = "III级（中度致残）"; } else if (totalScore >= 6) { level = 'MILD'; interpretation = "II级（轻度致残）"; } } 
  else if (scaleDef.id === 'QOLIE-31') { if (totalScore > 50) { level = 'SEVERE'; interpretation = "生活质量严重受损"; } }
  return { score: totalScore, maxScore: 100, level, interpretation, reportTitle };
};

export const calculateEPDS = (answers: Record<string, number>): { score: number; isRisk: boolean } => {
    let score = 0; for (let i = 1; i <= 10; i++) { if (typeof answers[`epds_q${i}`] === 'number') score += answers[`epds_q${i}`]; }
    return { score, isRisk: score >= 9 };
};
