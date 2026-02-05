
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Button from './Button';
import { AppView } from '../types';
import { usePayment, AVAILABLE_COUPONS, RENTAL_PLANS } from '../hooks/usePayment';

interface ServiceMarketplaceProps {
  onNavigate: (view: AppView) => void;
  onBack: () => void;
}

// --- HaaS 租赁结算流程 (Ant Style Refactor) ---
export const HaaSRentalView: React.FC<{ onBack: () => void; onComplete: () => void }> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'confirm' | 'form' | 'success' | 'error'>('confirm');
  const [isFamilyPay, setIsFamilyPay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // New States for Commercial Logic
  const [selectedPlanId, setSelectedPlanId] = useState('30d');
  const [selectedCouponId, setSelectedCouponId] = useState<string | undefined>(undefined);
  const { calculateRentalPrice, hasFeature } = usePayment();

  // 计算最终价格
  const pricing = calculateRentalPrice(selectedPlanId, selectedCouponId);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '陈建国',
    phone: '138****0000',
    address: '四川省成都市武侯区国学巷37号'
  });

  const handlePay = () => {
    setIsProcessing(true);
    setStep('confirm'); // reset if coming from error
    
    setTimeout(() => {
      // [DEMO MODE] 移除随机故障，强制成功
      setIsProcessing(false);
      setStep('success');
      setIsDataSynced(true); // 模拟数据下发
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col h-screen bg-white max-w-[430px] mx-auto overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in relative">
          
          <div className="w-20 h-20 bg-[#1677FF] rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-2">支付成功</h2>
          <p className="text-slate-500 text-xs font-medium mb-8">
              华西物联网中心已接单 · 预计明日送达
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 w-full mb-8 text-center border border-slate-100">
             <div className="text-[11px] text-slate-400 mb-1">同步状态</div>
             <div className="flex items-center justify-center gap-2 text-[#1677FF] font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse"></span>
                亲情数据链路已激活
             </div>
          </div>
        </div>
        <div className="p-6 pb-safe animate-fade-in">
          <Button fullWidth onClick={onComplete} className="bg-[#1677FF] py-4">完成</Button>
        </div>
      </div>
    );
  }

  // [NEW] 错误状态视图
  if (step === 'error') {
      return (
        <Layout headerTitle="支付失败" showBack onBack={() => setStep('confirm')}>
            <div className="flex flex-col h-full bg-white items-center justify-center p-8 text-center animate-shake">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100">
                   <span className="text-4xl">✕</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">订单支付失败</h3>
                <p className="text-xs text-slate-500 mb-10">{errorMsg}</p>
                <Button fullWidth onClick={handlePay} className="bg-brand-600 shadow-lg shadow-brand-500/20 py-4">
                    重新提交订单
                </Button>
            </div>
        </Layout>
      );
  }

  return (
    <Layout headerTitle="确认订单" showBack onBack={onBack}>
      <div className="p-4 pb-safe space-y-3 animate-slide-up pb-32 bg-[#F5F5F5] min-h-screen">
        
        {/* 1. 地址卡片 (Ant Style) */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm active:opacity-70 transition-opacity">
           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1677FF]">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
           </div>
           <div className="flex-1">
               <div className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                   {formData.name} <span className="text-slate-400 font-normal">{formData.phone}</span>
               </div>
               <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{formData.address}</div>
           </div>
           <span className="text-slate-300">›</span>
        </div>

        {/* 2. 商品卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-3 mb-4 border-b border-slate-50 pb-4">
                <div className="w-20 h-20 bg-slate-50 rounded-lg flex items-center justify-center text-4xl border border-slate-100 shrink-0">
                    ⌚
                </div>
                <div className="flex-1 py-0.5">
                    <div className="text-[13px] font-bold text-slate-900 mb-1">癫痫生命守护包 (年卡)</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                        <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">医疗级监测</span>
                        <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">坏件包赔</span>
                    </div>
                    <div className="text-[#1677FF] font-bold text-[13px]">
                        ¥ {pricing.plan.price} <span className="text-slate-300 font-normal text-[10px]">/ {pricing.plan.days}天</span>
                    </div>
                </div>
            </div>

            {/* SKU Selector */}
            <div className="space-y-3">
                 <div className="text-[11px] font-bold text-slate-700">租期选择</div>
                 <div className="flex gap-2">
                      {RENTAL_PLANS.map(plan => (
                          <button
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                                selectedPlanId === plan.id 
                                ? 'bg-blue-50 border-[#1677FF] text-[#1677FF]' 
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                              {plan.days}天
                          </button>
                      ))}
                 </div>
            </div>
        </div>

        {/* 3. 优惠与金额 */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-600">设备押金</span>
                <span className={pricing.deposit === 0 ? 'text-[#1677FF] font-bold' : 'text-slate-900 font-bold'}>
                    {pricing.deposit === 0 ? '免押金 (VIP)' : `¥${pricing.deposit}`}
                </span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-600">优惠券</span>
                <div className="flex items-center gap-1 text-slate-400">
                    {AVAILABLE_COUPONS.length > 0 ? (
                         <span className="text-red-500 font-bold bg-red-50 px-1 rounded text-[10px]">-¥20</span>
                    ) : '无可用'}
                    <span>›</span>
                </div>
            </div>
            <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-600">配送方式</span>
                <span className="text-slate-900 font-bold">顺丰包邮</span>
            </div>
        </div>

        {/* 4. 亲情代付开关 */}
        <div 
          onClick={() => setIsFamilyPay(!isFamilyPay)}
          className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
        >
           <div>
               <div className="text-[12px] font-bold text-slate-900">开启亲情代付</div>
               <div className="text-[10px] text-slate-400 mt-0.5">支付后自动绑定家属账号</div>
           </div>
           <div className={`w-10 h-6 rounded-full relative transition-colors ${isFamilyPay ? 'bg-[#1677FF]' : 'bg-slate-200'}`}>
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isFamilyPay ? 'left-5' : 'left-1'}`}></div>
           </div>
        </div>

      </div>

      {/* 底部结算栏 (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 pb-safe z-50 flex items-center justify-between max-w-[430px] mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
         <div className="pl-2">
            <div className="flex items-baseline gap-1">
               <span className="text-xs font-bold text-red-500">¥</span>
               <span className="text-2xl font-black text-red-500 tracking-tighter">{pricing.total}</span>
            </div>
            <div className="text-[9px] text-slate-400">已优惠 ¥{pricing.discount}</div>
         </div>
         <Button onClick={handlePay} disabled={isProcessing} className="w-[140px] bg-[#1677FF] h-10 text-[13px]">
             {isProcessing ? '处理中...' : '提交订单'}
         </Button>
      </div>
    </Layout>
  );
};

// --- 服务商城矩阵 (入口) ---
export const ServiceMallView: React.FC<ServiceMarketplaceProps> = ({ onNavigate, onBack }) => {
  return (
    <Layout headerTitle="服务中心" showBack onBack={onBack}>
      <div className="p-4 space-y-4 pb-24 animate-slide-up bg-[#F5F5F5] min-h-screen">
        
        {/* Banner */}
        <div className="bg-[#1677FF] rounded-xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
             <div className="relative z-10">
                <div className="font-black text-lg mb-1">华西专病 · 租赁中心</div>
                <p className="text-xs opacity-80">医疗级监测设备 / 坏件包赔 / 专家解读</p>
             </div>
             <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 rotate-12">🎁</div>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-2 gap-3">
             {[
                 { title: '癫痫守护包', price: '599', icon: '⌚', tag: '热租', nav: 'haas-checkout' },
                 { title: 'AD 认知会员', price: '365', icon: '🧠', tag: '推荐', nav: 'payment' },
                 { title: '深度评估', price: '1.00', icon: '📋', tag: '基础', nav: 'payment' },
                 { title: '专家复核', price: '299', icon: '👨‍⚕️', tag: 'VIP', nav: 'payment' },
             ].map((item, i) => (
                 <div key={i} onClick={() => onNavigate(item.nav as AppView)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 flex flex-col justify-between h-32 active:scale-[0.98] transition-transform relative overflow-hidden">
                     {item.tag && <span className="absolute top-0 right-0 bg-orange-50 text-orange-600 text-[9px] px-2 py-1 rounded-bl-lg font-bold">{item.tag}</span>}
                     <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-xl mb-2">{item.icon}</div>
                     <div>
                         <div className="text-[13px] font-bold text-slate-800">{item.title}</div>
                         <div className="text-red-500 font-black text-sm mt-0.5">¥{item.price}</div>
                     </div>
                 </div>
             ))}
        </div>

      </div>
    </Layout>
  );
};
