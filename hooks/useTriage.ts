
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTriageAnalysis } from '../services/geminiService';
import { ChatMessage, DiseaseType, ReferralData } from '../types';

export const useTriage = () => {
  const { dispatch } = useApp();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 辅助函数：根据病种生成建议检查项
  const getRecommends = (disease: DiseaseType): string[] => {
    switch (disease) {
      case DiseaseType.MIGRAINE:
        return ['头颅 3.0T MRI 平扫', 'TCD 发泡试验', '前庭功能评估'];
      case DiseaseType.EPILEPSY:
        return ['24小时视频脑电图 (V-EEG)', '血药浓度监测', '头部 MRI 癫痫序列'];
      case DiseaseType.COGNITIVE:
        return ['神经心理量表 (MMSE+MoCA)', '头颅 MRI 海马像', 'Aβ/Tau 蛋白检测'];
      default:
        return ['神经内科常规查体'];
    }
  };

  const performTriage = async (history: ChatMessage[]) => {
    setIsAnalyzing(true);

    try {
      // 1. 调用 Mock AI 服务获取分析结果
      const rawResult = await getTriageAnalysis(history);
      const result = JSON.parse(rawResult);

      // 2. 解析核心指标
      const riskScore = result.risk || 50;
      const diseaseType = (result.disease as DiseaseType) || DiseaseType.UNKNOWN;
      const diagnosisReason = result.summary || '临床症状尚不明确，建议进一步检查。';

      // 3. 更新全局风险分值和病种
      dispatch({
        type: 'SET_RISK_SCORE',
        payload: { score: riskScore, type: diseaseType }
      });

      // 4. 如果风险较高 (>60)，自动生成转诊通行证数据
      let referralData: ReferralData | undefined;
      
      if (riskScore >= 60) {
        referralData = {
          hospitalName: '四川大学华西医院 (本部)',
          distance: '2.3km',
          address: '成都市武侯区国学巷37号',
          recommends: getRecommends(diseaseType),
          qrCodeValue: `HX-${diseaseType.substring(0,3)}-${Date.now().toString().slice(-6)}`
        };
      }

      // 5. 持久化诊断结论
      dispatch({
        type: 'SET_DIAGNOSIS',
        payload: {
          reason: diagnosisReason,
          referral: referralData
        }
      });

      return { success: true, riskScore, diseaseType, referralData };

    } catch (error) {
      console.error('Triage failed:', error);
      return { success: false };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    performTriage
  };
};
