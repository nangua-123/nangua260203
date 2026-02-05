
/**
 * @file usePayment.ts
 * @description 商业化核心逻辑 Hook
 * @author Neuro-Link Architect
 * 
 * 职责:
 * 1. 定义 SKU (服务包) 与 Pricing (价格体系)。
 * 2. 优惠券 (Coupon) 核销逻辑。
 * 3. 硬件租赁 (HaaS) 复杂计费逻辑。
 * 4. 模拟支付网关 (Mock Gateway) - [UPDATED] 移除随机故障，确保演示流畅性。
 */

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServicePackage, FeatureKey, DiseaseType } from '../types';

// --- Commercial Configuration (商业化配置) ---

// 标准服务包定义
export const PACKAGES: Record<string, ServicePackage> = {
  ICE_BREAKING_MIGRAINE: {
    id: 'pkg_ice_migraine',
    featureKey: 'ICE_BREAKING_MIGRAINE',
    title: 'MIDAS 深度评估与建档',
    price: 1, // 破冰价
    duration: '永久',
    features: ['解锁数字处方看板', '生成近7日发作趋势', '建立华西专病档案'],
    medicalValue: '依据国际标准建立基线数据'
  },
  VIP_MIGRAINE: {
    id: 'pkg_vip_migraine',
    featureKey: 'VIP_MIGRAINE',
    title: '偏头痛管理年包',
    price: 299,
    originalPrice: 599,
    duration: '年',
    features: ['AI 诱因全维雷达', '华西专家影像复核', '用药方案优化报告', '全年无限次AI问诊'],
    medicalValue: '精准识别诱因，减少发作频率'
  },
  VIP_EPILEPSY: {
    id: 'pkg_vip_epilepsy',
    featureKey: 'VIP_EPILEPSY',
    title: '癫痫生命守护年包',
    price: 599,
    originalPrice: 1200,
    duration: '年',
    features: ['7x24h 发作预警', '亲情账号同步', '异常脑电专家解读', '硬件租赁免押金'],
    medicalValue: '降低意外风险，提升生活质量'
  },
  VIP_COGNITIVE: {
    id: 'pkg_vip_cognitive',
    featureKey: 'VIP_COGNITIVE',
    title: '认知康复会员',
    price: 365,
    duration: '年',
    features: ['每日定制训练处方', '季度专家远程随访', '月度脑健康报告', 'AD8 风险动态评估'],
    medicalValue: '延缓认知衰退，建立长期健康档案'
  }
};

// 优惠券定义
export interface Coupon {
  id: string;
  code: string;
  name: string;
  value: number;
  minSpend: number;
  type: 'general' | 'rental';
}

export const AVAILABLE_COUPONS: Coupon[] = [
  { id: 'cp_new_user', code: 'NEW20', name: '新人首单立减', value: 20, minSpend: 100, type: 'general' },
  { id: 'cp_rental_bundle', code: 'RENT50', name: '套餐组合折扣', value: 50, minSpend: 500, type: 'rental' }
];

// 租赁价格阶梯
export const RENTAL_PLANS = [
  { id: '7d', days: 7, price: 199, label: '7天体验装' },
  { id: '30d', days: 30, price: 599, label: '30天月租 (推荐)' },
  { id: '90d', days: 90, price: 1499, label: '90天季卡 (超值)' }
];

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export const usePayment = () => {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState<PaymentStatus>('idle');

  /**
   * 检查是否已拥有某项权益 (Feature Gating)
   */
  const hasFeature = (key: FeatureKey): boolean => {
    return state.user.unlockedFeatures.includes(key);
  };

  /**
   * 个性化推荐算法 (Recommendation Engine)
   * 基于用户的风险评分和主诉病种，动态推荐最适合的 SKU。
   */
  const getRecommendedPackage = (): ServicePackage => {
    const { riskScore, primaryCondition } = state;
    
    // 1. 高风险癫痫 -> 癫痫年包
    if (primaryCondition === DiseaseType.EPILEPSY && riskScore > 60) {
        return PACKAGES.VIP_EPILEPSY;
    }
    // 2. 高风险头痛 -> 头痛年包
    if (primaryCondition === DiseaseType.MIGRAINE && riskScore > 60) {
        return PACKAGES.VIP_MIGRAINE;
    }
    // 3. 认知障碍 -> 认知包
    if (primaryCondition === DiseaseType.COGNITIVE) {
        return PACKAGES.VIP_COGNITIVE;
    }
    // 4. 默认/低风险 -> 1元破冰
    return PACKAGES.ICE_BREAKING_MIGRAINE;
  };

  /**
   * 计算硬件租赁费用
   * 处理押金(VIP免押)、优惠券抵扣、套餐基础价。
   */
  const calculateRentalPrice = (planId: string, applyCouponId?: string) => {
    const plan = RENTAL_PLANS.find(p => p.id === planId) || RENTAL_PLANS[1];
    const deposit = state.user.vipLevel > 0 ? 0 : 500; // 核心商业规则：VIP 免押金
    
    let discount = 0;
    if (applyCouponId) {
        const coupon = AVAILABLE_COUPONS.find(c => c.id === applyCouponId);
        if (coupon && plan.price >= coupon.minSpend) {
            discount = coupon.value;
        }
    }

    return {
        basePrice: plan.price,
        deposit,
        discount,
        total: plan.price + deposit - discount,
        plan
    };
  };

  /**
   * 处理支付核心逻辑 (Mock Gateway)
   * [UPDATED] 移除随机故障逻辑，确保演示 100% 成功
   * 
   * @param featureKey 待解锁的权益 Key
   * @param onSuccess 成功回调
   * @param onError 失败回调
   */
  const handlePay = async (featureKey: FeatureKey, onSuccess?: () => void, onError?: (msg: string) => void) => {
    // 幂等校验
    if (hasFeature(featureKey)) {
      if (onSuccess) onSuccess();
      return;
    }

    setStatus('processing');

    try {
      // 1. 模拟网络延迟 (缩短至 1s 提升体验)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 2. [DEMO MODE] 移除故障注入，强制成功
      // const isFailure = Math.random() < 0.2; ... (Removed)

      // 3. 支付成功，下发权益 (License Provisioning)
      dispatch({ type: 'UNLOCK_FEATURE', payload: featureKey });
      setStatus('success');
      
      // 执行后续 UI 逻辑 (如关闭弹窗)
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }

      // 自动重置状态
      setTimeout(() => setStatus('idle'), 2000);

    } catch (error: any) {
      console.error('Payment failed', error);
      setStatus('error');
      
      // 触发错误回调，供 UI 层展示 Toast 或 Error Page
      if (onError) onError(error.message || "未知支付错误");
    }
  };

  return {
    status,
    setStatus,
    hasFeature,
    handlePay,
    getRecommendedPackage,
    calculateRentalPrice,
    PACKAGES,
    RENTAL_PLANS,
    AVAILABLE_COUPONS
  };
};
