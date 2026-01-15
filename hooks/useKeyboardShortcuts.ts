import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
    category: 'navigation' | 'action' | 'global';
}

interface UseKeyboardShortcutsOptions {
    onOpenCommandPalette?: () => void;
    onCloseCommandPalette?: () => void;
    onOpenHelpModal?: () => void;
    enabled?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { onOpenCommandPalette, onCloseCommandPalette, onOpenHelpModal, enabled = true } = options;

    // Check if we're on an authenticated route
    const isAuthenticatedRoute = !['/', '/login', '/signup', '/forgot-password', '/reset-password', '/privacy', '/terms', '/documentation'].some(
        path => location.pathname === path || location.pathname.startsWith('/help')
    );

    const shortcuts: ShortcutConfig[] = [
        // Global
        { key: 'k', ctrl: true, action: () => onOpenCommandPalette?.(), description: 'Abrir Busca Rápida', category: 'global' },
        { key: '/', action: () => onOpenHelpModal?.(), description: 'Mostrar Atalhos', category: 'global' },

        // Navigation (Alt + Number)
        { key: '1', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/dashboard'); }, description: 'Ir para Dashboard', category: 'navigation' },
        { key: '2', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/transactions'); }, description: 'Ir para Transações', category: 'navigation' },
        { key: '3', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/sales'); }, description: 'Ir para Vendas', category: 'navigation' },
        { key: '4', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/contacts'); }, description: 'Ir para Contatos', category: 'navigation' },
        { key: '5', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/reports'); }, description: 'Ir para Relatórios', category: 'navigation' },
        { key: '6', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/wallet'); }, description: 'Ir para Carteira', category: 'navigation' },
        { key: '7', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/ai-assistant'); }, description: 'Ir para Assistente IA', category: 'navigation' },
        { key: '8', alt: true, action: () => { onCloseCommandPalette?.(); navigate('/settings'); }, description: 'Ir para Ajustes', category: 'navigation' },
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Skip if user is typing in an input, textarea, or contenteditable
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Allow Escape and Ctrl+K even in inputs
            if (event.key !== 'Escape' && !(event.key === 'k' && (event.ctrlKey || event.metaKey))) {
                return;
            }
        }

        // Find matching shortcut
        const matchingShortcut = shortcuts.find(shortcut => {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

            return keyMatch && ctrlMatch && altMatch && shiftMatch;
        });

        if (matchingShortcut) {
            // Only trigger navigation shortcuts on authenticated routes
            if (matchingShortcut.category === 'navigation' && !isAuthenticatedRoute) {
                return;
            }

            event.preventDefault();
            matchingShortcut.action();
        }
    }, [enabled, shortcuts, isAuthenticatedRoute]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { shortcuts };
};

export default useKeyboardShortcuts;
