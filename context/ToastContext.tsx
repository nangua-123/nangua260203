
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 独立的 Toast 组件，负责生命周期和动画渲染
const ToastItem: React.FC<{ msg: ToastMessage; onRemove: () => void }> = ({ msg, onRemove }) => {
    // 动态注入 Keyframes 样式，确保动画行为精确符合 2.7s (0.3s fade-in + 2.1s stay + 0.3s fade-out)
    const animationStyle: React.CSSProperties = {
        animation: 'toastLifecycle 2.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    };

    const iconMap = {
        success: '✅',
        error: '❌',
        info: '🤖'
    };

    return (
        <>
            <style>{`
                @keyframes toastLifecycle {
                    0% { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
                    10% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    88% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
                }
            `}</style>
            <div 
                className="fixed bottom-24 left-1/2 z-[9999] flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl text-white text-sm font-bold tracking-wide min-w-max"
                style={animationStyle}
                onAnimationEnd={onRemove}
            >
                <span className="text-lg">{iconMap[msg.type]}</span>
                <span>{msg.text}</span>
            </div>
        </>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: ToastType = 'success') => {
    // 如果已有 Toast，先移除再重新添加，确保动画重置
    setToast(null);
    // 使用 setTimeout 确保 React 重新渲染组件以触发动画
    setTimeout(() => {
        setToast({ id: Date.now(), text, type });
    }, 10);
  }, []);

  const removeToast = useCallback(() => {
      setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastItem key={toast.id} msg={toast} onRemove={removeToast} />}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
