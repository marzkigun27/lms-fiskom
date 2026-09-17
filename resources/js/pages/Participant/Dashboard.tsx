import { Head, Link } from "@inertiajs/react";

interface ParticipantProfile {
    name: string;
    identity_number: string;
    class_name: string;
    group_name: string;
    shift: string | null;
    semester_name: string;
}

interface CurrentSession {
    id: number;
    session_type: string;
    module_id: number;
    module_code: string;
    module_title: string;
    room: string;
    opened_at: string;
}

interface PerformanceData {
    total_modules: number;
    completed_modules: number;
    completion_percentage: number;
    average_score: number | null;
}

interface ModuleItem {
    id: number;
    code: string;
    title: string;
    description: string | null;
    order_number: number;
    status: 'completed' | 'in_progress' | 'locked';
    score: number | null;
    grade_letter: string | null;
    active_session_id: number | null;
}

interface UpcomingScheduleItem {
    id: number;
    module_title: string;
    module_code: string;
    room: string;
    date_month: string;
    date_day: string;
    time_range: string;
    status: string;
}

interface UpcomingPrelabItem {
    id: number;
    module_id: number;
    module_code: string;
    module_title: string;
    deadline_at: string | null;
    deadline_formatted: string;
    is_submitted: boolean;
    is_past_due: boolean;
}

interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    priority: 'normal' | 'important' | 'urgent';
    created_at: string;
}

interface ParticipantDashboardProps {
    profile?: ParticipantProfile;
    currentSession?: CurrentSession | null;
    performance?: PerformanceData;
    modules?: ModuleItem[];
    upcomingSchedules?: UpcomingScheduleItem[];
    upcomingPrelabs?: UpcomingPrelabItem[];
    announcements?: AnnouncementItem[];
}

const MODULE_ICONS = ['speed', 'waves', 'bolt', 'terminal', 'developer_board', 'memory', 'devices', 'science'];

const SESSION_LABELS: Record<string, string> = {
    initial_task: 'Tugas Awal',
    journal: 'Jurnal',
    independent_task: 'Tugas Mandiri',
    feedback: 'Feedback',
};

