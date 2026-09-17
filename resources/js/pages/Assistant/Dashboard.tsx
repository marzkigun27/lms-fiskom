import { Head, Link } from "@inertiajs/react";

interface AssistantInfo {
    name: string;
    identity_number?: string;
    email: string;
}

interface SemesterInfo {
    name: string;
    academic_year: string;
}

interface AssistantStats {
    guided_participants: number;
    pending_grading: number;
    total_schedules: number;
    has_active_session: boolean;
}

interface ActiveSessionInfo {
    id: number;
    session_type: string;
    module_id?: number;
    module_code: string;
    module_title: string;
    room: string;
    day?: string;
    shift?: string;
    opened_at?: string;
}

interface PendingGradingItem {
    id: number;
    participant_id: number;
    participant_name: string;
    participant_nim: string;
    module_id?: number;
    module_code: string;
    module_title: string;
    session_type: string;
    submitted_at: string;
    type: 'warning' | 'info';
}

interface ScheduleItem {
    id: number;
    day: string;
    shift: string;
    time_range: string;
    groups_count: number;
    total_participants: number;
    is_today: boolean;
    location: string;
}

interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    priority: 'normal' | 'important' | 'urgent';
    created_at: string;
}

interface AssistantDashboardProps {
    assistant?: AssistantInfo;
    semester?: SemesterInfo;
    stats?: AssistantStats;
    activeSession?: ActiveSessionInfo | null;
    pendingGrading?: PendingGradingItem[];
    schedules?: ScheduleItem[];
    announcements?: AnnouncementItem[];
}

