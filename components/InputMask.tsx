import React from 'react';
import { IMaskInput } from 'react-imask';

interface InputMaskProps {
    mask: any;
    value: string;
    onAccept: (value: string, mask: any) => void;
    placeholder?: string;
    className?: string;
    name?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    unmask?: boolean | 'typed';
}

const InputMask: React.FC<InputMaskProps> = ({
    mask,
    value,
    onAccept,
    placeholder,
    className = '',
    name,
    onBlur,
    unmask = true,
}) => {
    return (
        <IMaskInput
            mask={mask}
            value={value}
            unmask={unmask}
            onAccept={onAccept}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400 dark:text-white ${className}`}
            name={name}
            onBlur={onBlur}
        />
    );
};

export default InputMask;
