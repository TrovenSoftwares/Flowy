import React, { useEffect, useState } from 'react';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    onApply: () => void;
    onClear: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    title = 'Filtros Avançados',
    children,
    onApply,
    onClear
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`relative w-full max-w-md h-full bg-white dark:bg-slate-850 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_list</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined font-bold">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClear}
                        className="flex-1 h-12 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                        Limpar Filtros
                    </button>
                    <button
                        onClick={onApply}
                        className="flex-1 h-12 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterDrawer;
