import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarLinkProps {
    to: string;
    icon: string;
    label: string;
    currentPath: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, currentPath }) => {
    const isActive = currentPath === to;
    return (
        <Link
            to={to}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
        >
            <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{icon}</span>
            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        </Link>
    );
};

export default SidebarLink;
