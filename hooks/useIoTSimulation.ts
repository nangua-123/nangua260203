
/**
 * @file useIoTSimulation.ts
 * @description 全局物联网设备数据模拟 Hook
 * @author Neuro-Link Architect
 * 
 * 职责:
 * 1. 模拟心率、血压、血氧等生命体征的实时变化。
 * 2. [UPDATED] 集成 SignalProcessing 模块进行数据清洗与 SQI 计算。
 * 3. 模拟突发事件: 心率异常、跌倒检测 (Fall Detection)、声音识别。
 * 4. 离线预警补丁。
 */

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { IoTStats, DiseaseType } from '../types';
import { useToast } from '../context/ToastContext';
import { processHeartRateSample, calculateHRVMetrics } from '../utils/signalProcessing';

export const useIoTSimulation = () => {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const { user } = state;
    
    const activeProfileId = user.currentProfileId || user.id;
    const hasDevice = user.hasHardware; 

    const activeIdRef = useRef(activeProfileId);
    const lastAlertTimeRef = useRef<number>(0);
    
    // [NEW] Buffer for signal processing
    const lastHrRef = useRef<number>(75);
    const rrIntervalsBuffer = useRef<number[]>([]); // Buffer for HRV calc

    useEffect(() => { activeIdRef.current = activeProfileId; }, [activeProfileId]);

    useEffect(() => {
        if (!state.isLoggedIn || !hasDevice) return;

        const interval = setInterval(() => {
            // [HaaS] Offline Diagnosis Logic (> 24h)
            const lastUpdate = user.iotStats?.lastUpdated || 0;
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdate;
            const offlineThreshold = 24 * 60 * 60 * 1000; 
            const alertCooldown = 24 * 60 * 60 * 1000; 

            if (lastUpdate > 0 && timeSinceLastUpdate > offlineThreshold) {
                if (now - lastAlertTimeRef.current > alertCooldown) {
                    dispatch({ 
                        type: 'SEND_CLINICAL_MESSAGE', 
                        payload: { 
                            targetId: activeProfileId, 
                            message: `【严重故障】监测设备已离线超过24小时，请检查电量或联系客服。` 
                        } 
                    });
                    lastAlertTimeRef.current = now;
                }
                return;
            }

            // --- Signal Simulation & Processing ---
            
            // 1. Generate Raw Signal (with potential noise/artifacts)
            const isMotionArtifact = Math.random() > 0.9; // 10% chance of motion artifact
            const isHrAnomaly = Math.random() > 0.98; // 2% chance of clinical anomaly
            
            let rawHr = 75 + Math.floor(Math.random() * 20 - 10); 
            
            if (isHrAnomaly) {
                rawHr = Math.random() > 0.5 ? 135 : 55; // Tachycardia or Bradycardia
            } else if (isMotionArtifact) {
                rawHr = rawHr + Math.floor(Math.random() * 40 - 20); // Sudden jump due to motion
            }

            // 2. Process Signal (Cleaning)
            const processedPacket = processHeartRateSample(rawHr, lastHrRef.current);
            lastHrRef.current = processedPacket.value;

            // 3. HRV Calculation (Simulated from RR intervals)
            // RR interval approx = 60000 / HR (ms)
            const currentRR = 60000 / processedPacket.value;
            rrIntervalsBuffer.current.push(currentRR);
            if (rrIntervalsBuffer.current.length > 20) rrIntervalsBuffer.current.shift(); // Keep last 20 beats
            
            const hrvMetrics = calculateHRVMetrics(rrIntervalsBuffer.current);

            // 4. Other Vitals
            const bpSys = 110 + Math.floor(Math.random() * 20);
            const bpDia = 75 + Math.floor(Math.random() * 10);
            const spo2 = 96 + Math.floor(Math.random() * 4);

            // 5. Event Detection
            const isEpilepsyUser = state.primaryCondition === DiseaseType.EPILEPSY;
            const isFall = isEpilepsyUser && Math.random() > 0.995;
            const isSound = isEpilepsyUser && Math.random() > 0.995; 

            // 6. Construct Final Stats
            // Note: If SQI (Signal Quality Index) is low, we might flag 'isAbnormal' as false to avoid false positives,
            // or we might flag a 'deviceFault'. Here we just rely on processed value.
            
            const stats: IoTStats = {
                hr: processedPacket.value, 
                hrStandardDeviation: hrvMetrics.sdnn, 
                bpSys, bpDia, spo2,
                isAbnormal: processedPacket.value > 120 || processedPacket.value < 60,
                isFallDetected: isFall,
                isSoundTriggered: isSound, 
                lastUpdated: Date.now()
            };

            dispatch({
                type: 'UPDATE_IOT_STATS',
                payload: { id: activeIdRef.current, stats }
            });

            // 7. Feedback for Poor Signal
            if (processedPacket.quality < 50 && processedPacket.isArtifact) {
                // Throttle this toast in real app
                if (Math.random() > 0.8) {
                    showToast('监测信号微弱，请调整佩戴位置', 'info');
                }
            }

            // 8. Critical Event Handling (Offline Patch)
            if ((stats.isFallDetected || stats.isSoundTriggered || stats.isAbnormal) && processedPacket.quality > 60) {
                // Only alert if signal quality is decent
                if (!navigator.onLine) {
                    if (navigator.vibrate) navigator.vibrate([100,30,100,30,100]);
                    showToast('⚠️ 离线模式：已触发本地急救震动', 'error');
                } else {
                    dispatch({
                        type: 'SET_RISK_SCORE',
                        payload: { score: 95, type: DiseaseType.EPILEPSY }
                    });
                }
            }

        }, 3000); 

        return () => clearInterval(interval);
    }, [state.isLoggedIn, hasDevice, state.primaryCondition]);
};
