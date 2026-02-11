
import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';

interface PharmacistReviewModalProps {
    drugName: string;
    patientVitals: { bpSys: number; bpDia: number; hr: number };
    onApproved: () => void;
    onRejected: () => void;
    onClose: () => void;
}

type ReviewStep = 'CONNECTING' | 'ANALYZING' | 'CHECKING_DDI' | 'RESULT';

export const PharmacistReviewModal: React.FC<PharmacistReviewModalProps> = ({ 
    drugName, 
    patientVitals, 
    onApproved, 
    onRejected, 
    onClose 
}) => {
    const [step, setStep] = useState<ReviewStep>('CONNECTING');
    const [logs, setLogs] = useState<string[]>([]);
    const [riskFound, setRiskFound] = useState(false);

    // Simulation Sequence
    useEffect(() => {
        const sequence = async () => {
            // Step 1: Connecting
            await delay(800);
            addLog("正在接入华西互联网医院药学中心...");
            setStep('ANALYZING');
            
            await delay(1000);
            addLog(`分配临床药师: 张伟 (工号: P-9982)`);
            addLog(`同步患者实时体征: BP ${patientVitals.bpSys}/${patientVitals.bpDia} mmHg`);
            
            // Step 2: Analysis
            await delay(1200);
            setStep('CHECKING_DDI');
            addLog("正在核查药品相互作用 (DDI)...");
            addLog("正在核查禁忌症...");

            // Step 3: Logic Check
            await delay(1500);
            const isHypertension = patientVitals.bpSys >= 140 || patientVitals.bpDia >= 90;
            const isTriptan = drugName.includes("曲普坦");

            if (isTriptan && isHypertension) {
                setRiskFound(true);
                addLog("⚠️ 发现潜在用药风险");
            } else {
                addLog("✅ 处方审核通过");
                setTimeout(() => {
                    onApproved(); // Auto approve if safe
                }, 1000);
            }
            setStep('RESULT');
        };

        sequence();
    }, []);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={riskFound ? undefined : onClose}></div>
            
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden relative z-10 animate-slide-up shadow-2xl">
                {/* Header */}
                <div className={`p-6 text-white text-center transition-colors duration-500 ${riskFound ? 'bg-red-500' : 'bg-indigo-600'}`}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 backdrop-blur-md border-2 border-white/30">
                        {step === 'RESULT' ? (riskFound ? '🛑' : '✅') : '👨‍⚕️'}
                    </div>
                    <h3 className="text-lg font-black tracking-wide">
                        {step === 'RESULT' 
                            ? (riskFound ? '用药拦截警告' : '审核通过') 
                            : '临床药师实时复核'}
                    </h3>
                    <p className="text-xs opacity-80 font-medium mt-1">
                        {step === 'CONNECTING' ? '建立安全链路...' : step === 'ANALYZING' ? '药师正在审方...' : step === 'CHECKING_DDI' ? '安全数据库比对中...' : '审核完成'}
                    </p>
                </div>

                {/* Log Terminal */}
                <div className="bg-slate-50 p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-2 border-b border-slate-100 relative">
                    {logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 animate-fade-in">
                            <span className="text-slate-300">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={log.includes('⚠️') ? 'text-red-600 font-bold' : log.includes('✅') ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                                {log}
                            </span>
                        </div>
                    ))}
                    {step !== 'RESULT' && (
                        <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                            <span>_</span>
                        </div>
                    )}
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_4px,6px_100%]"></div>
                </div>

                {/* Result Action Area */}
                <div className="p-6">
                    {step !== 'RESULT' ? (
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-xs text-slate-400 mt-3 font-bold">请稍候，正在保障您的用药安全...</p>
                        </div>
                    ) : riskFound ? (
                        <div className="space-y-4">
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-left">
                                <div className="text-xs font-black text-red-700 mb-1">拦截原因：禁忌症 (Contraindication)</div>
                                <p className="text-[10px] text-red-600 leading-relaxed">
                                    检测到您当前血压 ({patientVitals.bpSys}/{patientVitals.bpDia}) 处于高值。
                                    <br/>
                                    <strong>{drugName}</strong> 具有血管收缩作用，可能导致高血压危象或脑血管意外。
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button fullWidth variant="secondary" onClick={onRejected} className="bg-slate-100 text-slate-600">
                                    取消用药
                                </Button>
                                <Button fullWidth onClick={onApproved} className="bg-red-600 shadow-red-500/30">
                                    强制执行 (风险自担)
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-xs text-emerald-600 font-bold mb-4">处方合理，未发现配伍禁忌</p>
                            {/* Auto close will handle this, but provide button just in case */}
                            <Button fullWidth onClick={onApproved} className="bg-emerald-500 shadow-emerald-500/30">
                                确认记录
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
