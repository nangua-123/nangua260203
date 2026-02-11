
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { DoctorTask, DoctorNote } from '../../../types';
import Button from '../../common/Button';
import { useToast } from '../../../context/ToastContext';

// --- Subcomponent: Task Item ---
const TaskCard: React.FC<{ task: DoctorTask; onHandle: (t: DoctorTask) => void }> = ({ task, onHandle }) => {
    const isUrgent = task.priority === 'URGENT';
    const typeLabel = {
        'RENTAL_APPROVAL': '📦 租赁审批',
        'RISK_ALERT': '🚨 高危预警',
        'REFERRAL_AUDIT': '🏥 转诊审核',
        'PRESCRIPTION_RENEWAL': '💊 续方申请',
        'REPORT_REVIEW': '📊 报告复核' // [NEW]
    }[task.type];

    return (
        <div className={`bg-white p-4 rounded-2xl border mb-3 shadow-sm active:scale-[0.98] transition-transform ${isUrgent ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {typeLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(task.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                {task.status === 'PENDING' && (
                    <button 
                        onClick={() => onHandle(task)}
                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-indigo-500/20 active:scale-90 transition-transform"
                    >
                        处理
                    </button>
                )}
            </div>
            
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                    {task.avatar || '👤'}
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-800">{task.patientName}</h4>
                    <p className="text-xs text-slate-500 leading-tight mt-1">{task.description}</p>
                </div>
            </div>
        </div>
    );
};

// [NEW] Report Review Modal
const ReportReviewModal: React.FC<{ task: DoctorTask; onClose: () => void; onSubmit: (note: string) => void }> = ({ task, onClose, onSubmit }) => {
    const [note, setNote] = useState('');
    
    // Simulate AI summary content from patient data (In real app, fetch by ID)
    const mockAISummary = "AI 初步分析：患者近7日发作频率较低(1次)，但用药依从性需关注(漏服2次)。CSI指数 82，整体风险可控。建议加强患者教育。";

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up max-w-[430px] mx-auto min-h-[60vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">健康周报复核</h3>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🤖</span>
                            <span className="text-xs font-bold text-slate-500">AI 预生成摘要</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                            {mockAISummary}
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-indigo-900 mb-2 block">医生批注 / 医嘱 (必填)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full h-32 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="请输入您的专业建议，将推送给患者..."
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => onSubmit("已阅，同意 AI 评估。")}>
                        快速通过
                    </Button>
                    <Button className="flex-[2] bg-indigo-600" onClick={() => onSubmit(note)} disabled={!note.trim()}>
                        发送批注
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Mock Data Generator ---
const generateMockTasks = (currentUserId: string): DoctorTask[] => [
    {
        id: 't_001',
        type: 'RENTAL_APPROVAL',
        patientId: currentUserId, // Target current user for demo loopback
        patientName: '当前用户 (演示)',
        avatar: '👨‍🦰',
        title: '申请租赁癫痫监测包',
        description: '申请开通 HaaS 癫痫生命守护包 (30天)，已支付押金，等待设备配发。',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
        priority: 'NORMAL',
        status: 'PENDING'
    },
    {
        id: 't_004',
        type: 'REPORT_REVIEW',
        patientId: currentUserId,
        patientName: '当前用户 (演示)',
        avatar: '👨‍🦰',
        title: '健康周报待复核',
        description: '本周 AI 健康周报已生成，包含 1 次疑似发作记录，请复核并给出建议。',
        timestamp: Date.now() - 1000 * 60 * 30,
        priority: 'HIGH',
        status: 'PENDING'
    },
    {
        id: 't_002',
        type: 'RISK_ALERT',
        patientId: 'p_998',
        patientName: '陈建国',
        avatar: '👴',
        title: '连续抽搐预警',
        description: 'IoT 设备监测到持续强直阵挛发作 > 3分钟，SPO2 降至 88%。',
        timestamp: Date.now() - 1000 * 60 * 2, 
        priority: 'URGENT',
        status: 'PENDING'
    },
    {
        id: 't_003',
        type: 'REFERRAL_AUDIT',
        patientId: 'p_997',
        patientName: '张敏',
        avatar: '👩',
        title: '双向转诊申请',
        description: '申请从社区医院转诊至华西本部神经内科，主诉难治性偏头痛。',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, 
        priority: 'HIGH',
        status: 'PENDING'
    }
];

export const DoctorWorkbench: React.FC = () => {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'TODO' | 'PATIENTS'>('TODO');
    const [reviewTask, setReviewTask] = useState<DoctorTask | null>(null);
    
    // --- Init Mock Tasks ---
    useEffect(() => {
        if (state.doctorTasks.length === 0) {
            dispatch({ type: 'INIT_DOCTOR_TASKS', payload: generateMockTasks(state.user.id) });
        }
    }, []);

    const pendingTasks = state.doctorTasks.filter(t => t.status === 'PENDING');
    const urgentCount = pendingTasks.filter(t => t.priority === 'URGENT').length;

    const handleProcessTask = (task: DoctorTask) => {
        if (task.type === 'REPORT_REVIEW') {
            setReviewTask(task); // Open modal
            return;
        }

        if (task.type === 'RENTAL_APPROVAL') {
            const confirm = window.confirm(`确认批准 ${task.patientName} 的设备租赁申请？\n这将激活该用户的 HaaS 设备权限。`);
            if (confirm) {
                dispatch({ type: 'COMPLETE_DOCTOR_TASK', payload: { taskId: task.id, outcome: 'APPROVED' } });
                showToast('已批准租赁，设备权限已下发', 'success');
            }
        } else if (task.type === 'RISK_ALERT') {
            const action = window.prompt("高危预警处理：\n1. 拨打患者电话\n2. 发送安抚短信\n3. 标记为误报", "1");
            if (action === "1") {
                window.location.href = "tel:120"; // Demo
            } else if (action === "2") {
                dispatch({ 
                    type: 'COMPLETE_DOCTOR_TASK', 
                    payload: { taskId: task.id, outcome: 'APPROVED', note: '医生已介入关注，请保持电话畅通。' } 
                });
                showToast('安抚短信已发送', 'success');
            }
        } else {
            // General approval
            dispatch({ type: 'COMPLETE_DOCTOR_TASK', payload: { taskId: task.id, outcome: 'APPROVED' } });
            showToast('任务已处理', 'success');
        }
    };

    const handleSubmitReview = (content: string) => {
        if (!reviewTask) return;
        
        // 1. Dispatch Note to Patient
        const note: DoctorNote = {
            id: `note_${Date.now()}`,
            doctorId: 'doc_001',
            doctorName: '李医生(助理)',
            content: content,
            timestamp: Date.now(),
            type: 'REPORT_VERIFICATION'
        };
        dispatch({ type: 'ADD_DOCTOR_NOTE', payload: note });

        // 2. Complete Task
        dispatch({ type: 'COMPLETE_DOCTOR_TASK', payload: { taskId: reviewTask.id, outcome: 'APPROVED' } });
        
        setReviewTask(null);
        showToast('批注已发送，患者端即刻可见', 'success');
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-safe flex flex-col">
            {/* Header */}
            <div className="bg-indigo-600 pt-[calc(1rem+env(safe-area-inset-top))] pb-12 px-6 rounded-b-[32px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="relative z-10 flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl border-2 border-white/30 backdrop-blur-md shadow-sm">
                            🩺
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">李医生 (助理)</h2>
                            <p className="text-[10px] text-indigo-100 opacity-90 bg-indigo-700/50 px-2 py-0.5 rounded-full inline-block mt-1">
                                华西神经内科协作组
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">今日待办</div>
                        <div className="text-2xl font-black text-white">{pendingTasks.length}</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-indigo-100 font-bold mb-1">高危预警</div>
                        <div className="text-lg font-black text-red-300">{urgentCount}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-indigo-100 font-bold mb-1">签约患者</div>
                        <div className="text-lg font-black text-white">128</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <div className="text-xs text-indigo-100 font-bold mb-1">随访率</div>
                        <div className="text-lg font-black text-emerald-300">92%</div>
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="px-6 -mt-6 relative z-10">
                <div className="bg-white rounded-xl shadow-sm p-1 flex">
                    <button 
                        onClick={() => setActiveTab('TODO')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'TODO' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        待办事项
                    </button>
                    <button 
                        onClick={() => setActiveTab('PATIENTS')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'PATIENTS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        我的患者
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-4 py-4 overflow-y-auto">
                {activeTab === 'TODO' ? (
                    pendingTasks.length > 0 ? (
                        <div className="space-y-1 animate-slide-up">
                            {pendingTasks.map(task => (
                                <TaskCard key={task.id} task={task} onHandle={handleProcessTask} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <span className="text-4xl mb-4 grayscale opacity-50">☕</span>
                            <p className="text-xs font-bold">暂无待办事项，喝杯咖啡吧</p>
                        </div>
                    )
                ) : (
                    <div className="space-y-3 animate-slide-up">
                        {/* Mock Patient List */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between active:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">👤</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">患者 {1000 + i}</div>
                                        <div className="text-[10px] text-slate-400">V{i} 随访阶段 · 依从性良好</div>
                                    </div>
                                </div>
                                <span className="text-slate-300">›</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {reviewTask && (
                <ReportReviewModal 
                    task={reviewTask} 
                    onClose={() => setReviewTask(null)} 
                    onSubmit={handleSubmitReview} 
                />
            )}
        </div>
    );
};
