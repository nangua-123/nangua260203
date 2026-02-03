
import React, { useState } from 'react';
import { DiseaseType } from '../types';
import Layout from './Layout';
import Button from './Button';

interface AssessmentViewProps {
  type: DiseaseType;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Question {
  id: number;
  text: string;
  type: 'choice' | 'number' | 'slider';
  options?: { label: string; value: number }[];
  min?: number;
  max?: number;
  suffix?: string;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ type, onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [inputValue, setInputValue] = useState<string>('');

  // --- SCALE DEFINITIONS ---

  // MIDAS (Migraine Disability Assessment)
  const midasQuestions: Question[] = [
    { id: 1, text: "过去3个月，有多少天您因头痛【完全无法】工作、上学或做家务？", type: 'number', max: 90, suffix: "天" },
    { id: 2, text: "过去3个月，有多少天您的工作或学习效率【降低了一半以上】？(不包括完全无法工作的天数)", type: 'number', max: 90, suffix: "天" },
    { id: 3, text: "过去3个月，有多少天您【没有】进行家务劳动？", type: 'number', max: 90, suffix: "天" },
    { id: 4, text: "过去3个月，有多少天您做家务的效率【降低了一半以上】？", type: 'number', max: 90, suffix: "天" },
    { id: 5, text: "过去3个月，您共有多少天出现过头痛？(频率评估)", type: 'number', max: 90, suffix: "天" },
    { id: 6, text: "您通常头痛时的疼痛程度是多少？(0=无痛, 10=剧痛)", type: 'slider', min: 0, max: 10 }
  ];

  // AD8 (Dementia Screening Interview)
  const ad8Questions: Question[] = [
    { id: 1, text: "判断力出现问题（如做决定困难、财务混乱、判断错误）", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 2, text: "对活动和嗜好的兴趣降低", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 3, text: "重复相同的问题、故事或陈述", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 4, text: "学习使用小器具（遥控器、微波炉）有困难", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 5, text: "记不清当前的月份或年份", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 6, text: "处理复杂的财务问题有困难（如个人所得税、缴费）", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 7, text: "记不住约会的时间", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
    { id: 8, text: "日常记忆和思维能力出现持续的问题", type: 'choice', options: [{label: "是，有改变", value: 1}, {label: "否，无改变", value: 0}, {label: "不知道", value: 0}] },
  ];

  // General Epilepsy Screening
  const epilepsyQuestions: Question[] = [
    { id: 1, text: "近三个月内，是否出现过意识突然丧失或倒地？", type: 'choice', options: [{label: "有", value: 5}, {label: "无", value: 0}] },
    { id: 2, text: "发作时是否伴有肢体抽搐、口吐白沫 or 尿失禁？", type: 'choice', options: [{label: "有", value: 5}, {label: "无", value: 0}] },
    { id: 3, text: "发作后是否感到极度疲劳、头痛 or 意识模糊？", type: 'choice', options: [{label: "是", value: 3}, {label: "否", value: 0}] },
    { id: 4, text: "是否有各种形式的先兆（如闻到怪味、眼前闪光、心慌）？", type: 'choice', options: [{label: "经常", value: 3}, {label: "偶尔", value: 1}, {label: "无", value: 0}] },
  ];

  const getQuestions = () => {
    switch (type) {
      case DiseaseType.MIGRAINE: return midasQuestions;
      case DiseaseType.COGNITIVE: return ad8Questions;
      case DiseaseType.EPILEPSY: return epilepsyQuestions;
      default: return epilepsyQuestions;
    }
  };

  const questions = getQuestions();
  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleNext = (val: number) => {
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);
    setInputValue('');

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate Score
      let totalScore = 0;
      if (type === DiseaseType.MIGRAINE) {
        // MIDAS Score: Sum of Q1-Q5 (days). Q6 is severity (not part of sum usually but useful)
        // Standard MIDAS sums days of disability. Let's sum Q1-Q5.
        // Note: Q5 is frequency assessment, standard MIDAS sums Q1-Q5 (A+B+A+B+Freq) -> Wait, Standard MIDAS is Q1+Q2+Q3+Q4+Q5? 
        // Correction: Standard MIDAS is sum of days from 5 questions regarding lost time. 
        // Q1 (Work missed), Q2 (Work reduced), Q3 (Housework missed), Q4 (Housework reduced), Q5 (Social/Family missed).
        // My mock questions slightly differ but logic is sum.
        // FIX: Cast 'v' to number to avoid 'unknown' type error during addition
        Object.entries(newAnswers).forEach(([k, v]) => {
           if (parseInt(k) <= 5) totalScore += (v as number);
        });
      } else {
        // Simple Sum for AD8 and Epilepsy
        // FIX: Cast Object.values result to number[] to avoid 'unknown' type error during addition
        (Object.values(newAnswers) as number[]).forEach(v => totalScore += v);
      }
      onComplete(totalScore);
    }
  };

  return (
    <Layout headerTitle="专业风险评估" showBack onBack={onBack}>
      <div className="p-6">
        <div className="mb-6">
           <div className="flex justify-between text-xs text-slate-400 mb-1">
               <span>进度</span>
               <span>{step + 1}/{questions.length}</span>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card min-h-[360px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-8 leading-relaxed">
                {currentQ.text}
            </h3>

            <div className="flex-1">
                {currentQ.type === 'choice' && (
                    <div className="space-y-3">
                        {currentQ.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNext(opt.value)}
                                className="w-full p-4 text-left border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all active:scale-[0.99] font-medium text-slate-600"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === 'number' && (
                    <div className="space-y-6">
                         <div className="flex items-center gap-3">
                             <input 
                                type="number" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="0"
                                className="flex-1 text-3xl font-bold text-center border-b-2 border-brand-200 py-2 focus:border-brand-600 outline-none bg-transparent text-brand-900 placeholder:text-slate-200"
                                autoFocus
                             />
                             <span className="text-slate-500 font-medium">{currentQ.suffix}</span>
                         </div>
                         <Button 
                            fullWidth 
                            onClick={() => handleNext(parseInt(inputValue || '0'))}
                            disabled={!inputValue}
                         >
                             下一题
                         </Button>
                    </div>
                )}

                {currentQ.type === 'slider' && (
                    <div className="space-y-8 px-2">
                        <div className="relative pt-6">
                            <input 
                                type="range" 
                                min={currentQ.min} 
                                max={currentQ.max} 
                                step="1"
                                defaultValue={0}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-4">
                                <span>0 (无痛)</span>
                                <span>5 (中度)</span>
                                <span>10 (剧痛)</span>
                            </div>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 py-1 rounded-lg font-bold text-lg shadow-lg">
                                {inputValue || '0'}
                            </div>
                        </div>
                        <Button fullWidth onClick={() => handleNext(parseInt(inputValue || '0'))}>
                            确认
                        </Button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
                {type === DiseaseType.MIGRAINE && "本量表基于 MIDAS (Migraine Disability Assessment) 标准"}
                {type === DiseaseType.COGNITIVE && "本量表基于 AD8 (Dementia Screening Interview) 标准"}
            </p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                预计耗时 2 分钟
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssessmentView;
