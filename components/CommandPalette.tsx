import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from './Input';

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: string;
    category: 'navigation' | 'action' | 'search';
    action: () => void;
    shortcut?: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-dashboard', label: 'Visão Geral', description: 'Ir para o Dashboard', icon: 'dashboard', category: 'navigation', action: () => navigate('/'), shortcut: 'Alt+1' },
        { id: 'nav-transactions', label: 'Transações', description: 'Gerenciar transações financeiras', icon: 'receipt_long', category: 'navigation', action: () => navigate('/transactions'), shortcut: 'Alt+2' },
        { id: 'nav-sales', label: 'Vendas', description: 'Consultar e registrar vendas', icon: 'point_of_sale', category: 'navigation', action: () => navigate('/sales'), shortcut: 'Alt+3' },
        { id: 'nav-contacts', label: 'Contatos', description: 'Clientes, fornecedores e vendedores', icon: 'contacts', category: 'navigation', action: () => navigate('/contacts'), shortcut: 'Alt+4' },
        { id: 'nav-reports', label: 'Relatórios', description: 'Análises e gráficos', icon: 'monitoring', category: 'navigation', action: () => navigate('/reports'), shortcut: 'Alt+5' },
        { id: 'nav-wallet', label: 'Carteira', description: 'Gerenciar contas e saldos', icon: 'account_balance_wallet', category: 'navigation', action: () => navigate('/wallet'), shortcut: 'Alt+6' },
        { id: 'nav-ai', label: 'Assistente IA', description: 'Revisão inteligente do WhatsApp', icon: 'smart_toy', category: 'navigation', action: () => navigate('/ai-assistant'), shortcut: 'Alt+7' },
        { id: 'nav-settings', label: 'Ajustes', description: 'Configurações do sistema', icon: 'settings', category: 'navigation', action: () => navigate('/settings'), shortcut: 'Alt+8' },

        // Actions
        { id: 'action-new-transaction', label: 'Nova Transação', description: 'Registrar entrada ou saída', icon: 'add_circle', category: 'action', action: () => navigate('/transactions/new') },
        { id: 'action-new-sale', label: 'Nova Venda', description: 'Registrar uma venda', icon: 'shopping_cart', category: 'action', action: () => navigate('/sales/new') },
        { id: 'action-new-contact', label: 'Novo Contato', description: 'Cadastrar cliente ou fornecedor', icon: 'person_add', category: 'action', action: () => navigate('/contacts/new') },
        { id: 'action-help', label: 'Central de Ajuda', description: 'Tutoriais e documentação', icon: 'help', category: 'action', action: () => navigate('/help') },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    const groupedCommands = {
        navigation: filteredCommands.filter(c => c.category === 'navigation'),
        action: filteredCommands.filter(c => c.category === 'action'),
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] animate-in fade-in duration-150">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
                {/* Search Input */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar páginas, ações..."
                        leftIcon={<span className="material-symbols-outlined text-xl">search</span>}
                        rightIcon={
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                ESC
                            </kbd>
                        }
                        className="text-base font-medium"
                    />
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">search_off</span>
                            <p className="text-sm text-slate-400">Nenhum resultado para "{query}"</p>
                        </div>
                    ) : (
                        <>
                            {groupedCommands.navigation.length > 0 && (
                                <>
                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegação</div>
                                    {groupedCommands.navigation.map((cmd, idx) => {
                                        const globalIdx = filteredCommands.indexOf(cmd);
                                        return (
                                            <button
                                                key={cmd.id}
                                                onClick={() => { cmd.action(); onClose(); }}
                                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${globalIdx === selectedIndex
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-xl ${globalIdx === selectedIndex ? 'text-primary' : 'text-slate-400'}`}>
                                                    {cmd.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{cmd.label}</p>
                                                    <p className="text-xs text-slate-400 truncate">{cmd.description}</p>
                                                </div>
                                                {cmd.shortcut && (
                                                    <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        {cmd.shortcut}
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </>
                            )}

                            {groupedCommands.action.length > 0 && (
                                <>
                                    <div className="px-3 py-2 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</div>
                                    {groupedCommands.action.map((cmd) => {
                                        const globalIdx = filteredCommands.indexOf(cmd);
                                        return (
                                            <button
                                                key={cmd.id}
                                                onClick={() => { cmd.action(); onClose(); }}
                                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${globalIdx === selectedIndex
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-xl ${globalIdx === selectedIndex ? 'text-primary' : 'text-slate-400'}`}>
                                                    {cmd.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{cmd.label}</p>
                                                    <p className="text-xs text-slate-400 truncate">{cmd.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">↵</kbd>
                            selecionar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold">esc</kbd>
                            fechar
                        </span>
                    </div>
                    <span className="font-bold">Flowy ERP</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
