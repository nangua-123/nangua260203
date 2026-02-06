
import React, { useState } from 'react';
import { User, AppView, UserRole, DiseaseType } from '../types';
import Layout from '../components/common/Layout';
import { useApp } from '../context/AppContext';
import { useRole } from '../hooks/useRole';
import { FamilyManagedModal } from '../components/FamilyManagedModal';
import { RoleManager } from '../components/RoleManager'; // [NEW]
import { useToast } from '../context/ToastContext';

interface ProfileViewProps {
    user: User;
    hasDevice: boolean;
    onNavigate: (v: AppView) => void;
    onClearCache: () => void;
    onToggleElderly: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, hasDevice, onNavigate, onClearCache, onToggleElderly }) => {
    const { dispatch } = useApp();
    const { isPatient, isFamily, isDoctor, checkPermission } = useRole();
    const { showToast } = useToast();
    const [showQR, setShowQR] = useState(false);
    const [showRoleManager, setShowRoleManager] = useState(false); // [NEW]

    // AD 患者判定
    const isADPatient = user.isElderlyMode || user.headacheProfile?.diagnosisType?.includes('AD') || false;

    // 当前是否在查看关联患者视角
    const isViewingPatient = user.associatedPatientId && user.currentProfileId === user.associatedPatientId;

    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗？')) {
            dispatch({ type: 'LOGOUT' });
        }
    };

    const handleSwitchContext = () => {
        if (!user.associatedPatientId) return;
        
        if (isViewingPatient) {
            // 切回自己
            dispatch({ type: 'SWITCH_PATIENT', payload: user.id });
            showToast('已切回个人视图', 'success');
        } else {
            // 切到患者
            dispatch({ type: 'SWITCH_PATIENT', payload: user.associatedPatientId });
            showToast('已切换至患者代管视图', 'success');
            setTimeout(() => onNavigate('home'), 500); // 自动跳转到首页查看数据
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case UserRole.PATIENT: return { label: '患者本人', icon: '👨‍🦰', color: 'bg-blue-100 text-blue-600' };
            case UserRole.FAMILY: return { label: '家属看护', icon: '👨‍👩‍👧', color: 'bg-orange-100 text-orange-600' };
            case UserRole.DOCTOR_ASSISTANT: return { label: '医生助理', icon: '🩺', color: 'bg-indigo-100 text-indigo-600' };
            default: return { label: '未知', icon: '?', color: 'bg-slate-100' };
        }
    };

    // [UPDATED] 蚂蚁阿福风格配色：统一使用品牌蓝，通过透明度区分角色
    const headerBgClass = isFamily ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 
                          isDoctor ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 
                          'bg-gradient-to-b from-[#1677FF] to-[#1D4ED8]';

    return (
        <Layout headerTitle="个人中心" hideHeader>
            <div className="min-h-screen bg-[#F5F5F5] pb-24 relative animate-fade-in">
                {/* Header - [UPDATED] 更明亮的视觉风格 */}
                <div className={`relative pt-16 pb-24 px-6 overflow-hidden ${headerBgClass} shadow-lg shadow-blue-500/10`}>
                    {/* 装饰性背景纹理 */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-[3px] border-white/30 bg-white/20 text-white backdrop-blur-md`}>
                            {user.avatar ? <span className="text-xl">{user.avatar}</span> : (user.role === UserRole.PATIENT ? '👨‍🦳' : user.role === UserRole.FAMILY ? '👩' : '🩺')}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-sm">
                                    {getRoleLabel(user.role).label}
                                </span>
                                {user.authProvider && (
                                    <span className="text-[10px] text-white/70 bg-black/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        {user.authProvider === 'WECHAT' ? '微信登录' : user.authProvider === 'ALIPAY' ? '支付宝登录' : '手机号登录'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 家属代管状态提示 - Clickable to Switch */}
                    {isFamily && user.associatedPatientId && (
                        <div 
                            onClick={handleSwitchContext}
                            className={`mt-6 border rounded-xl p-3 flex items-center gap-3 backdrop-blur-md shadow-inner cursor-pointer active:scale-95 transition-all ${isViewingPatient ? 'bg-emerald-500/30 border-emerald-200/50 ring-2 ring-emerald-400/50' : 'bg-white/10 border-white/20'}`}
                        >
                            <span className="text-2xl drop-shadow-sm">{isViewingPatient ? '👀' : '🔗'}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs font-bold text-orange-100 opacity-80">
                                        {isViewingPatient ? '当前正在查看' : '已关联患者'}
                                    </div>
                                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                                        {isViewingPatient ? '点击切回' : '点击切换视角'}
                                    </span>
                                </div>
                                <div className="text-sm font-black text-white flex items-center gap-2">
                                    陈建国 (ID: {user.associatedPatientId.split('_')[1] || '8829'})
                                    {isViewingPatient && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dashboard Content */}
                <div className="px-5 -mt-16 relative z-20 space-y-4">
                    
                    {/* [NEW] 角色管理入口 */}
                    <div 
                        onClick={() => setShowRoleManager(true)}
                        className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 text-lg border border-brand-100">
                                🎭
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-800">我的角色管理</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">当前已绑定 {user.availableRoles.length} 个身份</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {user.availableRoles.map(r => (
                                    <div key={r} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px]">
                                        {getRoleLabel(r).icon}
                                    </div>
                                ))}
                            </div>
                            <span className="text-slate-300">›</span>
                        </div>
                    </div>

                    {/* AD 患者专属：家属代管入口 */}
                    {checkPermission('GENERATE_QR') && isADPatient && (
                        <div 
                            onClick={() => setShowQR(true)}
                            className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-[24px] p-6 shadow-lg shadow-orange-500/20 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border border-white/30">👨‍👩‍👧</div>
                                <div>
                                    <div className="text-lg font-black text-white">家属代管模式</div>
                                    <div className="text-xs text-white/90 mt-1 font-medium">生成二维码供家属扫码</div>
                                </div>
                            </div>
                            <span className="text-white/80 text-2xl">›</span>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-50">
                        <MenuItem icon="📄" label="健康报告" sub="查看历史评估与记录" onClick={() => onNavigate('report')} />
                        {checkPermission('MANAGE_FAMILY') && (
                            <MenuItem icon="👨‍👩‍👧" label="亲情账号管理" sub="添加或移除家庭成员" onClick={() => onNavigate('service-family')} />
                        )}
                        {isDoctor && (
                            <>
                                <MenuItem icon="🔄" label="患者数据同步" sub="同步院内 HIS 系统" onClick={() => alert('数据同步中...')} />
                                <MenuItem icon="📝" label="随访记录填写" sub="记录本次随访情况" onClick={() => alert('打开随访表单')} />
                            </>
                        )}
                        <div className="border-t border-slate-50 mx-4 my-2"></div>
                        <MenuItem icon="🛡️" label="隐私与授权管理" sub="管理敏感医疗数据共享权限" onClick={() => onNavigate('privacy-settings')} />
                        {isPatient && (
                            <MenuItem icon="🗑️" label="清除本地缓存" onClick={onClearCache} variant="danger" />
                        )}
                    </div>
                    
                    <button onClick={handleLogout} className="w-full py-4 text-slate-400 text-xs font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
                        退出当前账号
                    </button>
                    
                    <div className="text-center pb-4">
                        <p className="text-[9px] text-slate-300 font-mono">Version 2.4.0 (Build 20240522)</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showQR && <FamilyManagedModal onClose={() => setShowQR(false)} />}
            {showRoleManager && <RoleManager onClose={() => setShowRoleManager(false)} />}
        </Layout>
    );
};

const MenuItem: React.FC<{ icon: string; label: string; sub?: string; onClick: () => void; variant?: 'default' | 'danger' }> = ({ icon, label, sub, onClick, variant = 'default' }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group ${variant === 'danger' ? 'text-rose-500' : 'text-slate-700'}`}
    >
        <div className="flex items-center gap-3">
            <span className="text-xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{icon}</span>
            <div className="text-left">
                <div className="text-[13px] font-bold">{label}</div>
                {sub && <div className={`text-[9px] ${variant === 'danger' ? 'text-rose-300' : 'text-slate-400'}`}>{sub}</div>}
            </div>
        </div>
        <span className="text-slate-300 text-lg">›</span>
    </button>
);
