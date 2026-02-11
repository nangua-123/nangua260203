
/**
 * @file signalProcessing.ts
 * @description HaaS 设备信号处理核心算法库
 * 用于科研数据的预处理、伪影去除及特征提取
 */

export interface SignalPacket {
    timestamp: number;
    value: number;
    raw?: number; // 原始含噪数据 (用于对比)
    quality: number; // 0-100, 信号质量指标 (SQI)
    isArtifact: boolean; // 是否包含伪影
}

// 伪影检测阈值配置
const ARTIFACT_CONFIG = {
    HR_JUMP_THRESHOLD: 20, // 心率单次跳变阈值 (bpm)
    SIGNAL_SATURATION: 0.95, // 信号饱和度阈值 (归一化后)
    NOISE_FLOOR: 0.05, // 底噪阈值
};

/**
 * 简单移动平均滤波 (SMA)
 * 用于平滑生理信号中的高频噪声
 */
export const smoothSignal = (data: number[], windowSize: number = 3): number[] => {
    if (data.length < windowSize) return data;
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
        const subset = data.slice(start, end);
        const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
        result.push(avg);
    }
    return result;
};

/**
 * 伪影检测与剔除算法
 * @param rawValue 当前原始采样值
 * @param lastValidValue 上一个有效值
 * @returns 处理后的 SignalPacket
 */
export const processHeartRateSample = (
    rawValue: number, 
    lastValidValue: number
): SignalPacket => {
    let quality = 100;
    let isArtifact = false;
    let processedValue = rawValue;

    // 1. 范围校验 (生理合理性: 30-220 bpm)
    if (rawValue < 30 || rawValue > 220) {
        quality -= 50;
        isArtifact = true;
    }

    // 2. 突变校验 (Motion Artifact Detection)
    // 如果跟上一次有效值相比跳变过大，视为伪影
    if (Math.abs(rawValue - lastValidValue) > ARTIFACT_CONFIG.HR_JUMP_THRESHOLD) {
        quality -= 40;
        isArtifact = true;
        // 策略: 保持上一有效值 (Hold) 或 限制变化率 (Slew Rate Limiter)
        // 这里采用限制变化率策略，向目标值靠拢但不超过阈值
        const direction = rawValue > lastValidValue ? 1 : -1;
        processedValue = lastValidValue + (direction * ARTIFACT_CONFIG.HR_JUMP_THRESHOLD * 0.5); 
    }

    // 3. 接触不良模拟 (Random Noise Check)
    // 假设输入流中已经包含了一些随机噪声，这里评估其信噪比
    // (在前端模拟中，我们简化为基于 quality 再次调整 value)
    
    if (quality < 60) {
        // 信号质量差时，增加平滑力度
        processedValue = (processedValue + lastValidValue) / 2;
    }

    return {
        timestamp: Date.now(),
        value: Math.round(processedValue),
        raw: rawValue,
        quality: Math.max(0, quality),
        isArtifact
    };
};

/**
 * 脑电波形伪影去除 (简易版)
 * 主要针对眨眼 (EOG) 和肌电 (EMG) 干扰进行幅度限制
 */
export const cleanEEGWaveform = (rawPoints: number[]): number[] => {
    const CLAMP_MIN = 5;
    const CLAMP_MAX = 95;
    
    return rawPoints.map((y, idx) => {
        // 1. 幅度限制 (Clipping)
        let cleanY = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, y));
        
        // 2. 尖峰削弱 (针对高频肌电伪影)
        if (idx > 0 && idx < rawPoints.length - 1) {
            const prev = rawPoints[idx-1];
            const next = rawPoints[idx+1];
            // 如果当前点是尖峰
            if (Math.abs(cleanY - prev) > 20 && Math.abs(cleanY - next) > 20) {
                cleanY = (prev + next) / 2; // 使用线性插值替换
            }
        }
        
        return cleanY;
    });
};

/**
 * 计算 HRV 时域指标 (模拟)
 * @param rrIntervals R-R 间期数组 (ms)
 */
export const calculateHRVMetrics = (rrIntervals: number[]) => {
    if (rrIntervals.length < 2) return { sdnn: 0, rmssd: 0 };

    // Calculate Mean RR
    const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;

    // Calculate SDNN (Standard Deviation of NN intervals)
    const variance = rrIntervals.reduce((acc, val) => acc + Math.pow(val - meanRR, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSqDiff = 0;
    for (let i = 0; i < rrIntervals.length - 1; i++) {
        sumSqDiff += Math.pow(rrIntervals[i+1] - rrIntervals[i], 2);
    }
    const rmssd = Math.sqrt(sumSqDiff / (rrIntervals.length - 1));

    return { sdnn: Math.round(sdnn), rmssd: Math.round(rmssd) };
};
