import React from 'react';

interface AccountCardProps {
    name: string;
    type: string;
    balance: string;
    logo?: string;
    logoIcon?: string;
    color: string;
    update: string;
    isNegative: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
    name, type, balance, logo, logoIcon, color, update, isNegative, onEdit, onDelete
}) => (
    <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-850 border border-[#e7edf3] dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all relative overflow-hidden min-w-0">
        <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`size-10 sm:size-12 rounded-2xl ${color} flex items-center justify-center text-white shrink-0 font-bold text-lg sm:text-xl shadow-lg shadow-black/10 border border-white/20 overflow-hidden relative group-hover:scale-105 transition-transform`}>
                    {logoIcon && logoIcon.startsWith('/') ? (
                        <img
                            src={logoIcon}
                            alt={name}
                            className="size-full object-cover"
                            onError={(e) => {
                                (e.target as any).style.display = 'none';
                                (e.target as any).parentElement.innerHTML = `<span class="material-symbols-outlined text-white">${logoIcon.includes('/') ? 'account_balance' : logoIcon}</span>`;
                            }}
                        />
                    ) : logoIcon ? (
                        <span className="material-symbols-outlined text-white">{logoIcon}</span>
                    ) : (
                        <span className="font-black text-white">{logo}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                </div>
                <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{type}</p>
                    <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">{name}</p>
                </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 hover:bg-[#e7edf3] dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 hover:bg-[#e7edf3] dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>

        <div className="mt-2">
            <p className={`text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {isNegative ? '-' : ''} {"R$\u00A0"}{balance.replace('-', '')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-0.5 sm:mt-1">
                <span className="material-symbols-outlined text-sm sm:text-base">sync</span> {update}
            </p>
        </div>
    </div>
);

export default AccountCard;
