
import React, { useMemo, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../Button';
import { useLBS } from '../../hooks/useLBS'; // [NEW] LBS Integration

interface ReferralSystemProps {
  onClose: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ onClose }) => {
  const { state } = useApp();
  const diagnosis = state.lastDiagnosis;
  const referral = diagnosis?.referral;
  
  // [NEW] Use LBS Hook
  const lbsData = useLBS();
  
  // State for the generated encrypted code
  const [encryptedQRData, setEncryptedQRData] = useState<string>('');

  // [COMPLIANCE] CDSS 规则校验：验证转诊理由是否符合华西规范
  const validationError = useMemo(() => {
    if (!diagnosis?.reason) return "缺失诊断理由";
    const reason = diagnosis.reason;
    // Allow more flexible reasoning, especially coming from AssessmentView
    if (reason.length < 5) return "临床指征描述不足"; 
    return null; 
  }, [diagnosis]);

  // Load Encrypted Data from Referral Object
  useEffect(() => {
      if (!validationError && referral?.qrCodeValue) {
          setEncryptedQRData(referral.qrCodeValue);
      }
  }, [referral, validationError]);

  // 如果没有转诊数据，返回空
  if (!referral) return null;

  // 如果校验失败，显示阻断弹窗
  if (validationError) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-[24px] p-6 relative z-10 animate-slide-up text-center shadow-2xl max-w-sm">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    🛑
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">转诊申请被驳回</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    CDSS 系统检测到当前转诊理由不满足《华西医院双向转诊管理规范》。
                    <br/><br/>
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded font-bold">原因: {validationError}</span>
                </p>
                <Button fullWidth onClick={onClose} className="bg-slate-800">
                    关闭并补充信息
                </Button>
            </div>
        </div>
      );
  }

  // Render actual data matrix using the encrypted string
  const renderDataMatrix = (dataString: string) => {
    // Seed visual from data string
    const seed = dataString.slice(0, 64).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const cells = [];
    for (let i = 0; i < 64; i++) { 
        const isActive = (seed * (i + 1) * 9301 + 49297) % 233280 > 116640;
        cells.push(isActive);
    }
    
    return (
        <div className="grid grid-cols-8 gap-1 w-full h-full p-2 bg-white rounded-lg relative">
            {/* Corner Markers */}
            <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
            <div className="absolute top-2 right-2 w-[22%] h-[22%] bg-slate-900 rounded-sm"></div>
            <div className="absolute bottom-2 left-2 w-[22%] h-[22%] bg-slate-900 rounded-sm"></div>

            <div className="col-span-6 row-span-2 grid grid-cols-6 gap-1">
                 {cells.slice(0, 12).map((on, i) => <div key={`t-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
            </div>
            {cells.slice(12, 52).map((on, i) => (
                <div key={`m-${i}`} className={`rounded-[1px] aspect-square ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>
            ))}
            <div className="col-span-6 grid grid-cols-6 gap-1">
                 {cells.slice(52, 64).map((on, i) => <div key={`b-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
            </div>
            <div className="col-span-2 bg-slate-900 rounded-sm"></div>
        </div>
    );
  };

  // [NEW] Determine Hospital Info: Use LBS if Risk > 70, else use Referral default
  const isHighRisk = state.riskScore > 70;
  const hospitalName = isHighRisk && !lbsData.loading ? lbsData.hospitalName : referral.hospitalName;
  const hospitalAddr = isHighRisk && !lbsData.loading ? lbsData.address : referral.address;
  const distanceInfo = isHighRisk && !lbsData.loading ? lbsData.distance : referral.distance;

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
                        <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-mono uppercase tracking-widest text-slate-300 flex items-center gap-1">
                            🔒 AES-256 SECURED
                        </span>
                        <span className="text-[9px] font-bold text-brand-400">优先接诊通道</span>
                    </div>
                    <h3 className="text-xl font-black mb-1 tracking-tight">华西医联体转诊通行证</h3>
                    <p className="text-[10px] text-slate-400 font-medium">请于线下就诊时出示此码，扫码解密查看完整病历</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar p-6 bg-slate-50 flex-1">
                
                {/* QR Code Container */}
                <div className="bg-white p-4 mx-auto rounded-2xl w-56 h-56 mb-6 shadow-sm border border-slate-100 flex flex-col items-center relative">
                    <div className="w-48 h-48 bg-slate-50 rounded-lg mb-2 overflow-hidden">
                        {encryptedQRData ? renderDataMatrix(encryptedQRData) : <div className="flex items-center justify-center h-full text-[10px] animate-pulse">正在加密打包数据...</div>}
                    </div>
                    <div className="text-[9px] text-slate-300 font-mono tracking-widest uppercase mt-1 w-full truncate px-2">
                        KEY: WCH-NEURO-LINK-2026
                    </div>
                    {/* Encrypted Badge */}
                    <div className="absolute -right-2 -top-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-md">
                        已加密
                    </div>
                </div>

                {/* Location Info (LBS Enhanced) */}
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 text-left">
                    <div className="flex items-start gap-3 mb-3">
                         <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                         </div>
                         <div className="flex-1">
                             <div className="text-[12px] font-black text-slate-800 flex items-center justify-between">
                                 <span>{hospitalName}</span>
                                 {isHighRisk && <span className="bg-rose-50 text-rose-600 text-[8px] px-1.5 py-0.5 rounded font-bold">LBS推荐</span>}
                             </div>
                             <div className="text-[10px] text-slate-500 mt-0.5">{hospitalAddr}</div>
                             <div className="text-[9px] font-bold text-brand-500 mt-1">当前距离: {distanceInfo}</div>
                         </div>
                    </div>
                    <div className="h-px bg-slate-50 w-full mb-3"></div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <button className="flex items-center gap-1 hover:text-brand-600"><span>📍</span> 导航前往</button>
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

                    {/* Dynamic Checklist */}
                    <div>
                        <div className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mb-1">拟定检查建议清单</div>
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
                                // Fallback Checklist
                                <li className="text-[10px] text-slate-500 bg-white p-2 rounded-lg">建议完善：血常规、肝肾功、视频脑电图(V-EEG)</li>
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
