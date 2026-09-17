import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

const toastConfigs: Record<
    ToastType,
    {
        background: string;
        color: string;
        icon: string;
    }
> = {
    success: {
        background: '#10b981',
        color: '#ffffff',
        icon: '✓',
    },
    error: {
        background: '#ef4444',
        color: '#ffffff',
        icon: '✕',
    },
    warning: {
        background: '#f59e0b',
        color: '#ffffff',
        icon: '⚠',
    },
    info: {
        background: '#3b82f6',
        color: '#ffffff',
        icon: 'ℹ',
    },
};

export function showToast(type: ToastType, message: string): void {
    const config = toastConfigs[type] || toastConfigs.info;

    Toastify({
        text: `${config.icon}  ${message}`,
        duration: 4000,
        close: true,
        gravity: 'top',
        position: 'right',
        stopOnFocus: true,
        style: {
            background: config.background,
            color: config.color,
        },
    }).showToast();
}

export const toast = {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message),
    info: (message: string) => showToast('info', message),
};
