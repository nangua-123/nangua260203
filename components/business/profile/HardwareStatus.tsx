
import React from 'react';
import Button from '../../common/Button';
import { DeviceInfo } from '../../../types';

interface HardwareStatusProps {
    info: DeviceInfo;
    onRenew: () => void;
}

export const HardwareStatus: React.FC<HardwareStatusProps> = ({ info, onRenew }) => {
    // Calculate days remaining
    const now = Date.now();
    const daysLeft = Math.ceil((info.rentalExpireDate - now) / (1000 * 60 * 60 * 24));
    const isExpiring = daysLeft <= 3;
    const isBatteryLow = info.batteryLevel < 20;

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-blue-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-10 translate-x-10 opacity-60 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl border border-blue-100 shadow-inner">
                            ⌚
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800">{info.modelName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${info.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${info.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {info.status === 'ONLINE' ? '监测中' : '离线'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">ID: {info.deviceId}</span>
                            </div>
                        </div>
                    </div>
                    {isExpiring && (
                        <span className="bg-red-50 text-red-600 text-[9px] px-2 py-1 rounded font-bold border border-red-100 animate-pulse">
                            即将到期
                        </span>
                    )}
                </div>

                {/* Battery Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] mb-1 font-bold">
                        <span className="text-slate-400">剩余电量</span>
                        <span className={isBatteryLow ? 'text-red-500' : 'text-emerald-500'}>{info.batteryLevel}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${isBatteryLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${info.batteryLevel}%` }}
                        ></div>
                    </div>
                    {isBatteryLow && <p className="text-[9px] text-red-400 mt-1">请尽快充电，以免监测中断</p>}
                </div>

                {/* Subscription Info */}
                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5">租赁有效期</div>
                        <div className={`text-xs font-black font-mono ${isExpiring ? 'text-red-600' : 'text-slate-700'}`}>
                            剩余 {daysLeft > 0 ? daysLeft : 0} 天 ({new Date(info.rentalExpireDate).toLocaleDateString()})
                        </div>
                    </div>
                    <Button size="sm" onClick={onRenew} className={`${isExpiring ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-600'} h-8 px-4 text-[10px]`}>
                        {isExpiring ? '立即续费' : '延长租期'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
