import React, { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarContent from './SidebarContent';
import { useAuth } from '../contexts/AuthContext';
import { VersixLogo } from './BrandedIcons';

const Sidebar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-850 border-r border-[#e7edf3] dark:border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-30 hidden lg:flex shrink-0">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-center">
          <VersixLogo className="h-[55px] w-auto px-2" />
        </div>
      </div>

      <SidebarContent locationPath={location.pathname} navigate={navigate} />

      <div className="p-4 border-t border-[#e7edf3] dark:border-slate-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          aria-label="Sair da conta"
        >
          <span className="material-symbols-outlined text-xl group-hover:text-red-500">logout</span>
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;