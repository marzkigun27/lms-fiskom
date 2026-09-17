import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

interface PrelabModuleItem {
    id: number;
    order_number: number;
    code: string;
    title: string;
    description: string;
    period: {
        id: number;
        opens_at: string;
        deadline_at: string;
        opens_at_formatted: string;
        deadline_at_formatted: string;
        state: 'scheduled' | 'active' | 'closed';
    } | null;
    status: 'not_started' | 'ongoing' | 'expired';
    status_label: string;
    remaining_time: string | null;
    remaining_seconds: number;
    participant_work_state: 'unstarted' | 'draft' | 'submitted';
    participant_work_label: string;
}

interface Props {
    modules: PrelabModuleItem[];
}

export default function ParticipantPreLabIndex({ modules }: Props) {
    const { flash } = usePage().props as any;

    // Client-side live timer tick for remaining seconds
    const sanitizeModules = (mods: PrelabModuleItem[]) =>
        mods.map((m) => ({
            ...m,
            remaining_seconds: Math.max(0, Math.floor(m.remaining_seconds || 0)),
        }));

    const [moduleList, setModuleList] = useState(() => sanitizeModules(modules));

    useEffect(() => {
        setModuleList(sanitizeModules(modules));
    }, [modules]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            let shouldReload = false;

            setModuleList((prev) =>
                prev.map((mod) => {
                    if (mod.period) {
                        const opensAtTime = new Date(mod.period.opens_at).getTime();
                        const deadlineAtTime = new Date(mod.period.deadline_at).getTime();

                        // Auto-transition when scheduled start time arrives
                        if (mod.status === 'not_started' && now >= opensAtTime && now <= deadlineAtTime) {
                            shouldReload = true;
                            return {
                                ...mod,
                                status: 'ongoing',
                                status_label: 'Sedang Berjalan',
                                remaining_seconds: Math.max(0, Math.floor((deadlineAtTime - now) / 1000)),
                            };
                        }

                        // Auto-transition when deadline arrives
                        if (mod.status === 'ongoing' && now > deadlineAtTime) {
                            shouldReload = true;
                            return {
                                ...mod,
                                status: 'expired',
                                status_label: 'Sudah Lewat',
                                remaining_time: 'Waktu Habis',
                                remaining_seconds: 0,
                            };
                        }
                    }

                    if (mod.status === 'ongoing' && mod.remaining_seconds > 0) {
                        const nextSeconds = Math.max(0, Math.floor(mod.remaining_seconds) - 1);
                        if (nextSeconds <= 0) {
                            shouldReload = true;
                            return {
                                ...mod,
                                remaining_seconds: 0,
                                status: 'expired',
                                status_label: 'Sudah Lewat',
                                remaining_time: 'Waktu Habis',
                            };
                        }
                        const days = Math.floor(nextSeconds / 86400);
                        const hours = Math.floor((nextSeconds % 86400) / 3600);
                        const minutes = Math.floor((nextSeconds % 3600) / 60);
                        const seconds = Math.floor(nextSeconds % 60);

                        const parts = [];
                        if (days > 0) parts.push(`${days} hari`);
                        if (hours > 0) parts.push(`${hours} jam`);
                        if (minutes > 0) parts.push(`${minutes} menit`);
                        if (days === 0 && hours === 0) parts.push(`${seconds} detik`);

                        return {
                            ...mod,
                            remaining_seconds: nextSeconds,
                            remaining_time: parts.join(' '),
                        };
                    }
                    return mod;
                })
            );

            if (shouldReload) {
                router.reload({ only: ['modules'] });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Tugas Pendahuluan" />

            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                <div className="max-w-6xl mx-auto space-y-8 pb-24">
                    {/* Header */}
                    <div className="border-b-[4px] border-black dark:border-white pb-6">
                        <div className="inline-flex items-center gap-2 bg-tertiary-fixed text-black font-label font-black text-xs uppercase px-3 py-1 rounded-full border-2 border-black mb-3 neo-shadow-sm">
                            <span className="material-symbols-outlined text-sm">assignment</span>
                            Preliminary Tasks
                        </div>
                        <h1 className="font-headline text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight">
                            Tugas Pendahuluan
                        </h1>
                        <p className="font-body text-outline mt-2 text-base max-w-2xl leading-relaxed">
                            Pilih modul praktikum untuk melihat soal dan mengerjakan Tugas Pendahuluan. Soal hanya dapat dibuka saat periode pengerjaan modul sedang berjalan.
                        </p>
                    </div>

                    {/* Notification Alerts */}
                    {flash?.success && (
                        <div className="bg-emerald-100 border-[3px] border-emerald-800 text-emerald-950 p-4 rounded-xl font-body font-bold flex items-center gap-3 neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-emerald-800">check_circle</span>
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-rose-100 border-[3px] border-rose-800 text-rose-950 p-4 rounded-xl font-body font-bold flex items-center gap-3 neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-rose-800">error</span>
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {moduleList.map((m) => {
                            const isOngoing = m.status === 'ongoing';
                            const isNotStarted = m.status === 'not_started';
                            const isExpired = m.status === 'expired';
                            const isSubmitted = m.participant_work_state === 'submitted';
                            const isDraft = m.participant_work_state === 'draft';

                            return (
                                <div
                                    key={m.id}
                                    className={`bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 neo-shadow-lg flex flex-col justify-between transition-all relative overflow-hidden ${
                                        isOngoing ? 'ring-2 ring-emerald-500' : ''
                                    }`}
                                >
                                    {/* Top badges */}
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-mono text-xs font-black px-2.5 py-1 bg-surface-container border-2 border-black rounded-lg">
                                                MODUL {m.order_number} • {m.code}
                                            </span>

                                            {/* Status Badge */}
                                            {isOngoing ? (
                                                <span className="px-3 py-1 bg-emerald-300 text-black font-headline font-black text-xs uppercase rounded-full border-2 border-black animate-pulse flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-700" />
                                                    Sedang Berjalan
                                                </span>
                                            ) : isNotStarted ? (
                                                <span className="px-3 py-1 bg-blue-200 text-black font-headline font-bold text-xs uppercase rounded-full border-2 border-black flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-blue-700" />
                                                    Belum Mulai
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-200 text-gray-800 font-headline font-bold text-xs uppercase rounded-full border-2 border-black">
                                                    Sudah Lewat
                                                </span>
                                            )}
                                        </div>

                                        {/* Module Title */}
                                        <div>
                                            <h3 className="font-headline font-black text-2xl text-on-surface leading-snug">
                                                {m.title}
                                            </h3>
                                            <p className="font-body text-xs text-outline line-clamp-2 mt-1 font-medium">
                                                {m.description || 'Pengerjaan tugas pendahuluan pemahaman materi modul praktikum.'}
                                            </p>
                                        </div>

                                        {/* Schedule details & Countdown */}
                                        <div className="bg-surface-container border-[2px] border-black rounded-xl p-4 space-y-2">
                                            {m.period ? (
                                                <>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-outline font-bold uppercase">Waktu Pengerjaan</span>
                                                        <span className="font-semibold text-on-surface">
                                                            {m.period.opens_at_formatted} s/d {m.period.deadline_at_formatted}
                                                        </span>
                                                    </div>

                                                    {isOngoing && m.remaining_time && (
                                                        <div className="flex items-center justify-between pt-2 border-t border-black/10">
                                                            <span className="font-headline font-bold text-xs uppercase text-emerald-800">
                                                                Sisa Waktu
                                                            </span>
                                                            <span className="font-headline font-black text-sm text-emerald-950 bg-emerald-200 px-2.5 py-0.5 rounded-md border border-emerald-800">
                                                                {m.remaining_time}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xs text-outline italic">
                                                    Jadwal pengerjaan belum ditetapkan oleh asisten.
                                                </p>
                                            )}
                                        </div>

                                        {/* Participant submission badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-outline">Status Anda:</span>
                                            {isSubmitted ? (
                                                <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-label font-bold text-xs uppercase rounded-lg border border-emerald-800 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Sudah Dikumpulkan
                                                </span>
                                            ) : isDraft ? (
                                                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 font-label font-bold text-xs uppercase rounded-lg border border-amber-800 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">edit_note</span>
                                                    Draft Tersimpan
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 bg-surface-container text-outline font-label font-bold text-xs uppercase rounded-lg border border-black/30">
                                                    Belum Dikerjakan
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="pt-6 mt-4 border-t-2 border-black/10">
                                        {isOngoing ? (
                                            <Link
                                                href={`/praktikan/tugas-pendahuluan/${m.id}`}
                                                className={`w-full py-3 px-6 rounded-xl border-[3px] border-black font-headline font-black text-sm uppercase text-center neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md transition-all flex items-center justify-center gap-2 ${
                                                    isSubmitted
                                                        ? 'bg-secondary-fixed text-black'
                                                        : 'bg-tertiary-fixed text-black'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {isSubmitted ? 'visibility' : isDraft ? 'edit' : 'play_arrow'}
                                                </span>
                                                {isSubmitted
                                                    ? 'Lihat Jawaban Terkumpul'
                                                    : isDraft
                                                    ? 'Lanjutkan Kerjakan Draft'
                                                    : 'Mulai Kerjakan'}
                                            </Link>
                                        ) : isExpired && isSubmitted ? (
                                            <Link
                                                href={`/praktikan/tugas-pendahuluan/${m.id}`}
                                                className="w-full py-3 px-6 bg-surface-container text-on-surface rounded-xl border-[3px] border-black font-headline font-black text-sm uppercase text-center neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                                Lihat Jawaban Saya
                                            </Link>
                                        ) : isNotStarted ? (
                                            <div className="w-full py-3 px-4 bg-surface-container text-outline rounded-xl border-[3px] border-black/40 font-headline font-bold text-xs uppercase text-center cursor-not-allowed flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-base">lock</span>
                                                Dibuka {m.period?.opens_at_formatted || 'segera'}
                                            </div>
                                        ) : (
                                            <div className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-xl border-[3px] border-gray-300 font-headline font-bold text-xs uppercase text-center cursor-not-allowed flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-base">lock_clock</span>
                                                Batas Waktu Telah Berakhir
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
