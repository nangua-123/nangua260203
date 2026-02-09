
import { DiseaseType } from '../types';

export interface TriageOption {
    label: string;
    value: string;
    riskWeight: number; // Adds to the risk score (e.g., 20 for high risk)
    isCritical?: boolean; // Flags immediate danger
}

export interface TriageStep {
    id: string;
    question: string;
    options: TriageOption[];
}

export const TRIAGE_CONFIG: Record<DiseaseType, TriageStep[]> = {
    [DiseaseType.MIGRAINE]: [
        {
            id: 'm_nature',
            question: '请描述您头痛的主要性质？(这有助于区分血管性头痛)',
            options: [
                { label: '搏动性/跳痛 (血管性)', value: 'pulsating', riskWeight: 20 },
                { label: '紧箍感/压迫感', value: 'pressing', riskWeight: 5 },
                { label: '电击样刺痛', value: 'stabbing', riskWeight: 10 },
                { label: '持续性胀痛', value: 'dull', riskWeight: 5 }
            ]
        },
        {
            id: 'm_symptoms',
            question: '头痛发作时，是否伴随以下症状？',
            options: [
                { label: '恶心/呕吐', value: 'nausea', riskWeight: 15 },
                { label: '畏光/畏声', value: 'photophobia', riskWeight: 15 },
                { label: '视觉先兆 (闪光/暗点)', value: 'aura', riskWeight: 20 },
                { label: '无明显伴随症状', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'm_frequency',
            question: '最近3个月内，头痛发作的频率是？',
            options: [
                { label: '> 15天/月 (慢性化风险)', value: 'chronic', riskWeight: 40, isCritical: true },
                { label: '1-4 次/月', value: 'episodic_frequent', riskWeight: 10 },
                { label: '< 1 次/月', value: 'episodic_infrequent', riskWeight: 0 },
                { label: '几乎每天不停', value: 'continuous', riskWeight: 50, isCritical: true }
            ]
        },
        {
            id: 'm_meds',
            question: '您是否服用止痛药 (如布洛芬/散利痛/曲普坦)？',
            options: [
                { label: '> 10天/月 (MOH风险)', value: 'overuse', riskWeight: 35, isCritical: true },
                { label: '仅发作时偶尔服用', value: 'occasional', riskWeight: 0 },
                { label: '从未服用/无效', value: 'none', riskWeight: 10 },
                { label: '正在服用预防性药物', value: 'preventative', riskWeight: 0 }
            ]
        },
        {
            id: 'm_sleep',
            question: '睡眠情况与头痛的关系？',
            options: [
                { label: '熬夜/睡眠不足诱发', value: 'lack_sleep', riskWeight: 15 },
                { label: '周末补觉/睡多了诱发', value: 'over_sleep', riskWeight: 10 },
                { label: '头痛导致失眠', value: 'insomnia', riskWeight: 20 },
                { label: '无明显关联', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'm_weather',
            question: '是否感觉到头痛与天气或气压变化有关？',
            options: [
                { label: '阴雨天/气压低时加重', value: 'pressure_sensitive', riskWeight: 10 },
                { label: '换季/冷热交替时加重', value: 'temp_sensitive', riskWeight: 5 },
                { label: '无相关性', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'm_family',
            question: '直系亲属 (父母/兄弟姐妹) 是否有类似头痛病史？',
            options: [
                { label: '有，且症状相似', value: 'positive', riskWeight: 15 },
                { label: '有，但类型不同', value: 'mixed', riskWeight: 5 },
                { label: '无家族史', value: 'negative', riskWeight: 0 }
            ]
        },
        {
            id: 'm_impact',
            question: '头痛发作时，对您日常生活的影响程度？',
            options: [
                { label: '必须卧床休息', value: 'severe', riskWeight: 30 },
                { label: '效率降低但能坚持', value: 'moderate', riskWeight: 15 },
                { label: '基本不影响', value: 'mild', riskWeight: 0 }
            ]
        }
    ],
    [DiseaseType.EPILEPSY]: [
        {
            id: 'e_semiology',
            question: '发作时的具体表现是怎样的？(核心特征)',
            options: [
                { label: '肢体抽搐/强直', value: 'motor', riskWeight: 20 },
                { label: '突然愣神/动作停止', value: 'absence', riskWeight: 15 },
                { label: '跌倒/突然无力', value: 'atonic', riskWeight: 25 },
                { label: '奇怪的感觉/幻觉', value: 'sensory', riskWeight: 10 }
            ]
        },
        {
            id: 'e_aura',
            question: '发作前是否有特殊的“预感”或先兆？',
            options: [
                { label: '有胃气上升/恐惧感', value: 'epigastric', riskWeight: 10 },
                { label: '有闪光/异味', value: 'visual_olfactory', riskWeight: 10 },
                { label: '无任何先兆', value: 'none', riskWeight: 5 },
                { label: '不确定', value: 'unknown', riskWeight: 0 }
            ]
        },
        {
            id: 'e_consciousness',
            question: '发作过程中您的意识状态如何？',
            options: [
                { label: '完全丧失意识', value: 'unconscious', riskWeight: 20 },
                { label: '意识模糊/似懂非懂', value: 'impaired', riskWeight: 15 },
                { label: '意识完全清醒', value: 'aware', riskWeight: 0 }
            ]
        },
        {
            id: 'e_duration',
            question: '【关键】通常发作持续时间是多久？',
            options: [
                { label: '< 1分钟', value: 'short', riskWeight: 0 },
                { label: '1 - 5分钟', value: 'medium', riskWeight: 10 },
                { label: '> 5分钟 (持续状态风险)', value: 'long', riskWeight: 50, isCritical: true },
                { label: '> 30分钟', value: 'status_epilepticus', riskWeight: 80, isCritical: true }
            ]
        },
        {
            id: 'e_meds',
            question: '目前的抗癫痫药物 (ASM) 服用依从性？',
            options: [
                { label: '规律服药，从不漏服', value: 'adherent', riskWeight: 0 },
                { label: '偶尔漏服', value: 'occasional_miss', riskWeight: 20 },
                { label: '经常漏服/自行减量', value: 'poor_adherence', riskWeight: 40, isCritical: true },
                { label: '从未服药', value: 'naive', riskWeight: 10 }
            ]
        },
        {
            id: 'e_trigger',
            question: '最近是否存在以下诱发因素？',
            options: [
                { label: '熬夜/剥夺睡眠', value: 'sleep_deprivation', riskWeight: 20 },
                { label: '漏服药物', value: 'missed_meds', riskWeight: 25 },
                { label: '闪光刺激/视频游戏', value: 'photic', riskWeight: 15 },
                { label: '无明显诱因', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'e_post_ictal',
            question: '发作结束后，您的状态如何？',
            options: [
                { label: '立即清醒', value: 'immediate', riskWeight: 0 },
                { label: '困倦/嗜睡', value: 'drowsy', riskWeight: 10 },
                { label: '意识混乱/胡言乱语', value: 'confused', riskWeight: 15 },
                { label: '肢体无力 (Todd麻痹)', value: 'paralysis', riskWeight: 20 }
            ]
        },
        {
            id: 'e_history',
            question: '是否有既往相关病史？',
            options: [
                { label: '热性惊厥史', value: 'febrile', riskWeight: 10 },
                { label: '脑外伤/脑炎史', value: 'trauma', riskWeight: 20 },
                { label: '家族癫痫史', value: 'family', riskWeight: 15 },
                { label: '无', value: 'none', riskWeight: 0 }
            ]
        }
    ],
    [DiseaseType.COGNITIVE]: [
        {
            id: 'c_complaint',
            question: '您感觉记忆力下降主要表现在？',
            options: [
                { label: '近期事情转头就忘', value: 'recent', riskWeight: 20 },
                { label: '以前的老事记不清了', value: 'remote', riskWeight: 5 },
                { label: '提笔忘字/叫不出名', value: 'language', riskWeight: 15 },
                { label: '性格改变', value: 'behavior', riskWeight: 25 }
            ]
        },
        {
            id: 'c_frequency',
            question: '这种情况发生的频率？',
            options: [
                { label: '偶尔发生', value: 'occasional', riskWeight: 0 },
                { label: '经常发生', value: 'frequent', riskWeight: 15 },
                { label: '持续存在且加重', value: 'progressive', riskWeight: 30 }
            ]
        },
        {
            id: 'c_orientation',
            question: '【关键】是否出现过出门迷路的情况？',
            options: [
                { label: '有过迷路/走丢', value: 'lost', riskWeight: 40, isCritical: true },
                { label: '在熟悉的地方也会迷糊', value: 'place_disorientation', riskWeight: 30 },
                { label: '分不清时间', value: 'time_disorientation', riskWeight: 20 },
                { label: '无此情况', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'c_long_term',
            question: '对于老房子的地址或年轻时的工作，还记得吗？',
            options: [
                { label: '记得很清楚', value: 'intact', riskWeight: 0 },
                { label: '有些模糊', value: 'mild', riskWeight: 10 },
                { label: '完全不记得了', value: 'severe', riskWeight: 30 }
            ]
        },
        {
            id: 'c_adl',
            question: '日常生活能力是否受损？(如买菜算账、做饭)',
            options: [
                { label: '完全能自理', value: 'independent', riskWeight: 0 },
                { label: '复杂事情需要帮助', value: 'mild_impairment', riskWeight: 20 },
                { label: '基本生活需要协助', value: 'dependent', riskWeight: 40, isCritical: true }
            ]
        },
        {
            id: 'c_language',
            question: '说话时是否存在找词困难？',
            options: [
                { label: '经常叫不出物品名字', value: 'naming', riskWeight: 15 },
                { label: '反复问同一个问题', value: 'repetition', riskWeight: 20 },
                { label: '交流无障碍', value: 'normal', riskWeight: 0 }
            ]
        },
        {
            id: 'c_mood',
            question: '情绪或性格是否有明显改变？',
            options: [
                { label: '变得多疑/易怒', value: 'agitation', riskWeight: 20 },
                { label: '变得淡漠/不爱说话', value: 'apathy', riskWeight: 15 },
                { label: '情绪低落', value: 'depression', riskWeight: 10 },
                { label: '无明显改变', value: 'none', riskWeight: 0 }
            ]
        },
        {
            id: 'c_caregiver',
            question: '目前的照护情况是？',
            options: [
                { label: '独居', value: 'alone', riskWeight: 15 },
                { label: '配偶/子女照顾', value: 'family', riskWeight: 0 },
                { label: '保姆/机构', value: 'institution', riskWeight: 0 }
            ]
        },
        {
            id: 'c_sleep',
            question: '是否有睡眠障碍或"日落综合征" (傍晚情绪烦躁)？',
            options: [
                { label: '晚上不睡，白天瞌睡', value: 'reversal', riskWeight: 20 },
                { label: '傍晚容易吵闹', value: 'sundowning', riskWeight: 25 },
                { label: '睡眠尚可', value: 'normal', riskWeight: 0 }
            ]
        }
    ],
    [DiseaseType.UNKNOWN]: []
};
