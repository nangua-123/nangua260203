
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
// Range: 0-30. Threshold >= 9 indicates depression risk.
export const calculateEPDS = (answers: Record<string, number>): { score: number; isRisk: boolean } => {
    let score = 0;
    // EPDS has 10 questions, usually keys epds_q1 to epds_q10. Values 0-3.
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
// Formula: MET-minutes/week
// Vigorous = 8.0 METs, Moderate = 4.0 METs, Transport (Cycling/Walking) = 4.0 METs
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