export default function AssistantDashboard({
    assistant,
    semester,
    stats = {
        guided_participants: 0,
        pending_grading: 0,
        total_schedules: 0,
        has_active_session: false,
    },
    activeSession,
    pendingGrading = [],
    schedules = [],
    announcements = [],
}: AssistantDashboardProps) {
    const firstName = assistant?.name?.split(" ")[0] ?? "Asisten";

    // Dynamic greeting based on current local hour
    const hour = new Date().getHours();
    const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

    return (
        <>
            <Head title="Dashboard Asisten" />
            <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
                {/* Greetings Section */}
                <header className="relative flex flex-col justify-center min-h-[220px] bg-primary-container p-6 md:p-10 rounded-2xl border-4 border-primary neo-shadow-lg overflow-hidden">
                    <div className="relative z-10 flex-1 flex flex-col justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-surface border-2 border-primary rounded-full px-3 py-1 font-label font-bold text-xs text-on-surface neo-shadow-sm">
                                Peran: Asisten Praktikum
                            </span>
                            {semester?.name && (
                                <span className="bg-tertiary-fixed border-2 border-primary rounded-full px-3 py-1 font-label font-bold text-xs text-black neo-shadow-sm">
                                    {semester.name} ({semester.academic_year})
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="font-headline text-3xl md:text-5xl text-white font-black leading-tight">
                                {greeting}, {firstName}!
                            </h1>
                            <p className="font-body text-base md:text-xl text-primary-fixed-dim mt-2 max-w-2xl">
                                Kelola sesi praktikum, pantau antrean penilaian praktikan, dan atur aktivitas laboratorium dengan mudah.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Active Practicum Banner Alert (if a session is live) */}
                {activeSession && (
                    <div className="bg-secondary-container border-4 border-primary rounded-2xl p-6 neo-shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center border-2 border-primary neo-shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-2xl">sensors</span>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 font-label font-bold text-xs text-secondary mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                                    SESI PRAKTIKUM SEDANG BERLANGSUNG
                                </div>
                                <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">
                                    {activeSession.module_code} • {activeSession.module_title}
                                </h3>
                                <p className="font-body text-sm text-on-surface-variant">
                                    Lokasi: {activeSession.room} {activeSession.day ? `• ${activeSession.day}, ${activeSession.shift}` : ''}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/asisten/praktikum"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label font-bold text-base border-[3px] border-primary rounded-xl neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all shrink-0"
                        >
                            <span className="material-symbols-outlined">settings_input_antenna</span>
                            Kelola Sesi Sekarang
                        </Link>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Stat 1: Guided Participants */}
                    <div className="bg-surface rounded-2xl border-[3px] border-primary p-5 neo-shadow flex items-center justify-between">
                        <div>
                            <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Praktikan Bimbingan
                            </p>
                            <h4 className="font-headline text-3xl font-black text-on-surface mt-1">
                                {stats.guided_participants}
                            </h4>
                            <p className="text-[11px] font-label text-on-surface-variant mt-1">
                                Peserta aktif dibimbing
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-fixed border-2 border-primary flex items-center justify-center neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-on-surface">groups</span>
                        </div>
                    </div>

                    {/* Stat 2: Pending Grading */}
                    <div className="bg-surface rounded-2xl border-[3px] border-primary p-5 neo-shadow flex items-center justify-between">
                        <div>
                            <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Menunggu Dinilai
                            </p>
                            <h4 className="font-headline text-3xl font-black text-on-surface mt-1">
                                {stats.pending_grading}
                            </h4>
                            <p className="text-[11px] font-label text-on-surface-variant mt-1">
                                Tugas & jurnal praktikan
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl border-2 border-primary flex items-center justify-center neo-shadow-sm ${
                            stats.pending_grading > 0 ? 'bg-secondary-container' : 'bg-surface-container-high'
                        }`}>
                            <span className="material-symbols-outlined text-2xl text-on-surface">rate_review</span>
                        </div>
                    </div>

                    {/* Stat 3: Total Schedules */}
                    <div className="bg-surface rounded-2xl border-[3px] border-primary p-5 neo-shadow flex items-center justify-between">
                        <div>
                            <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Jadwal Mengajar
                            </p>
                            <h4 className="font-headline text-3xl font-black text-on-surface mt-1">
                                {stats.total_schedules}
                            </h4>
                            <p className="text-[11px] font-label text-on-surface-variant mt-1">
                                Shift mingguan terdaftar
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-tertiary-fixed border-2 border-primary flex items-center justify-center neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-black">calendar_today</span>
                        </div>
                    </div>

                    {/* Stat 4: Lab Management CTA */}
                    <div className="bg-surface rounded-2xl border-[3px] border-primary p-5 neo-shadow flex items-center justify-between">
                        <div>
                            <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Manajemen Lab
                            </p>
                            <Link
                                href="/asisten/praktikum"
                                className="inline-flex items-center gap-1 font-label font-bold text-sm text-primary hover:underline mt-2"
                            >
                                Buka Ruang Praktikum
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-secondary-fixed border-2 border-primary flex items-center justify-center neo-shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-on-surface">play_circle</span>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Pending Grading (Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-end border-b-[3px] border-primary pb-3">
                            <div>
                                <h2 className="font-headline text-2xl md:text-3xl text-on-surface font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-secondary">
                                        pending_actions
                                    </span>
                                    Antrean Penilaian
                                </h2>
                                <p className="font-body text-xs md:text-sm text-on-surface-variant mt-0.5">
                                    Tugas dan jawaban praktikan bimbingan yang menunggu dievaluasi
                                </p>
                            </div>
                            <Link
                                href="/asisten/nilai"
                                className="font-label text-xs md:text-sm font-bold text-secondary underline hover:text-secondary-fixed-dim"
                            >
                                Lihat Semua Penilaian
                            </Link>
                        </div>

                        {pendingGrading.length === 0 ? (
                            <div className="bg-surface rounded-2xl border-[3px] border-primary p-10 text-center neo-shadow">
                                <div className="w-16 h-16 rounded-full bg-tertiary-fixed border-2 border-primary flex items-center justify-center mx-auto mb-3 neo-shadow-sm">
                                    <span className="material-symbols-outlined text-3xl text-black">
                                        task_alt
                                    </span>
                                </div>
                                <h3 className="font-headline text-xl font-bold text-on-surface">
                                    Semua Tugas Telah Dinilai!
                                </h3>
                                <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto mt-1">
                                    Tidak ada submission yang tertunda saat ini. Anda dapat memeriksa rekapan nilai praktikan di halaman Manajemen Nilai.
                                </p>
                                <Link
                                    href="/asisten/nilai"
                                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-surface border-2 border-primary rounded-lg font-label font-bold text-sm neo-shadow-sm hover:bg-surface-container transition-all"
                                >
                                    Rekap Nilai
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {pendingGrading.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface text-on-surface rounded-2xl border-[3px] border-primary p-5 flex flex-col justify-between relative overflow-hidden group neo-shadow"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="bg-surface-variant text-on-surface font-label text-[11px] py-0.5 px-2.5 rounded-full border-2 border-primary uppercase font-bold">
                                                    {item.module_code}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] font-label font-bold text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                                    {item.submitted_at}
                                                </span>
                                            </div>

                                            <h4 className="font-headline text-lg font-bold text-on-surface mb-1 truncate">
                                                {item.participant_name}
                                            </h4>
                                            <p className="font-mono text-xs text-on-surface-variant mb-2">
                                                NIM: {item.participant_nim}
                                            </p>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/30 border border-primary text-xs font-label font-bold text-on-surface mb-4">
                                                <span className="material-symbols-outlined text-sm text-secondary">
                                                    assignment
                                                </span>
                                                {item.session_type} • {item.module_title}
                                            </div>
                                        </div>

                                        <Link
                                            href={`/asisten/nilai${item.module_id ? `?module_id=${item.module_id}` : ''}`}
                                            className="w-full bg-primary text-on-primary hover:bg-inverse-surface font-label font-bold py-2.5 px-4 rounded-lg border-2 border-primary neo-shadow hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">
                                                edit_note
                                            </span>
                                            Beri Nilai Sekarang
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Lab Schedules & Announcements (Span 1) */}
                    <div className="space-y-6">
                        <section>
                            <div className="flex justify-between items-end border-b-[3px] border-primary pb-3 mb-4">
                                <div>
                                    <h2 className="font-headline text-xl md:text-2xl text-on-surface font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">
                                            calendar_month
                                        </span>
                                        Jadwal Mengajar
                                    </h2>
                                </div>
                                <Link
                                    href="/asisten/jadwal"
                                    className="font-label text-xs font-bold text-secondary underline"
                                >
                                    Kelola Jadwal
                                </Link>
                            </div>

                            {schedules.length === 0 ? (
                                <div className="bg-surface rounded-2xl border-[3px] border-primary p-6 text-center neo-shadow">
                                    <p className="font-body text-xs text-on-surface-variant">
                                        Belum ada jadwal mengajar yang ditugaskan kepada Anda pada semester ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-surface rounded-2xl border-[3px] border-primary p-4 space-y-3 neo-shadow">
                                    {schedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 border-primary transition-all ${
                                                schedule.is_today
                                                    ? 'bg-secondary-container neo-shadow-sm'
                                                    : 'bg-surface hover:bg-surface-container'
                                            }`}
                                        >
                                            <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-primary p-2 min-w-[55px] ${
                                                schedule.is_today
                                                    ? 'bg-secondary text-on-secondary'
                                                    : 'bg-primary text-on-primary'
                                            }`}>
                                                <span className="font-headline font-bold text-sm leading-none uppercase">
                                                    {schedule.day.slice(0, 3)}
                                                </span>
                                                {schedule.is_today && (
                                                    <span className="text-[9px] font-label font-bold uppercase mt-1">
                                                        Hari Ini
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col justify-center overflow-hidden">
                                                <h5 className="font-headline text-sm font-bold text-on-surface truncate">
                                                    {schedule.shift}
                                                </h5>
                                                <p className="font-body text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                    <span className="material-symbols-outlined text-[13px]">groups</span>
                                                    {schedule.groups_count} Kelompok ({schedule.total_participants} Peserta)
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Announcements Section */}
                        {announcements.length > 0 && (
                            <section className="bg-surface rounded-2xl border-[3px] border-primary p-5 neo-shadow space-y-3">
                                <h3 className="font-headline text-lg font-bold text-on-surface border-b-2 border-primary pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">
                                        campaign
                                    </span>
                                    Pengumuman Asisten
                                </h3>
                                <div className="space-y-3">
                                    {announcements.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-lg border-2 border-primary neo-shadow-sm ${
                                                item.priority === 'urgent' ? 'bg-secondary-container' : 'bg-surface'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <h6 className="font-label font-bold text-xs text-on-surface truncate">
                                                    {item.title}
                                                </h6>
                                                <span className="text-[10px] font-label text-on-surface-variant shrink-0 ml-2">
                                                    {item.created_at}
                                                </span>
                                            </div>
                                            <p className="font-body text-xs text-on-surface-variant line-clamp-2">
                                                {item.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
