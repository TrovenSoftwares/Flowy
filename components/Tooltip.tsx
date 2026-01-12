import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    showIcon?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    showIcon = true
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const calculatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        // Add scroll offset just in case, though fixed position usually relates to viewport
        // actually rect is relative to viewport, so strict fixed is fine.

        if (position === 'top') {
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
        } else if (position === 'bottom') {
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
        } else if (position === 'left') {
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
        } else if (position === 'right') {
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
        }

        setCoords({ top, left });
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={() => {
                    calculatePosition();
                    setIsVisible(true);
                }}
                onMouseLeave={() => setIsVisible(false)}
                className="inline-flex items-center cursor-help"
            >
                {children || (
                    showIcon && (
                        <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-[18px]">
                            info
                        </span>
                    )
                )}
            </div>

            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none max-w-xs text-center border border-slate-700/50"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: position === 'top' ? 'translate(-50%, -100%)' :
                            position === 'bottom' ? 'translate(-50%, 0)' :
                                position === 'left' ? 'translate(-100%, -50%)' :
                                    'translate(0, -50%)'
                    }}
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-slate-900 rotate-45 transform 
                ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b border-slate-700/50' : ''}
                ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t border-slate-700/50' : ''}
                ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r border-slate-700/50' : ''}
                ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l border-slate-700/50' : ''}
             `}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
