
import React from 'react';
import { AppView } from '../../types';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    {
      id: 'home',
      label: '健康',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      id: 'chat',
      label: '问诊',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: '我的',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
           <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center pt-2 h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id as AppView)}
              className={`flex flex-col items-center justify-center w-full min-h-[44px] space-y-1 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}
            >
              <div className="transition-transform duration-200 active:scale-90">
                {item.icon(isActive)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
