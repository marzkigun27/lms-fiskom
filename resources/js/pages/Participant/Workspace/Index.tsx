import { Head, Link, usePage, router } from '@inertiajs/react';
import { useConnectionStatus, useEcho } from '@laravel/echo-react';
import React, {
    useState,
} from 'react'; /* --- MOCK DATA FOR WORKSPACE SHOW --- */
const ASSISTANTS = [
    { id: 1, name: 'Kak Budi' },
    { id: 2, name: 'Kak Siti' },
    { id: 3, name: 'Kak Anton' },
];
const MOCK_STATES = [
    'offline',
    'waiting',
    'tugas_awal',
    'jurnal',
    'tugas_akhir',
    'feedback',
];
type SessionState =
    | 'offline'
    | 'waiting'
    | 'tugas_awal'
    | 'jurnal'
    | 'tugas_akhir'
    | 'feedback';
const QuestionCell = ({
    index,
    title,
    type,
    points,
}: {
    index: number;
    title: string;
    type: 'text' | 'code';
    points: number;
}) => {
    return (
        <div className="mb-12 flex w-full flex-col gap-6">
            {' '}
            <div className="border-primary mb-4 flex items-start justify-between border-b-[3px] pb-4">
                {' '}
                <div>
                    {' '}
                    <h2 className="font-headline text-on-surface text-3xl font-bold">
                        Task {index + 1}
                    </h2>{' '}
                    <div className="font-body text-outline mt-2 text-lg leading-relaxed whitespace-pre-wrap break-words">
                        {' '}
                        {title}{' '}
                    </div>{' '}
                </div>{' '}
                <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label border-primary neo-shadow-sm rounded-full border-[2px] px-3 py-1 font-bold whitespace-nowrap">
                    {' '}
                    {points} Points{' '}
                </span>{' '}
            </div>{' '}
            <div className="border-primary bg-primary-container neo-shadow-lg group focus-within:neo-shadow-xl overflow-hidden rounded-[16px] border-[3px] transition-all focus-within:-translate-y-1">
                {' '}
                <div className="bg-primary-fixed text-on-primary-fixed border-primary flex items-center justify-between border-b-[3px] p-4">
                    {' '}
                    <div className="font-label flex items-center gap-2 text-sm font-bold uppercase">
                        {' '}
                        <span className="material-symbols-outlined">
                            {type === 'code' ? 'code' : 'edit_document'}
                        </span>{' '}
                        Lembar Jawaban ({type}){' '}
                    </div>{' '}
                </div>{' '}
                <div className="bg-surface-container-lowest relative p-0">
                    {' '}
                    <textarea
                        className={`h-48 w-full p-6 md:h-64 ${type === 'code' ? 'bg-inverse-surface font-mono text-green-400' : 'font-body bg-surface-container-lowest text-on-surface'} resize-y border-none text-lg leading-relaxed font-medium placeholder-slate-400 focus:ring-0`}
                        placeholder={
                            type === 'code'
                                ? '// Tuliskan kode Anda di sini...'
                                : 'Ketik jawaban Anda di sini...'
                        }
                    />{' '}
                    <div className="absolute right-4 bottom-4">
                        {' '}
                        <button className="bg-tertiary-container text-on-tertiary-container border-primary neo-shadow font-label hover:neo-shadow-md flex items-center gap-2 rounded-xl border-[3px] px-6 py-2 text-base font-bold transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none">
                            {' '}
                            Simpan Jawaban{' '}
                            <span className="material-symbols-outlined text-lg">
                                save
                            </span>{' '}
                        </button>{' '}
                    </div>{' '}
                </div>{' '}
            </div>{' '}
        </div>
    );
};
/* ----------------------------------- */
interface Module {
    id: number;
    title: string;
    description: string;
    order_number: number;
}
interface WorkspaceModule {
    id: number;
    code: string;
    title: string;
    description?: string | null;
    order_number: number;
    is_completed: boolean;
    active_session_id?: number | null;
}
interface PracticumSession {
    id: number;
    state: string;
    session_type: string;
    practicum_schedule: { module: Module };
}

