
import React from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';

interface NotificationInboxProps {
    onClose: () => void;
}

export const NotificationInbox: React.FC<NotificationInboxProps> = ({ onClose }) => {
    const { state } = useApp();
    const messages = state.user.inbox || [];

    // Sort by timestamp desc
    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return isToday ? timeStr : `${d.getMonth() + 1}/${d.getDate()} ${timeStr}`;
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#F5F5F5] w-full h-[80vh] rounded-t-[32px] relative z-10 animate-slide-up flex flex-col overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-center shadow-sm z-20">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>🔔</span> 消息通知
                        {sortedMessages.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {sortedMessages.length}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100">✕</button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                    {sortedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-3xl grayscale opacity-50">📭</div>
                            <p className="text-xs font-bold">暂无新消息</p>
                        </div>
                    ) : (
                        sortedMessages.map((msg) => (
                            <MessageCard key={msg.id} msg={msg} timeStr={formatTime(msg.timestamp)} />
                        ))
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-100 text-center text-[10px] text-slate-300">
                    仅展示近 30 天的通知记录
                </div>
            </div>
        </div>
    );
};

const MessageCard: React.FC<{ msg: ChatMessage; timeStr: string }> = ({ msg, timeStr }) => {
    // Determine style based on message type
    const isCritical = msg.isClinicalPush || msg.text.includes('警报') || msg.text.includes('故障') || msg.text.includes('风险');
    const isSystem = msg.role === 'system';

    return (
        <div className={`p-4 rounded-2xl border shadow-sm transition-all active:scale-[0.99] ${
            isCritical 
            ? 'bg-red-50 border-red-100' 
            : 'bg-white border-slate-100'
        }`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {isCritical ? (
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">🚨</span>
                    ) : (
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">💬</span>
                    )}
                    <span className={`text-xs font-bold ${isCritical ? 'text-red-800' : 'text-slate-700'}`}>
                        {msg.isClinicalPush ? '医助急救推送' : '系统通知'}
                    </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
            </div>
            <p className={`text-[13px] leading-relaxed break-words ${isCritical ? 'text-red-900 font-medium' : 'text-slate-600'}`}>
                {msg.text}
            </p>
            {isCritical && (
                <div className="mt-3 flex justify-end">
                    <span className="text-[9px] bg-white/60 border border-red-200 text-red-500 px-2 py-0.5 rounded font-bold">
                        需立即关注
                    </span>
                </div>
            )}
        </div>
    );
};
