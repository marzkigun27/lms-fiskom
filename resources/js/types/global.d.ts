import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';
import type { FlashToast } from '@/types/ui';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        flashDataType: {
            toast?: FlashToast;
        };
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            currentTeam: Team | null;
            teams: Team[];
            flash?: {
                success?: string | null;
                error?: string | null;
                warning?: string | null;
                info?: string | null;
                status?: string | null;
                message?: string | null;
                toast?: FlashToast | null;
            };
            [key: string]: unknown;
        };
    }
}
