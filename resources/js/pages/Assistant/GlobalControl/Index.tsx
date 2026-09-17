import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface PrelabModule {
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
    default_template: {
        academic_week: number;
        opens_at: string;
        deadline_at: string;
        opens_at_formatted: string;
        deadline_at_formatted: string;
        semester_name: string;
    };
}

interface RegistrationState {
    status: 'not_started' | 'open' | 'closed';
    status_label: string;
    is_allowed: boolean;
    is_enabled: boolean;
    start_at: string | null;
    end_at: string | null;
    start_at_formatted: string | null;
    end_at_formatted: string | null;
}

interface VoteCategory {
    id: number;
    name: string;
    description: string | null;
    order_number: number;
    is_active: boolean;
    total_votes: number;
}

interface VotingState {
    period: {
        id: number;
        title: string;
        opens_at: string;
        closes_at: string;
        opens_at_formatted: string;
        closes_at_formatted: string;
        status: 'draft' | 'active' | 'closed';
        computed_status: 'not_started' | 'ongoing' | 'closed';
        status_label: string;
    };
    categories: VoteCategory[];
    total_voters: number;
}

interface AuditLogEntry {
    id: number;
    actor_name: string;
    action: string;
    auditable_type: string;
    old_values: any;
    new_values: any;
    created_at_formatted: string;
}

interface Props {
    prelab: {
        modules: PrelabModule[];
    };
    registration: RegistrationState;
    voting: VotingState;
    audit_logs: AuditLogEntry[];
}

