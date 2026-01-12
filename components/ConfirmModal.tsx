import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'info'
}) => {
    const confirmButtonClass = type === 'danger'
        ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
        : type === 'warning'
            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
            : 'bg-primary hover:bg-primary/90 shadow-primary/20';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg active:scale-95 ${confirmButtonClass}`}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="flex gap-4">
                {type === 'danger' && (
                    <div className="flex-shrink-0 size-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-2xl">delete_forever</span>
                    </div>
                )}
                {type === 'warning' && (
                    <div className="flex-shrink-0 size-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
                    </div>
                )}
                <div className="flex flex-col">
                    <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
