import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { showToast, type ToastType } from '@/lib/toast';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const lastToastRef = useRef<string | null>(null);

    const triggerToast = (data?: FlashToast | null) => {
        if (!data || !data.message || !data.type) {
            return;
        }

        const key = `${data.type}:${data.message}`;
        if (lastToastRef.current === key) {
            return;
        }

        lastToastRef.current = key;
        showToast(data.type as ToastType, data.message);

        setTimeout(() => {
            if (lastToastRef.current === key) {
                lastToastRef.current = null;
            }
        }, 1000);
    };

    useEffect(() => {
        const unbindFlash = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            triggerToast(flash?.toast as FlashToast | undefined);
        });

        const unbindNavigate = router.on('navigate', (event) => {
            const flash = event.detail.page.props?.flash as { toast?: FlashToast | null } | undefined;
            triggerToast(flash?.toast);
        });

        return () => {
            unbindFlash();
            unbindNavigate();
        };
    }, []);
}
