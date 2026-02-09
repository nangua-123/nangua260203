
import { ScaleDefinition } from '../config/ScaleDefinitions';

export interface ClinicalResult {
  score: number;
  maxScore: number;
  level: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  interpretation: string;
  reportTitle: string;
}

export const calculateScaleScore = (scaleDef: ScaleDefinition, answers: Record<number, number>): ClinicalResult => {
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 1. Calculate raw score
  scaleDef.questions.forEach(q => {
    // Skip if question is purely informational (weight 0) or VAS logic handled separately in some contexts
    // For simplicity, we sum (answer * weight) if answer is 0/1 (boolean-like) OR just sum value if answer is direct score
    // In our ScaleDefinitions, 'options' have 'value' which is the score. 'number' input value is the score itself.
    // However, for MIDAS, the input IS the score.
    // For consistency with the definition:
    
    const ans = answers[q.id] || 0;
    
    if (scaleDef.id === 'MIDAS') {
        // MIDAS logic: Sum of days (Q1-Q5). Q6 is VAS (not part of disability score usually, but here we can include or separate)
        // Standard MIDAS sums Q1-Q5.
        if (q.id <= 5) {
            totalScore += ans;
        }
    } else {
        // Standard Summation (MMSE, QOLIE)
        totalScore += ans;
    }
  });

  // 2. Determine Level & Interpretation
  let level: ClinicalResult['level'] = 'NORMAL';
  let interpretation = "未见明显异常，建议保持健康生活方式。";
  let reportTitle = `${scaleDef.title} 报告`;

  if (scaleDef.id === 'MIDAS') {
      reportTitle = "偏头痛致残性评估报告";
      if (totalScore >= 21) {
          level = 'SEVERE';
          interpretation = "IV级（重度致残）：头痛严重影响日常生活，建议启动预防性治疗。";
      } else if (totalScore >= 11) {
          level = 'MODERATE';
          interpretation = "III级（中度致残）：生活受到明显干扰，需调整急性期用药。";
      } else if (totalScore >= 6) {
          level = 'MILD';
          interpretation = "II级（轻度致残）：对生活有一定影响，建议记录头痛日记。";
      } else {
          interpretation = "I级（极少/无致残）：病情控制尚可，继续观察。";
      }
  } 
  else if (scaleDef.id === 'MMSE') {
      reportTitle = "MMSE 认知功能评估报告";
      // Simplified Logic: Max ~30. Here our partial subset max is different.
      // Assuming subset max is approx 20 for this demo config.
      if (totalScore < 10) {
          level = 'SEVERE';
          interpretation = "提示重度认知功能受损，建议立即前往记忆门诊复查。";
      } else if (totalScore < 15) {
          level = 'MODERATE';
          interpretation = "提示中度认知风险，需关注日常生活能力(ADL)。";
      } else {
          level = 'NORMAL';
          interpretation = "认知功能基本正常，建议定期进行脑力训练。";
      }
  }
  else if (scaleDef.id === 'QOLIE-31') {
      reportTitle = "癫痫生活质量综合报告";
      if (totalScore > 50) {
          level = 'SEVERE';
          interpretation = "发作频繁，生活质量受损严重，需评估手术或药物调整方案。";
      } else if (totalScore > 20) {
          level = 'MODERATE';
          interpretation = "存在一定发作风险，需加强生活护理与用药依从性。";
      } else {
          interpretation = "病情相对稳定，请坚持规律随访。";
      }
  }

  return {
    score: totalScore,
    maxScore: maxPossibleScore, // Placeholder, can be calculated if strictly needed
    level,
    interpretation,
    reportTitle
  };
};
