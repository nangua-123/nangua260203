
import React, { useState, useEffect } from 'react';
import { User, UserRole, SharingScope, AuthProvider, LoginFormState, ThirdPartyLoginRes } from '../types';
import Button from '../components/common/Button';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
    const { dispatch } = useApp();
    
    // 表单状态
    const [formData, setFormData] = useState<LoginFormState>({
        phone: '',
        code: ''
    });
    
    // UI 交互状态
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMsg, setErrorMsg] = useState(''); // [NEW] 错误提示状态

    // 验证码倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 构造基础用户对象 (Factory Pattern)
    const createBaseUser = (provider: AuthProvider, extraData?: Partial<ThirdPartyLoginRes>): User => {
        const displayPhone = formData.phone || '13800008829';
        
        return {
            id: `user_${Date.now()}`,
            name: extraData?.nickname || (provider === AuthProvider.PHONE ? `用户${displayPhone.slice(-4)}` : '新用户'),
            phone: provider === AuthProvider.PHONE ? displayPhone : '',
            avatar: extraData?.avatar,
            authProvider: provider,
            
            role: UserRole.PATIENT, 
            availableRoles: [UserRole.PATIENT],
            
            vipLevel: 0,
            unlockedFeatures: [],
            hasHardware: false,
            isElderlyMode: false,
            privacySettings: {
                allowCloudStorage: true,
                sharingScope: SharingScope.ONLY_ME,
                allowResearchUse: false,
                lastUpdated: Date.now()
            },
            iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, hrStandardDeviation: 0, isAbnormal: false, isFallDetected: false, lastUpdated: 0 },
            cognitiveStats: { totalSessions: 0, todaySessions: 0, todayDuration: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0, dimensionStats: { memory: 60, attention: 60, reaction: 60, stability: 60, flexibility: 60 } },
            familyMembers: [],
            currentProfileId: `user_${Date.now()}`
        };
    };

    const performLoginExecution = async (user: User) => {
        setIsLoading(true);
        setErrorMsg(''); // Clear errors

        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            // [LR-012] 模拟验证码错误校验
            // 规则：手机号登录模式下，验证码必须为 '123456'
            if (user.authProvider === AuthProvider.PHONE && formData.code !== '123456') {
                throw new Error('验证码错误，请重新输入');
            }

            const navEvent = new CustomEvent('navigate-to', { detail: 'chat' });
            window.dispatchEvent(navEvent);

            dispatch({ type: 'LOGIN', payload: user });

        } catch (error: any) {
            console.error("[Login] Failed:", error);
            setErrorMsg(error.message || '登录失败，请重试');
            // 错误时震动反馈 (模拟)
            if (navigator.vibrate) navigator.vibrate(200);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCode = () => {
        if (!formData.phone || formData.phone.length !== 11) {
            setErrorMsg('请输入有效的11位手机号码');
            return;
        }
        if (countdown > 0) return;
        
        setErrorMsg('');
        setCountdown(60);
        // 自动填入演示数据 (方便测试)
        setTimeout(() => {
            setFormData(prev => ({ 
                ...prev, 
                code: '123456' 
            }));
        }, 500);
    };

    const handlePhoneLogin = () => {
        if (!formData.phone || !formData.code) {
            setErrorMsg('请填写手机号和验证码');
            return;
        }
        const user = createBaseUser(AuthProvider.PHONE);
        performLoginExecution(user);
    };

    const handleThirdPartyLogin = (provider: AuthProvider) => {
        setIsLoading(true); 
        const mockData: Partial<ThirdPartyLoginRes> = provider === AuthProvider.WECHAT 
            ? { nickname: '微信用户_Neuro', avatar: '🟢' }
            : { nickname: '支付宝用户_Ali', avatar: '🔵' };

        const user = createBaseUser(provider, mockData);
        performLoginExecution(user);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 opacity-50 z-0 pointer-events-none"></div>

            <div className="w-full max-w-sm relative z-50 flex flex-col">
                
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-brand-500/30 mx-auto mb-6 transform rotate-3">
                        🧠
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">华西神经专病<br/>数字医院</h1>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Neuro-Link Digital Health</p>
                </div>

                {/* [LR-012] Error Message Display */}
                {errorMsg && (
                    <div className="bg-red-50 text-red-500 text-xs font-bold px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-shake border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {errorMsg}
                    </div>
                )}

                {/* Login Form */}
                <div className="space-y-5 mb-8">
                    {/* [LR-006] Registration Mode Title */}
                    {isRegistering && (
                        <div className="text-center mb-2">
                             <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded font-bold">
                                 新用户注册 / 家属代办模式
                             </span>
                        </div>
                    )}
                    
                    <div>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-lg z-20 pointer-events-none">📱</span>
                            <input 
                                data-testid="input-phone"
                                type="tel" 
                                placeholder="请输入手机号码"
                                maxLength={11}
                                value={formData.phone}
                                onChange={e => { setFormData({...formData, phone: e.target.value}); setErrorMsg(''); }}
                                className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:bg-white outline-none transition-all shadow-sm focus:shadow-md relative z-10 ${errorMsg ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500'}`}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-3.5 text-lg z-20 pointer-events-none">🔒</span>
                            <input 
                                data-testid="input-code"
                                type="text" 
                                placeholder="验证码"
                                maxLength={6}
                                value={formData.code}
                                onChange={e => { setFormData({...formData, code: e.target.value}); setErrorMsg(''); }}
                                className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:bg-white outline-none transition-all shadow-sm focus:shadow-md relative z-10 ${errorMsg ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500'}`}
                            />
                        </div>
                        <button 
                            data-testid="btn-get-code"
                            type="button"
                            onClick={handleGetCode}
                            disabled={countdown > 0}
                            className={`bg-white border border-brand-200 text-brand-600 px-5 rounded-2xl text-xs font-black active:scale-95 transition-transform shadow-sm whitespace-nowrap min-w-[100px] z-10 ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </button>
                    </div>
                </div>

                <Button 
                    data-testid="btn-login"
                    fullWidth 
                    onClick={handlePhoneLogin} 
                    disabled={isLoading} 
                    className={`py-4 shadow-xl shadow-brand-500/20 mb-8 text-sm tracking-widest rounded-2xl relative z-10 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>{isRegistering ? '注册并登录...' : '安全登录中...'}</span>
                        </div>
                    ) : (isRegistering ? '同意协议并注册' : '安全登录')}
                </Button>

                <div className="relative mb-8 z-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-[10px] text-slate-400 font-bold">第三方快捷登录</span>
                    </div>
                </div>

                <div className="flex justify-center gap-10 mb-8 z-10">
                    <button 
                        type="button"
                        onClick={() => !isLoading && handleThirdPartyLogin(AuthProvider.WECHAT)}
                        className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                    >
                        <div className="w-14 h-14 rounded-full bg-[#E9F7EF] border border-[#07C160]/20 flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-shadow">
                            <span className="text-[#07C160]">💬</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold group-hover:text-[#07C160]">微信登录</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => !isLoading && handleThirdPartyLogin(AuthProvider.ALIPAY)}
                        className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                    >
                        <div className="w-14 h-14 rounded-full bg-[#E6F1FE] border border-[#1677FF]/20 flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-shadow">
                            <span className="text-[#1677FF]">支</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold group-hover:text-[#1677FF]">支付宝登录</span>
                    </button>
                </div>

                <div className="text-center mt-auto z-10">
                    <button 
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
                        className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors mb-6 p-2"
                    >
                        {isRegistering ? '已有账号？去登录' : '没有账号？注册新用户'}
                    </button>
                    
                    <p className="text-[10px] text-slate-300 leading-tight">
                        {isRegistering ? '注册' : '登录'}即代表您已同意
                        <br/>
                        <span className="underline cursor-pointer hover:text-brand-500">《用户服务协议》</span> 与 <span className="underline cursor-pointer hover:text-brand-500">《隐私政策》</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
