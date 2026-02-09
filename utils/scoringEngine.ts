
import { ScaleDefinition } from '../config/ScaleDefinitions';

export interface ClinicalResult {
  score: number;
  maxScore: number;
  level: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  interpretation: string;
  reportTitle: string;
  alerts?: string[]; // [NEW] For critical alerts like EPDS >= 9
}

export const calculateScaleScore = (scaleDef: ScaleDefinition, answers: Record<number, number>): ClinicalResult => {
  let totalScore = 0;
  let maxPossibleScore = 0;

  scaleDef.questions.forEach(q => {
    const ans = answers[q.id] || 0;
    if (scaleDef.id === 'MIDAS') {
        if (q.id <= 5) totalScore += ans;
    } else {
        totalScore += ans;
    }
  });

  let level: ClinicalResult['level'] = 'NORMAL';
  let interpretation = "未见明显异常，建议保持健康生活方式。";
  let reportTitle = `${scaleDef.title} 报告`;

  if (scaleDef.id === 'MIDAS') {
      reportTitle = "偏头痛致残性评估报告";
      if (totalScore >= 21) { level = 'SEVERE'; interpretation = "IV级（重度致残）：严重影响生活，建议预防性治疗。"; }
      else if (totalScore >= 11) { level = 'MODERATE'; interpretation = "III级（中度致残）：生活受到明显干扰。"; }
      else if (totalScore >= 6) { level = 'MILD'; interpretation = "II级（轻度致残）：建议记录头痛日记。"; }
      else interpretation = "I级（极少/无致残）：病情控制尚可。";
  } 
  else if (scaleDef.id === 'MMSE') {
      reportTitle = "MMSE 认知功能评估报告";
      if (totalScore < 10) { level = 'SEVERE'; interpretation = "提示重度认知受损。"; }
      else if (totalScore < 15) { level = 'MODERATE'; interpretation = "提示中度认知风险。"; }
  }
  else if (scaleDef.id === 'QOLIE-31') {
      reportTitle = "癫痫生活质量综合报告";
      if (totalScore > 50) { level = 'SEVERE'; interpretation = "生活质量受损严重。"; }
      else if (totalScore > 20) { level = 'MODERATE'; interpretation = "存在一定发作风险。"; }
  }

  return { score: totalScore, maxScore: maxPossibleScore, level, interpretation, reportTitle };
};

// [NEW] EPDS Calculation Engine
export const calculateEPDS = (answers: Record<string, number>): { score: number; isRisk: boolean } => {
    let score = 0;
    for (let i = 1; i <= 10; i++) {
        const key = `epds_q${i}`;
        if (typeof answers[key] === 'number') {
            score += answers[key];
        }
    }
    return {
        score,
        isRisk: score >= 9
    };
};

// [NEW] GPAQ MET Calculation Engine
export const calculateGPAQ = (answers: Record<string, any>): number => {
    const getVal = (k: string) => parseFloat(answers[k] || '0');
    
    // Vigorous Work
    const v_work_days = getVal('vigorous_work_days');
    const v_work_time = getVal('vigorous_work_time'); // minutes
    const met_v_work = v_work_days * v_work_time * 8.0;

    // Moderate Work
    const m_work_days = getVal('moderate_work_days');
    const m_work_time = getVal('moderate_work_time');
    const met_m_work = m_work_days * m_work_time * 4.0;

    // Transport
    const t_days = getVal('transport_days');
    const t_time = getVal('transport_time');
    const met_transport = t_days * t_time * 4.0;

    // Vigorous Recreation
    const v_rec_days = getVal('vigorous_rec_days');
    const v_rec_time = getVal('vigorous_rec_time');
    const met_v_rec = v_rec_days * v_rec_time * 8.0;

    // Moderate Recreation
    const m_rec_days = getVal('moderate_rec_days');
    const m_rec_time = getVal('moderate_rec_time');
    const met_m_rec = m_rec_days * m_rec_time * 4.0;

    return met_v_work + met_m_work + met_transport + met_v_rec + met_m_rec;
};

// [NEW] MMSE Smart Scoring Engine
export const calculateMMSEScore = (answers: Record<string, any>): { score: number; level: string; interpretation: string } => {
    let score = 0;

    // 1. Orientation (10 pts)
    const orientationKeys = [
        'ori_time_year', 'ori_time_season', 'ori_time_month', 'ori_time_date', 'ori_time_day',
        'ori_place_province', 'ori_place_district', 'ori_place_street', 'ori_place_floor', 'ori_place_spot'
    ];
    orientationKeys.forEach(k => { if (answers[k] === 1) score++; });

    // 2. Registration (3 pts)
    ['reg_ball', 'reg_flag', 'reg_tree'].forEach(k => { if (answers[k] === 1) score++; });

    // 3. Attention & Calculation (Serial 7s) - Smart Logic
    // Logic: If input is correct OR input is (previous - 7), give point.
    let currentTarget = 93;
    let previousVal = 100;
    
    for (let i = 1; i <= 5; i++) {
        const val = parseFloat(answers[`calc_${i}`]);
        if (!isNaN(val)) {
            // Check if correct absolute value
            if (val === currentTarget) {
                score++;
            } 
            // Check if correct relative to previous input (Engine Logic: 100-7=92(wrong), 92-7=85(correct relative))
            else if (i > 1) {
                const prevInput = parseFloat(answers[`calc_${i-1}`]);
                if (!isNaN(prevInput) && val === prevInput - 7) {
                    score++;
                }
            }
        }
        previousVal = currentTarget;
        currentTarget -= 7;
    }

    // 4. Recall (3 pts)
    ['recall_ball', 'recall_flag', 'recall_tree'].forEach(k => { if (answers[k] === 1) score++; });

    // 5. Language (9 pts)
    const languageKeys = [
        'lang_name_watch', 'lang_name_pencil', 'lang_repetition',
        'lang_command_take', 'lang_command_fold', 'lang_command_put',
        'lang_read', 'lang_write', 'lang_draw'
    ];
    languageKeys.forEach(k => { if (answers[k] === 1) score++; });

    // 6. Education Correction
    const eduYears = parseFloat(answers['education_years'] || '12');
    if (eduYears <= 12) {
        score = Math.min(30, score + 1);
    }

    // 7. Grading
    let level = 'NORMAL';
    let interpretation = '认知功能正常';
    if (score <= 9) { level = 'SEVERE'; interpretation = '重度认知功能障碍'; }
    else if (score <= 20) { level = 'MODERATE'; interpretation = '中度认知功能障碍'; }
    else if (score <= 26) { level = 'MILD'; interpretation = '轻度认知功能障碍'; }

    return { score, level, interpretation };
};

