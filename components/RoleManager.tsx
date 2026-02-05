
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface RoleManagerProps {
    onClose: () => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ onClose }) => {
    const { state, dispatch } = useApp();
    const { user } = state;
    const [activeTab, setActiveTab] = useState<'switch' | 'add'>('switch');
    const [addRoleType, setAddRoleType] = useState<UserRole | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);

    // 角色配置元数据
    const roleMeta = {
        [UserRole.PATIENT]: { label: '患者本人', icon: '👨‍🦰', color: 'bg-blue-50 text-blue-600', desc: '全功能医疗服务' },
        [UserRole.FAMILY]: { label: '家属 / 看护', icon: '👨‍👩‍👧', color: 'bg-orange-50 text-orange-600', desc: '关联患者，远程看护' },
        [UserRole.DOCTOR_ASSISTANT]: { label: '医生助理', icon: '🩺', color: 'bg-indigo-50 text-indigo-600', desc: '华西协作，随访管理' }
    };

    // 切换角色
    const handleSwitch = (role: UserRole) => {
        if (role !== user.role) {
            dispatch({ type: 'SWITCH_ROLE', payload: role });
        }
        onClose();
    };

    // 添加角色逻辑
    const handleAddRole = (role: UserRole) => {
        setAddRoleType(role);
    };

    const confirmAddRole = () => {
        if (!addRoleType) return;

        // 模拟特定角色的前置条件
        if (addRoleType === UserRole.FAMILY) {
            // 模拟扫码
            const patientId = prompt("模拟扫码成功: 请输入患者ID (mock: user_001)", "user_001");
            if (!patientId) return;
            
            dispatch({ type: 'ADD_ROLE', payload: UserRole.FAMILY });
            dispatch({ type: 'ASSOCIATE_PATIENT', payload: patientId });
            alert(`已成功关联患者 (ID: ${patientId})`);
        } else if (addRoleType === UserRole.DOCTOR_ASSISTANT) {
            if (!proofFile) {
                alert("请先上传证明文件");
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
            alert("证明已提交，等待审核。");
        } else {
            // 患者角色直接添加
            dispatch({ type: 'ADD_ROLE', payload: UserRole.PATIENT });
        }

        setAddRoleType(null);
        setActiveTab('switch');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-[32px] p-6 relative z-10 animate-slide-up max-w-[430px] mx-auto min-h-[60vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">角色管理</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    <button 
                        onClick={() => { setActiveTab('switch'); setAddRoleType(null); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'switch' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                        切换当前角色
                    </button>
                    <button 
                        onClick={() => { setActiveTab('add'); setAddRoleType(null); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'add' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                        添加新身份
                    </button>
                </div>

                {/* Content: Switch Role */}
                {activeTab === 'switch' && (
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {user.availableRoles.map(role => (
                            <button
                                key={role}
                                onClick={() => handleSwitch(role)}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-[0.98] ${
                                    user.role === role 
                                    ? 'border-brand-500 bg-brand-50/50' 
                                    : 'border-slate-100 bg-white hover:border-brand-200'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${roleMeta[role].color.replace('text-', 'bg-').replace('50', '100')}`}>
                                    {roleMeta[role].icon}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-900">{roleMeta[role].label}</span>
                                        {user.role === role && <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">当前使用</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{roleMeta[role].desc}</p>
                                </div>
                                {user.role === role && <div className="text-brand-500">✔</div>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content: Add Role */}
                {activeTab === 'add' && !addRoleType && (
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {(Object.keys(roleMeta) as UserRole[]).filter(r => !user.availableRoles.includes(r)).map(role => (
                            <button
                                key={role}
                                onClick={() => handleAddRole(role)}
                                className="w-full p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center gap-4 transition-all active:scale-[0.98]"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl grayscale opacity-70 bg-slate-100`}>
                                    {roleMeta[role].icon}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-black text-slate-900">{roleMeta[role].label}</div>
                                    <p className="text-xs text-slate-400 mt-0.5">{roleMeta[role].desc}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 font-bold">+</div>
                            </button>
                        ))}
                        {user.availableRoles.length === 3 && (
                            <div className="text-center text-slate-400 text-xs py-10">
                                您已解锁所有可用身份
                            </div>
                        )}
                    </div>
                )}

                {/* Content: Specific Role Setup */}
                {activeTab === 'add' && addRoleType === UserRole.FAMILY && (
                    <div className="flex-1 flex flex-col items-center text-center animate-fade-in pt-4">
                        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-4xl mb-6">📷</div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">扫码关联患者</h4>
                        <p className="text-xs text-slate-500 mb-8 px-8">请扫描患者“个人中心-家属代管”生成的二维码，或输入患者ID进行绑定。</p>
                        <Button fullWidth onClick={confirmAddRole} className="bg-orange-500 shadow-orange-500/30">启动扫描器</Button>
                        <button onClick={() => setAddRoleType(null)} className="text-slate-400 text-xs font-bold mt-4">返回选择</button>
                    </div>
                )}

                {activeTab === 'add' && addRoleType === UserRole.DOCTOR_ASSISTANT && (
                    <div className="flex-1 flex flex-col items-center text-center animate-fade-in pt-4">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-4xl mb-6">📂</div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">上传资质证明</h4>
                        <p className="text-xs text-slate-500 mb-6 px-4">请上传《华西协作医院医务人员身份证明》</p>
                        
                        <label className="block w-full h-32 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 mb-6 flex flex-col items-center justify-center cursor-pointer active:bg-indigo-50 transition-colors">
                            <span className="text-2xl mb-2">📄</span>
                            <span className="text-xs font-bold text-indigo-400">
                                {proofFile ? proofFile.name : '点击选择文件 (JPG/PDF)'}
                            </span>
                            <input type="file" className="hidden" onChange={e => e.target.files && setProofFile(e.target.files[0])} />
                        </label>

                        <Button fullWidth onClick={confirmAddRole} disabled={!proofFile} className="bg-indigo-600 shadow-indigo-500/30">提交审核</Button>
                        <button onClick={() => setAddRoleType(null)} className="text-slate-400 text-xs font-bold mt-4">返回选择</button>
                    </div>
                )}

            </div>
        </div>
    );
};
