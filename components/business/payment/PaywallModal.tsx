
import React, { useState, useEffect } from 'react';
import { ServicePackage } from '../../../types';
import Button from '../../Button';
import { usePayment, AVAILABLE_COUPONS } from '../../../hooks/usePayment';

interface PaywallModalProps {
  visible: boolean;
  pkg: ServicePackage;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, pkg, onClose, onSuccess }) => {
  const { handlePay } = usePayment();
  const [step, setStep] = useState<'info' | 'paying' | 'success'>('info');
  const [selectedCouponId, setSelectedCouponId] = useState<string | undefined>(undefined);

  // 当弹窗重新打开时，重置状态
  useEffect(() => {
    if (visible) {
        setStep('info');
        setSelectedCouponId(undefined);
    }
  }, [visible]);

  if (!visible) return null;

  const performPayment = async () => {
    setStep('paying');
    
    // 调用 Hook 中的支付逻辑
    await handlePay(pkg.featureKey, () => {
        setStep('success');
        // 成功动画展示 2秒后 关闭
        setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
        }, 2000);
    });
  };

  const isVipMigraine = pkg.featureKey === 'VIP_MIGRAINE';

  // 计算折扣后价格
  let finalPrice = pkg.price;
  let discountAmount = 0;
  
  if (selectedCouponId) {
      const coupon = AVAILABLE_COUPONS.find(c => c.id === selectedCouponId);
      if (coupon && pkg.price >= coupon.minSpend) {
          discountAmount = coupon.value;
          finalPrice = Math.max(0, pkg.price - discountAmount);
      }
  }

  // 获取可用优惠券
  const usableCoupons = AVAILABLE_COUPONS.filter(c => c.type === 'general' && pkg.price >= c.minSpend);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center max-w-[430px] mx-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={step !== 'paying' && step !== 'success' ? onClose : undefined}
      ></div>

      {/* Modal Card */}
      <div className="bg-white w-full rounded-t-[40px] p-8 relative z-10 animate-slide-up shadow-2xl min-h-[400px]">
        {step === 'info' && (
            <>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{pkg.title}</h3>
                        <p className="text-[11px] text-brand-600 font-black mt-1.5 uppercase tracking-widest">{pkg.medicalValue}</p>
                    </div>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-300 active:scale-90 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                {isVipMigraine ? (
                   // 对比表格视图 (针对 VIP_MIGRAINE 的高转化设计)
                   <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                       <h4 className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest mb-3">权益对比</h4>
                       <div className="grid grid-cols-3 gap-2 text-[11px] mb-2 border-b border-slate-200 pb-2">
                           <div className="text-slate-400 font-bold">功能点</div>
                           <div className="text-center text-slate-400 font-bold">免费版</div>
                           <div className="text-center font-black bg-brand-100 text-brand-700 rounded py-0.5">VIP 会员</div>
                       </div>
                       <div className="space-y-3">
                           <div className="grid grid-cols-3 gap-2 items-center text-[10px]">
                               <div className="font-bold text-slate-700">气压预警</div>
                               <div className="text-center text-slate-400">公开天气数据</div>
                               <div className="text-center font-black bg-brand-100 text-brand-700 rounded py-0.5">微环境实测</div>
                           </div>
                           <div className="grid grid-cols-3 gap-2 items-center text-[10px]">
                               <div className="font-bold text-slate-700">生理周期</div>
                               <div className="text-center text-slate-400">无</div>
                               <div className="text-center font-black bg-brand-100 text-brand-700 rounded py-0.5">智能算法</div>
                           </div>
                           <div className="grid grid-cols-3 gap-2 items-center text-[10px]">
                               <div className="font-bold text-slate-700">专家复核</div>
                               <div className="text-center text-slate-400">无</div>
                               <div className="text-center font-black bg-brand-100 text-brand-700 rounded py-0.5">1对1 复核</div>
                           </div>
                       </div>
                   </div>
                ) : (
                    // 默认列表视图
                    <div className="bg-slate-50 rounded-3xl p-5 mb-4 space-y-4 border border-slate-100/50">
                        {pkg.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                                <span className="text-[13px] font-bold text-slate-700">{feat}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* 优惠券选择 */}
                {usableCoupons.length > 0 && (
                    <div className="mb-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">可用优惠券</label>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {usableCoupons.map(coupon => (
                                <button
                                    key={coupon.id}
                                    onClick={() => setSelectedCouponId(selectedCouponId === coupon.id ? undefined : coupon.id)}
                                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold whitespace-nowrap transition-colors ${
                                        selectedCouponId === coupon.id 
                                        ? 'bg-red-50 border-red-200 text-red-500' 
                                        : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                >
                                    {coupon.name} (-¥{coupon.value})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-8 border-t border-slate-50 pt-5">
                    <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服务周期: {pkg.duration}</span></div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900">¥</span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{finalPrice}</span>
                            {pkg.originalPrice && <span className="text-xs text-slate-300 line-through ml-2">¥{pkg.originalPrice}</span>}
                        </div>
                        {discountAmount > 0 && (
                            <span className="text-[10px] font-bold text-red-500">已优惠 ¥{discountAmount}</span>
                        )}
                    </div>
                </div>

                <Button fullWidth onClick={performPayment} className="shadow-xl shadow-brand-500/20 py-5 text-[13px] tracking-widest">
                    确认解锁权益
                </Button>
            </>
        )}

        {step === 'paying' && (
            <div className="py-16 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 border-[5px] border-slate-100 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">安全支付中...</h3>
            </div>
        )}

        {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in h-full">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-soft border border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                </div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">服务已生效</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">权限已解锁</p>
            </div>
        )}
      </div>
    </div>
  );
};
