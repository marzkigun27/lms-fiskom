import { Head, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import {
    useConnectionStatus,
    useEcho,
    useEchoPresence,
    echo,
} from '@laravel/echo-react';
import {
    start_session,
    update_phase,
    end_session,
} from '@/routes/assistant/praktikum';

interface Participant {
    id: number;
    name: string;
    avatar: string;
    status: string;
    role?: string;
    session_id?: number;
    progress?: {
        completed: number;
        total: number;
        phase: string;
    };
}

interface PracticumSession {
    id: number;
    session_type: string;
    state: string;
    practicum_schedule_id: number;
    opened_at?: string | null;
}

interface PracticumSchedule {
    id: number;
    room?: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    module_id: number;
    weekly_schedule_id?: number | null;
    module: {
        id: number;
        title: string;
        code: string;
    };
}

interface Props {
    modules: any[];
    schedules: PracticumSchedule[];
    weeklySchedules: any[];
    activeSessions: PracticumSession[];
    participants: Participant[];
}

interface ParticipantProgressEvent {
    participantId: number;
    status: string;
    progress: Participant['progress'];
}

function LiveSessionPresence({
    sessionId,
    setLiveParticipants,
}: {
    sessionId: number;
    setLiveParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
}) {
    const { channel } = useEchoPresence<ParticipantProgressEvent>(
        `practicum.${sessionId}`,
        ['ParticipantProgressUpdated', '.ParticipantProgressUpdated'],
        (event) => {
            setLiveParticipants((participants) =>
                participants.map((participant) =>
                    participant.id === event.participantId
                        ? {
                              ...participant,
                              progress: event.progress,
                              status:
                                  event.status === 'submitted'
                                      ? 'submitted'
                                      : 'active',
                          }
                        : participant,
                ),
            );
        },
        [sessionId],
    );

    useEffect(() => {
        let presenceChannel = channel();
        if (!presenceChannel) {
            try {
                presenceChannel = echo().join(`practicum.${sessionId}`);
            } catch {
                // Ignore if not initialized
            }
        }

        if (!presenceChannel) {
            return;
        }

        const isAssistantOrAdmin = (u: any) => {
            const role = u?.role || u?.user_type;
            return role === 'assistant' || role === 'admin' || u?.is_assistant === true;
        };

        const syncMembers = (users: Array<{ id: number | string; name?: string; role?: string }>) => {
            const studentUsers = users.filter((u) => !isAssistantOrAdmin(u));
            const onlineIds = studentUsers.map((user) => Number(user.id));

            setLiveParticipants((participants) => {
                const filtered = participants.filter((p) => !isAssistantOrAdmin(p));
                const updated = filtered.map((participant) => ({
                    ...participant,
                    status: onlineIds.includes(Number(participant.id))
                        ? participant.status === 'submitted'
                            ? 'submitted'
                            : 'active'
                        : 'offline',
                }));

                for (const u of studentUsers) {
                    const uId = Number(u.id);
                    if (!updated.some((p) => p.id === uId) && u.name) {
                        updated.push({
                            id: uId,
                            name: u.name,
                            avatar: u.name.charAt(0).toUpperCase(),
                            status: 'active',
                            role: 'participant',
                        });
                    }
                }
                return updated;
            });
        };

        presenceChannel
            .here((users: Array<{ id: number | string; name?: string; role?: string }>) => {
                syncMembers(users);
            })
            .joining((user: { id: number | string; name?: string; role?: string }) => {
                if (isAssistantOrAdmin(user)) {
                    return;
                }
                const userId = Number(user.id);
                setLiveParticipants((participants) => {
                    const filtered = participants.filter((p) => !isAssistantOrAdmin(p));
                    const exists = filtered.some((p) => p.id === userId);
                    if (exists) {
                        return filtered.map((participant) =>
                            participant.id === userId
                                ? {
                                      ...participant,
                                      status:
                                          participant.status === 'submitted'
                                              ? 'submitted'
                                              : 'active',
                                  }
                                : participant,
                        );
                    }
                    if (user.name) {
                        return [
                            ...filtered,
                            {
                                id: userId,
                                name: user.name,
                                avatar: user.name.charAt(0).toUpperCase(),
                                status: 'active',
                                role: 'participant',
                            },
                        ];
                    }
                    return filtered;
                });
            })
            .leaving((user: { id: number | string; role?: string }) => {
                if (isAssistantOrAdmin(user)) {
                    return;
                }
                const userId = Number(user.id);
                setLiveParticipants((participants) =>
                    participants.map((participant) =>
                        participant.id === userId
                            ? { ...participant, status: 'offline' }
                            : participant,
                    ),
                );
            });

        const ch = presenceChannel as any;
        if (ch?.subscription?.members) {
            const currentUsers: Array<{ id: number | string; name?: string; role?: string }> = [];
            ch.subscription.members.each((member: any) => {
                if (member?.id && !isAssistantOrAdmin(member.info)) {
                    currentUsers.push({ id: member.id, name: member.info?.name, role: member.info?.role });
                }
            });
            if (currentUsers.length > 0) {
                syncMembers(currentUsers);
            }
        }
    }, [channel, setLiveParticipants, sessionId]);

    return null;
}

function AssistantScheduleListener({ scheduleId }: { scheduleId: number }) {
    useEcho(`practicum-control.${scheduleId}`, '.SessionStateUpdated', () => {
        router.reload({ only: ['schedules', 'activeSessions', 'participants'] });
    });

    return null;
}

export default function ManageModulesIndex({
    modules,
    schedules,
    weeklySchedules,
    activeSessions,
    participants: initialParticipants,
}: Props) {
    const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;
    const isSessionStarted = activeSession !== null;

    const isModuleCompleted = (moduleId: number) => {
        if (selectedWeeklyScheduleId) {
            return schedules.some(
                (s) =>
                    Number(s.module_id) === Number(moduleId) &&
                    String(s.weekly_schedule_id) === String(selectedWeeklyScheduleId) &&
                    s.status === 'completed',
            );
        }

        return schedules.some(
            (s) =>
                Number(s.module_id) === Number(moduleId) &&
                s.status === 'completed',
        );
    };

    const filterOutAssistants = (list: Participant[]) =>
        list.filter((p: any) => {
            const role = p?.role || p?.user_type;
            return role !== 'assistant' && role !== 'admin' && !p?.is_assistant;
        });

    const [liveParticipants, setLiveParticipants] =
        useState<Participant[]>(() => filterOutAssistants(initialParticipants));

    useEffect(() => {
        setLiveParticipants((current) => {
            const currentStatusMap = new Map(
                current.map((p) => [
                    p.id,
                    { status: p.status, progress: p.progress },
                ]),
            );

            return filterOutAssistants(initialParticipants).map((p) => {
                const existing = currentStatusMap.get(p.id);
                return {
                    ...p,
                    status: existing ? existing.status : p.status,
                    progress: existing?.progress ?? p.progress,
                };
            });
        });
    }, [initialParticipants]);

    const [elapsedTime, setElapsedTime] = useState('00:00');
    const [pendingPhaseIndex, setPendingPhaseIndex] = useState<number | null>(
        null,
    );
    const [isRollbackAction, setIsRollbackAction] = useState<boolean>(false);
    const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
    const [selectedWeeklyScheduleId, setSelectedWeeklyScheduleId] =
        useState<string>('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    const sessionPhases = [
        {
            id: 'pilih_modul',
            label: 'Pilih Jadwal',
            type: 'select',
            color: 'bg-surface-container-high text-on-surface',
            accent: 'text-on-surface-variant',
            barColor: '',
        },
        {
            id: 'initial_task',
            label: 'Tugas Awal',
            type: 'progress',
            color: 'bg-primary-container text-on-primary',
            accent: 'text-primary-fixed',
            barColor: 'bg-tertiary-fixed',
        },
        {
            id: 'journal',
            label: 'Jurnal',
            type: 'progress',
            color: 'bg-[#FFF59D] text-black dark:text-on-surface',
            accent: 'text-on-surface-variant dark:text-on-surface-variant',
            barColor: 'bg-primary',
        },
        {
            id: 'independent_task',
            label: 'Tugas Akhir',
            type: 'progress',
            color: 'bg-secondary-fixed text-on-secondary-fixed',
            accent: 'text-secondary',
            barColor: 'bg-secondary-container',
        },
        {
            id: 'feedback',
            label: 'Feedback Praktikum',
            type: 'progress',
            color: 'bg-tertiary-container text-on-tertiary-container',
            accent: 'text-tertiary',
            barColor: 'bg-primary-fixed',
        },
    ];

    const activePhaseIndex = activeSession
        ? sessionPhases.findIndex((p) => p.id === activeSession.session_type)
        : 0;

    const connectionStatus = useConnectionStatus();

    useEffect(() => {
        if (!activeSession?.opened_at) {
            setElapsedTime('00:00');
            return;
        }

        const updateElapsedTime = () => {
            const elapsedSeconds = Math.max(
                0,
                Math.floor(
                    (Date.now() -
                        new Date(activeSession.opened_at as string).getTime()) /
                        1000,
                ),
            );
            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const seconds = elapsedSeconds % 60;
            setElapsedTime(
                hours > 0
                    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            );
        };

        updateElapsedTime();
        const timer = window.setInterval(updateElapsedTime, 1000);

        return () => window.clearInterval(timer);
    }, [activeSession?.id, activeSession?.opened_at]);

    const activeSchedule = activeSession
        ? schedules.find((s) => s.id === activeSession.practicum_schedule_id)
        : null;

    const handleStartSession = () => {
        if (!selectedWeeklyScheduleId || !selectedModuleId) return;
        router.post(
            start_session.url(),
            {
                weekly_schedule_id: selectedWeeklyScheduleId,
                module_id: selectedModuleId,
            },
            {
                onSuccess: () => setPendingPhaseIndex(null),
            },
        );
    };

    const handleChangePhase = () => {
        if (pendingPhaseIndex === null || !activeSession) return;
        const phaseId = sessionPhases[pendingPhaseIndex].id;
        router.patch(
            update_phase.url({ session: activeSession.id }),
            { phase: phaseId },
            {
                onSuccess: () => setPendingPhaseIndex(null),
            },
        );
    };

    const handleEndSession = () => {
        if (!activeSession) return;
        router.post(end_session.url({ session: activeSession.id }));
    };

    return (
        <>
            {activeSession && (
                <LiveSessionPresence
                    sessionId={activeSession.id}
                    setLiveParticipants={setLiveParticipants}
                />
            )}
            {weeklySchedules.map((schedule) => (
                <AssistantScheduleListener
                    key={schedule.id}
                    scheduleId={schedule.id}
                />
            ))}
            <Head title="Practicum Management" />
            <div className="bg-surface-container hide-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto max-w-6xl space-y-6 pb-12">
                    {/* Header Topbar */}
                    <header className="border-primary flex flex-col justify-between gap-6 border-b-[4px] pb-6 md:flex-row md:items-end">
                        <div>
                            <h1 className="font-headline text-on-surface text-4xl font-extrabold tracking-tight uppercase md:text-5xl">
                                Practicum Management
                            </h1>
                        </div>
                    </header>

                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
                        {/* Session Header */}
                        <div className="mb-2 flex flex-col items-start justify-between gap-4 md:flex-row">
                            <div>
                                <div className="mb-2 flex items-center gap-3">
                                    <span className="font-label text-on-surface-variant text-sm font-bold tracking-widest uppercase">
                                        Session:{' '}
                                        {activeSchedule
                                            ? `${activeSchedule.module.title} - ${activeSchedule.room}`
                                            : 'No Active Session'}
                                    </span>
                                    {isSessionStarted && (
                                        <span className="bg-tertiary-fixed border-primary font-label neo-shadow-sm inline-flex items-center gap-1.5 rounded-full border-[2px] px-3 py-1 text-xs font-bold">
                                            <span className="bg-tertiary-container h-2 w-2 animate-pulse rounded-full" />
                                            Live
                                        </span>
                                    )}
                                    <span className="font-label text-on-surface-variant text-xs font-bold uppercase">
                                        {connectionStatus === 'connected'
                                            ? 'Realtime terhubung'
                                            : connectionStatus ===
                                                    'reconnecting' ||
                                                connectionStatus ===
                                                    'connecting'
                                              ? 'Menghubungkan realtime...'
                                              : 'Realtime terputus'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                            {/* Command Center */}
                            <div className="bg-primary-container text-on-primary border-primary neo-shadow-lg col-span-1 flex flex-col gap-4 rounded-2xl border-[3px] p-6 md:col-span-4">
                                <h3 className="font-headline border-primary-fixed-dim mb-2 border-b-[3px] pb-2 text-2xl font-bold">
                                    Command Center
                                </h3>
                                {!isSessionStarted ? (
                                    <button
                                        onClick={() => setPendingPhaseIndex(1)}
                                        disabled={
                                            !selectedWeeklyScheduleId ||
                                            !selectedModuleId
                                        }
                                        className="bg-tertiary-fixed border-primary font-headline neo-shadow hover:neo-shadow-md my-auto flex w-full items-center justify-center gap-3 rounded-xl border-[3px] py-4 text-xl font-bold text-black transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                                    >
                                        <span
                                            className="material-symbols-outlined text-3xl"
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            play_arrow
                                        </span>
                                        Start Session
                                    </button>
                                ) : (
                                    <>
                                        {/* Phase Control Buttons styled like photo */}
                                        <div className="border-primary bg-surface neo-shadow flex flex-col gap-3 rounded-xl border-[3px] p-4 text-on-surface">
                                            <div className="flex items-center justify-between">
                                                <span className="font-label text-xs font-black tracking-wider uppercase text-outline">
                                                    Control Phase
                                                </span>
                                                <span className="font-label text-xs font-bold text-primary">
                                                    Tahap {activePhaseIndex} / {sessionPhases.length - 1}
                                                </span>
                                            </div>

                                            {/* PREV and NEXT Buttons matching user photo */}
                                            <div className="flex flex-col items-center gap-1 pt-1">
                                                <div className="flex w-full items-center justify-center gap-3">
                                                    {/* PREV BUTTON */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsRollbackAction(false);
                                                            setPendingPhaseIndex(Math.max(1, activePhaseIndex - 1));
                                                        }}
                                                        disabled={activePhaseIndex <= 1}
                                                        className="group relative flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#16a34a] bg-white dark:bg-slate-900 px-4 py-2.5 font-headline text-base font-bold text-[#16a34a] dark:text-[#22c55e] shadow-[4px_4px_0px_#16a34a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#16a34a] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                                                    >
                                                        <span className="text-xl font-black leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
                                                        <span className="tracking-wider">PREV</span>
                                                    </button>

                                                    {/* NEXT BUTTON */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsRollbackAction(false);
                                                            setPendingPhaseIndex(Math.min(sessionPhases.length - 1, activePhaseIndex + 1));
                                                        }}
                                                        disabled={activePhaseIndex >= sessionPhases.length - 1}
                                                        className="group relative flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#16a34a] bg-white dark:bg-slate-900 px-4 py-2.5 font-headline text-base font-bold text-[#16a34a] dark:text-[#22c55e] shadow-[4px_4px_0px_#16a34a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#16a34a] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                                                    >
                                                        <span className="tracking-wider">NEXT</span>
                                                        <span className="text-xl font-black leading-none group-hover:translate-x-0.5 transition-transform">→</span>
                                                    </button>
                                                </div>

                                                {/* Dashed curved rollback line as in photo */}
                                                <div className="w-full max-w-[240px] h-3.5 relative flex items-center justify-center pointer-events-none">
                                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 200 16" fill="none">
                                                        <path
                                                            d="M 165 2 C 165 14, 35 14, 35 3"
                                                            stroke="#16a34a"
                                                            strokeWidth="1.75"
                                                            strokeDasharray="4 4"
                                                            fill="none"
                                                        />
                                                        <polygon points="31,4 35,0 39,4" fill="#16a34a" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* ROLLBACK BUTTON */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsRollbackAction(true);
                                                    if (activePhaseIndex <= 2) {
                                                        setPendingPhaseIndex(1);
                                                    } else {
                                                        setShowRollbackModal(true);
                                                    }
                                                }}
                                                disabled={activePhaseIndex <= 1}
                                                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#16a34a]/80 bg-white/95 dark:bg-slate-900 px-4 py-2 font-headline text-xs font-bold text-[#16a34a] dark:text-[#22c55e] shadow-[3px_3px_0px_#16a34a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#16a34a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-base">restart_alt</span>
                                                <span className="tracking-wider uppercase">Rollback Tahap</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleEndSession}
                                            className="bg-secondary-container text-on-secondary-container border-primary font-label neo-shadow hover:neo-shadow-md mt-auto flex w-full items-center justify-center gap-2 rounded-xl border-[3px] py-4 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                                        >
                                            <span
                                                className="material-symbols-outlined"
                                                style={{
                                                    fontVariationSettings:
                                                        "'FILL' 1",
                                                }}
                                            >
                                                stop
                                            </span>
                                            End Session
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Session Status & Completion Rates */}
                            <div className="bg-surface-container-lowest border-primary neo-shadow-lg col-span-1 flex flex-col rounded-2xl border-[3px] p-6 md:col-span-8">
                                <div className="border-primary mb-6 flex items-center justify-between border-b-[3px] pb-4">
                                    <h3 className="font-headline text-on-surface text-2xl font-bold">
                                        Session Status
                                    </h3>
                                    {isSessionStarted &&
                                    activePhaseIndex > 0 ? (
                                        <div className="bg-secondary-container text-on-secondary-container border-primary neo-shadow flex items-center gap-3 rounded-xl border-[3px] px-4 py-2">
                                            <span
                                                className="material-symbols-outlined"
                                                style={{
                                                    fontVariationSettings:
                                                        "'FILL' 1",
                                                }}
                                            >
                                                timer
                                            </span>
                                            <span className="font-headline text-2xl font-black">
                                                {elapsedTime}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="bg-surface-variant text-on-surface-variant border-primary neo-shadow flex items-center gap-3 rounded-xl border-[3px] px-4 py-2">
                                            <span className="font-headline text-xl font-bold">
                                                Start a practicum
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isSessionStarted || activePhaseIndex === 0 ? (
                                    <>
                                        <div className="mb-4 flex items-center justify-between">
                                            <h4 className="font-headline text-on-surface text-xl font-bold">
                                                Session Phase
                                            </h4>
                                            {activePhaseIndex > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsRollbackAction(false);
                                                            setPendingPhaseIndex(Math.max(1, activePhaseIndex - 1));
                                                        }}
                                                        disabled={activePhaseIndex <= 1}
                                                        aria-label="Tahap sebelumnya"
                                                        className="group relative inline-flex items-center justify-center gap-1 rounded-xl border-2 border-[#16a34a] bg-white dark:bg-slate-900 px-3 py-1 font-headline text-xs font-bold text-[#16a34a] dark:text-[#22c55e] shadow-[2px_2px_0px_#16a34a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                                                    >
                                                        <span className="font-bold leading-none">←</span>
                                                        <span>PREV</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsRollbackAction(false);
                                                            setPendingPhaseIndex(Math.min(sessionPhases.length - 1, activePhaseIndex + 1));
                                                        }}
                                                        disabled={activePhaseIndex >= sessionPhases.length - 1}
                                                        aria-label="Tahap berikutnya"
                                                        className="group relative inline-flex items-center justify-center gap-1 rounded-xl border-2 border-[#16a34a] bg-white dark:bg-slate-900 px-3 py-1 font-headline text-xs font-bold text-[#16a34a] dark:text-[#22c55e] shadow-[2px_2px_0px_#16a34a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                                                    >
                                                        <span>NEXT</span>
                                                        <span className="font-bold leading-none">→</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center">
                                            {(() => {
                                                const phase =
                                                    sessionPhases[
                                                        activePhaseIndex
                                                    ];
                                                if (phase.type === 'select') {
                                                    return (
                                                        <div
                                                            key={phase.id}
                                                            className={`${phase.color} border-primary neo-shadow animate-in fade-in zoom-in-95 flex min-h-[160px] flex-col justify-between rounded-xl border-[3px] p-6 duration-300`}
                                                        >
                                                            <div className="flex flex-1 flex-col justify-center gap-4">
                                                                <select
                                                                    value={
                                                                        selectedWeeklyScheduleId
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setSelectedWeeklyScheduleId(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="bg-surface border-primary font-body text-on-surface focus:border-tertiary-fixed neo-shadow w-full rounded-xl border-[3px] px-4 py-3 transition-all focus:ring-0 focus:outline-none"
                                                                >
                                                                    <option value="">
                                                                        -- Pilih
                                                                        Jadwal
                                                                        (Weekly)
                                                                        --
                                                                    </option>
                                                                    {weeklySchedules.map(
                                                                        (
                                                                            schedule,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    schedule.id
                                                                                }
                                                                                value={
                                                                                    schedule.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    schedule.day
                                                                                }{' '}
                                                                                -{' '}
                                                                                {
                                                                                    schedule.shift
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                                <select
                                                                    value={
                                                                        selectedModuleId
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setSelectedModuleId(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="bg-surface border-primary font-body text-on-surface focus:border-tertiary-fixed neo-shadow w-full rounded-xl border-[3px] px-4 py-3 transition-all focus:ring-0 focus:outline-none"
                                                                >
                                                                    <option value="">
                                                                        -- Pilih
                                                                        Modul --
                                                                    </option>
                                                                    {modules.map(
                                                                        (
                                                                            mod,
                                                                        ) => {
                                                                            const completed =
                                                                                isModuleCompleted(
                                                                                    mod.id,
                                                                                );
                                                                            return (
                                                                                <option
                                                                                    key={
                                                                                        mod.id
                                                                                    }
                                                                                    value={
                                                                                        mod.id
                                                                                    }
                                                                                >
                                                                                    {completed
                                                                                        ? '✓ '
                                                                                        : ''}
                                                                                    {
                                                                                        mod.code
                                                                                    }{' '}
                                                                                    -{' '}
                                                                                    {
                                                                                        mod.title
                                                                                    }
                                                                                    {completed
                                                                                        ? ' (Sudah Dilaksanakan)'
                                                                                        : ''}
                                                                                </option>
                                                                            );
                                                                        },
                                                                    )}
                                                                </select>
                                                                {selectedModuleId &&
                                                                    isModuleCompleted(
                                                                        Number(
                                                                            selectedModuleId,
                                                                        ),
                                                                    ) && (
                                                                        <div className="border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mt-2 flex items-center gap-2 rounded-lg border-2 p-2.5 text-xs font-bold">
                                                                            <span className="material-symbols-outlined text-sm">
                                                                                check_circle
                                                                            </span>
                                                                            <span>
                                                                                Praktikum
                                                                                untuk
                                                                                modul
                                                                                ini
                                                                                sudah
                                                                                pernah
                                                                                dilaksanakan.
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Calculate overall progress for this phase from liveParticipants
                                                const currentPhaseProgress =
                                                    liveParticipants.reduce(
                                                        (acc, p) => {
                                                            if (
                                                                p.progress
                                                                    ?.phase ===
                                                                phase.id
                                                            ) {
                                                                acc.completed +=
                                                                    p.progress.completed;
                                                                acc.total +=
                                                                    p.progress.total;
                                                            }
                                                            return acc;
                                                        },
                                                        {
                                                            completed: 0,
                                                            total: 0,
                                                        },
                                                    );

                                                const percentage =
                                                    currentPhaseProgress.total
                                                        ? Math.round(
                                                              (currentPhaseProgress.completed /
                                                                  currentPhaseProgress.total) *
                                                                  100,
                                                          )
                                                        : 0;

                                                return (
                                                    <div
                                                        key={phase.id}
                                                        className={`${phase.color} border-primary neo-shadow animate-in fade-in zoom-in-95 flex min-h-[160px] flex-col justify-between rounded-xl border-[3px] p-6 duration-300`}
                                                    >
                                                        <p
                                                            className={`font-label text-sm ${phase.accent} mb-4 font-bold tracking-wider uppercase`}
                                                        >
                                                            {phase.label}
                                                        </p>
                                                        <div>
                                                            <div className="mb-2 flex items-end gap-2">
                                                                <span className="font-headline text-6xl leading-none font-black">
                                                                    {
                                                                        currentPhaseProgress.completed
                                                                    }
                                                                </span>
                                                                <span className="font-body pb-1 text-xl">
                                                                    /{' '}
                                                                    {currentPhaseProgress.total ||
                                                                        '?'}
                                                                </span>
                                                            </div>
                                                            <div className="border-primary bg-surface-container mt-6 h-4 overflow-hidden rounded-full border-[2px]">
                                                                <div
                                                                    className={`h-full ${phase.barColor} border-primary border-r-[2px]`}
                                                                    style={{
                                                                        width: `${percentage}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {/* Live Presence List */}
                        {isSessionStarted && (
                            <div className="bg-surface-container-lowest border-primary neo-shadow-lg mt-8 rounded-2xl border-[3px] p-6">
                                <div className="border-primary mb-6 flex items-center justify-between border-b-[3px] pb-4">
                                    <h3 className="font-headline text-on-surface text-2xl font-bold">
                                        Live Presence
                                    </h3>
                                    <div className="font-label bg-primary-fixed text-on-primary-fixed border-primary neo-shadow-sm rounded-full border-[2px] px-3 py-1 text-sm font-bold">
                                        {
                                            liveParticipants.filter(
                                                (p) =>
                                                    p.status === 'active' ||
                                                    p.status === 'submitted',
                                            ).length
                                        }{' '}
                                        Online, {liveParticipants.length} Total
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {liveParticipants.map((p) => (
                                        <div
                                            key={p.id}
                                            className="border-primary bg-surface hover:bg-surface-container-low neo-shadow flex items-center gap-4 rounded-xl border-[3px] p-3 transition-colors"
                                        >
                                            <div className="border-primary bg-surface-variant font-headline flex h-12 w-12 items-center justify-center rounded-lg border-[2px] text-xl font-bold">
                                                {p.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-headline text-on-surface line-clamp-1 font-bold">
                                                    {p.name}
                                                </h4>
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    {p.status === 'active' && (
                                                        <>
                                                            <span className="bg-emerald-500 h-2 w-2 animate-pulse rounded-full" />
                                                            <span className="font-label text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase">
                                                                Online
                                                            </span>
                                                        </>
                                                    )}
                                                    {p.status ===
                                                        'submitted' && (
                                                        <>
                                                            <span
                                                                className="material-symbols-outlined text-primary text-[14px]"
                                                                style={{
                                                                    fontVariationSettings:
                                                                        "'FILL' 1",
                                                                }}
                                                            >
                                                                check_circle
                                                            </span>
                                                            <span className="font-label text-primary text-xs font-bold uppercase">
                                                                Submitted
                                                            </span>
                                                        </>
                                                    )}
                                                    {p.status === 'offline' && (
                                                        <>
                                                            <span className="bg-outline h-2 w-2 rounded-full" />
                                                            <span className="font-label text-outline text-xs font-bold uppercase">
                                                                Belum Online
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {liveParticipants.length === 0 && (
                                        <div className="border-outline-variant bg-surface-container col-span-full flex items-center gap-4 rounded-xl border-[3px] border-dashed p-3 opacity-50">
                                            <div className="border-outline-variant bg-surface-container flex h-12 w-12 items-center justify-center rounded-lg border-[2px]">
                                                <span className="material-symbols-outlined text-outline">
                                                    person
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-headline text-on-surface-variant font-bold">
                                                    No participants enrolled in
                                                    this session...
                                                </h4>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {pendingPhaseIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="bg-primary/80 absolute inset-0 backdrop-blur-sm"
                        onClick={() => setPendingPhaseIndex(null)}
                    ></div>
                    <div className="bg-surface border-primary neo-shadow-xl relative z-10 mx-4 w-full max-w-sm rounded-2xl border-[4px] p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className={`${isRollbackAction || pendingPhaseIndex < activePhaseIndex ? 'bg-amber-100 text-amber-800' : 'bg-primary-container text-on-primary-container'} border-primary neo-shadow mb-6 flex h-16 w-16 items-center justify-center rounded-full border-[3px]`}>
                                <span className="material-symbols-outlined text-3xl font-black">
                                    {activePhaseIndex === 0
                                        ? 'play_arrow'
                                        : isRollbackAction || pendingPhaseIndex < activePhaseIndex
                                          ? 'history'
                                          : 'arrow_forward'}
                                </span>
                            </div>
                            <h2 className="font-headline text-on-surface mb-2 text-2xl font-extrabold">
                                {activePhaseIndex === 0
                                    ? 'Mulai Sesi Praktikum?'
                                    : isRollbackAction
                                      ? 'Rollback Tahap?'
                                      : pendingPhaseIndex < activePhaseIndex
                                        ? 'Kembali ke Tahap Sebelumnya?'
                                        : 'Lanjut ke Tahap Berikutnya?'}
                            </h2>
                            <p className="font-body text-on-surface-variant mb-8">
                                {activePhaseIndex === 0 ? (
                                    'Apakah Anda yakin ingin memulai sesi praktikum? Sesi akan dibuka dan layar seluruh praktikan akan diarahkan ke Tugas Awal.'
                                ) : (
                                    <>
                                        Apakah Anda yakin ingin{' '}
                                        {isRollbackAction
                                            ? 'me-rollback sesi ke'
                                            : pendingPhaseIndex < activePhaseIndex
                                              ? 'kembali ke'
                                              : 'melanjutkan ke'}{' '}
                                        tahap{' '}
                                        <strong>
                                            {
                                                sessionPhases[pendingPhaseIndex]
                                                    ?.label
                                            }
                                        </strong>
                                        ? Sesi praktikan yang terhubung akan otomatis diarahkan ke tahap ini.
                                    </>
                                )}
                            </p>
                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={
                                        activePhaseIndex === 0
                                            ? handleStartSession
                                            : handleChangePhase
                                    }
                                    className="bg-primary-fixed text-on-primary-fixed font-label border-primary neo-shadow hover:neo-shadow-md w-full rounded-xl border-[3px] py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                                >
                                    {activePhaseIndex === 0
                                        ? 'Mulai Sesi'
                                        : isRollbackAction || pendingPhaseIndex < activePhaseIndex
                                          ? 'Ya, Rollback / Kembali'
                                          : 'Ya, Lanjutkan'}
                                </button>
                                <button
                                    onClick={() => setPendingPhaseIndex(null)}
                                    className="bg-surface text-on-surface font-label border-primary neo-shadow hover:neo-shadow-md w-full rounded-xl border-[3px] py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rollback Selector Modal */}
            {showRollbackModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="bg-primary/80 absolute inset-0 backdrop-blur-sm"
                        onClick={() => setShowRollbackModal(false)}
                    ></div>
                    <div className="bg-surface border-primary neo-shadow-xl relative z-10 mx-4 w-full max-w-md rounded-2xl border-[4px] p-6 md:p-8">
                        <div className="text-center">
                            <div className="bg-amber-100 text-amber-700 border-primary neo-shadow mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px]">
                                <span className="material-symbols-outlined text-3xl font-black">
                                    restart_alt
                                </span>
                            </div>
                            <h2 className="font-headline text-on-surface mb-2 text-2xl font-black uppercase">
                                Rollback Tahap Praktikum
                            </h2>
                            <p className="font-body text-outline mb-6 text-sm">
                                Pilih tahap sebelumnya yang ingin diaktifkan kembali. Seluruh praktikan akan diarahkan kembali ke tahap tersebut.
                            </p>
                            <div className="space-y-3 mb-6">
                                {sessionPhases
                                    .slice(1, activePhaseIndex)
                                    .map((phase, idx) => (
                                        <button
                                            key={phase.id}
                                            type="button"
                                            onClick={() => {
                                                setShowRollbackModal(false);
                                                setIsRollbackAction(true);
                                                setPendingPhaseIndex(idx + 1);
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-emerald-500 bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-headline font-bold shadow-[3px_3px_0px_#16a34a] transition-all hover:-translate-y-0.5 active:translate-y-0.5 text-left"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-xl text-emerald-600">
                                                    history
                                                </span>
                                                <span>Rollback ke {phase.label}</span>
                                            </span>
                                            <span className="font-label text-xs uppercase px-2 py-1 bg-emerald-100 dark:bg-emerald-950/60 rounded-md">
                                                Tahap {idx + 1}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRollbackModal(false)}
                                className="w-full bg-surface border-primary font-label text-on-surface neo-shadow rounded-xl border-[3px] py-2.5 font-bold uppercase transition-all"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