export default function GlobalControlIndex({ prelab, registration, voting, audit_logs }: Props) {
    const { errors, flash } = usePage().props as any;

    // Active ongoing module for prelab
    const ongoingModule = prelab.modules.find((m) => m.status === 'ongoing');
    const scheduledModule = prelab.modules.find((m) => m.status === 'not_started');

    // Modals state
    const [isPrelabModalOpen, setIsPrelabModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<number>(
        prelab.modules[0]?.id || 1
    );

    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<VoteCategory | null>(null);

    // Confirmation Modals
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // Forms
    const prelabForm = useForm({
        module_id: selectedModuleId,
        opens_at: '',
        deadline_at: '',
    });

    const regForm = useForm({
        is_enabled: registration.is_enabled,
        start_at: registration.start_at ? registration.start_at.substring(0, 16) : '',
        end_at: registration.end_at ? registration.end_at.substring(0, 16) : '',
    });

    const votingForm = useForm({
        period_id: voting.period.id,
        title: voting.period.title,
        opens_at: voting.period.opens_at ? voting.period.opens_at.substring(0, 16) : '',
        closes_at: voting.period.closes_at ? voting.period.closes_at.substring(0, 16) : '',
        status: voting.period.status,
    });

    const categoryForm = useForm({
        period_id: voting.period.id,
        name: '',
        description: '',
        order_number: (voting.categories.length + 1).toString(),
        is_active: true,
    });

    // Auto-sync periodic check for real-time state changes
    React.useEffect(() => {
        const interval = setInterval(() => {
            // Only reload if user is not currently in any modal form
            if (!isPrelabModalOpen && !isRegModalOpen && !isVotingModalOpen && !isCategoryModalOpen) {
                router.reload({ only: ['prelab', 'registration', 'voting'] });
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isPrelabModalOpen, isRegModalOpen, isVotingModalOpen, isCategoryModalOpen]);

    // Handle open prelab modal for a specific module
    const handleOpenPrelabModal = (moduleId: number) => {
        setSelectedModuleId(moduleId);
        const mod = prelab.modules.find((m) => m.id === moduleId);
        if (mod && mod.period) {
            prelabForm.setData({
                module_id: moduleId,
                opens_at: mod.period.opens_at.substring(0, 16),
                deadline_at: mod.period.deadline_at.substring(0, 16),
            });
        } else if (mod && mod.default_template) {
            prelabForm.setData({
                module_id: moduleId,
                opens_at: mod.default_template.opens_at.substring(0, 16),
                deadline_at: mod.default_template.deadline_at.substring(0, 16),
            });
        }
        setIsPrelabModalOpen(true);
    };

    // Apply default even-week template into form
    const applyEvenWeekTemplate = () => {
        const mod = prelab.modules.find((m) => m.id === prelabForm.data.module_id);
        if (mod && mod.default_template) {
            prelabForm.setData({
                ...prelabForm.data,
                opens_at: mod.default_template.opens_at.substring(0, 16),
                deadline_at: mod.default_template.deadline_at.substring(0, 16),
            });
        }
    };

    // Submit Prelab Schedule
    const submitPrelab = (e: React.FormEvent) => {
        e.preventDefault();
        prelabForm.post('/asisten/global-control/prelab', {
            onSuccess: () => {
                setIsPrelabModalOpen(false);
            },
        });
    };

    // Toggle Prelab Period state
    const togglePrelabPeriod = (periodId: number, currentStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: currentStatus === 'closed' ? 'Aktifkan Jadwal?' : 'Tutup/Nonaktifkan Jadwal?',
            message: currentStatus === 'closed'
                ? 'Jadwal akan diaktifkan kembali. Pastikan tidak ada bentrok waktu dengan modul lain.'
                : 'Menutup jadwal akan menghentikan akses pengerjaan praktikan pada modul ini.',
            variant: currentStatus === 'closed' ? 'warning' : 'danger',
            onConfirm: () => {
                router.post(`/asisten/global-control/prelab/${periodId}/toggle`);
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Quick toggle Registration
    const toggleRegistration = () => {
        const nextState = !registration.is_enabled;
        setConfirmModal({
            isOpen: true,
            title: nextState ? 'Buka Registrasi Akun?' : 'Tutup Registrasi Akun?',
            message: nextState
                ? 'Praktikan baru akan dapat membuat akun di sistem.'
                : 'Pembuatan akun baru akan segera ditolak oleh sistem untuk semua praktikan.',
            variant: nextState ? 'warning' : 'danger',
            onConfirm: () => {
                router.post('/asisten/global-control/registration', {
                    is_enabled: nextState,
                    start_at: registration.start_at,
                    end_at: registration.end_at,
                });
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Submit Registration schedule
    const submitRegistration = (e: React.FormEvent) => {
        e.preventDefault();
        regForm.post('/asisten/global-control/registration', {
            onSuccess: () => setIsRegModalOpen(false),
        });
    };

    // Submit Voting Period
    const submitVotingPeriod = (e: React.FormEvent) => {
        e.preventDefault();
        votingForm.post('/asisten/global-control/voting/period', {
            onSuccess: () => setIsVotingModalOpen(false),
        });
    };

    // Open Category Modal (New or Edit)
    const handleOpenCategoryModal = (cat?: VoteCategory) => {
        if (cat) {
            setEditingCategory(cat);
            categoryForm.setData({
                period_id: voting.period.id,
                name: cat.name,
                description: cat.description || '',
                order_number: cat.order_number.toString(),
                is_active: cat.is_active,
            });
        } else {
            setEditingCategory(null);
            categoryForm.setData({
                period_id: voting.period.id,
                name: '',
                description: '',
                order_number: (voting.categories.length + 1).toString(),
                is_active: true,
            });
        }
        setIsCategoryModalOpen(true);
    };

    // Submit Category (Store or Update)
    const submitCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            categoryForm.put(`/asisten/global-control/voting/categories/${editingCategory.id}`, {
                onSuccess: () => setIsCategoryModalOpen(false),
            });
        } else {
            categoryForm.post('/asisten/global-control/voting/categories', {
                onSuccess: () => setIsCategoryModalOpen(false),
            });
        }
    };

    // Delete Category with warning
    const handleDeleteCategory = (cat: VoteCategory) => {
        const hasVotes = cat.total_votes > 0;
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kategori Voting?',
            message: hasVotes
                ? `Kategori "${cat.name}" sudah memiliki ${cat.total_votes} suara. Kategori akan dinonaktifkan (soft deactivation) agar tidak menghilangkan histori suara.`
                : `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Tindakan ini tidak dapat dibatalkan.`,
            variant: 'danger',
            onConfirm: () => {
                router.delete(`/asisten/global-control/voting/categories/${cat.id}`);
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    return (
        <>
            <Head title="Global State Control Panel" />

            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                <div className="max-w-7xl mx-auto space-y-10 pb-28">
                    {/* Header */}
                    <div className="border-b-[4px] border-black dark:border-white pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-tertiary-fixed text-black font-label font-black text-xs uppercase px-3 py-1 rounded-full border-2 border-black mb-3 neo-shadow-sm">
                                <span className="material-symbols-outlined text-sm">settings_suggest</span>
                                Central System Authority
                            </div>
                            <h1 className="font-headline text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight">
                                Global State Control Panel
                            </h1>
                            <p className="font-body text-outline mt-2 text-base max-w-2xl leading-relaxed">
                                Pusat kendali state global untuk Tugas Pendahuluan, Registrasi Akun Praktikan, dan Voting Asisten. Konfigurasi disimpan persisten pada backend dan database.
                            </p>
                        </div>
                    </div>

                    {/* Notification Banner / Flash Messages */}
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
                    {errors?.schedule && (
                        <div className="bg-amber-100 border-[3px] border-amber-800 text-amber-950 p-4 rounded-xl font-body font-bold flex items-start gap-3 neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-amber-800 shrink-0 mt-0.5">warning</span>
                            <div>
                                <span className="font-headline font-black block">Konflik Jadwal Terdeteksi!</span>
                                <span className="text-sm font-medium">{errors.schedule}</span>
                            </div>
                        </div>
                    )}

                    {/* SECTION 1: TUGAS PENDAHULUAN */}
                    <section className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-primary/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary-container border-[3px] border-black flex items-center justify-center neo-shadow-sm">
                                    <span className="material-symbols-outlined text-2xl text-on-primary-container font-black">assignment</span>
                                </div>
                                <div>
                                    <h2 className="font-headline text-2xl font-black uppercase text-on-surface">
                                        1. Tugas Pendahuluan
                                    </h2>
                                    <p className="font-body text-xs text-outline font-semibold">
                                        Maksimal 1 modul aktif dalam satu waktu • Jadwal tidak boleh overlap
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenPrelabModal(prelab.modules[0]?.id || 1)}
                                className="bg-tertiary-fixed text-black font-label font-black text-sm uppercase px-5 py-2.5 rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add_alarm</span>
                                Atur Jadwal Modul
                            </button>
                        </div>

                        {/* Current Active Status Banner */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-label font-bold text-xs uppercase text-outline">
                                        Status Modul Aktif Saat Ini
                                    </span>
                                    {ongoingModule ? (
                                        <span className="px-3 py-1 bg-emerald-400 text-black font-headline font-black text-xs uppercase rounded-full border-2 border-black animate-pulse">
                                            ● Sedang Berjalan
                                        </span>
                                    ) : scheduledModule ? (
                                        <span className="px-3 py-1 bg-blue-300 text-black font-headline font-black text-xs uppercase rounded-full border-2 border-black">
                                            ● Terjadwal (Belum Mulai)
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-200 text-gray-700 font-headline font-bold text-xs uppercase rounded-full border-2 border-black">
                                            Tidak Ada Modul Aktif
                                        </span>
                                    )}
                                </div>

                                {ongoingModule ? (
                                    <div className="space-y-2">
                                        <h3 className="font-headline font-black text-xl text-on-surface">
                                            {ongoingModule.title} ({ongoingModule.code})
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                            <div className="flex items-center gap-1.5 bg-surface-bright px-3 py-1.5 rounded-lg border-2 border-black">
                                                <span className="material-symbols-outlined text-base">schedule</span>
                                                <span>{ongoingModule.period?.opens_at_formatted} → {ongoingModule.period?.deadline_at_formatted}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-tertiary-fixed text-black px-3 py-1.5 rounded-lg border-2 border-black font-bold">
                                                <span className="material-symbols-outlined text-base">timer</span>
                                                <span>Sisa Waktu: {ongoingModule.remaining_time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : scheduledModule ? (
                                    <div className="space-y-2">
                                        <h3 className="font-headline font-black text-xl text-on-surface">
                                            {scheduledModule.title} ({scheduledModule.code})
                                        </h3>
                                        <p className="text-sm font-medium text-outline">
                                            Akan dibuka pada: <span className="font-bold text-on-surface">{scheduledModule.period?.opens_at_formatted}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-outline italic">
                                        Belum ada modul Tugas Pendahuluan yang sedang dibuka untuk praktikan. Gunakan tombol "Atur Jadwal Modul" untuk membuka modul.
                                    </p>
                                )}
                            </div>

                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="font-label font-bold text-xs uppercase text-outline block mb-1">
                                        Aturan Default Scheduling
                                    </span>
                                    <p className="font-headline font-black text-sm text-on-surface uppercase">
                                        Rabu 18:00 → Sabtu 18:00
                                    </p>
                                    <p className="font-body text-xs text-outline mt-1">
                                        Dihitung otomatis per minggu genap semester dari tanggal awal akademik semester aktif.
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t-2 border-black/20 text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                                    <span>Template Otomatis Siap Digunakan</span>
                                </div>
                            </div>
                        </div>

                        {/* All Modules Prelab Table */}
                        <div className="overflow-x-auto border-[3px] border-black rounded-xl">
                            <table className="w-full text-left font-body text-sm">
                                <thead className="bg-surface-container-high border-b-[3px] border-black font-headline font-black text-xs uppercase text-on-surface">
                                    <tr>
                                        <th className="p-4">Modul</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Periode Terjadwal</th>
                                        <th className="p-4">Template Minggu Genap</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black/20 bg-surface-container-lowest font-medium">
                                    {prelab.modules.map((m) => (
                                        <tr key={m.id} className="hover:bg-surface-container transition-colors">
                                            <td className="p-4">
                                                <div className="font-headline font-bold text-base text-on-surface">
                                                    Modul {m.order_number}: {m.title}
                                                </div>
                                                <span className="text-xs text-outline font-mono font-bold uppercase">{m.code}</span>
                                            </td>
                                            <td className="p-4">
                                                {m.status === 'ongoing' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-300 text-black font-label font-black text-xs uppercase rounded-lg border-2 border-black">
                                                        Sedang Berjalan
                                                    </span>
                                                ) : m.status === 'not_started' ? (
                                                    <span className="px-2.5 py-1 bg-blue-200 text-black font-label font-bold text-xs uppercase rounded-lg border-2 border-black">
                                                        Belum Mulai
                                                    </span>
                                                ) : m.period ? (
                                                    <span className="px-2.5 py-1 bg-gray-200 text-gray-800 font-label font-bold text-xs uppercase rounded-lg border-2 border-black">
                                                        Sudah Lewat
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-label font-bold text-xs uppercase rounded-lg border-2 border-black">
                                                        Belum Diatur
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs font-semibold">
                                                {m.period ? (
                                                    <div>
                                                        <div>{m.period.opens_at_formatted}</div>
                                                        <div className="text-outline">s/d {m.period.deadline_at_formatted}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-outline italic">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs">
                                                <div className="font-bold text-on-surface">
                                                    Minggu ke-{m.default_template.academic_week}
                                                </div>
                                                <div className="text-outline">
                                                    {m.default_template.opens_at_formatted} → {m.default_template.deadline_at_formatted}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenPrelabModal(m.id)}
                                                        className="px-3 py-1.5 bg-surface-container border-2 border-black rounded-lg font-label font-bold text-xs uppercase hover:bg-secondary-fixed hover:text-black transition-colors"
                                                    >
                                                        {m.period ? 'Ubah' : 'Set Jadwal'}
                                                    </button>
                                                    {m.period && (
                                                        <button
                                                            onClick={() => togglePrelabPeriod(m.period!.id, m.period!.state)}
                                                            className={`px-3 py-1.5 border-2 border-black rounded-lg font-label font-bold text-xs uppercase transition-colors ${
                                                                m.period.state === 'closed'
                                                                    ? 'bg-emerald-300 text-black hover:bg-emerald-400'
                                                                    : 'bg-rose-200 text-rose-900 hover:bg-rose-300'
                                                            }`}
                                                        >
                                                            {m.period.state === 'closed' ? 'Aktifkan' : 'Tutup'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* SECTION 2: REGISTRASI AKUN */}
                    <section className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-primary/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-secondary-fixed border-[3px] border-black flex items-center justify-center neo-shadow-sm text-black">
                                    <span className="material-symbols-outlined text-2xl font-black">person_add</span>
                                </div>
                                <div>
                                    <h2 className="font-headline text-2xl font-black uppercase text-on-surface">
                                        2. Registrasi Akun Praktikan
                                    </h2>
                                    <p className="font-body text-xs text-outline font-semibold">
                                        Kontrol pembukaan pendaftaran akun baru • Blokir pendaftaran otomatis jika ditutup
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleRegistration}
                                    className={`px-5 py-2.5 font-label font-black text-sm uppercase rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md transition-all flex items-center gap-2 ${
                                        registration.is_enabled
                                            ? 'bg-rose-400 text-black'
                                            : 'bg-emerald-400 text-black'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {registration.is_enabled ? 'lock' : 'lock_open'}
                                    </span>
                                    {registration.is_enabled ? 'Tutup Registrasi' : 'Buka Registrasi'}
                                </button>
                                <button
                                    onClick={() => setIsRegModalOpen(true)}
                                    className="bg-surface-container text-on-surface font-label font-black text-sm uppercase px-4 py-2.5 rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-lg">date_range</span>
                                    Jadwal
                                </button>
                            </div>
                        </div>

                        {/* Registration Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Status Otorisasi Backend
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 border-black ${registration.is_allowed ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    <span className="font-headline font-black text-xl uppercase text-on-surface">
                                        {registration.status_label}
                                    </span>
                                </div>
                                <p className="text-xs text-outline font-medium">
                                    {registration.is_allowed
                                        ? 'Endpoint pendaftaran terbuka dan menerima registrasi praktikan baru.'
                                        : 'Endpoint pendaftaran terkunci. Percobaan registrasi akan ditolak langsung oleh backend.'}
                                </p>
                            </div>

                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Rentang Waktu Terjadwal
                                </span>
                                {registration.start_at || registration.end_at ? (
                                    <div className="text-sm font-semibold text-on-surface">
                                        <div>Mulai: {registration.start_at_formatted || 'Langsung Buka'}</div>
                                        <div>Selesai: {registration.end_at_formatted || 'Tanpa Batas'}</div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-outline italic">
                                        Tidak menggunakan jadwal otomatis (kontrol manual via toggle).
                                    </p>
                                )}
                            </div>

                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Pencegahan Akun Ganda
                                </span>
                                <p className="text-xs font-semibold text-on-surface leading-relaxed">
                                    Validasi keunikan NIM dan email tetap dipertahankan secara ketat oleh database pada setiap request.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: VOTING ASISTEN */}
                    <section className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-primary/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-tertiary-container border-[3px] border-black flex items-center justify-center neo-shadow-sm text-black">
                                    <span className="material-symbols-outlined text-2xl font-black">how_to_vote</span>
                                </div>
                                <div>
                                    <h2 className="font-headline text-2xl font-black uppercase text-on-surface">
                                        3. Voting Asisten & Kategori
                                    </h2>
                                    <p className="font-body text-xs text-outline font-semibold">
                                        Pengaturan periode voting dan manajemen kategori voting dinamis
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleOpenCategoryModal()}
                                    className="bg-secondary-fixed text-black font-label font-black text-sm uppercase px-4 py-2.5 rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-lg">category</span>
                                    Tambah Kategori
                                </button>
                                <button
                                    onClick={() => setIsVotingModalOpen(true)}
                                    className="bg-tertiary-fixed text-black font-label font-black text-sm uppercase px-5 py-2.5 rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                                    Atur Jadwal Voting
                                </button>
                            </div>
                        </div>

                        {/* Voting Status Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Status Periode Voting
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 border-black ${
                                        voting.period.computed_status === 'ongoing'
                                            ? 'bg-emerald-500 animate-pulse'
                                            : voting.period.computed_status === 'not_started'
                                            ? 'bg-blue-400'
                                            : 'bg-gray-400'
                                    }`} />
                                    <span className="font-headline font-black text-xl uppercase text-on-surface">
                                        {voting.period.status_label}
                                    </span>
                                </div>
                                <p className="text-xs text-outline font-medium">
                                    {voting.period.opens_at_formatted} → {voting.period.closes_at_formatted}
                                </p>
                            </div>

                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Total Praktikan Memilih
                                </span>
                                <div className="font-headline font-black text-3xl text-on-surface">
                                    {voting.total_voters} <span className="text-base text-outline font-bold">Voters</span>
                                </div>
                                <p className="text-xs text-outline font-medium">
                                    {voting.categories.length} kategori aktif tersedia
                                </p>
                            </div>

                            <div className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm space-y-2">
                                <span className="font-label font-bold text-xs uppercase text-outline block">
                                    Judul Periode Aktif
                                </span>
                                <p className="font-headline font-bold text-base text-on-surface">
                                    {voting.period.title}
                                </p>
                                <span className="text-xs font-mono font-semibold text-outline">
                                    Status DB: {voting.period.status}
                                </span>
                            </div>
                        </div>

                        {/* Voting Categories Management */}
                        <div className="space-y-4">
                            <h3 className="font-headline font-bold text-lg uppercase text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">view_list</span>
                                Daftar Kategori Voting
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {voting.categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="bg-surface-container border-[3px] border-black rounded-xl p-5 neo-shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-headline font-black text-lg text-on-surface leading-tight">
                                                    {cat.name}
                                                </h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-headline font-bold uppercase rounded-md border-2 border-black shrink-0 ${
                                                    cat.is_active ? 'bg-emerald-300 text-black' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            {cat.description && (
                                                <p className="font-body text-xs text-outline line-clamp-2">
                                                    {cat.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between">
                                            <span className="font-label font-bold text-xs text-on-surface bg-surface-bright px-2.5 py-1 rounded-lg border-2 border-black">
                                                {cat.total_votes} Suara
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenCategoryModal(cat)}
                                                    className="p-1.5 bg-surface-container-lowest border-2 border-black rounded-lg hover:bg-secondary-fixed transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="p-1.5 bg-surface-container-lowest border-2 border-black rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                                                    title="Hapus Kategori"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4: AUDIT LOGS */}
                    <section className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-4">
                            <div className="w-12 h-12 rounded-xl bg-surface-variant border-[3px] border-black flex items-center justify-center neo-shadow-sm">
                                <span className="material-symbols-outlined text-2xl font-black">history</span>
                            </div>
                            <div>
                                <h2 className="font-headline text-2xl font-black uppercase text-on-surface">
                                    4. Riwayat Perubahan Global State (Audit Trail)
                                </h2>
                                <p className="font-body text-xs text-outline font-semibold">
                                    Pencatatan siapa yang melakukan perubahan konfigurasi, nilai sebelumnya, nilai baru, dan waktu
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto border-[3px] border-black rounded-xl">
                            <table className="w-full text-left font-body text-xs">
                                <thead className="bg-surface-container-high border-b-[3px] border-black font-headline font-black uppercase text-on-surface">
                                    <tr>
                                        <th className="p-3">Waktu</th>
                                        <th className="p-3">Aktor</th>
                                        <th className="p-3">Aksi</th>
                                        <th className="p-3">Target Entitas</th>
                                        <th className="p-3">Detail Nilai Baru</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black/10 bg-surface-container-lowest font-medium">
                                    {audit_logs.length > 0 ? (
                                        audit_logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-surface-container transition-colors">
                                                <td className="p-3 text-outline whitespace-nowrap">{log.created_at_formatted}</td>
                                                <td className="p-3 font-bold text-on-surface">{log.actor_name}</td>
                                                <td className="p-3">
                                                    <span className="font-mono bg-surface-container px-2 py-0.5 rounded border border-black text-[11px]">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-outline">{log.auditable_type}</td>
                                                <td className="p-3 max-w-xs truncate font-mono text-[11px]">
                                                    {JSON.stringify(log.new_values)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-outline italic">
                                                Belum ada riwayat audit log perubahan konfigurasi.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* MODAL 1: ATUR JADWAL TUGAS PENDAHULUAN */}
            {isPrelabModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-lg w-full p-6 neo-shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                Atur Jadwal Tugas Pendahuluan
                            </h3>
                            <button
                                onClick={() => setIsPrelabModalOpen(false)}
                                className="w-8 h-8 rounded-full border-2 border-black bg-surface flex items-center justify-center hover:bg-rose-100"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitPrelab} className="space-y-4">
                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Pilih Modul</label>
                                <select
                                    value={prelabForm.data.module_id}
                                    onChange={(e) => {
                                        const modId = parseInt(e.target.value);
                                        prelabForm.setData('module_id', modId);
                                        const mod = prelab.modules.find((m) => m.id === modId);
                                        if (mod && mod.period) {
                                            prelabForm.setData((prev) => ({
                                                ...prev,
                                                module_id: modId,
                                                opens_at: mod.period!.opens_at.substring(0, 16),
                                                deadline_at: mod.period!.deadline_at.substring(0, 16),
                                            }));
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 bg-surface-container border-2 border-black rounded-xl font-body font-bold text-sm focus:outline-none"
                                >
                                    {prelab.modules.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            Modul {m.order_number}: {m.title} ({m.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Default Template Button */}
                            <div className="bg-secondary-fixed/20 border-2 border-dashed border-black rounded-xl p-3 flex items-center justify-between gap-3">
                                <div className="text-xs">
                                    <span className="font-headline font-bold block text-on-surface">Gunakan Template Minggu Genap</span>
                                    <span className="text-outline">Rabu 18:00 → Sabtu 18:00</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={applyEvenWeekTemplate}
                                    className="px-3 py-1.5 bg-secondary-fixed text-black font-label font-bold text-xs uppercase rounded-lg border-2 border-black neo-shadow-sm hover:scale-105 transition-transform shrink-0"
                                >
                                    Terapkan
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-label font-bold text-xs uppercase mb-1">Waktu Mulai</label>
                                    <input
                                        type="datetime-local"
                                        value={prelabForm.data.opens_at}
                                        onChange={(e) => prelabForm.setData('opens_at', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                    />
                                    {prelabForm.errors.opens_at && (
                                        <p className="text-rose-600 text-xs mt-1">{prelabForm.errors.opens_at}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-label font-bold text-xs uppercase mb-1">Waktu Berakhir</label>
                                    <input
                                        type="datetime-local"
                                        value={prelabForm.data.deadline_at}
                                        onChange={(e) => prelabForm.setData('deadline_at', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                    />
                                    {prelabForm.errors.deadline_at && (
                                        <p className="text-rose-600 text-xs mt-1">{prelabForm.errors.deadline_at}</p>
                                    )}
                                </div>
                            </div>

                            {((prelabForm.errors as any).schedule || errors?.schedule) && (
                                <div className="p-3 bg-rose-100 border-2 border-rose-600 rounded-xl text-xs text-rose-900 font-bold">
                                    {(prelabForm.errors as any).schedule || errors?.schedule}
                                </div>
                            )}

                            <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPrelabModalOpen(false)}
                                    className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={prelabForm.processing}
                                    className="px-6 py-2 bg-tertiary-fixed text-black font-label font-black text-xs uppercase border-2 border-black rounded-xl neo-shadow hover:-translate-y-0.5 transition-all"
                                >
                                    {prelabForm.processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ATUR JADWAL REGISTRASI */}
            {isRegModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-md w-full p-6 neo-shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                Atur Periode Registrasi
                            </h3>
                            <button
                                onClick={() => setIsRegModalOpen(false)}
                                className="w-8 h-8 rounded-full border-2 border-black bg-surface flex items-center justify-center hover:bg-rose-100"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitRegistration} className="space-y-4">
                            <div className="flex items-center gap-3 bg-surface-container p-3 rounded-xl border-2 border-black">
                                <input
                                    type="checkbox"
                                    id="is_enabled"
                                    checked={regForm.data.is_enabled}
                                    onChange={(e) => regForm.setData('is_enabled', e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-black text-primary focus:ring-0"
                                />
                                <label htmlFor="is_enabled" className="font-label font-bold text-sm cursor-pointer">
                                    Izinkan Registrasi Akun (Master Toggle)
                                </label>
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Mulai Buka (Opsional)</label>
                                <input
                                    type="datetime-local"
                                    value={regForm.data.start_at}
                                    onChange={(e) => regForm.setData('start_at', e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Tutup Pada (Opsional)</label>
                                <input
                                    type="datetime-local"
                                    value={regForm.data.end_at}
                                    onChange={(e) => regForm.setData('end_at', e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                            </div>

                            <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRegModalOpen(false)}
                                    className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={regForm.processing}
                                    className="px-6 py-2 bg-secondary-fixed text-black font-label font-black text-xs uppercase border-2 border-black rounded-xl neo-shadow hover:-translate-y-0.5 transition-all"
                                >
                                    {regForm.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ATUR JADWAL VOTING */}
            {isVotingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-md w-full p-6 neo-shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                Atur Periode Voting Asisten
                            </h3>
                            <button
                                onClick={() => setIsVotingModalOpen(false)}
                                className="w-8 h-8 rounded-full border-2 border-black bg-surface flex items-center justify-center hover:bg-rose-100"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitVotingPeriod} className="space-y-4">
                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Judul Voting</label>
                                <input
                                    type="text"
                                    value={votingForm.data.title}
                                    onChange={(e) => votingForm.setData('title', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Waktu Buka</label>
                                <input
                                    type="datetime-local"
                                    value={votingForm.data.opens_at}
                                    onChange={(e) => votingForm.setData('opens_at', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Waktu Tutup</label>
                                <input
                                    type="datetime-local"
                                    value={votingForm.data.closes_at}
                                    onChange={(e) => votingForm.setData('closes_at', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Status</label>
                                <select
                                    value={votingForm.data.status}
                                    onChange={(e) => votingForm.setData('status', e.target.value as any)}
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-bold text-sm focus:outline-none"
                                >
                                    <option value="draft">Draft (Belum Dibuka)</option>
                                    <option value="active">Active (Sedang Berjalan)</option>
                                    <option value="closed">Closed (Ditutup)</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsVotingModalOpen(false)}
                                    className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={votingForm.processing}
                                    className="px-6 py-2 bg-tertiary-fixed text-black font-label font-black text-xs uppercase border-2 border-black rounded-xl neo-shadow hover:-translate-y-0.5 transition-all"
                                >
                                    {votingForm.processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: TAMBAH / EDIT KATEGORI VOTING */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-md w-full p-6 neo-shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                {editingCategory ? 'Edit Kategori Voting' : 'Tambah Kategori Voting'}
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-8 h-8 rounded-full border-2 border-black bg-surface flex items-center justify-center hover:bg-rose-100"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitCategory} className="space-y-4">
                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Asisten Teramah"
                                    required
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                />
                                {categoryForm.errors.name && (
                                    <p className="text-rose-600 text-xs mt-1">{categoryForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-label font-bold text-xs uppercase mb-1">Deskripsi Kategori</label>
                                <textarea
                                    value={categoryForm.data.description}
                                    onChange={(e) => categoryForm.setData('description', e.target.value)}
                                    placeholder="Jelaskan kriteria kategori ini..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-medium text-sm focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-label font-bold text-xs uppercase mb-1">Nomor Urut</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={categoryForm.data.order_number}
                                        onChange={(e) => categoryForm.setData('order_number', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-surface-container border-2 border-black rounded-xl font-body font-semibold text-sm focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="cat_active"
                                        checked={categoryForm.data.is_active}
                                        onChange={(e) => categoryForm.setData('is_active', e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-black text-primary focus:ring-0"
                                    />
                                    <label htmlFor="cat_active" className="font-label font-bold text-xs uppercase cursor-pointer">
                                        Status Aktif
                                    </label>
                                </div>
                            </div>

                            <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={categoryForm.processing}
                                    className="px-6 py-2 bg-secondary-fixed text-black font-label font-black text-xs uppercase border-2 border-black rounded-xl neo-shadow hover:-translate-y-0.5 transition-all"
                                >
                                    {categoryForm.processing ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-md w-full p-6 neo-shadow-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-3xl ${confirmModal.variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}`}>
                                {confirmModal.variant === 'danger' ? 'warning' : 'info'}
                            </span>
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                {confirmModal.title}
                            </h3>
                        </div>
                        <p className="font-body text-sm text-outline font-medium leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className={`px-5 py-2 font-label font-black text-xs uppercase rounded-xl border-2 border-black neo-shadow hover:-translate-y-0.5 transition-all ${
                                    confirmModal.variant === 'danger'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-amber-400 text-black'
                                }`}
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
