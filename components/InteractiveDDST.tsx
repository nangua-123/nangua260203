
import React, { useState, useMemo } from 'react';
import Button from './common/Button';
import { useToast } from '../context/ToastContext';

interface InteractiveDDSTProps {
    initialAgeMonths?: number;
    onComplete: (result: { status: 'NORMAL' | 'SUSPECT' | 'ABNORMAL', desc: string }) => void;
    onCancel: () => void;
}

type Domain = 'PS' | 'FM' | 'LANG' | 'GM';

interface Question {
    id: string;
    domain: Domain;
    text: string;
    icon: string;
    ageGroup: number; // 6, 9, 12
    isRedFlag: boolean; // If failed, counts as delay
}

// Simplified DDST Items for 6-12 Months
const DDST_ITEMS: Question[] = [
    // 6 Months
    { id: '6_gm_roll', domain: 'GM', text: '宝宝能从仰卧翻身到俯卧吗？', icon: '🔄', ageGroup: 6, isRedFlag: true },
    { id: '6_fm_reach', domain: 'FM', text: '宝宝能主动伸手抓取面前的玩具吗？', icon: '🧸', ageGroup: 6, isRedFlag: true },
    { id: '6_lang_squeal', domain: 'LANG', text: '高兴时会尖叫或发声大笑吗？', icon: '😄', ageGroup: 6, isRedFlag: false },
    { id: '6_ps_feed', domain: 'PS', text: '喂食时会自己用手扶着奶瓶或摸索吗？', icon: '🍼', ageGroup: 6, isRedFlag: false },

    // 9 Months
    { id: '9_gm_sit', domain: 'GM', text: '宝宝能不需要支撑，自己坐得很稳吗？', icon: '🧘', ageGroup: 9, isRedFlag: true },
    { id: '9_fm_pass', domain: 'FM', text: '能把玩具从一只手换到另一只手吗？', icon: '👐', ageGroup: 9, isRedFlag: true },
    { id: '9_lang_dada', domain: 'LANG', text: '会发类似“ba-ba”、“ma-ma”的音吗（无意识）？', icon: '🗣️', ageGroup: 9, isRedFlag: true },
    { id: '9_ps_bye', domain: 'PS', text: '会做“再见”或“欢迎”的手势吗？', icon: '👋', ageGroup: 9, isRedFlag: false },

    // 12 Months
    { id: '12_gm_stand', domain: 'GM', text: '扶着栏杆或家具能站起来吗？', icon: '🪜', ageGroup: 12, isRedFlag: true },
    { id: '12_fm_thumb', domain: 'FM', text: '能用拇指和食指捏起小物品（如葡萄干/豆子）吗？', icon: '👌', ageGroup: 12, isRedFlag: true },
    { id: '12_lang_word', domain: 'LANG', text: '除了爸妈，能有意识说出1个有意义的词吗（如拿、灯）？', icon: '💡', ageGroup: 12, isRedFlag: true },
    { id: '12_ps_ball', domain: 'PS', text: '和你玩球时，能把球滚回来或递给你吗？', icon: '⚽', ageGroup: 12, isRedFlag: false },
];

