import React, { useEffect } from 'react';

export interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message?: React.ReactNode;
    submessage?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmModal({
    isOpen,
    title = 'Konfirmasi Hapus',
    message = 'Apakah Anda yakin ingin menghapus data ini?',
    submessage = 'Tindakan ini tidak dapat dibatalkan. Data yang telah dihapus akan hilang permanen.',
    confirmText = 'Ya, Hapus',
    cancelText = 'Batal',
    icon,
    variant = 'danger',
    isLoading = false,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const defaultIcon = icon || (variant === 'danger' ? 'delete' : variant === 'warning' ? 'warning' : 'help_center');

    const headerBg =
        variant === 'danger'
            ? 'bg-error-container text-on-error-container'
            : variant === 'warning'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-tertiary-container text-on-tertiary-container';

    const confirmBtnBg =
        variant === 'danger'
            ? 'bg-error text-white hover:bg-error/90'
            : variant === 'warning'
              ? 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim'
              : 'bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) {
                    onClose();
                }
            }}
        >
            <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[24px] w-full max-w-md neo-shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
                {/* Header */}
                <div className={`${headerBg} border-b-[4px] border-primary px-6 py-4 flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-3xl select-none">
                            {defaultIcon}
                        </span>
                        <h2 className="font-headline font-black text-2xl uppercase tracking-tight">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 rounded-lg border-[2px] border-primary bg-surface-container-lowest text-on-surface hover:bg-error-container hover:text-error flex items-center justify-center neo-shadow-xs transition-all disabled:opacity-50"
                        aria-label="Tutup"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 space-y-4">
                    <div className="font-body text-base md:text-lg text-on-surface font-bold leading-relaxed">
                        {message}
                    </div>

                    {submessage && (
                        <p className="font-body text-xs md:text-sm text-on-surface-variant font-medium leading-normal">
                            {submessage}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-[2px] border-primary/20">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onClose}
                            className="bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-[3px] border-primary rounded-xl px-5 py-2.5 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onConfirm}
                            className={`${confirmBtnBg} border-[3px] border-primary rounded-xl px-5 py-2.5 font-label font-black uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 justify-center disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl">
                                        {defaultIcon}
                                    </span>
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
