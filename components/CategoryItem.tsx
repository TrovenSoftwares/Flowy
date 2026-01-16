import React from 'react';

interface CategoryItemProps {
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    spent: string;
    budget: number;
    percentage: number;
    subcategories?: any[];
    iaReady?: boolean;
    warning?: boolean;
    critical?: boolean;
    isInfinite?: boolean;
    onEdit: (cat: any) => void;
    onDelete: (item: any) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
    id, name, icon, iconColor, spent, budget, percentage, subcategories, iaReady, warning, critical, isInfinite, onEdit, onDelete
}) => (
    <div className="p-4 hover:bg-[#fcfdfd] dark:hover:bg-slate-800/50 transition-colors group relative">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
            <button
                onClick={() => onEdit({ id, name, icon, color: iconColor, budget: budget?.toString() || '', budget_is_unlimited: isInfinite, parent_id: null })}
                className="p-1.5 hover:bg-[#e7edf3] dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
                onClick={() => onDelete({ id, type: 'category' })}
                className="p-1.5 hover:bg-[#e7edf3] dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pr-10 sm:pr-14">
            <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 whitespace-nowrap">{subcategories ? subcategories.length : 0} Subcategorias</span>
                        {iaReady && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1 whitespace-nowrap">
                                <span className="material-symbols-outlined text-[10px] filled">auto_awesome</span> IA Ready
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-left sm:text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {"R$\u00A0"}{spent.replace('-', '')} <span className="text-slate-500 font-normal text-xs">/ {isInfinite ? '∞' : `R$\u00A0${Number(budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}</span>
                </p>
                {!isInfinite && (
                    <p className={`text-xs mt-0.5 font-medium ${critical ? 'text-red-600 dark:text-red-400' : warning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                        {percentage}% utilizado
                    </p>
                )}
                {isInfinite && <p className="text-xs mt-0.5 font-medium text-slate-400">Sem limite</p>}
            </div>
        </div>
        {/* Only show progress bar if not infinite */}
        {!isInfinite && (
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full transition-all duration-1000 ${critical ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        )}
    </div>
);

export default CategoryItem;
