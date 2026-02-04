
import React from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../Button';

interface ReferralSystemProps {
  onClose: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ onClose }) => {
  const { state } = useApp();
  const diagnosis = state.lastDiagnosis;
  const referral = diagnosis?.referral;

  // 如果没有转诊数据，返回空（实际业务中可能需要 Loading 或 Empty State）
  if (!referral) return null;

  // 生成一个基于 qrCodeValue 的伪随机像素矩阵，模拟真实二维码
  const renderPseudoQRCode = (codeValue: string) => {
    // 简单的伪随机生成器
    const seed = codeValue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const cells = [];
    for (let i = 0; i < 64; i++) { // 8x8 grid for simplicity
        const isActive = (seed * (i + 1) * 9301 + 49297) % 233280 > 116640;
        cells.push(isActive);
    }
    
    return (
        <div className="grid grid-cols-8 gap-1 w-full h-full p-2 bg-white rounded-lg">
            {/* 定位点 - 左上 */}
            <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
            <div className="col-span-6 row-span-2 grid grid-cols-6 gap-1">
                 {cells.slice(0, 12).map((on, i) => <div key={`t-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
            </div>
            
            {/* 中间区域 */}
            {cells.slice(12, 52).map((on, i) => (
                <div key={`m-${i}`} className={`rounded-[1px] aspect-square ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>
            ))}

            {/* 定位点 - 右下 (模拟) */}
            <div className="col-span-6 grid grid-cols-6 gap-1">
                 {cells.slice(52, 64).map((on, i) => <div key={`b-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
            </div>
            <div className="col-span-2 bg-slate-900 rounded-sm"></div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
        ></div>
        
        {/* Ticket Card */}
        <div className="bg-white w-full rounded-[24px] p-0 relative z-10 animate-slide-up text-center max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header Area */}
            <div className="bg-slate-900 text-white p-6 pt-8 rounded-t-[24px] relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-[60px] opacity-40 -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-mono uppercase tracking-widest text-slate-300">
                            No. {referral.qrCodeValue.split('-')[2]}
                        </span>
                        <span className="text-[9px] font-bold text-brand-400">优先接诊通道</span>
                    </div>
                    <h3 className="text-xl font-black mb-1 tracking-tight">华西医联体转诊通行证</h3>
                    <p className="text-[10px] text-slate-400 font-medium">请于线下就诊时向分诊台出示此凭证</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar p-6 bg-slate-50 flex-1">
                
                {/* QR Code Container */}
                <div className="bg-white p-4 mx-auto rounded-2xl w-56 h-56 mb-6 shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="w-48 h-48 bg-slate-50 rounded-lg mb-2">
                        {renderPseudoQRCode(referral.qrCodeValue)}
                    </div>
                    <div className="text-[9px] text-slate-300 font-mono tracking-widest uppercase mt-1">
                        {referral.qrCodeValue}
                    </div>
                </div>

                {/* Location Info */}
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 text-left">
                    <div className="flex items-start gap-3 mb-3">
                         <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                         </div>
                         <div>
                             <div className="text-[12px] font-black text-slate-800">{referral.hospitalName}</div>
                             <div className="text-[10px] text-slate-500 mt-0.5">{referral.address}</div>
                             <div className="text-[9px] font-bold text-brand-500 mt-1">当前距离: {referral.distance}</div>
                         </div>
                    </div>
                    <div className="h-px bg-slate-50 w-full mb-3"></div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>导航前往</span>
                        <span>预约电话: 028-8542****</span>
                    </div>
                </div>

                {/* Medical Recommendations (CDSS) */}
                <div className="bg-rose-50 rounded-2xl p-5 text-left border border-rose-100">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                        <h4 className="text-[11px] font-black text-rose-800">华西专家系统 (CDSS) 建议</h4>
                    </div>
                    
                    {/* Primary Reason */}
                    <div className="mb-4">
                        <div className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mb-1">触发原因</div>
                        <div className="text-[11px] text-rose-900 font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-200/50">
                            {diagnosis.reason}
                        </div>
                    </div>

                    {/* Check List */}
                    <div>
                        <div className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mb-1">建议检查项目</div>
                        <ul className="space-y-2">
                            {referral.recommends && referral.recommends.length > 0 ? (
                                referral.recommends.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-rose-100 shadow-sm">
                                        <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-700">{item}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-[10px] text-rose-400 italic">暂无具体检查项，建议遵医嘱。</li>
                            )}
                        </ul>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-white border-t border-slate-50 shrink-0">
                <Button fullWidth onClick={onClose} variant="outline" className="border-slate-200 text-slate-600">
                    保存图片至相册
                </Button>
            </div>
        </div>
    </div>
  );
};
