import { Head, useHttp } from '@inertiajs/react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { dashboard } from '@/routes';
import type { DashboardInvitation } from '@/types';
import { useEchoPublic, useConnectionStatus } from '@laravel/echo-react';

type Props = {
    pendingInvitations?: DashboardInvitation[];
};

export default function Dashboard({ pendingInvitations = [] }: Props) {
    const [showInvitations, setShowInvitations] = useState(
        pendingInvitations.length > 0,
    );

    const connectionStatus = useConnectionStatus();
    const [wsMessages, setWsMessages] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    
    const { post } = useHttp();

    useEchoPublic('test-channel', 'TestEvent', (event: any) => {
        setWsMessages((prev) => [...prev, `${event.time}: ${event.message}`]);
    });

    const triggerBroadcast = async () => {
        setIsSending(true);
        try {
            await post('/test-broadcast');
        } catch (e) {
            console.error('Failed to trigger broadcast', e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-4 shadow-sm">
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-semibold text-on-surface">WebSocket Tester</h3>
                            <div className="mt-2 flex items-center justify-center space-x-2">
                                <span className="text-sm text-outline">Status:</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                    {connectionStatus}
                                </span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={triggerBroadcast}
                            disabled={isSending || connectionStatus !== 'connected'}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {isSending ? 'Sending...' : 'Trigger Server Event'}
                        </button>

                        <div className="mt-4 w-full flex-1 overflow-y-auto rounded-md bg-surface-container p-3 text-sm max-h-32">
                            {wsMessages.length === 0 ? (
                                <p className="text-center text-outline">No messages yet.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {wsMessages.map((msg, i) => (
                                        <li key={i} className="animate-in slide-in-from-left-2 fade-in font-mono text-xs text-on-surface">
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-outline/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-outline/20" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-outline/20" />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
