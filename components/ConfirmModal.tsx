import React from 'react';
import Modal from './Modal';
import Button from './Button';

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
    // confirmButtonClass logic removed as Button component handles variants now

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={type === 'info' ? 'primary' : type}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </Button>
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
