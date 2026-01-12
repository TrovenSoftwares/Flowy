import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string;
    icon?: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    icon?: string;
    placeholder?: string;
    className?: string;
    searchable?: boolean;
    maxHeight?: number;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    icon,
    placeholder = 'Selecione...',
    className = '',
    searchable = true,
    maxHeight = 280
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const selectedOption = options?.find(opt => opt.value === value);

    const filteredOptions = useMemo(() => {
        if (!options) return [];
        if (!search.trim()) return options;
        const lower = search.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lower));
    }, [options, search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside both container AND portal dropdown
            const portal = document.getElementById('custom-select-portal-' + containerRef.current?.id);
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                (!portal || !portal.contains(event.target as Node))
            ) {
                setIsOpen(false);
                setSearch('');
            }
        };

        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: `${rect.bottom + 8}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                zIndex: 9999
            });

            // Focus input after render
            setTimeout(() => {
                if (searchable && searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, searchable]);

    const handleSelect = (optValue: string) => {
        onChange(optValue);
        setIsOpen(false);
        setSearch('');
    };

    // Use a portal to render dropdown outside of overflow-hidden containers
    const renderDropdown = () => {
        if (!isOpen) return null;

        // Dynamic ID for click outside check
        const portalId = 'custom-select-portal-' + containerRef.current?.id;

        return (
            <div
                id={portalId}
                className="fixed bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top"
                style={dropdownStyle}
            >
                {/* Search Input */}
                {searchable && options.length > 5 && (
                    <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <span className="material-symbols-outlined text-[18px]">search</span>
                            </span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white"
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}

                {/* Options List */}
                <div
                    className="py-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600"
                    style={{ maxHeight }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400 italic">
                            Nenhum resultado encontrado
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 ${value === option.value ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                {option.icon && (
                                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${value === option.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-slate-500'}`}>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {option.icon}
                                        </span>
                                    </div>
                                )}
                                <span className="flex-1 text-left truncate">{option.label}</span>
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">check</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 h-11 px-4 rounded-xl bg-gray-50 dark:bg-slate-900 border text-sm font-medium transition-all text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 ${isOpen ? 'border-primary dark:border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10' : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {(selectedOption?.icon || icon) && (
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isOpen ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {selectedOption?.icon || icon}
                            </span>
                        </div>
                    )}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>
            {/* Render Portal */}
            {typeof document !== 'undefined' && isOpen && (
                createPortal(renderDropdown(), document.body)
            )}
        </div>
    );
};

export default CustomSelect;
