import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps & { loading?: boolean }> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loading, // Capture this to prevent it from being spread to DOM
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    ...props
}) => {
    // Support both isLoading and loading props
    const showLoading = isLoading || loading;
    const baseStyles = `
        inline-flex items-center justify-center font-bold rounded-xl
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.97] hover:scale-[1.02]
        transform will-change-transform
    `.replace(/\s+/g, ' ').trim();

    const variants = {
        primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary/50 shadow-md hover:shadow-lg hover:shadow-primary/25',
        secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-500/50 hover:shadow-md',
        outline: 'border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-slate-500/50 hover:shadow-sm',
        ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50 shadow-md hover:shadow-lg hover:shadow-red-500/25',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500/50 shadow-md hover:shadow-lg hover:shadow-amber-500/25'
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2.5 gap-2',
        lg: 'text-base px-6 py-3 gap-2.5'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || showLoading}
            {...props}
        >
            {showLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!showLoading && leftIcon && <span className="flex-shrink-0 transition-transform group-hover:scale-110">{leftIcon}</span>}
            {children}
            {!showLoading && rightIcon && <span className="flex-shrink-0 transition-transform group-hover:scale-110">{rightIcon}</span>}
        </button>
    );
};

export default Button;

