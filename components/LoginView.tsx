
import React, { useState, useEffect } from 'react';
import { User, UserRole, SharingScope, AuthProvider, LoginFormState, ThirdPartyLoginRes } from '../types';
import Button from './Button';
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

    // 验证码倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 构造基础用户对象 (Factory Pattern)
    const createBaseUser = (provider: AuthProvider, extraData?: Partial<ThirdPartyLoginRes>): User => {
        // 如果用户未输入，则使用默认演示账号
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
            // 初始化空数据结构
            iotStats: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, isAbnormal: false, lastUpdated: 0 },
            cognitiveStats: { totalSessions: 0, todaySessions: 0, totalDuration: 0, lastScore: 0, aiRating: '-', lastUpdated: 0 },
            familyMembers: [],
            currentProfileId: `user_${Date.now()}`
        };
    };

    /**
     * 核心登录执行逻辑
     * 顺序：验证 -> 模拟API -> 路由跳转(Chat) -> 更新鉴权状态
     */
    const performLoginExecution = async (user: User) => {
        console.log('[Login] Starting login sequence...');
        setIsLoading(true);

        try {
            // 1. 模拟网络请求延迟 (Mock API) - 缩短至 600ms 以提升体验
            await new Promise(resolve => setTimeout(resolve, 600));

            // 2. [Critical] 优先触发路由跳转事件
            // 在 App.tsx 重新渲染前，先通知路由切换到 ChatView
            console.log('[Login] Dispatching navigate-to chat...');
            const navEvent = new CustomEvent('navigate-to', { detail: 'chat' });
            window.dispatchEvent(navEvent);

            // 3. 更新全局鉴权状态
            console.log('[Login] Updating global auth state...');
            dispatch({ type: 'LOGIN', payload: user });

        } catch (error) {
            console.error("[Login] Failed:", error);
            setIsLoading(false);
        }
    };

    // [MODIFIED] 获取验证码：移除正则校验，点击即自动填入
    const handleGetCode = () => {
        if (countdown > 0) return;
        
        console.log('[Login] Auto-filling verification code...');
        setCountdown(60);
        // 自动填入演示数据
        setTimeout(() => {
            setFormData(prev => ({ 
                ...prev, 
                phone: prev.phone || '13800008829', // 自动补全手机号
                code: '123456' 
            }));
        }, 100); // 缩短填充延时
    };

    // [MODIFIED] 手机号登录：移除正则校验，点击即登录
    const handlePhoneLogin = () => {
        console.log('[Login] Phone login clicked - Validation bypassed');
        // 直接构造用户并登录，无需校验
        const user = createBaseUser(AuthProvider.PHONE);
        performLoginExecution(user);
    };

    // 第三方登录处理
    const handleThirdPartyLogin = (provider: AuthProvider) => {
        console.log(`[Login] ${provider} login clicked`);
        setIsLoading(true); // 立即锁定界面
        
        // 模拟第三方授权回调数据
        const mockData: Partial<ThirdPartyLoginRes> = provider === AuthProvider.WECHAT 
            ? { nickname: '微信用户_Neuro', avatar: '🟢' }
            : { nickname: '支付宝用户_Ali', avatar: '🔵' };

        const user = createBaseUser(provider, mockData);
        performLoginExecution(user);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            {/* Background Decoration - [FIX] 添加 pointer-events-none 防止遮挡点击 */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 opacity-50 z-0 pointer-events-none"></div>

            {/* Main Container - [FIX] 明确 z-50 确保位于背景之上且可点击 */}
            <div className="w-full max-w-sm relative z-50 flex flex-col">
                
                {/* Logo Area */}
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-brand-500/30 mx-auto mb-6 transform rotate-3">
                        🧠
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">华西神经专病<br/>数字医院</h1>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Neuro-Link Digital Health</p>
                </div>

                {/* Login Form */}
                <div className="space-y-5 mb-8">
                    <div>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-lg z-20 pointer-events-none">📱</span>
                            <input 
                                data-testid="input-phone"
                                type="tel" 
                                placeholder="请输入手机号码 (免验证)"
                                maxLength={11}
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-brand-500 focus:bg-white outline-none transition-all shadow-sm focus:shadow-md relative z-10"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-3.5 text-lg z-20 pointer-events-none">🔒</span>
                            <input 
                                data-testid="input-code"
                                type="text" 
                                placeholder="验证码 (自动填)"
                                maxLength={6}
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-brand-500 focus:bg-white outline-none transition-all shadow-sm focus:shadow-md relative z-10"
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

                {/* Main Action Button - [FIX] 显式 z-10 确保可点击 */}
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
                            <span>安全登录中...</span>
                        </div>
                    ) : '安全登录'}
                </Button>

                {/* Third Party Divider */}
                <div className="relative mb-8 z-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-[10px] text-slate-400 font-bold">第三方快捷登录</span>
                    </div>
                </div>

                {/* Third Party Buttons */}
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

                {/* Footer Links */}
                <div className="text-center mt-auto z-10">
                    <button 
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors mb-6 p-2"
                    >
                        {isRegistering ? '已有账号？去登录' : '没有账号？注册新用户'}
                    </button>
                    
                    <p className="text-[10px] text-slate-300 leading-tight">
                        登录即代表您已同意
                        <br/>
                        <span className="underline cursor-pointer hover:text-brand-500">《用户服务协议》</span> 与 <span className="underline cursor-pointer hover:text-brand-500">《隐私政策》</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
