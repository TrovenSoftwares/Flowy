import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VersixLogo } from './BrandedIcons';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white dark:bg-slate-850 border-b border-[#e7edf3] dark:border-slate-700 flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1"
          aria-label="Abrir menu lateral"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <VersixLogo className="h-[32px] xs:h-[40px] w-auto" />
      </div>

      <div className="flex-1"></div>


      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative transition-colors"
          aria-label="Notificações"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 size-2 bg-red-500 rounded-full border border-white dark:border-slate-850"></span>
        </button>
        <button
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Ajuda"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">help</span>
        </button>
        <div className="h-6 sm:h-8 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1"></div>
        <button
          onClick={() => navigate('/new-transaction')}
          className="bg-primary hover:bg-primary/90 text-white px-2.5 sm:px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2"
          aria-label="Criar novo lançamento"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="hidden md:inline">Novo Lançamento</span>
        </button>
      </div>
    </header>
  );
};

export default Header;