export default function ParticipantDashboard({
    profile,
    currentSession,
    performance = {
        total_modules: 0,
        completed_modules: 0,
        completion_percentage: 0,
        average_score: null,
    },
    modules = [],
    upcomingSchedules = [],
    upcomingPrelabs = [],
    announcements = [],
}: ParticipantDashboardProps) {
    const firstName = profile?.name?.split(" ")[0] ?? "Praktikan";

    return (
        <>
            <Head title="Dashboard Praktikan" />
            <div className="flex-1 overflow-y-auto p-6 bg-surface dark:bg-surface">
                <div className="max-w-6xl mx-auto space-y-6 pb-12">
                    {/* ── ROW 1: Welcome + Performance ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Welcome Card (spans 2 cols) */}
                        <div className="lg:col-span-2 bg-tertiary-fixed border-[3px] border-primary rounded-xl p-6 neo-shadow-lg relative overflow-hidden">
                            {/* Decorative shapes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-surface-container-lowest border-4 border-primary rounded-full opacity-50 pointer-events-none" />
                            <div className="absolute bottom-6 right-16 w-16 h-16 bg-secondary-container border-4 border-primary rotate-12 opacity-80 pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <div className="inline-flex items-center gap-2 bg-surface-container-lowest border-2 border-primary rounded-full px-3 py-1 neo-shadow-sm">
                                            <span className={`w-2.5 h-2.5 rounded-full ${currentSession ? 'bg-emerald-500 animate-pulse' : 'bg-tertiary-container'}`}></span>
                                            <span className="font-label font-bold text-xs text-black">
                                                {currentSession ? 'Sesi Sedang Berlangsung' : 'Status: Aktif'}
                                            </span>
                                        </div>

                                        {profile?.class_name && (
                                            <span className="bg-surface-container-lowest border-2 border-primary rounded-full px-3 py-1 font-label font-bold text-xs text-black neo-shadow-sm">
                                                {profile.class_name} • {profile.group_name}
                                            </span>
                                        )}
                                        {profile?.identity_number && (
                                            <span className="bg-surface-container-lowest border-2 border-primary rounded-full px-3 py-1 font-mono font-bold text-xs text-black neo-shadow-sm">
                                                NIM: {profile.identity_number}
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-black leading-tight mb-2">
                                        Selamat Datang,
                                        <br />
                                        {firstName}!
                                    </h2>
                                    <p className="font-body text-base md:text-lg text-on-surface-variant max-w-lg">
                                        {currentSession
                                            ? `Sesi ${SESSION_LABELS[currentSession.session_type] ?? currentSession.session_type} untuk ${currentSession.module_code} sedang dibuka di ${currentSession.room}.`
                                            : "Pantau kemajuan modul praktikum, jadwal mendatang, dan pengumuman terbaru di sini."}
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <Link
                                        href={currentSession ? `/praktikan/praktikum/${currentSession.id}` : "/praktikan/praktikum"}
                                        className={`inline-flex items-center justify-center gap-2 border-[3px] border-primary rounded-lg py-3 px-6 neo-shadow hover:-translate-y-1 hover:-translate-x-1 hover:neo-shadow-md active:translate-y-1 active:translate-x-1 active:shadow-none transition-all font-label font-bold text-base md:text-lg ${
                                            currentSession
                                                ? 'bg-secondary text-on-secondary animate-bounce'
                                                : 'bg-primary text-on-primary'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">
                                            {currentSession ? 'rocket_launch' : 'play_arrow'}
                                        </span>
                                        {currentSession ? 'Masuk Sesi Sekarang' : 'Buka Praktikum'}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Performance Card */}
                        <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-6 neo-shadow-lg flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4 border-b-[3px] border-primary pb-4">
                                <h3 className="font-headline text-2xl font-bold text-on-surface">
                                    Performa
                                </h3>
                                <span
                                    className="material-symbols-outlined text-3xl text-secondary"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    monitoring
                                </span>
                            </div>

                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl md:text-6xl font-black font-headline tracking-tighter text-on-surface">
                                    {performance.average_score !== null ? performance.average_score : (performance.completion_percentage > 0 ? performance.completion_percentage : 0)}
                                </span>
                                <span className="font-label font-bold text-on-surface-variant mb-2 text-sm md:text-base">
                                    {performance.average_score !== null ? '/ 100 Rata-rata Nilai' : '% Selesai'}
                                </span>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs md:text-sm font-label font-bold text-on-surface-variant mb-2">
                                    <span>Modul Selesai</span>
                                    <span>{performance.completed_modules} / {performance.total_modules} Modul</span>
                                </div>
                                <div className="w-full h-6 bg-surface-container-highest border-2 border-primary rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-secondary-fixed border-r-2 border-primary rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, performance.completion_percentage))}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── ROW 2: Module Grid + Sidebar ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Module Grid (spans 2 cols) */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-2">
                                    <span
                                        className="material-symbols-outlined text-3xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        science
                                    </span>
                                    Modul Praktikum
                                </h3>
                                <Link
                                    href="/praktikan/nilai"
                                    className="font-label text-sm font-bold text-secondary underline hover:text-secondary-dim"
                                >
                                    Lihat Semua Nilai
                                </Link>
                            </div>

                            {modules.length === 0 ? (
                                <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-8 text-center neo-shadow">
                                    <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-2">
                                        folder_open
                                    </span>
                                    <p className="font-headline text-xl font-bold text-on-surface">
                                        Belum Ada Modul
                                    </p>
                                    <p className="font-body text-sm text-on-surface-variant mt-1">
                                        Modul praktikum untuk semester ini belum dipublikasikan oleh tim asisten.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {modules.map((module, idx) => {
                                        const icon = MODULE_ICONS[idx % MODULE_ICONS.length];
                                        const isCompleted = module.status === 'completed';
                                        const isInProgress = module.status === 'in_progress';
                                        const isLocked = module.status === 'locked';

                                        return (
                                            <div
                                                key={module.id}
                                                className={`bg-surface-container-lowest border-[3px] border-primary rounded-xl p-6 neo-shadow hover:-translate-y-1 hover:-translate-x-1 hover:neo-shadow-lg transition-all group relative overflow-hidden ${
                                                    isLocked ? 'opacity-75' : ''
                                                }`}
                                            >
                                                {isInProgress && (
                                                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-secondary-container border-r-transparent"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center neo-shadow-sm transition-colors ${
                                                        isCompleted ? 'bg-tertiary-fixed group-hover:bg-tertiary-fixed-dim' :
                                                        isInProgress ? 'bg-secondary-fixed group-hover:bg-secondary-fixed-dim' :
                                                        'bg-surface-container-high'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-on-surface">
                                                            {icon}
                                                        </span>
                                                    </div>

                                                    {isCompleted ? (
                                                        <span className="bg-tertiary-fixed border-2 border-primary rounded-full px-2.5 py-0.5 text-xs font-label font-bold neo-shadow-sm text-black">
                                                            {module.grade_letter ? `Nilai: ${module.grade_letter} (${module.score})` : 'Selesai'}
                                                        </span>
                                                    ) : isInProgress ? (
                                                        <span className="bg-secondary-fixed border-2 border-primary rounded-full px-2.5 py-0.5 text-xs font-label font-bold neo-shadow-sm text-on-surface">
                                                            Sedang Berjalan
                                                        </span>
                                                    ) : (
                                                        <span className="bg-surface-container border-2 border-primary rounded-full px-2 py-0.5 text-xs font-label font-bold text-on-surface">
                                                            Belum Dibuka
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mb-1 text-xs font-label font-bold text-secondary uppercase tracking-wider">
                                                    {module.code}
                                                </div>
                                                <h4 className="font-headline text-xl font-bold text-on-surface mb-2">
                                                    {module.title}
                                                </h4>
                                                <p className="font-body text-sm text-on-surface-variant mb-4 line-clamp-2">
                                                    {module.description || "Materi eksperimen dan tugas praktikum."}
                                                </p>

                                                <div className="mt-auto pt-2 border-t-2 border-dashed border-outline-variant flex items-center justify-between">
                                                    <div className="text-xs font-label font-bold text-on-surface-variant">
                                                        Modul ke-{module.order_number}
                                                    </div>
                                                    {module.active_session_id ? (
                                                        <Link
                                                            href={`/praktikan/praktikum/${module.active_session_id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-label font-bold text-primary underline"
                                                        >
                                                            Buka Sesi
                                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href="/praktikan/praktikum"
                                                            className="inline-flex items-center gap-1 text-xs font-label font-bold text-on-surface hover:text-primary transition-colors"
                                                        >
                                                            Detail
                                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            {/* Upcoming Schedule Card */}
                            <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-6 neo-shadow-lg">
                                <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface mb-4 border-b-[3px] border-primary pb-3 flex items-center justify-between">
                                    Jadwal Mendatang
                                    <span className="material-symbols-outlined text-on-surface">
                                        event
                                    </span>
                                </h3>

                                {upcomingSchedules.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-1">
                                            calendar_month
                                        </span>
                                        <p className="font-body text-sm text-on-surface-variant">
                                            Tidak ada jadwal praktikum dalam waktu dekat.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingSchedules.map((schedule) => (
                                            <div
                                                key={schedule.id}
                                                className="flex gap-3 p-3 border-2 border-primary rounded-lg hover:bg-primary-fixed hover:-translate-y-0.5 transition-all neo-shadow-sm bg-surface-container-lowest"
                                            >
                                                <div className="flex flex-col items-center justify-center px-3 border-r-2 border-primary min-w-[50px]">
                                                    <span className="text-xs font-label font-bold text-on-surface-variant uppercase">
                                                        {schedule.date_month}
                                                    </span>
                                                    <span className="text-xl font-black font-headline text-on-surface leading-none">
                                                        {schedule.date_day}
                                                    </span>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h5 className="font-label font-bold text-sm text-on-surface mb-0.5 truncate">
                                                        {schedule.module_title}
                                                    </h5>
                                                    <p className="text-xs font-label text-on-surface-variant flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[13px]">
                                                            schedule
                                                        </span>
                                                        {schedule.time_range}
                                                    </p>
                                                    <p className="text-xs font-label text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                        <span className="material-symbols-outlined text-[13px]">
                                                            meeting_room
                                                        </span>
                                                        {schedule.room}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Link
                                    href="/praktikan/praktikum"
                                    className="block text-center w-full mt-4 bg-surface-container-lowest text-on-surface border-[2px] border-primary rounded-lg py-2 px-4 neo-shadow-sm hover:bg-surface-container active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all font-label font-bold text-xs md:text-sm"
                                >
                                    Lihat Seluruh Praktikum
                                </Link>
                            </div>

                            {/* Tugas Pendahuluan (TP) Deadlines & Reminders */}
                            <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-6 neo-shadow-lg">
                                <h3 className="font-headline text-xl font-bold text-on-surface mb-4 border-b-[3px] border-primary pb-3 flex items-center justify-between">
                                    Tugas Pendahuluan (TP)
                                    <span className="material-symbols-outlined text-secondary">
                                        assignment
                                    </span>
                                </h3>

                                {upcomingPrelabs.length === 0 ? (
                                    <div className="py-4 text-center">
                                        <p className="font-body text-xs text-on-surface-variant">
                                            Tidak ada tenggat waktu Tugas Pendahuluan yang aktif saat ini.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingPrelabs.map((prelab) => (
                                            <div
                                                key={prelab.id}
                                                className={`p-3 border-2 border-primary rounded-lg neo-shadow-sm ${
                                                    prelab.is_submitted
                                                        ? 'bg-tertiary-fixed-dim/30'
                                                        : prelab.is_past_due
                                                        ? 'bg-error-container/20'
                                                        : 'bg-secondary-container/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-label font-bold text-xs text-primary">
                                                        {prelab.module_code}
                                                    </span>
                                                    <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-full border border-primary ${
                                                        prelab.is_submitted
                                                            ? 'bg-tertiary-fixed text-black'
                                                            : prelab.is_past_due
                                                            ? 'bg-error text-on-error'
                                                            : 'bg-secondary-fixed text-on-secondary-fixed'
                                                    }`}>
                                                        {prelab.is_submitted ? 'Sudah Dikumpulkan' : prelab.is_past_due ? 'Lewat Tenggat' : 'Belum Selesai'}
                                                    </span>
                                                </div>
                                                <h6 className="font-label font-bold text-sm text-on-surface mb-1 truncate">
                                                    {prelab.module_title}
                                                </h6>
                                                <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                                                    <span className="material-symbols-outlined text-[13px]">
                                                        alarm
                                                    </span>
                                                    Batas: {prelab.deadline_formatted}
                                                </p>
                                                <Link
                                                    href={`/praktikan/tugas-pendahuluan/${prelab.module_id}`}
                                                    className="inline-flex items-center gap-1 font-label font-bold text-xs text-primary underline"
                                                >
                                                    {prelab.is_submitted ? 'Tinjau Jawaban' : 'Kerjakan Sekarang'}
                                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Announcements */}
                            {announcements.length > 0 && (
                                <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-6 neo-shadow">
                                    <h3 className="font-headline text-lg font-bold text-on-surface mb-3 border-b-2 border-primary pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">
                                            campaign
                                        </span>
                                        Pengumuman
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
                                                    <span className="font-label font-bold text-xs text-on-surface truncate">
                                                        {item.title}
                                                    </span>
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
