
import React, { useState, useEffect, useRef } from 'react';
import Button from '../../common/Button';
import { DeviceInfo } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';

interface HardwareStatusProps {
    info: DeviceInfo;
    onRenew: () => void;
}

export const HardwareStatus: React.FC<HardwareStatusProps> = ({ info, onRenew }) => {
    const { dispatch } = useApp();
    const { showToast } = useToast();
    
    // --- State ---
    const [isExpanded, setIsExpanded] = useState(false);
    
    // OTA State
    const [otaStatus, setOtaStatus] = useState<'IDLE' | 'CHECKING' | 'DOWNLOADING' | 'INSTALLING' | 'REBOOTING'>('IDLE');
    const [otaProgress, setOtaProgress] = useState(0);
    
    // Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);

    // Calculate days remaining
    const now = Date.now();
    const daysLeft = Math.ceil((info.rentalExpireDate - now) / (1000 * 60 * 60 * 24));
    const isExpiring = daysLeft <= 3;
    const isBatteryLow = info.batteryLevel < 20;

    // --- OTA Logic ---
    const handleCheckUpdate = () => {
        if (otaStatus !== 'IDLE') return;
        setOtaStatus('CHECKING');
        
        setTimeout(() => {
            if (info.firmwareVersion === 'v2.2.0') {
                showToast('当前已是最新版本', 'success');
                setOtaStatus('IDLE');
            } else {
                startDownload();
            }
        }, 1500);
    };

    const startDownload = () => {
        setOtaStatus('DOWNLOADING');
        let p = 0;
        const interval = setInterval(() => {
            p += Math.floor(Math.random() * 10) + 5;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setOtaProgress(100);
                startInstall();
            } else {
                setOtaProgress(p);
            }
        }, 300);
    };

    const startInstall = () => {
        setTimeout(() => {
            setOtaStatus('INSTALLING');
            setTimeout(() => {
                setOtaStatus('REBOOTING');
                dispatch({ 
                    type: 'UPDATE_DEVICE_CONFIG', 
                    payload: { status: 'OFFLINE' } 
                });
                
                setTimeout(() => {
                    dispatch({ 
                        type: 'UPDATE_DEVICE_CONFIG', 
                        payload: { 
                            firmwareVersion: 'v2.2.0', 
                            status: 'ONLINE',
                            batteryLevel: Math.max(0, info.batteryLevel - 5) // Consume some battery
                        } 
                    });
                    setOtaStatus('IDLE');
                    setOtaProgress(0);
                    showToast('固件升级成功！设备已重启', 'success');
                }, 3000); // Reboot time
            }, 2500); // Install time
        }, 800);
    };

    // --- Low Power Mode ---
    const toggleLowPower = () => {
        const newState = !info.lowPowerMode;
        dispatch({ 
            type: 'UPDATE_DEVICE_CONFIG', 
            payload: { lowPowerMode: newState } 
        });
        showToast(newState ? '已开启省电模式 (128Hz采样)' : '已恢复高性能模式 (256Hz采样)', 'info');
    };

    // --- Data Sync ---
    const handleSync = () => {
        if (isSyncing || info.pendingDataSize === 0) return;
        setIsSyncing(true);
        
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setSyncProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setIsSyncing(false);
                setSyncProgress(0);
                dispatch({
                    type: 'UPDATE_DEVICE_CONFIG',
                    payload: { 
                        pendingDataSize: 0,
                        lastSyncTime: Date.now() 
                    }
                });
                // Simulate pushing historical data to main stats (conceptual)
                showToast('历史数据同步完成', 'success');
            }
        }, 100);
    };

    const formatTime = (ts: number) => {
        if (!ts) return '从未';
        const d = new Date(ts);
        return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    return (
        <div className={`bg-white rounded-[24px] p-5 shadow-sm border relative overflow-hidden transition-all duration-300 ${isExpiring ? 'border-red-100 ring-2 ring-red-50' : 'border-blue-50'}`}>
            
            {/* Main Info Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner transition-colors ${info.lowPowerMode ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                        {otaStatus !== 'IDLE' ? '🔄' : '⌚'}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            {info.modelName}
                            {info.lowPowerMode && <span className="text-[0.6rem] bg-amber-100 text-amber-700 px-1.5 rounded">省电中</span>}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${info.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${info.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {otaStatus !== 'IDLE' ? '升级中...' : (info.status === 'ONLINE' ? '监测中' : '离线')}
                            </span>
                            <span className="text-[0.6rem] text-slate-400 font-mono">FW: {info.firmwareVersion || 'v1.0.0'}</span>
                        </div>
                    </div>
                </div>
                {isExpiring && (
                    <span className="bg-red-50 text-red-600 text-[0.6rem] px-2 py-1 rounded font-bold border border-red-100 animate-pulse">
                        即将到期
                    </span>
                )}
            </div>

            {/* Battery Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-[0.65rem] mb-1 font-bold">
                    <span className="text-slate-400">剩余电量</span>
                    <span className={isBatteryLow ? 'text-red-500' : info.lowPowerMode ? 'text-amber-500' : 'text-emerald-500'}>{info.batteryLevel}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isBatteryLow ? 'bg-red-500' : info.lowPowerMode ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${info.batteryLevel}%` }}
                    ></div>
                </div>
            </div>

            {/* Toggle Expand for Advanced Controls */}
            <div className="border-t border-slate-50 pt-2">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-center gap-1 text-[0.7rem] text-slate-400 font-bold py-1 hover:text-brand-600 transition-colors"
                >
                    {isExpanded ? '收起设备详情' : '展开设备管理'} 
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
            </div>

            {/* Advanced Controls Panel */}
            {isExpanded && (
                <div className="mt-3 space-y-4 animate-slide-up">
                    
                    {/* 1. Low Power Switch */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                            <div className="text-xs font-bold text-slate-700">低功耗模式</div>
                            <div className="text-[0.6rem] text-slate-400">降低采样率以延长续航</div>
                        </div>
                        <button 
                            onClick={toggleLowPower}
                            disabled={otaStatus !== 'IDLE'}
                            className={`w-10 h-6 rounded-full relative transition-colors ${info.lowPowerMode ? 'bg-amber-400' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${info.lowPowerMode ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* 2. Data Sync */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-bold text-slate-700">离线数据同步</div>
                            <div className="text-[0.6rem] text-slate-400">上次: {formatTime(info.lastSyncTime || 0)}</div>
                        </div>
                        {isSyncing ? (
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-blue-500 transition-all duration-100" style={{width: `${syncProgress}%`}}></div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="text-[0.65rem] text-slate-500 font-mono">
                                    待传: {(info.pendingDataSize || 0).toFixed(1)} MB
                                </span>
                                <button 
                                    onClick={handleSync}
                                    disabled={!info.pendingDataSize}
                                    className={`text-[0.65rem] font-bold px-3 py-1.5 rounded-lg border ${!info.pendingDataSize ? 'text-slate-300 border-slate-200' : 'text-blue-600 border-blue-200 bg-blue-50'}`}
                                >
                                    立即同步
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3. Firmware Update */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-xs font-bold text-slate-700">固件版本</div>
                            <div className="text-[0.65rem] text-slate-500 font-mono">{info.firmwareVersion}</div>
                        </div>
                        
                        {otaStatus === 'IDLE' ? (
                            <button 
                                onClick={handleCheckUpdate}
                                className="w-full mt-2 bg-white border border-slate-200 text-slate-600 text-[0.65rem] font-bold py-2 rounded-lg active:scale-95 transition-transform"
                            >
                                检查更新
                            </button>
                        ) : (
                            <div className="mt-2">
                                <div className="flex justify-between text-[0.6rem] text-slate-500 mb-1 font-bold">
                                    <span>{otaStatus === 'CHECKING' ? '检查中...' : otaStatus === 'DOWNLOADING' ? '下载固件...' : otaStatus === 'INSTALLING' ? '安装中...' : '重启中...'}</span>
                                    {otaStatus === 'DOWNLOADING' && <span>{otaProgress}%</span>}
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    {otaStatus === 'CHECKING' || otaStatus === 'REBOOTING' ? (
                                        <div className="h-full bg-indigo-400 w-1/3 animate-[shimmer_1s_infinite]"></div>
                                    ) : (
                                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{width: otaStatus === 'INSTALLING' ? '100%' : `${otaProgress}%`}}></div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Renew Button */}
                    <Button size="sm" onClick={onRenew} className={`w-full ${isExpiring ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-600'} h-9 text-xs`}>
                        {isExpiring ? '立即续费 (防止服务中断)' : '延长租期'}
                    </Button>
                </div>
            )}
        </div>
    );
};