// [NEW] MoCA Scoring Engine
export const calculateMoCAScore = (answers: Record<string, any>): { score: number; level: string; interpretation: string } => {
    let score = 0;

    // 1. Visuospatial (5 pts)
    if (answers['moca_trail'] === 1) score++;
    if (answers['moca_cube_score'] === 1) score++;
    if (answers['clock_contour'] === 1) score++;
    if (answers['clock_numbers'] === 1) score++;
    if (answers['clock_hands'] === 1) score++;

    // 2. Naming (3 pts)
    if (answers['name_lion'] === 1) score++;
    if (answers['name_rhino'] === 1) score++;
    if (answers['name_camel'] === 1) score++;

    // 3. Attention (6 pts)
    if (answers['digit_fwd'] === 1) score++;
    if (answers['digit_bwd'] === 1) score++;
    if (answers['tap_task'] === 1) score++;

    // Serial 7s (3 pts max)
    let calcCorrect = 0;
    const targets = [93, 86, 79, 72, 65];
    for (let i = 1; i <= 5; i++) {
        if (parseFloat(answers[`calc_${i}`]) === targets[i-1]) calcCorrect++;
    }
    if (calcCorrect >= 4) score += 3;
    else if (calcCorrect >= 2) score += 2;
    else if (calcCorrect === 1) score += 1;

    // 4. Language (2 pts)
    if (answers['rep_1'] === 1) score++;
    if (answers['rep_2'] === 1) score++;

    // 5. Abstraction (2 pts)
    if (answers['abs_1'] === 1) score++;
    if (answers['abs_2'] === 1) score++;

    // 6. Delayed Recall (5 pts)
    const recallKeys = ['recall_face', 'recall_velvet', 'recall_church', 'recall_daisy', 'recall_red'];
    recallKeys.forEach(k => { if (answers[k] === 1) score++; });

    // 7. Orientation (6 pts)
    const oriKeys = ['ori_date', 'ori_month', 'ori_year', 'ori_day', 'ori_place', 'ori_city'];
    oriKeys.forEach(k => { if (answers[k] === 1) score++; });

    // 8. Education Correction
    const eduYears = parseFloat(answers['education_years'] || '13');
    if (eduYears <= 12) {
        score = Math.min(30, score + 1);
    }

    // 9. Grading
    let level = 'NORMAL';
    let interpretation = '认知功能正常';
    if (score < 10) { level = 'SEVERE'; interpretation = '重度认知障碍'; }
    else if (score <= 17) { level = 'MODERATE'; interpretation = '中度认知障碍'; }
    else if (score <= 25) { level = 'MILD'; interpretation = '轻度认知障碍 (MCI)'; }

    return { score, level, interpretation };
};

// [NEW] ADL/IADL Scoring
export const calculateADLScore = (answers: Record<string, any>): { barthelScore: number; lawtonScore: number; interpretation: string } => {
    // Barthel
    const barthelKeys = [
        'adl_feeding', 'adl_bathing', 'adl_grooming', 'adl_dressing', 
        'adl_bowel', 'adl_bladder', 'adl_toilet', 'adl_transfer', 
        'adl_mobility', 'adl_stairs'
    ];
    let barthelScore = 0;
    barthelKeys.forEach(k => { barthelScore += (answers[k] || 0); });

    // Lawton
    const lawtonKeys = [
        'iadl_phone', 'iadl_shopping', 'iadl_food', 'iadl_housework',
        'iadl_laundry', 'iadl_transport', 'iadl_meds', 'iadl_finance'
    ];
    let lawtonScore = 0;
    lawtonKeys.forEach(k => { lawtonScore += (answers[k] || 0); });

    let interpretation = '生活自理能力良好';
    if (barthelScore < 20) interpretation = '生活完全依赖 (需全职护理)';
    else if (barthelScore <= 40) interpretation = '重度依赖 (日常生活大部分需协助)';
    else if (barthelScore <= 60) interpretation = '中度功能障碍 (需协助)';
    else if (barthelScore < 100) interpretation = '轻度依赖';

    return { barthelScore, lawtonScore, interpretation };
};
