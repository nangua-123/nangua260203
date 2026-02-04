
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServicePackage, FeatureKey } from '../types';

// 定义标准服务包
export const PACKAGES: Record<string, ServicePackage> = {
  ICE_BREAKING_MIGRAINE: {
    id: 'pkg_ice_migraine',
    featureKey: 'ICE_BREAKING_MIGRAINE',
    title: 'MIDAS 深度评估与建档',
    price: 1,
    duration: '永久',
    features: ['解锁数字处方看板', '生成近7日发作趋势', '建立华西专病档案'],
    medicalValue: '依据国际标准建立基线数据'
  },
  VIP_MIGRAINE: {
    id: 'pkg_vip_migraine',
    featureKey: 'VIP_MIGRAINE',
    title: '偏头痛管理会员',
    price: 299,
    originalPrice: 599,
    duration: '年',
    features: ['AI 诱因全维雷达', '华西专家影像复核', '用药方案优化报告'],
    medicalValue: '精准识别诱因，减少发作频率'
  },
  VIP_EPILEPSY: {
    id: 'pkg_vip_epilepsy',
    featureKey: 'VIP_EPILEPSY',
    title: '癫痫生命守护会员',
    price: 599,
    duration: '年',
    features: ['7x24h 发作预警', '亲情账号同步', '异常脑电专家解读'],
    medicalValue: '降低意外风险，提升生活质量'
  },
  VIP_COGNITIVE: {
    id: 'pkg_vip_cognitive',
    featureKey: 'VIP_COGNITIVE',
    title: '认知康复会员',
    price: 365,
    duration: '年',
    features: ['每日定制训练处方', '季度专家远程随访', '月度脑健康报告'],
    medicalValue: '延缓认知衰退，建立长期健康档案'
  }
};

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export const usePayment = () => {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState<PaymentStatus>('idle');

  /**
   * 检查是否已拥有某项权益
   */
  const hasFeature = (key: FeatureKey): boolean => {
    return state.user.unlockedFeatures.includes(key);
  };

  /**
   * 处理支付核心逻辑
   * @param featureKey 目标权益Key
   * @param onSuccess 成功回调
   */
  const handlePay = async (featureKey: FeatureKey, onSuccess?: () => void) => {
    if (hasFeature(featureKey)) {
      if (onSuccess) onSuccess();
      return;
    }

    setStatus('processing');

    try {
      // 模拟支付网关交互 (1.5秒延迟)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 支付成功，下发权益
      dispatch({ type: 'UNLOCK_FEATURE', payload: featureKey });
      setStatus('success');
      
      // 执行后续 UI 逻辑 (如关闭弹窗)
      if (onSuccess) {
        setTimeout(onSuccess, 800);
      }

      // 重置状态
      setTimeout(() => setStatus('idle'), 2500);

    } catch (error) {
      console.error('Payment failed', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return {
    status,
    hasFeature,
    handlePay,
    PACKAGES
  };
};
