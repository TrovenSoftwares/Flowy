import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    badge?: {
        text: string;
        icon?: string;
    };
    actions?: React.ReactNode;
    className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    badge,
    actions,
    className = '',
}) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4 mb-2 ${className}`}>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
                <h1 className="text-2xl xs:text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                    {title}
                </h1>
                {(description || badge) && (
                    <p className="text-slate-500 dark:text-gray-400 text-sm xs:text-base font-normal flex items-center flex-wrap gap-2">
                        {description}
                        {badge && (
                            <span className="inline-flex items-center gap-1 text-primary text-sm bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                                {badge.icon && (
                                    <span className="material-symbols-outlined text-[14px]">
                                        {badge.icon}
                                    </span>
                                )}
                                {badge.text}
                            </span>
                        )}
                    </p>
                )}
            </div>
            {actions && <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">{actions}</div>}
        </div>
    );
};

export default PageHeader;
