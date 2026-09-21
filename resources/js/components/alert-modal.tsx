import React, { useEffect } from 'react';

export interface AlertModalProps {
    isOpen: boolean;
    title?: string;
    message?: React.ReactNode;
    buttonText?: string;
    icon?: string;
    variant?: 'info' | 'warning' | 'error';
    onClose: () => void;
}

export default function AlertModal({
    isOpen,
    title = 'Perhatian',
    message,
    buttonText = 'Mengerti',
    icon,
    variant = 'warning',
    onClose,
}: AlertModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const defaultIcon = icon || (variant === 'error' ? 'error' : variant === 'warning' ? 'warning' : 'info');

    const headerBg =
        variant === 'error'
            ? 'bg-error-container text-on-error-container'
            : variant === 'warning'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-tertiary-container text-on-tertiary-container';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[24px] w-full max-w-md neo-shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
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
                        className="w-8 h-8 rounded-lg border-[2px] border-primary bg-surface-container-lowest text-on-surface hover:bg-error-container hover:text-error flex items-center justify-center neo-shadow-xs transition-all"
                        aria-label="Tutup"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                    <div className="font-body text-base md:text-lg text-on-surface font-bold leading-relaxed">
                        {message}
                    </div>

                    <div className="flex justify-end pt-4 border-t-[2px] border-primary/20">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto bg-primary text-on-primary border-[3px] border-primary rounded-xl px-6 py-2.5 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
