
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
    <div className="min-h-screen bg-[#F7F9FA] flex justify-center">
      <div className="w-full max-w-md bg-[#F7F9FA] h-[100dvh] relative flex flex-col overflow-hidden">
        {/* Header - 蚂蚁阿福空气感设计 */}
        {!hideHeader && (
          <header className="flex-none bg-white border-b border-slate-50 px-6 h-14 flex items-center justify-between z-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-4">
              {showBack && (
                <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-brand-500 active:scale-90 transition-transform shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              <h1 className="font-bold text-sm text-slate-900 tracking-tight">{headerTitle}</h1>
            </div>
          </header>
        )}

        <main className={`flex-1 flex flex-col relative ${disableScroll ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar pb-24'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