interface SessionStateEvent {
    action: 'started' | 'phase_changed' | 'ended';
    session: {
        id: number;
        state: string;
        session_type: string;
    };
}

function PracticumControlListener({
    weeklyScheduleId,
}: {
    weeklyScheduleId: number;
}) {
    useEcho<SessionStateEvent>(
        `practicum-control.${weeklyScheduleId}`,
        '.SessionStateUpdated',
        () => {
            router.reload({ only: ['activeSessions', 'modules'] });
        },
    );

    return null;
}

export default function WorkspaceIndex() {
    const {
        activeSessions = [],
        controlChannels = [],
        modules = [],
    } = usePage<{
        activeSessions: PracticumSession[];
        controlChannels: number[];
        modules: WorkspaceModule[];
    }>().props;
    const connectionStatus = useConnectionStatus();
    /* MOCKUP STATE */ const [isMockupActive, setIsMockupActive] =
        useState(false);
    const [mockCurrentState, setMockCurrentState] =
        useState<SessionState>('tugas_awal');
    const [feedbackAsisten, setFeedbackAsisten] = useState('');
    /* Render Logic for Mockup Show */ const renderMockupContent = () => {
        switch (mockCurrentState) {
            case 'offline':
                return (
                    <div className="border-primary bg-secondary-container neo-shadow-xl mx-auto my-12 w-full max-w-2xl rotate-1 transform rounded-[24px] border-[4px] p-12 text-center">
                        {' '}
                        <div className="bg-surface-container-lowest border-primary neo-shadow mb-6 inline-block rounded-full border-[3px] p-6">
                            {' '}
                            <span className="material-symbols-outlined text-on-tertiary-container text-6xl">
                                snooze
                            </span>{' '}
                        </div>{' '}
                        <h2 className="font-headline text-on-surface mb-4 text-4xl font-black tracking-tight uppercase">
                            Tidak Ada Sesi
                        </h2>{' '}
                        <p className="font-body text-on-surface text-lg font-medium">
                            Asisten belum memulai sesi praktikum Anda. Silakan
                            tunggu atau hubungi asisten yang bertugas.
                        </p>{' '}
                    </div>
                );
            case 'waiting':
                return (
                    <div className="border-primary bg-surface-container-lowest neo-shadow-xl mx-auto my-12 w-full max-w-2xl rounded-[24px] border-[4px] p-12 text-center">
                        {' '}
                        <span className="material-symbols-outlined text-outline-variant mb-4 animate-pulse text-6xl">
                            hourglass_empty
                        </span>{' '}
                        <h2 className="font-headline text-on-surface mb-2 text-3xl font-black tracking-tight uppercase">
                            Menunggu Asisten
                        </h2>{' '}
                        <p className="font-body text-outline text-lg">
                            Sesi telah aktif. Asisten sedang mempersiapkan tahap
                            selanjutnya. Tampilan ini akan otomatis berubah saat
                            tahap dimulai.
                        </p>{' '}
                    </div>
                );
            case 'tugas_awal':
                return (
                    <>
                        {' '}
                        <div className="bg-tertiary-container border-primary neo-shadow-md mb-10 rounded-2xl border-[3px] p-6">
                            {' '}
                            <h2 className="font-headline text-on-tertiary-container mb-2 text-2xl font-black uppercase">
                                Tahap: Tugas Awal
                            </h2>{' '}
                            <p className="font-body text-on-tertiary-container font-bold">
                                Jawablah 3 pertanyaan berikut dengan ringkas dan
                                jelas.
                            </p>{' '}
                        </div>{' '}
                        <QuestionCell
                            index={0}
                            title="Jelaskan secara singkat apa yang dimaksud dengan koefisien gesekan statis!"
                            type="text"
                            points={30}
                        />{' '}
                        <QuestionCell
                            index={1}
                            title="Buatlah sebuah fungsi dalam Python untuk menghitung gaya gesek statis maksimum jika diketahui mu_s dan massa m."
                            type="code"
                            points={40}
                        />{' '}
                        <QuestionCell
                            index={2}
                            title="Apa perbedaan utama antara gesekan statis dan gesekan kinetis?"
                            type="text"
                            points={30}
                        />{' '}
                    </>
                );
            case 'jurnal':
                return (
                    <>
                        {' '}
                        <div className="bg-primary-fixed border-primary neo-shadow-md mb-10 rounded-2xl border-[3px] p-6">
                            {' '}
                            <h2 className="font-headline text-on-primary-fixed mb-2 text-2xl font-black uppercase">
                                Tahap: Jurnal Praktikum
                            </h2>{' '}
                            <p className="font-body text-on-primary-fixed font-bold">
                                Catat data eksperimen Anda dan lakukan
                                pengolahan data.
                            </p>{' '}
                        </div>{' '}
                        <QuestionCell
                            index={0}
                            title="Masukkan data eksperimen (massa, gaya tarik, delta_x) ke dalam bentuk array/list Python!"
                            type="code"
                            points={20}
                        />{' '}
                        <QuestionCell
                            index={1}
                            title="Lakukan fitting regresi linear pada data yang Anda peroleh untuk mencari konstanta pegas menggunakan pustaka Numpy."
                            type="code"
                            points={40}
                        />{' '}
                        <QuestionCell
                            index={2}
                            title="Berdasarkan hasil regresi, apakah data Anda sesuai dengan Hukum Hooke? Jelaskan!"
                            type="text"
                            points={40}
                        />{' '}
                    </>
                );
            case 'tugas_akhir':
                return (
                    <>
                        {' '}
                        <div className="bg-tertiary-fixed border-primary neo-shadow-md mb-10 rounded-2xl border-[3px] p-6">
                            {' '}
                            <h2 className="font-headline text-on-tertiary-fixed mb-2 text-2xl font-black uppercase">
                                Tahap: Tugas Akhir
                            </h2>{' '}
                            <p className="font-body text-on-tertiary-fixed font-bold">
                                Selesaikan tugas akhir sebagai kesimpulan dari
                                modul ini.
                            </p>{' '}
                        </div>{' '}
                        <QuestionCell
                            index={0}
                            title="Buatlah skrip visualisasi data (Plot) menggunakan Matplotlib untuk menampilkan grafik gaya (F) terhadap pertambahan panjang (delta_x) dengan garis regresi."
                            type="code"
                            points={100}
                        />{' '}
                    </>
                );
            case 'feedback':
                return (
                    <div className="bg-surface-container-lowest border-primary neo-shadow-xl mx-auto my-8 max-w-3xl rounded-[24px] border-[4px] p-8 md:p-12">
                        {' '}
                        <div className="border-primary mb-10 border-b-[3px] pb-8 text-center">
                            {' '}
                            <span className="material-symbols-outlined text-on-primary-container mb-4 text-6xl">
                                stars
                            </span>{' '}
                            <h2 className="font-headline text-on-surface text-4xl font-black tracking-tight uppercase">
                                Sesi Selesai!
                            </h2>{' '}
                            <p className="font-body text-outline mt-2 text-lg">
                                Terima kasih telah mengikuti praktikum hari ini.
                                Silakan berikan *feedback* kepada asisten Anda.
                            </p>{' '}
                        </div>{' '}
                        <div className="space-y-6">
                            {' '}
                            <div>
                                {' '}
                                <label className="font-label text-on-surface mb-2 block text-sm font-bold uppercase">
                                    {' '}
                                    Pilih Asisten{' '}
                                </label>{' '}
                                <select
                                    value={feedbackAsisten}
                                    onChange={(e) =>
                                        setFeedbackAsisten(e.target.value)
                                    }
                                    className="bg-background border-primary font-headline text-on-surface neo-shadow w-full rounded-xl border-[3px] px-4 py-4 text-lg font-bold focus:ring-0 focus:outline-none"
                                >
                                    {' '}
                                    <option value="" disabled>
                                        -- Pilih Asisten yang mengajar Anda --
                                    </option>{' '}
                                    {ASSISTANTS.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            Kak {a.name}
                                        </option>
                                    ))}{' '}
                                </select>{' '}
                            </div>{' '}
                            <div>
                                {' '}
                                <label className="font-label text-on-surface mb-2 block text-sm font-bold uppercase">
                                    {' '}
                                    Pesan / Ulasan{' '}
                                </label>{' '}
                                <textarea
                                    rows={5}
                                    placeholder="Tuliskan ulasan, kritik membangun, atau apresiasi..."
                                    className="bg-background border-primary font-body text-on-surface neo-shadow w-full resize-y rounded-xl border-[3px] px-4 py-4 text-lg focus:ring-0 focus:outline-none"
                                />{' '}
                            </div>{' '}
                            <button
                                onClick={() => {
                                    alert(
                                        'Feedback terkirim! Kembali ke dashboard.',
                                    );
                                    setIsMockupActive(false);
                                }}
                                className="bg-primary-container text-on-primary-container border-primary font-headline neo-shadow-md hover:neo-shadow-lg mt-4 flex w-full items-center justify-center gap-3 rounded-xl border-[3px] px-6 py-4 text-xl font-black uppercase transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                            >
                                {' '}
                                <span className="material-symbols-outlined">
                                    send
                                </span>{' '}
                                Kirim Feedback{' '}
                            </button>{' '}
                        </div>{' '}
                    </div>
                );
        }
    };
    if (isMockupActive) {
        return (
            <>
                {' '}
                <Head title="Mockup Session" /> {/* MOCKUP DEVELOPER TOOLBAR */}{' '}
                <div className="bg-on-primary-fixed text-on-primary-container border-primary fixed top-0 left-0 z-[9999] flex w-full items-center justify-center gap-2 overflow-x-auto border-b-4 p-2">
                    {' '}
                    <span className="font-label text-primary-fixed mr-4 shrink-0 text-xs font-bold tracking-wider uppercase">
                        Mockup Controller:
                    </span>{' '}
                    {MOCK_STATES.map((state) => (
                        <button
                            key={state}
                            onClick={() =>
                                setMockCurrentState(state as SessionState)
                            }
                            className={`font-label border-primary rounded border-2 px-3 py-1 text-xs font-bold whitespace-nowrap uppercase transition-all ${mockCurrentState === state ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-container text-inverse-on-surface hover:bg-surface-container-highest'}`}
                        >
                            {' '}
                            {state.replace('_', ' ')}{' '}
                        </button>
                    ))}{' '}
                </div>{' '}
                <div className="bg-background relative flex h-full w-full flex-col overflow-hidden pt-14">
                    {' '}
                    {/* Back button */}{' '}
                    <button
                        onClick={() => setIsMockupActive(false)}
                        className="bg-primary-container text-on-primary-container border-primary neo-shadow hover:neo-shadow-md absolute top-20 left-4 z-50 flex items-center justify-center rounded-full border-[3px] p-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                        {' '}
                        <span className="material-symbols-outlined">
                            arrow_back
                        </span>{' '}
                    </button>{' '}
                    {/* Workspace Header */}{' '}
                    <header className="border-primary bg-surface-container-lowest neo-shadow relative z-40 flex shrink-0 items-center justify-between border-b-[4px] px-6 py-4 pl-20">
                        {' '}
                        <div className="flex items-center gap-4">
                            {' '}
                            <h1 className="font-headline text-on-surface text-xl font-black uppercase md:text-2xl">
                                Modul 3: Gesekan
                            </h1>{' '}
                            <div className="bg-primary-fixed border-primary neo-shadow-sm hidden items-center gap-2 rounded-full border-[2px] px-4 py-1.5 md:flex">
                                {' '}
                                <div className="bg-on-primary-fixed h-2.5 w-2.5 animate-pulse rounded-full"></div>{' '}
                                <span className="font-label text-on-primary-fixed text-xs font-bold tracking-wider uppercase">
                                    {' '}
                                    {mockCurrentState.replace('_', ' ')}{' '}
                                </span>{' '}
                            </div>{' '}
                        </div>{' '}
                    </header>{' '}
                    {/* Main Canvas / Notebook Area */}{' '}
                    <section className="hide-scrollbar flex-1 overflow-y-auto p-6 pb-32 md:p-12">
                        {' '}
                        <div className="mx-auto w-full max-w-4xl">
                            {' '}
                            {renderMockupContent()}{' '}
                            {['tugas_awal', 'jurnal', 'tugas_akhir'].includes(
                                mockCurrentState,
                            ) && (
                                <div className="border-primary mt-16 border-t-[4px] border-dashed pt-8 text-center opacity-50">
                                    {' '}
                                    <span className="material-symbols-outlined text-on-surface text-4xl">
                                        flag
                                    </span>{' '}
                                    <h3 className="font-headline text-on-surface mt-2 text-xl font-bold uppercase">
                                        Akhir Tahap
                                    </h3>{' '}
                                    <p className="font-body text-outline mt-1">
                                        Anda telah mencapai akhir soal untuk
                                        tahap ini.
                                    </p>{' '}
                                </div>
                            )}{' '}
                        </div>{' '}
                    </section>{' '}
                </div>{' '}
            </>
        );
    }
    return (
        <>
            {controlChannels.map((weeklyScheduleId) => (
                <PracticumControlListener
                    key={weeklyScheduleId}
                    weeklyScheduleId={weeklyScheduleId}
                />
            ))}{' '}
            <Head title="Practicum Workspace" />{' '}
            <div className="bg-surface flex h-full flex-1 flex-col overflow-hidden">
                {' '}
                {/* Workspace Topbar */}{' '}
                <header className="border-primary bg-surface-container-lowest neo-shadow relative z-40 flex shrink-0 items-center justify-between border-b-[3px] px-6 py-4">
                    {' '}
                    <div className="flex items-center gap-6">
                        {' '}
                        <h1 className="font-headline text-on-surface text-2xl font-bold">
                            Practicum Workspace
                        </h1>{' '}
                        <div
                            className={`border-primary neo-shadow-sm flex items-center gap-2 rounded-full border-[3px] px-4 py-1 transition-all ${
                                connectionStatus === 'connected'
                                    ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200'
                                    : connectionStatus === 'connecting' ||
                                        connectionStatus === 'reconnecting'
                                      ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200'
                                      : 'bg-surface-container-high text-on-surface'
                            }`}
                        >
                            <div
                                className={`border-primary h-3 w-3 rounded-full border-2 ${
                                    connectionStatus === 'connected'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : connectionStatus === 'connecting' ||
                                            connectionStatus === 'reconnecting'
                                          ? 'bg-amber-500 animate-ping'
                                          : 'bg-outline'
                                }`}
                            />
                            <span className="font-label text-sm font-bold tracking-tight">
                                {connectionStatus === 'connected'
                                    ? 'Online'
                                    : connectionStatus === 'connecting' ||
                                        connectionStatus === 'reconnecting'
                                      ? 'Connecting...'
                                      : 'Offline'}
                            </span>
                        </div>
                        {activeSessions.length > 0 && (
                            <div className="border-primary neo-shadow-sm bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1.5 rounded-full border-[3px] px-3.5 py-1 text-xs font-black uppercase">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                Sesi Aktif
                            </div>
                        )}
                    </div>{' '}
                </header>{' '}
                {/* Split View */}{' '}
                <div className="flex flex-1 overflow-hidden">
                    {' '}
                    {/* Left Panel: Module List */}
                    <aside className="border-primary bg-surface-container-lowest hide-scrollbar z-30 w-80 shrink-0 overflow-y-auto border-r-[3px]">
                        <div className="flex flex-col gap-4 p-6">
                            <div className="border-primary flex items-center justify-between border-b-[3px] pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-on-surface">
                                        list_alt
                                    </span>
                                    <h2 className="font-headline text-on-surface text-2xl font-bold">
                                        Modul
                                    </h2>
                                </div>
                                <span className="font-label bg-surface-container border-primary rounded-full border-2 px-2.5 py-0.5 text-xs font-bold text-on-surface">
                                    {modules.length}
                                </span>
                            </div>

                            {modules.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {modules.map((mod, index) => {
                                        const moduleOrder =
                                            mod.order_number || index + 1;
                                        const hasActiveSession =
                                            Boolean(mod.active_session_id);
                                        const isCompleted = mod.is_completed;

                                        if (hasActiveSession) {
                                            return (
                                                <Link
                                                    href={`/praktikan/praktikum/${mod.active_session_id}`}
                                                    key={mod.id}
                                                >
                                                    <div className="bg-primary-fixed border-primary neo-shadow border-l-primary hover:neo-shadow-md relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border-[3px] border-l-[8px] p-5 transition-all hover:-translate-y-0.5">
                                                        <div className="bg-primary text-on-primary font-label border-primary absolute top-0 right-0 flex items-center gap-1 rounded-bl-lg border-b-2 border-l-2 px-3 py-1 text-xs font-bold uppercase">
                                                            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-red-400"></span>
                                                            Aktif
                                                        </div>
                                                        <div className="bg-surface-container-lowest border-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[2px]">
                                                            <span
                                                                className="material-symbols-outlined text-primary"
                                                                style={{
                                                                    fontVariationSettings:
                                                                        "'FILL' 1",
                                                                }}
                                                            >
                                                                play_arrow
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-headline text-on-surface text-lg leading-tight font-extrabold">
                                                                Modul {moduleOrder}:{' '}
                                                                {mod.title}
                                                            </h3>
                                                            <p className="text-primary font-body mt-1 text-xs font-bold">
                                                                Sedang Berlangsung • Klik Masuk
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        }

                                        if (isCompleted) {
                                            return (
                                                <div
                                                    key={mod.id}
                                                    className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-700 dark:border-emerald-500 border-l-[8px] border-l-emerald-600 dark:border-l-emerald-400 neo-shadow relative flex flex-col gap-3 overflow-hidden rounded-xl border-[3px] p-5 transition-all"
                                                >
                                                    <div className="bg-emerald-600 text-white font-label border-emerald-800 dark:border-emerald-400 absolute top-0 right-0 flex items-center gap-1 rounded-bl-lg border-b-2 border-l-2 px-3 py-1 text-xs font-bold uppercase">
                                                        <span className="material-symbols-outlined text-xs">
                                                            check
                                                        </span>
                                                        Selesai
                                                    </div>
                                                    <div className="bg-emerald-100 dark:bg-emerald-900/60 border-emerald-700 dark:border-emerald-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[2px]">
                                                        <span
                                                            className="material-symbols-outlined text-emerald-700 dark:text-emerald-300"
                                                            style={{
                                                                fontVariationSettings:
                                                                    "'FILL' 1",
                                                            }}
                                                        >
                                                            task_alt
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-headline text-on-surface text-lg leading-tight font-extrabold">
                                                            Modul {moduleOrder}:{' '}
                                                            {mod.title}
                                                        </h3>
                                                        <p className="text-emerald-700 dark:text-emerald-400 font-body mt-1 text-xs font-bold">
                                                            Praktikum Selesai Dilaksanakan
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={mod.id}
                                                className="bg-surface-container-low border-outline-variant neo-shadow-sm relative flex flex-col gap-3 overflow-hidden rounded-xl border-[2px] p-5 opacity-90"
                                            >
                                                <div className="bg-surface-container-high text-on-surface-variant font-label border-outline-variant absolute top-0 right-0 rounded-bl-lg border-b-2 border-l-2 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                                                    Belum Dimulai
                                                </div>
                                                <div className="bg-surface-container-lowest border-outline-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[2px]">
                                                    <span className="material-symbols-outlined text-outline">
                                                        schedule
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-headline text-on-surface text-lg leading-tight font-bold">
                                                        Modul {moduleOrder}:{' '}
                                                        {mod.title}
                                                    </h3>
                                                    <p className="text-on-surface-variant font-body mt-1 text-xs font-medium">
                                                        Menunggu jadwal praktikum
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="border-outline-variant bg-surface-container rounded-xl border-[2px] border-dashed p-6 text-center">
                                    <span className="material-symbols-outlined text-outline mb-2 text-3xl">
                                        folder_off
                                    </span>
                                    <p className="font-body text-on-surface-variant text-sm font-medium">
                                        Belum ada modul praktikum yang tersedia.
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>{' '}
                    {/* Right Panel: Empty State / Instructions */}{' '}
                    <section className="bg-surface-container hide-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 md:p-10">
                        {' '}
                        <div className="flex w-full max-w-2xl flex-col gap-8">
                            {' '}
                            {activeSessions.length > 0 ? (
                                <div className="border-primary bg-tertiary-fixed neo-shadow-xl rounded-2xl border-[4px] p-12 text-center transition-transform duration-300 hover:rotate-0">
                                    {' '}
                                    <div className="bg-surface-container-lowest border-primary neo-shadow mb-6 inline-block rounded-full border-[3px] p-6">
                                        {' '}
                                        <span
                                            className="material-symbols-outlined text-tertiary text-6xl"
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            check_circle
                                        </span>{' '}
                                    </div>{' '}
                                    <h2 className="font-headline text-on-tertiary-fixed mb-4 text-4xl font-bold">
                                        Session Active!
                                    </h2>{' '}
                                    <p className="font-body text-on-tertiary-fixed-variant mb-6 text-lg">
                                        {' '}
                                        You have an active practicum session.
                                        Click a module on the left to
                                        start.{' '}
                                    </p>{' '}
                                    <Link
                                        href={`/praktikan/praktikum/${activeSessions[0]?.id}`}
                                        className="bg-primary text-on-primary border-primary font-headline neo-shadow hover:neo-shadow-md inline-flex items-center gap-2 rounded-xl border-[3px] px-8 py-4 text-xl font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                    >
                                        {' '}
                                        <span className="material-symbols-outlined">
                                            arrow_forward
                                        </span>{' '}
                                        Enter Notebook Workspace{' '}
                                    </Link>{' '}
                                </div>
                            ) : (
                                <div className="border-primary bg-primary-fixed neo-shadow-xl rotate-1 transform rounded-2xl border-[4px] p-12 text-center transition-transform duration-300 hover:rotate-0">
                                    {' '}
                                    <div className="bg-surface-container-lowest border-primary neo-shadow mb-6 inline-block rounded-full border-[3px] p-6">
                                        {' '}
                                        <span
                                            className="material-symbols-outlined text-on-primary-fixed text-6xl"
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            snooze
                                        </span>{' '}
                                    </div>{' '}
                                    <h2 className="font-headline text-on-primary-fixed mb-4 text-4xl font-black tracking-tight uppercase">
                                        Tidak Ada Sesi
                                    </h2>{' '}
                                    <p className="font-body text-on-surface mb-8 text-lg font-bold">
                                        Saat ini tidak ada sesi praktikum yang
                                        dijadwalkan untuk Anda.
                                    </p>{' '}
                                </div>
                            )}{' '}
                        </div>{' '}
                    </section>{' '}
                </div>{' '}
            </div>{' '}
        </>
    );
}
