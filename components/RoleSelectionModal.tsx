
import React, { useState } from 'react';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';
import Button from './common/Button';

interface RoleSelectionModalProps {
    onRoleSelected: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ onRoleSelected }) => {
    const { dispatch } = useApp();
    const [step, setStep] = useState<'select' | 'doctor_upload' | 'family_scan'>('select');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // 角色配置
    const roles = [
        {
            id: UserRole.PATIENT,
            icon: '👨‍🦰',
            title: '患者本人',
            desc: '适用于神经系统慢病患者，可使用全部个人医疗功能',
            color: 'bg-blue-50 text-blue-600 border-blue-100'
        },
        {
            id: UserRole.FAMILY,
            icon: '👨‍👩‍👧',
            title: '家属 / 看护',
            desc: '适用于看护家属，选择后需关联患者账号',
            color: 'bg-orange-50 text-orange-600 border-orange-100'
        },
        {
            id: UserRole.DOCTOR_ASSISTANT,
            icon: '🩺',
            title: '医生助理',
            desc: '仅华西协作医院授权人员，需上传证明',
            color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
        }
    ];

    const handleRoleClick = (role: UserRole) => {
        if (role === UserRole.PATIENT) {
            // 患者直接进入
            dispatch({ type: 'ADD_ROLE', payload: UserRole.PATIENT });
            onRoleSelected();
        } else if (role === UserRole.FAMILY) {
            setStep('family_scan');
        } else if (role === UserRole.DOCTOR_ASSISTANT) {
            setStep('doctor_upload');
        }
    };

    // 模拟家属扫码
    const handleFamilyScan = () => {
        const patientId = prompt("模拟扫码成功: 请输入患者ID (mock: user_001)", "user_001");
        if (patientId) {
            dispatch({ type: 'ADD_ROLE', payload: UserRole.FAMILY });
            dispatch({ type: 'ASSOCIATE_PATIENT', payload: patientId });
            alert(`已成功关联患者 (ID: ${patientId})`);
            onRoleSelected();
        }
    };

    // 模拟医助上传
    const handleDoctorUpload = () => {
        if (!uploadFile) {
            alert("请先选择证明文件");
            return;
        }
        dispatch({ type: 'ADD_ROLE', payload: UserRole.DOCTOR_ASSISTANT });
        dispatch({
            type: 'UPDATE_ASSISTANT_PROOF',
            payload: {
                hospitalName: '华西协作医院(待审)',
                employeeId: 'PENDING-001',
                certificateUrl: 'mock_url',
                verified: false
            }
        });
        alert("证明已提交，等待审核。当前仅开放基础权限。");
        onRoleSelected();
    };

    // 稍后选择 (进入无角色状态的个人中心)
    const handleSkip = () => {
        onRoleSelected();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-slide-up">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-[430px] mx-auto w-full">
                
                {step === 'select' && (
                    <>
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">请选择您的身份</h2>
                            <p className="text-sm text-slate-500">以便为您提供精准的医疗服务</p>
                        </div>

                        <div className="w-full space-y-4">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleClick(role.id)}
                                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-95 flex items-start gap-4 ${role.color} hover:bg-opacity-80`}
                                >
                                    <div className="text-3xl bg-white/50 w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                        {role.icon}
                                    </div>
                                    <div>
                                        <div className="text-lg font-black mb-1">{role.title}</div>
                                        <div className="text-xs opacity-80 leading-relaxed font-bold">{role.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button onClick={handleSkip} className="mt-8 text-slate-400 text-xs font-bold py-4">
                            稍后选择，先逛逛 &gt;
                        </button>
                    </>
                )}

                {step === 'family_scan' && (
                    <div className="text-center w-full">
                        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-pulse">
                            📷
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">扫码关联患者</h3>
                        <p className="text-sm text-slate-500 mb-8 px-8">
                            请扫描患者“个人中心-家属代管”生成的二维码进行绑定
                        </p>
                        <Button fullWidth onClick={handleFamilyScan} className="bg-orange-500 shadow-orange-500/30 mb-4">
                            启动扫描器
                        </Button>
                        <button onClick={() => setStep('select')} className="text-slate-400 text-xs font-bold">
                            返回上一步
                        </button>
                    </div>
                )}

                {step === 'doctor_upload' && (
                    <div className="text-center w-full">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            📂
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">上传授权证明</h3>
                        <p className="text-sm text-slate-500 mb-8 px-4">
                            请上传加盖公章的《华西协作医院医务人员身份证明》
                        </p>
                        
                        <label className="block w-full h-32 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 mb-6 flex flex-col items-center justify-center cursor-pointer active:bg-indigo-50 transition-colors">
                            <span className="text-2xl mb-2">📄</span>
                            <span className="text-xs font-bold text-indigo-400">
                                {uploadFile ? uploadFile.name : '点击选择文件 (JPG/PDF)'}
                            </span>
                            <input type="file" className="hidden" onChange={e => e.target.files && setUploadFile(e.target.files[0])} />
                        </label>

                        <Button fullWidth onClick={handleDoctorUpload} className="bg-indigo-600 shadow-indigo-500/30 mb-4" disabled={!uploadFile}>
                            提交审核
                        </Button>
                        <button onClick={() => setStep('select')} className="text-slate-400 text-xs font-bold">
                            返回上一步
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
