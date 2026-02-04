
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Button from './Button';
import { AppView } from '../types';

interface ServiceMarketplaceProps {
  onNavigate: (view: AppView) => void;
  onBack: () => void;
}

// --- HaaS 租赁结算流程 ---
export const HaaSRentalView: React.FC<{ onBack: () => void; onComplete: () => void }> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'confirm' | 'form' | 'success'>('confirm');
  const [isFamilyPay, setIsFamilyPay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '陈建国',
    phone: '138****0000',
    address: '四川省成都市武侯区国学巷37号'
  });

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      setIsDataSynced(true); // 模拟数据下发
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col h-screen bg-slate-50 max-w-[430px] mx-auto overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in relative">
          
          {/* 3D Checkmark Animation */}
          <div className="w-32 h-32 relative mb-8">
             <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" className="opacity-20" />
                <path fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" 
                      d="M25 50 L45 70 L75 30"
                      className="origin-center animate-[draw_0.6s_ease-out_forwards]"
                      strokeDasharray="100" strokeDashoffset="100">
                      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
                </path>
             </svg>
             <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse"></div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">租赁申请已提交</h2>
          <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-widest">看护模式已开启 · 顺丰速运待揽件</p>
          
          {isDataSynced && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 w-full mb-8 text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <span className="text-2xl mb-2 block">📡</span>
              <div className="text-brand-700 font-black text-sm">亲情数据同步指令已下发</div>
              <div className="text-brand-600/70 text-[10px] font-bold mt-1">设备激活后数据将实时传输至家属端</div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 w-full shadow-sm border border-slate-100 space-y-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2.5 h-2.5 bg-brand-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                <div className="w-0.5 h-10 bg-slate-100"></div>
              </div>
              <div className="flex-1 pb-4 border-b border-slate-50">
                <div className="text-[11px] font-black text-brand-600">正在出库</div>
                <div className="text-[10px] text-slate-400 mt-0.5">华西神经内科物联网中心库房 · 已接单</div>
                <div className="text-[9px] text-slate-300 mt-1">{new Date().toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="text-[11px] font-black text-slate-500">等待揽收</div>
                <div className="text-[10px] text-slate-400 mt-0.5">顺丰速运 快递员 [刘师傅 139****1234]</div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pb-safe animate-fade-in" style={{animationDelay: '0.8s'}}>
          <Button fullWidth onClick={onComplete} className="shadow-lg shadow-emerald-500/20">返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout headerTitle="租赁服务结算台" showBack onBack={onBack}>
      <div className="p-5 pb-safe space-y-5 animate-slide-up">
        
        {/* 1. 医嘱确认卡 */}
        <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-[24px] p-5 relative overflow-hidden">
           <div className="flex gap-4">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-brand-50">🩺</div>
             <div className="flex-1">
               <h3 className="text-[13px] font-black text-brand-800 mb-1">医嘱处方建议</h3>
               <p className="text-[11px] text-brand-700 leading-relaxed font-bold">
                 经华西协作医院医生评估，建议患者佩戴 <span className="underline">长程脑电监测贴</span> 进行 24小时 居家体征与发作监测。
               </p>
             </div>
           </div>
        </div>

        {/* 2. 商品详情 */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center text-4xl border border-slate-100">🧠</div>
            <div className="flex-1 py-1">
              <h4 className="font-black text-slate-900 text-sm">癫痫生命守护包 (年卡)</h4>
              <div className="flex gap-2 mt-2">
                 <span className="text-[9px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold">含硬件租赁</span>
                 <span className="text-[9px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold">免押金</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xs font-bold text-red-500">¥</span>
                <span className="text-xl font-black text-red-500">599</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">/ 年</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
               <span>硬件押金 (会员权益)</span>
               <span className="line-through text-slate-400">¥ 1200</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
               <span>平台服务费</span>
               <span>¥ 599</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
               <span>顺丰物流费</span>
               <span className="text-emerald-500">包邮</span>
            </div>
          </div>
        </div>

        {/* 3. 收货信息 */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50">
           <h4 className="text-[12px] font-black text-slate-900 mb-4 tracking-wider">收货信息</h4>
           <div className="space-y-4">
              <div className="relative">
                 <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-brand-500">收件人姓名</label>
                 <input 
                   type="text" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-brand-500 outline-none"
                 />
              </div>
              <div className="relative">
                 <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-brand-500">联系电话</label>
                 <input 
                   type="tel" 
                   value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-brand-500 outline-none"
                 />
              </div>
              <div className="relative">
                 <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-brand-500">详细地址</label>
                 <textarea 
                   rows={2}
                   value={formData.address}
                   onChange={e => setFormData({...formData, address: e.target.value})}
                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-brand-500 outline-none resize-none"
                 />
              </div>
           </div>
        </div>

        {/* 4. 亲情代付开关 */}
        <div 
          onClick={() => setIsFamilyPay(!isFamilyPay)}
          className={`rounded-[24px] p-4 border flex items-center justify-between transition-all cursor-pointer ${isFamilyPay ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-50 shadow-sm'}`}
        >
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${isFamilyPay ? 'bg-white text-brand-500' : 'bg-slate-50 text-slate-400'}`}>👪</div>
              <div>
                 <div className={`text-[12px] font-black transition-colors ${isFamilyPay ? 'text-brand-700' : 'text-slate-900'}`}>为家人购买 (开启看护模式)</div>
                 <div className="text-[9px] text-slate-400 font-bold mt-0.5">支付后将绑定亲情账号，同步预警信息</div>
              </div>
           </div>
           <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isFamilyPay ? 'bg-brand-500 border-brand-500' : 'border-slate-300 bg-white'}`}>
              {isFamilyPay && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
           </div>
        </div>

      </div>

      {/* 底部支付栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-safe z-50 flex items-center justify-between max-w-[430px] mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
         <div>
            <div className="text-[10px] text-slate-400 font-bold mb-0.5">实付金额</div>
            <div className="flex items-baseline gap-1 text-slate-900">
               <span className="text-xs font-bold">¥</span>
               <span className="text-2xl font-black tracking-tighter">599.00</span>
            </div>
         </div>
         <Button onClick={handlePay} disabled={isProcessing} className="w-[180px] shadow-xl shadow-brand-500/20">
             {isProcessing ? '支付处理中...' : (isFamilyPay ? '亲情代付并开通' : '立即支付')}
         </Button>
      </div>
    </Layout>
  );
};

// --- 服务商城矩阵 (入口) ---
export const ServiceMallView: React.FC<ServiceMarketplaceProps> = ({ onNavigate, onBack }) => {
  return (
    <Layout headerTitle="华西神经专病服务中心" showBack onBack={onBack}>
      <div className="p-5 space-y-6 pb-24 animate-slide-up">
        
        {/* Banner */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[32px] p-6 text-white shadow-xl min-h-[160px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
               <span className="bg-white/10 text-white text-[9px] font-black px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-widest border border-white/10">华西医联体官方</span>
               <h2 className="text-2xl font-black mt-3 mb-2">专业硬件 免费租赁</h2>
               <p className="text-[11px] text-slate-400 font-bold leading-relaxed w-2/3">
                 加入专病生命守护计划，即刻由华西物联网中心配送医疗级监测设备。
               </p>
            </div>
        </div>

        {/* 服务矩阵 */}
        <div className="space-y-4">
           <h3 className="text-[13px] font-black text-slate-900 tracking-wider px-1">会员服务矩阵</h3>
           
           {/* 1. 深度评估 */}
           <div 
             onClick={() => onNavigate('payment')} 
             className="bg-white rounded-[24px] p-5 shadow-card border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all"
           >
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-xl text-orange-500">📋</div>
                 <div>
                    <h4 className="font-black text-slate-800 text-[13px]">单次深度风险评估</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">临床级量表 + AI 预诊报告</p>
                 </div>
              </div>
              <button className="bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-[11px] font-black">¥ 1.00</button>
           </div>

           {/* 2. AD 会员 */}
           <div 
             onClick={() => onNavigate('payment')} // 简化逻辑，实际可跳到详情
             className="bg-white rounded-[24px] p-5 shadow-card border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all"
           >
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl text-purple-500">🧠</div>
                 <div>
                    <h4 className="font-black text-slate-800 text-[13px]">AD 认知康复会员</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">定制训练 · 专家季度随访</p>
                 </div>
              </div>
              <button className="bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-[11px] font-black">¥ 365</button>
           </div>

           {/* 3. 癫痫守护包 (HaaS) */}
           <div 
             onClick={() => onNavigate('haas-checkout')}
             className="bg-white rounded-[24px] p-5 shadow-card border border-slate-50 relative overflow-hidden group active:scale-[0.98] transition-all ring-1 ring-brand-100"
           >
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl">热销</div>
              <div className="flex gap-4 items-start">
                 <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl text-brand-600">⌚</div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-[13px]">癫痫生命守护包 (年卡)</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 mb-3">含智能手环/脑电贴租赁 · 24h 报警</p>
                    <div className="flex gap-2">
                       <span className="text-[8px] border border-slate-100 px-1.5 py-0.5 rounded text-slate-500">免押金</span>
                       <span className="text-[8px] border border-slate-100 px-1.5 py-0.5 rounded text-slate-500">顺丰包邮</span>
                    </div>
                 </div>
                 <div className="self-center">
                    <button className="bg-brand-600 text-white px-4 py-2 rounded-full text-[11px] font-black shadow-lg shadow-brand-500/30">¥ 599</button>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </Layout>
  );
};
