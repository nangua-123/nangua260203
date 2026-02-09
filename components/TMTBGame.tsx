
import React, { useRef, useState, useEffect } from 'react';
import Button from './common/Button';
import { useToast } from '../context/ToastContext';

// Standard TMT-B Sequence: 1 -> A -> 2 -> B -> ... -> 13 -> L
// Total 25 items.
const SEQUENCE = [
    { label: '1', type: 'num' }, { label: 'A', type: 'char' },
    { label: '2', type: 'num' }, { label: 'B', type: 'char' },
    { label: '3', type: 'num' }, { label: 'C', type: 'char' },
    { label: '4', type: 'num' }, { label: 'D', type: 'char' },
    { label: '5', type: 'num' }, { label: 'E', type: 'char' },
    { label: '6', type: 'num' }, { label: 'F', type: 'char' },
    { label: '7', type: 'num' }, { label: 'G', type: 'char' },
    { label: '8', type: 'num' }, { label: 'H', type: 'char' },
    { label: '9', type: 'num' }, { label: 'I', type: 'char' },
    { label: '10', type: 'num' }, { label: 'J', type: 'char' },
    { label: '11', type: 'num' }, { label: 'K', type: 'char' },
    { label: '12', type: 'num' }, { label: 'L', type: 'char' },
    { label: '13', type: 'num' }
];

// Fixed layout for 25 nodes to fit 350x500 canvas without overlap
const NODE_POSITIONS = [
    { x: 175, y: 450 }, // 1 (Start Bottom Center)
    { x: 100, y: 400 }, // A
    { x: 250, y: 400 }, // 2
    { x: 50, y: 350 },  // B
    { x: 300, y: 350 }, // 3
    { x: 175, y: 320 }, // C
    { x: 100, y: 280 }, // 4
    { x: 250, y: 280 }, // D
    { x: 30, y: 250 },  // 5
    { x: 320, y: 250 }, // E
    { x: 175, y: 220 }, // 6
    { x: 80, y: 180 },  // F
    { x: 270, y: 180 }, // 7
    { x: 130, y: 140 }, // G
    { x: 220, y: 140 }, // 8
    { x: 40, y: 100 },  // H
    { x: 310, y: 100 }, // 9
    { x: 175, y: 80 },  // I
    { x: 100, y: 50 },  // 10
    { x: 250, y: 50 },  // J
    { x: 20, y: 200 },  // 11 (Side)
    { x: 330, y: 200 }, // K (Side)
    { x: 140, y: 350 }, // 12 (Inner)
    { x: 210, y: 350 }, // L (Inner)
    { x: 175, y: 20 },  // 13 (Top Center)
];

interface Node {
    id: number; // Index in SEQUENCE (0-24)
    label: string;
    type: string;
    x: number;
    y: number;
}

interface TMTBGameProps {
    onComplete: (score: number, status: 'completed' | 'timeout', mistakes: number) => void;
    onExit: () => void;
}