export const InteractiveDDST: React.FC<InteractiveDDSTProps> = ({ initialAgeMonths = 9, onComplete, onCancel }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState<'AGE_CONFIRM' | 'TEST' | 'RESULT'>('AGE_CONFIRM');
    const [age, setAge] = useState(initialAgeMonths);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Filter questions appropriate for the age (Current age tier + Previous tier if needed)
    // Simplified: Show questions for the closest age tier <= actual age, plus the next tier up to check advanced dev.
    // Actually for screening, we care if they FAIL items at their current age or below.
    const relevantQuestions = useMemo(() => {
        let targetTier = 6;
        if (age >= 11) targetTier = 12;
        else if (age >= 8) targetTier = 9;
        else targetTier = 6;

        return DDST_ITEMS.filter(q => q.ageGroup <= targetTier).sort((a,b) => a.ageGroup - b.ageGroup);
    }, [age]);

    const handleAnswer = (val: boolean) => {
        const q = relevantQuestions[currentQuestionIndex];
        setAnswers(prev => ({ ...prev, [q.id]: val }));

        if (currentQuestionIndex < relevantQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            analyzeResult();
        }
    };

    const analyzeResult = () => {
        const failures: Record<Domain, number> = { PS: 0, FM: 0, LANG: 0, GM: 0 };
        const failedItems: string[] = [];

        relevantQuestions.forEach(q => {
            const passed = answers[q.id];
            // If item is a Red Flag for this age and they failed it -> Count as Delay
            // Note: In real DDST, the bar is % of population. Here we simplified isRedFlag as "Most children should do this".
            if (!passed && q.isRedFlag) {
                failures[q.domain]++;
                failedItems.push(q.text);
            }
        });

        let delayedDomains = 0;
        let totalDelays = 0;
        let desc = "";

        Object.entries(failures).forEach(([domain, count]) => {
            if (count > 0) {
                totalDelays += count;
                delayedDomains++;
                const domainName = domain === 'PS' ? '个人-社会' : domain === 'FM' ? '精细动作' : domain === 'LANG' ? '语言' : '大运动';
                desc += `${domainName}滞后; `;
            }
        });

        let status: 'NORMAL' | 'SUSPECT' | 'ABNORMAL' = 'NORMAL';

        // Simplified Rules
        if (delayedDomains >= 2 || totalDelays >= 3) {
            status = 'ABNORMAL';
        } else if (delayedDomains === 1 || totalDelays > 0) {
            status = 'SUSPECT';
        }

        if (status === 'NORMAL') desc = "各能区发育指标符合月龄标准";

        setStep('RESULT');
        setTimeout(() => {
            onComplete({ status, desc });
        }, 2000); // Show result screen briefly then close
    };

    const progress = ((currentQuestionIndex + 1) / relevantQuestions.length) * 100;
    const currentQ = relevantQuestions[currentQuestionIndex];

    if (step === 'AGE_CONFIRM') {
        return (
            <div className="fixed inset-0 z-[150] bg-white flex flex-col p-6 animate-slide-up">
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="text-6xl mb-6">👶</div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">DDST 发育筛查</h2>
                    <p className="text-sm text-slate-500 mb-8 px-4">
                        丹佛发育筛查测验 (Denver Developmental Screening Test) 是国际通用的儿童发育评估工具。
                    </p>
                    
                    <div className="w-full max-w-xs bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-3">确认宝宝月龄</label>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => setAge(Math.max(1, age - 1))} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-slate-600">-</button>
                            <span className="text-4xl font-black text-indigo-600 w-16">{age}</span>
                            <button onClick={() => setAge(age + 1)} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-slate-600">+</button>
                        </div>
                        <span className="text-xs text-slate-400 mt-2 block">个月</span>
                    </div>

                    <Button fullWidth onClick={() => setStep('TEST')} className="bg-indigo-600 shadow-indigo-500/30">
                        开始评估
                    </Button>
                    <button onClick={onCancel} className="mt-4 text-slate-400 text-xs font-bold">取消</button>
                </div>
            </div>
        );
    }

    if (step === 'RESULT') {
        // This is a transient state before onComplete fires in useEffect/timeout
        return (
            <div className="fixed inset-0 z-[150] bg-indigo-600 flex flex-col justify-center items-center text-white p-8 text-center animate-fade-in">
                <div className="text-6xl mb-6 animate-bounce">📊</div>
                <h2 className="text-2xl font-black mb-2">分析完成</h2>
                <p className="opacity-80 text-sm">正在生成 V5 随访发育报告...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 bg-white shadow-sm z-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-slate-400">DDST SCREENING</span>
                    <span className="text-xs font-bold text-indigo-600">{currentQuestionIndex + 1} / {relevantQuestions.length}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center p-6 relative">
                {/* Domain Badge */}
                <div className="absolute top-6 left-6">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        currentQ.domain === 'GM' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        currentQ.domain === 'FM' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        currentQ.domain === 'LANG' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                        {currentQ.domain === 'GM' ? '大运动' : currentQ.domain === 'FM' ? '精细动作' : currentQ.domain === 'LANG' ? '语言能力' : '个人社会'}
                    </span>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-xl text-center border border-slate-100 min-h-[300px] flex flex-col items-center justify-center">
                    <div className="text-6xl mb-6">{currentQ.icon}</div>
                    <h3 className="text-xl font-black text-slate-800 mb-8 leading-snug">
                        {currentQ.text}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button 
                            onClick={() => handleAnswer(false)}
                            className="py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-lg active:scale-95 transition-all hover:bg-slate-50"
                        >
                            否 / 不会
                        </button>
                        <button 
                            onClick={() => handleAnswer(true)}
                            className="py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                        >
                            是 / 能做
                        </button>
                    </div>
                </div>
                
                <p className="text-center text-xs text-slate-400 mt-8">
                    请根据宝宝最近一周的实际表现回答
                </p>
            </div>
        </div>
    );
};
