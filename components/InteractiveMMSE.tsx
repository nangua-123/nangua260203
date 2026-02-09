
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Layout from './common/Layout';
import Button from './common/Button';
import { useToast } from '../context/ToastContext';
import { CognitiveProfile } from '../types';

interface InteractiveMMSEProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

type Step = 'INTRO' | 'ORIENTATION' | 'MEMORY_ENCODING' | 'MEMORY_RECALL' | 'RESULT';

const MEMORY_WORDS = ['皮球', '旗帜', '大树'];
const DISTRACTORS = ['篮球', '风筝', '森林', '地球', '毛巾', '汽车'];

export const InteractiveMMSE: React.FC<InteractiveMMSEProps> = ({ onComplete, onBack }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('INTRO');
  const [score, setScore] = useState(0);
  
  // Orientation State
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [correctDate, setCorrectDate] = useState('');

  // Memory State
  const [timeLeft, setTimeLeft] = useState(5);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [recallOptions, setRecallOptions] = useState<string[]>([]);

  // Init Orientation Options
  useEffect(() => {
    const today = new Date();
    const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
    
    const target = fmt(today);
    setCorrectDate(target);

    const opts = [target];
    // Generate 3 wrong dates
    for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + (Math.random() > 0.5 ? i : -i));
        opts.push(fmt(d));
    }
    // Shuffle
    setDateOptions(opts.sort(() => Math.random() - 0.5));
    
    // Prep recall options
    const allWords = [...MEMORY_WORDS, ...DISTRACTORS].sort(() => Math.random() - 0.5);
    setRecallOptions(allWords);
  }, []);

  // Timer for Memory Encoding
  useEffect(() => {
    if (currentStep === 'MEMORY_ENCODING') {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCurrentStep('MEMORY_RECALL');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [currentStep]);

  const handleOrientationSelect = (date: string) => {
      if (date === correctDate) {
          setScore(s => s + 5); // 定向力 5分
          showToast('太棒了，大脑活跃度 +1%！', 'success');
      } else {
          showToast('差一点点，正确的日期是今天哦', 'info');
      }
      setTimeout(() => setCurrentStep('MEMORY_ENCODING'), 1000);
  };

  const handleWordSelect = (word: string) => {
      if (selectedWords.includes(word)) {
          setSelectedWords(prev => prev.filter(w => w !== word));
      } else {
          if (selectedWords.length < 3) {
              setSelectedWords(prev => [...prev, word]);
          }
      }
  };

  const submitRecall = () => {
      let memoryScore = 0;
      selectedWords.forEach(w => {
          if (MEMORY_WORDS.includes(w)) memoryScore += 2; // 每个词 2分，共6分
      });
      const finalScore = score + memoryScore;
      setScore(finalScore);
      
      // Data Write-back
      const profile: CognitiveProfile = {
          ...state.user.cognitiveProfile,
          isComplete: true,
          source: 'AI_GENERATED',
          mmseScoreEstimate: finalScore >= 8 ? '正常' : '需关注',
          miniMentalScore: finalScore, // [HARD_REQUIREMENT]
          symptoms: state.user.cognitiveProfile?.symptoms || [],
          adlScore: state.user.cognitiveProfile?.adlScore || '待评',
          caregiver: state.user.cognitiveProfile?.caregiver || '未知',
          lastUpdated: Date.now()
      };

      // Ensure we update the correct profile (Self or Family)
      const activeId = state.user.currentProfileId || state.user.id;
      dispatch({ type: 'UPDATE_PROFILE', payload: { id: activeId, profile: profile as any } }); // Casting due to loose coupling in profile types logic

      setCurrentStep('RESULT');
  };

  const finishAssessment = () => {
      onComplete(score);
  };

  // --- Render Steps ---

  const renderIntro = () => (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg shadow-indigo-200">
              🧠
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">数字华佗 MMSE 认知筛查</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-xs">
              通过两个简单有趣的互动游戏<br/>快速评估您的大脑活力。
          </p>
          <Button fullWidth onClick={() => setCurrentStep('ORIENTATION')} className="py-4 text-lg bg-indigo-600 shadow-indigo-500/30">
              开始大脑体检
          </Button>
      </div>
  );

  const renderOrientation = () => (
      <div className="p-6 h-full flex flex-col animate-slide-up">
          <div className="mb-8">
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">第一关</span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">今天是几月几号？</h2>
              <p className="text-sm text-slate-400 mt-1">测试您的时间定向能力</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
              {dateOptions.map((date, idx) => (
                  <button
                      key={idx}
                      onClick={() => handleOrientationSelect(date)}
                      className="aspect-[4/3] bg-white border-2 border-slate-100 rounded-2xl shadow-sm text-xl font-black text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center"
                  >
                      {date}
                  </button>
              ))}
          </div>
      </div>
  );

  const renderMemoryEncoding = () => (
      <div className="p-6 h-full flex flex-col items-center justify-center animate-fade-in text-center">
          <div className="mb-10">
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">第二关</span>
              <h2 className="text-xl font-black text-slate-900 mt-2">请记住这 3 个词</h2>
          </div>

          <div className="flex gap-4 mb-12">
              {MEMORY_WORDS.map((word, idx) => (
                  <div key={idx} className="w-24 h-32 bg-white border-2 border-indigo-100 rounded-2xl flex flex-col items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <span className="text-3xl mb-2">
                          {word === '皮球' ? '🏀' : word === '旗帜' ? '🚩' : '🌲'}
                      </span>
                      <span className="text-lg font-black text-slate-800">{word}</span>
                  </div>
              ))}
          </div>

          <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>记忆倒计时</span>
                  <span>{timeLeft}s</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / 5) * 100}%` }}
                  ></div>
              </div>
          </div>
      </div>
  );

  const renderMemoryRecall = () => (
      <div className="p-6 h-full flex flex-col animate-slide-up">
          <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900">刚才展示的是哪三个词？</h2>
              <p className="text-sm text-slate-400 mt-1">请从下方选出正确答案 ({selectedWords.length}/3)</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
              {recallOptions.map((word, idx) => {
                  const isSelected = selectedWords.includes(word);
                  return (
                      <button
                          key={idx}
                          onClick={() => handleWordSelect(word)}
                          className={`aspect-square rounded-2xl font-bold text-lg transition-all active:scale-95 border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white border-slate-100 text-slate-600'}`}
                      >
                          {word}
                      </button>
                  );
              })}
          </div>

          <div className="mt-auto">
              <Button 
                  fullWidth 
                  onClick={submitRecall} 
                  disabled={selectedWords.length !== 3}
                  className={selectedWords.length === 3 ? "bg-indigo-600 shadow-xl" : "bg-slate-200 text-slate-400"}
              >
                  确认提交
              </Button>
          </div>
      </div>
  );

  const renderResult = () => (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-slide-up">
          <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center text-6xl mb-6 border-4 border-emerald-100">
              {score >= 8 ? '🎉' : '🛡️'}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
              {score >= 8 ? '大脑状态极佳！' : '建议加强训练'}
          </h2>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl mb-8">
              <span className="text-slate-500 font-bold mr-2">本次得分</span>
              <span className={`text-3xl font-black ${score >= 8 ? 'text-emerald-500' : 'text-orange-500'}`}>{score}</span>
              <span className="text-slate-300 ml-1">/ 11</span>
          </div>
          <Button fullWidth onClick={finishAssessment} className="bg-slate-900">
              查看详细报告
          </Button>
      </div>
  );

  return (
    <Layout headerTitle={currentStep === 'INTRO' ? '认知筛查' : '大脑体检中...'} showBack={currentStep === 'INTRO'} onBack={onBack}>
        <div className="h-full bg-white pb-safe">
            {currentStep === 'INTRO' && renderIntro()}
            {currentStep === 'ORIENTATION' && renderOrientation()}
            {currentStep === 'MEMORY_ENCODING' && renderMemoryEncoding()}
            {currentStep === 'MEMORY_RECALL' && renderMemoryRecall()}
            {currentStep === 'RESULT' && renderResult()}
        </div>
    </Layout>
  );
};