export const TMTBGame: React.FC<TMTBGameProps> = ({ onComplete, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // Game State
    const [nodes, setNodes] = useState<Node[]>([]);
    const [path, setPath] = useState<number[]>([0]); // Stores Node IDs (indices), starts with 0 ('1')
    const [mistakes, setMistakes] = useState(0);
    
    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [dragCurrent, setDragCurrent] = useState<{x: number, y: number} | null>(null);
    const [errorLine, setErrorLine] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

    // Timer State
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

    // Constants
    const TIME_LIMIT = 150; // 150s forced termination
    const NODE_RADIUS = 16;

    // --- Initialization ---
    useEffect(() => {
        // Map sequence to positions
        const gameNodes = SEQUENCE.map((item, idx) => ({
            id: idx,
            label: item.label,
            type: item.type,
            x: NODE_POSITIONS[idx].x,
            y: NODE_POSITIONS[idx].y
        }));
        setNodes(gameNodes);
        setStartTime(Date.now());
        showToast('请交替连接：1 -> A -> 2 -> B ...', 'info');
    }, []);

    // --- Timer & Watchdog ---
    useEffect(() => {
        if (isGameOver) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const e = (now - startTime) / 1000;
            setElapsed(e);

            // 1. Circuit Breaker (150s)
            if (e >= TIME_LIMIT) {
                clearInterval(timer);
                setIsGameOver(true);
                showToast('⏱️ 时间到，测试强制结束', 'error');
                onComplete(TIME_LIMIT, 'timeout', mistakes);
            }

            // 2. Periodic Feedback (Every 10s)
            const intE = Math.floor(e);
            if (intE > 0 && intE % 10 === 0 && (e - intE) < 0.1) {
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 100);

        return () => clearInterval(timer);
    }, [startTime, isGameOver, mistakes]);

    // --- Rendering Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || nodes.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Retina Scaling
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const render = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            // 1. Draw Correct Path
            if (path.length > 0) {
                ctx.beginPath();
                const startNode = nodes[path[0]];
                ctx.moveTo(startNode.x, startNode.y);
                for (let i = 1; i < path.length; i++) {
                    const n = nodes[path[i]];
                    ctx.lineTo(n.x, n.y);
                }
                ctx.strokeStyle = '#10B981'; // Emerald 500
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            // 2. Draw Drag Line
            if (isDragging && dragCurrent) {
                const lastNodeId = path[path.length - 1];
                const lastNode = nodes[lastNodeId];
                ctx.beginPath();
                ctx.moveTo(lastNode.x, lastNode.y);
                ctx.lineTo(dragCurrent.x, dragCurrent.y);
                ctx.strokeStyle = '#94A3B8'; // Slate 400
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 3. Draw Error Line (Red Flash)
            if (errorLine) {
                ctx.beginPath();
                ctx.moveTo(errorLine.start.x, errorLine.start.y);
                ctx.lineTo(errorLine.end.x, errorLine.end.y);
                ctx.strokeStyle = '#EF4444'; // Red 500
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            // 4. Draw Nodes
            nodes.forEach(node => {
                const isConnected = path.includes(node.id);
                const isNext = !isConnected && node.id === path.length; // Hint next (optional, maybe remove for strict test)
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
                
                if (isConnected) {
                    ctx.fillStyle = '#ECFDF5'; // Green bg
                    ctx.strokeStyle = '#10B981'; 
                } else {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.strokeStyle = node.type === 'num' ? '#3B82F6' : '#8B5CF6'; // Blue for nums, Purple for chars
                }
                
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();

                // Label
                ctx.fillStyle = isConnected ? '#047857' : '#1E293B';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, node.x, node.y);
            });
        };

        const animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [nodes, path, isDragging, dragCurrent, errorLine]);

    // --- Interaction Logic ---
    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isGameOver) return;
        const pos = getPos(e);
        
        // Check if starting from the last connected node
        const lastId = path[path.length - 1];
        const lastNode = nodes[lastId];
        
        const dist = Math.hypot(pos.x - lastNode.x, pos.y - lastNode.y);
        if (dist <= NODE_RADIUS * 2) {
            setIsDragging(true);
            setDragCurrent(pos);
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || isGameOver) return;
        e.preventDefault();
        setDragCurrent(getPos(e));
    };

    const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || isGameOver) return;
        setIsDragging(false);
        
        if (!dragCurrent) return;

        // Find drop target
        const target = nodes.find(n => {
            return Math.hypot(dragCurrent.x - n.x, dragCurrent.y - n.y) <= NODE_RADIUS * 2.5;
        });

        if (target) {
            const nextExpectedId = path.length;
            const lastId = path[path.length - 1];
            const lastNode = nodes[lastId];

            if (target.id === nextExpectedId) {
                // Correct
                setPath([...path, target.id]);
                if (navigator.vibrate) navigator.vibrate(15);
                
                // Check Win (13 is the last index 24)
                if (target.id === 24) {
                    setIsGameOver(true);
                    onComplete(elapsed, 'completed', mistakes);
                }
            } else if (target.id !== lastId && !path.includes(target.id)) {
                // Wrong Target (ignore if self or already connected)
                handleMistake(lastNode, target);
            }
        }
        setDragCurrent(null);
    };

    const handleMistake = (from: Node, to: Node) => {
        setMistakes(m => m + 1);
        
        // Visual Feedback
        setErrorLine({ start: {x: from.x, y: from.y}, end: {x: to.x, y: to.y} });
        setTimeout(() => setErrorLine(null), 500);
        
        showToast('❌ 顺序错误！请连接下一个逻辑节点', 'error');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                <div>
                    <h3 className="text-sm font-black text-slate-800">TMT-B (25点)</h3>
                    <p className="text-[10px] text-slate-500">1 → A → 2 → B ... → 13</p>
                </div>
                <div className={`text-xl font-mono font-black ${elapsed > 120 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                    {elapsed.toFixed(1)}s
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-200">
                <div 
                    className="h-full bg-brand-500 transition-all duration-100 ease-linear"
                    style={{ width: `${Math.min((elapsed / TIME_LIMIT) * 100, 100)}%` }}
                ></div>
            </div>

            {/* Canvas Area */}
            <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative touch-none select-none bg-slate-50"
            >
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', maxWidth: '375px', maxHeight: '500px' }}
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                />
            </div>

            {/* Footer Control */}
            <div className="p-6 pb-safe bg-white border-t border-slate-100 z-10 flex gap-4">
                <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">错误次数</span>
                    <span className={`text-lg font-black ${mistakes > 0 ? 'text-red-500' : 'text-slate-800'}`}>{mistakes}</span>
                </div>
                <Button variant="outline" onClick={onExit} className="flex-1 border-slate-200 text-slate-500">
                    放弃测试
                </Button>
            </div>

            {/* Result Overlay */}
            {isGameOver && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
                    <div className="text-6xl mb-6">{elapsed >= TIME_LIMIT ? '⌛' : '🎉'}</div>
                    <h2 className="text-2xl font-black mb-2">{elapsed >= TIME_LIMIT ? '测试超时' : '测试完成'}</h2>
                    <div className="grid grid-cols-2 gap-8 mb-10 w-full max-w-xs">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase">总耗时</div>
                            <div className="text-3xl font-black font-mono">{elapsed.toFixed(1)}s</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase">错误数</div>
                            <div className="text-3xl font-black font-mono text-red-400">{mistakes}</div>
                        </div>
                    </div>
                    <Button onClick={() => onComplete(elapsed, elapsed >= TIME_LIMIT ? 'timeout' : 'completed', mistakes)} className="bg-white text-slate-900 w-full shadow-xl">
                        查看评估结果
                    </Button>
                </div>
            )}
        </div>
    );
};
