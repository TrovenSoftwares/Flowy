import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    id,
    disabled,
    ...props
}, ref) => {
    const inputId = id || props.name;

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={`
            w-full rounded-lg border bg-white dark:bg-slate-900 
            text-slate-900 dark:text-white placeholder-slate-400 
            transition-all duration-200 outline-none
            disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary'
                        }
            py-2.5 text-sm
            ${className}
          `}
                    disabled={disabled}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {(error || helperText) && (
                <p className={`mt-1.5 text-xs ${error ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
