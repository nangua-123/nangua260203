
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  headerTitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideHeader?: boolean;
  disableScroll?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  headerTitle, 
  showBack, 
  onBack, 
  hideHeader = false,
  disableScroll = false 
}) => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F7F9FA]">
      {/* Header - 适配刘海屏安全区 */}
      {!hideHeader && (
        <header className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-50 px-5 pt-[env(safe-area-inset-top)] z-50">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && (
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              <h1 className="font-bold text-base text-slate-900 tracking-tight">{headerTitle}</h1>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area - 像 App 一样独立滚动 */}
      <main className={`flex-1 relative ${disableScroll ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar pb-safe'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
