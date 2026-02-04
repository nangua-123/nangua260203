
import React, { useState, useMemo } from 'react';
import { usePayment } from '../../../hooks/usePayment';
import { PaywallModal } from '../payment/PaywallModal';

interface PrescriptionData {
  doctor: string;
  title: string;
  hospital: string;
  validUntil: string;
  preventative: { name: string; dosage: string; note: string };
  acute: { name: string; dosage: string; note: string };
}

// 定义生活方式干预项接口
interface LifestyleItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  triggerKey: string; // 关联的诱因Key
  threshold: number; // 触发阈值
}

interface DigitalPrescriptionProps {
  highlight?: boolean;
  factors?: {
    pressure: number;
    sleep: number;
    stress: number;
    diet: number;
    cycle: number;
  };
}

// 华西医院认证医师白名单
const AUTHORIZED_DOCTORS = ["王德强 教授", "刘鸣 教授", "周东 教授"];

export const DigitalPrescription: React.FC<DigitalPrescriptionProps> = ({ highlight = false, factors }) => {
  const { hasFeature, PACKAGES } = usePayment();
  const [showPayModal, setShowPayModal] = useState(false);
  const [dailyMedsTaken, setDailyMedsTaken] = useState(false);

  // 权益校验：是否已购买“偏头痛1元破冰”或“偏头痛VIP”
  const isUnlocked = hasFeature('ICE_BREAKING_MIGRAINE') || hasFeature('VIP_MIGRAINE');

  // 完整 Mock 处方数据
  const prescription: PrescriptionData = {
    doctor: "王德强 教授",
    title: "主任医师",
    hospital: "四川大学华西医院",
    validUntil: "2024.12.31", // [COMPLIANCE] 故意设置一个可能过期的日期来测试逻辑，实际应动态生成
    preventative: { 
        name: "盐酸氟桂利嗪胶囊", 
        dosage: "5mg / 晚1次 (华西标准)", 
        note: "每晚睡前服用，注意嗜睡副作用" 
    },
    acute: { 
        name: "佐米曲普坦片", 
        dosage: "2.5mg / 发作即刻", 
        note: "24小时内不超过10mg" 
    }
  };

  // [COMPLIANCE] 合规校验逻辑
  // 1. 有效期校验 (模拟：假设处方有效期为生成后7天，此处简化为对比字符串日期)
  const isExpired = new Date(prescription.validUntil).getTime() < Date.now();
  // 2. 医师资质校验
  const isAuthorized = AUTHORIZED_DOCTORS.includes(prescription.doctor);
  
  // 如果处方不合规，强制锁定或显示警告
  const isInvalid = isExpired || !isAuthorized;


  // 基础生活方式建议库
  const lifestyleLibrary: LifestyleItem[] = [
    { id: 'sleep_hygiene', icon: '🛌', title: '执行睡眠卫生处方', desc: '今晚22:00前入睡，避免蓝光', triggerKey: 'sleep', threshold: 40 },
    { id: 'breathing', icon: '🌬️', title: '腹式呼吸 15分钟', desc: '降低皮质醇水平，缓解血管痉挛', triggerKey: 'stress', threshold: 45 },
    { id: 'water', icon: '💧', title: '水合作用疗法', desc: '快速补充 500ml 电解质水', triggerKey: 'diet', threshold: 50 },
    { id: 'cycle_care', icon: '📅', title: '激素期护理', desc: '注意头部保暖，记录疼痛日志', triggerKey: 'cycle', threshold: 40 },
    { id: 'indoor', icon: '🏠', title: '规避气压波动', desc: '减少户外暴露，保持室内恒温', triggerKey: 'pressure', threshold: 60 },
  ];

  // 动态排序逻辑
  const sortedLifestyle = useMemo(() => {
    if (!factors) return lifestyleLibrary.slice(0, 2);

    return [...lifestyleLibrary].sort((a, b) => {
      const valA = factors[a.triggerKey as keyof typeof factors] || 0;
      const valB = factors[b.triggerKey as keyof typeof factors] || 0;
      const weightA = valA + (valA > a.threshold ? 1000 : 0);
      const weightB = valB + (valB > b.threshold ? 1000 : 0);
      return weightB - weightA;
    }).slice(0, 2); 
  }, [factors]);

  return (
    <>
      <div className="relative group space-y-4">
        
        {/* 0. 动态非药物干预 (生活方式) - [COMPLIANCE FIX] 移出付费墙，作为免费基础功能 */}
        <div className={`rounded-[24px] p-5 border shadow-sm transition-colors duration-500 bg-white ${highlight ? 'border-rose-100 ring-2 ring-rose-50' : 'border-slate-50'}`}>
             <h4 className={`text-[12px] font-black uppercase tracking-widest mb-3 flex items-center justify-between ${highlight ? 'text-rose-500' : 'text-slate-800'}`}>
                 <span className="flex items-center gap-1">
                    {highlight && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>}
                    今日非药物干预 (生活方式)
                 </span>
                 <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-100">免费基础项</span>
             </h4>
             <div className="space-y-2">
                 {sortedLifestyle.map((item, idx) => (
                     <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="text-xl">{item.icon}</div>
                         <div>
                             <div className="text-[12px] font-black text-slate-800">{item.title}</div>
                             <div className="text-[10px] text-slate-500">{item.desc}</div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Prescription Card Container (Locked) */}
        <div className={`
            bg-white rounded-[32px] p-0 shadow-xl shadow-brand-500/10 relative overflow-hidden transition-all duration-500 border border-slate-100
            ${(!isUnlocked || isInvalid) ? 'select-none grayscale-[0.9] opacity-80' : 'scale-100 opacity-100'}
            ${highlight && isUnlocked && !isInvalid ? 'ring-4 ring-rose-200 animate-pulse' : ''}
        `}>
            {/* Header Section */}
            <div className={`p-6 text-white transition-colors duration-500 ${highlight ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-brand-600 to-brand-700'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-black backdrop-blur-sm">
                            {prescription.doctor[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black">{prescription.doctor}</span>
                                {isAuthorized && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-bold backdrop-blur-md">认证医师</span>}
                            </div>
                            <div className="text-[10px] text-white/80 font-medium">{prescription.hospital}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] text-white/60 font-bold uppercase tracking-widest mb-1">处方有效期至</div>
                        <div className={`text-[12px] font-mono font-bold tracking-tight px-2 py-1 rounded-lg inline-block ${isExpired ? 'bg-red-500/80 text-white' : 'bg-black/10'}`}>
                            {prescription.validUntil}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section (Drug Info) */}
            <div className="p-6 space-y-6">
                
                {/* 1. 预防性治疗 */}
                <div className="relative pl-4 border-l-2 border-brand-200">
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-brand-500 rounded-full ring-4 ring-white"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">长期预防方案 (Daily)</h4>
                            <div className="text-sm font-black text-slate-900 mb-1">{prescription.preventative.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded">
                                {prescription.preventative.dosage}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1 italic">
                                * {prescription.preventative.note}
                            </div>
                        </div>
                        <button 
                            onClick={() => isUnlocked && !isInvalid && setDailyMedsTaken(!dailyMedsTaken)}
                            disabled={isInvalid}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${dailyMedsTaken ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>

                {/* 2. 急性期治疗 */}
                <div className="relative pl-4 border-l-2 border-rose-200">
                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-rose-500 rounded-full ring-4 ring-white"></div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">急性期终止 (SOS)</h4>
                        <div className="text-sm font-black text-slate-900 mb-1">{prescription.acute.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded">
                            {prescription.acute.dosage}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Watermark */}
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                    Powered by West China Hospital CDSS
                </p>
            </div>
        
            {/* Invalid Overlay (Expired or Unauthorized) */}
            {isUnlocked && isInvalid && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-100/50 backdrop-blur-[2px] rounded-[32px]">
                    <div className="bg-white p-6 rounded-[24px] shadow-2xl text-center border border-rose-100 max-w-[260px]">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                            ⚠️
                        </div>
                        <h3 className="text-sm font-black text-slate-800 mb-1">处方已失效</h3>
                        <p className="text-[10px] text-slate-500 mb-0 leading-relaxed">
                            {isExpired ? '超过7天有效期，需重新评估' : '医师签名未通过华西认证'}
                        </p>
                    </div>
                </div>
            )}

            {/* Lock Overlay & Unlock Trigger */}
            {!isUnlocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
                    <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[24px] shadow-2xl text-center border border-white/50 max-w-[260px] animate-slide-up">
                        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
                            🔒
                        </div>
                        <h3 className="text-sm font-black text-slate-800 mb-1">解锁华西数字药方</h3>
                        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                            包含完整用药方案、剂量指导及专家注意事项。
                        </p>
                        <button 
                            onClick={() => setShowPayModal(true)}
                            className="bg-brand-600 text-white w-full py-3 rounded-xl text-[11px] font-black shadow-lg shadow-brand-500/30 active:scale-95 transition-all hover:bg-brand-700 flex items-center justify-center gap-2"
                        >
                            <span>立即解锁</span>
                            <span className="bg-white/20 px-1.5 rounded text-[9px]">¥1.00</span>
                        </button>
                        <p className="text-[8px] text-slate-300 mt-3">支持微信支付 / 支付宝</p>
                    </div>
                </div>
            )}
        </div>

        {/* Payment Modal */}
        <PaywallModal 
            visible={showPayModal} 
            pkg={PACKAGES.ICE_BREAKING_MIGRAINE} 
            onClose={() => setShowPayModal(false)}
        />
      </div>
    </>
  );
};
