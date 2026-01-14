import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    secondaryValue?: string;
    trend?: string;
    icon: string | React.ReactNode;
    iconColor: string;
    valueColor?: string;
    trendColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    secondaryValue,
    trend,
    icon,
    iconColor,
    valueColor,
    trendColor
}) => {
    return (
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                    {label}
                </p>
                <div className={`${iconColor} p-2 rounded-lg flex items-center justify-center`}>
                    {typeof icon === 'string' ? (
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                    ) : (
                        icon
                    )}
                </div>
            </div>

            <div className="flex items-end gap-2">
                <p className={`text-2xl sm:text-3xl font-bold ${valueColor || 'text-slate-900 dark:text-white'}`}>
                    {value}
                </p>
                {secondaryValue && (
                    <p className="text-sm font-medium text-slate-400 mb-1.5">
                        {secondaryValue}
                    </p>
                )}
            </div>

            {trend && (
                <p className={`${trendColor || 'text-slate-500'} text-xs font-medium flex items-center gap-1.5`}>
                    <span className="material-symbols-outlined text-sm">info</span> {trend}
                </p>
            )}
        </div>
    );
};

export default StatCard;
