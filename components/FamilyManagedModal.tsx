
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface FamilyManagedModalProps {
    onClose: () => void;
}

export const FamilyManagedModal: React.FC<FamilyManagedModalProps> = ({ onClose }) => {
    const { state } = useApp();
    const [qrValue, setQrValue] = useState('');
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds

    useEffect(() => {
        // 生成包含用户ID和时间戳的唯一 Token
        const token = `FAMILY_BIND_${state.user.id}_${Date.now()}`;
        setQrValue(token);

        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => clearInterval(timer);
    }, [state.user.id]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}小时${m}分`;
    };

    // 模拟二维码渲染 (像素矩阵)
    const renderPseudoQRCode = () => {
        const seed = qrValue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const cells = [];
        for (let i = 0; i < 64; i++) { 
            const isActive = (seed * (i + 1) * 9301 + 49297) % 233280 > 116640;
            cells.push(isActive);
        }
        
        return (
            <div className="grid grid-cols-8 gap-1 w-full h-full p-2 bg-white rounded-xl border-4 border-slate-900">
                <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
                <div className="col-span-6 row-span-2 grid grid-cols-6 gap-1">
                     {cells.slice(0, 12).map((on, i) => <div key={`t-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
                </div>
                {cells.slice(12, 52).map((on, i) => (
                    <div key={`m-${i}`} className={`rounded-[1px] aspect-square ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                ))}
                <div className="col-span-6 grid grid-cols-6 gap-1">
                     {cells.slice(52, 64).map((on, i) => <div key={`b-${i}`} className={`rounded-[1px] ${on ? 'bg-slate-900' : 'bg-transparent'}`}></div>)}
                </div>
                <div className="col-span-2 bg-slate-900 rounded-sm"></div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 animate-slide-up text-center shadow-2xl">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                    👨‍👩‍👧
                </div>
                
                {/* 适配高龄群体的大字体 */}
                <h3 className="text-2xl font-black text-slate-900 mb-2">家属代管二维码</h3>
                <p className="text-sm text-slate-500 mb-8 font-bold">
                    请家属使用 App 扫描下方二维码<br/>即可关联您的账号
                </p>
                
                <div className="w-64 h-64 mx-auto mb-6">
                    {renderPseudoQRCode()}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-8 inline-block px-6">
                    <span className="text-xs font-bold text-slate-400">有效期剩余: </span>
                    <span className="text-xl font-black text-brand-600 font-mono ml-2">{formatTime(timeLeft)}</span>
                </div>

                <Button fullWidth onClick={onClose} className="bg-slate-800 py-5 text-lg">
                    关闭
                </Button>
            </div>
        </div>
    );
};
