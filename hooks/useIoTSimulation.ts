
/**
 * @file useIoTSimulation.ts
 * @description 全局物联网设备数据模拟 Hook
 * @author Neuro-Link Architect
 * 
 * 职责:
 * 1. 模拟心率、血压、血氧等生命体征的实时变化。
 * 2. 模拟突发事件: 心率异常、跌倒检测 (Fall Detection)、声音识别。
 * 3. [Requirement 4] 离线预警补丁: 弱网/离线状态下触发物理震动和本地短信。
 */

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { IoTStats, DiseaseType } from '../types';
import { useToast } from '../context/ToastContext'; // Use Global Toast for feedback

export const useIoTSimulation = () => {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const { user } = state;
    
    // 获取当前需要模拟的 Profile ID (优先监测当前选中的家庭成员)
    const activeProfileId = user.currentProfileId || user.id;
    const hasDevice = user.hasHardware; 

    // 使用 Ref 防止闭包陷阱
    const activeIdRef = useRef(activeProfileId);
    useEffect(() => { activeIdRef.current = activeProfileId; }, [activeProfileId]);

    useEffect(() => {
        if (!state.isLoggedIn || !hasDevice) return;

        const interval = setInterval(() => {
            // 1. 基础生命体征模拟
            const isHrAnomaly = Math.random() > 0.98; // 2% 概率心率异常
            let hr = 75 + Math.floor(Math.random() * 20 - 10); 
            if (isHrAnomaly) hr = Math.random() > 0.5 ? 135 : 55;

            const bpSys = 110 + Math.floor(Math.random() * 20);
            const bpDia = 75 + Math.floor(Math.random() * 10);
            const spo2 = 96 + Math.floor(Math.random() * 4);

            // 2. 异常事件模拟 (Events)
            // 仅针对癫痫用户开启高频检测
            const isEpilepsyUser = state.primaryCondition === DiseaseType.EPILEPSY;
            
            // 跌倒检测: 0.5% 概率
            const isFall = isEpilepsyUser && Math.random() > 0.995;
            
            // 声音识别 (持续抽搐声): 0.5% 概率
            // [Requirement 1] Logic: Fall OR Sound
            const isSound = isEpilepsyUser && Math.random() > 0.995; 

            const stats: IoTStats = {
                hr, bpSys, bpDia, spo2,
                isAbnormal: hr > 120 || hr < 60,
                isFallDetected: isFall,
                isSoundTriggered: isSound, // [NEW] Sync with Type
                lastUpdated: Date.now()
            };

            // 3. 更新全局状态
            dispatch({
                type: 'UPDATE_IOT_STATS',
                payload: { id: activeIdRef.current, stats }
            });

            // 4. [Requirement 4] 离线预警补丁 (Offline Warning Patch)
            if (stats.isFallDetected || stats.isSoundTriggered || stats.isAbnormal) {
                // 检查网络状态
                if (!navigator.onLine) {
                    console.warn('[Offline Patch] Critical event detected while offline!');
                    
                    // A. 物理震动提醒 (Web Vibration API)
                    if (navigator.vibrate) {
                        // SOS pattern: ... --- ...
                        navigator.vibrate([100,30,100,30,100,200,200,30,200,30,200,200,100,30,100,30,100]);
                    }

                    // B. 尝试发送本地 SMS (Simulation)
                    // 在真实 App 中会调用 Native Bridge，这里使用 Toast 反馈
                    showToast('⚠️ 离线模式：已触发手环物理震动，正在尝试发送本地短信...', 'error');
                } else {
                    // 在线状态下，触发普通的风险评分联动
                    dispatch({
                        type: 'SET_RISK_SCORE',
                        payload: { score: 95, type: DiseaseType.EPILEPSY }
                    });
                }
            }

        }, 3000); // 每 3 秒更新一次

        return () => clearInterval(interval);
    }, [state.isLoggedIn, hasDevice, state.primaryCondition]);
};
