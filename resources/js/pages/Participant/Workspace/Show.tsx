import { Head, Link, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { useConnectionStatus, useEchoPresence } from '@laravel/echo-react';
import { submit as submitAnswer } from '@/routes/participant/workspace';
import AnswerFileDropzone from '@/components/answer-file-dropzone';

interface Question {
    id: number;
    module_id?: number;
    session_type: string;
    description: string;
    answer_type: string; // 'text' or 'code'
    programming_language?: string;
}

interface Answer {
    id: number;
    content: string;
    status: string;
}

interface Session {
    id: number;
    session_type: string;
    state: string;
    practicum_schedule: {
        module: {
            title: string;
            questions: Question[];
        };
    };
}

interface Assistant {
    id: number;
    name: string;
}

interface ExistingFeedback {
    id: number;
    rating: number;
    content: string;
    target_assistant_id: number;
    target_assistant?: { id: number; name: string };
    created_at: string;
}

interface Props {
    session: Session;
    existingAnswers: Record<number, Answer>;
    assistants?: Assistant[];
    existingFeedback?: ExistingFeedback | null;
}

const QuestionCell = ({
    index,
    question,
    existingAnswer,
    sessionId,
}: {
    index: number;
    question: Question;
    existingAnswer?: Answer;
    sessionId: number;
}) => {
    const { data, setData, post, processing } = useForm({
        answer_content: existingAnswer?.content || '',
    });

    const [saved, setSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(submitAnswer.url({ session: sessionId, question: question.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            },
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-12 flex w-full flex-col gap-6"
        >
            <div className="border-primary mb-4 flex items-start justify-between border-b-[3px] pb-4">
                <div>
                    <h2 className="font-headline text-on-surface text-3xl font-bold">
                        Soal {index + 1}
                    </h2>
                    <div className="font-body text-outline mt-2 text-lg leading-relaxed whitespace-pre-wrap">
                        {question.description}
                    </div>
                </div>
            </div>
            <div className="border-primary bg-primary-container neo-shadow-lg group focus-within:neo-shadow-xl overflow-hidden rounded-[16px] border-[3px] transition-all focus-within:-translate-y-1">
                <div className="bg-primary-fixed text-on-primary-fixed border-primary flex items-center justify-between border-b-[3px] p-4">
                    <div className="font-label flex items-center gap-2 text-sm font-bold uppercase">
                        <span className="material-symbols-outlined">
                            {question.answer_type === 'code'
                                ? 'code'
                                : question.answer_type === 'file'
                                ? 'upload_file'
                                : 'edit_document'}
                        </span>
                        Lembar Jawaban ({question.answer_type === 'file' ? 'Unggah Berkas' : question.answer_type})
                    </div>
                </div>
                {question.answer_type === 'file' ? (
                    <div className="p-6 bg-surface-container-lowest">
                        <AnswerFileDropzone
                            questionId={question.id}
                            practicumSessionId={sessionId}
                            initialValue={data.answer_content}
                            onUploadSuccess={(_fileData, rawJson) => {
                                setData('answer_content', rawJson);
                            }}
                            onRemove={() => {
                                setData('answer_content', '');
                            }}
                        />
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                            <span className="font-label text-xs text-outline font-medium">
                                Berkas otomatis tersimpan saat diunggah. Klik Simpan Jawaban untuk konfirmasi.
                            </span>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                {saved && (
                                    <span className="font-label text-primary animate-pulse font-bold text-sm">
                                        Tersimpan!
                                    </span>
                                )}
                                <button
                                    disabled={processing || !data.answer_content}
                                    type="submit"
                                    className="bg-tertiary-container text-on-tertiary-container border-primary neo-shadow font-label hover:neo-shadow-md flex items-center gap-2 rounded-xl border-[3px] px-6 py-2 text-base font-bold transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Jawaban'}
                                    <span className="material-symbols-outlined text-lg">
                                        save
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-container-lowest relative p-0">
                        <textarea
                            value={data.answer_content}
                            onChange={(e) =>
                                setData('answer_content', e.target.value)
                            }
                            className={`h-48 w-full p-6 md:h-64 ${question.answer_type === 'code' ? 'bg-inverse-surface font-mono text-green-400' : 'font-body bg-surface-container-lowest text-on-surface'} resize-y border-none text-lg leading-relaxed font-medium placeholder-slate-400 focus:ring-0`}
                            placeholder={
                                question.answer_type === 'code'
                                    ? '// Tuliskan kode Anda di sini...'
                                    : 'Ketik jawaban Anda di sini...'
                            }
                        />
                        <div className="absolute right-4 bottom-4 flex items-center gap-3">
                            {saved && (
                                <span className="font-label text-primary animate-pulse font-bold">
                                    Tersimpan!
                                </span>
                            )}
                            <button
                                disabled={processing}
                                type="submit"
                                className="bg-tertiary-container text-on-tertiary-container border-primary neo-shadow font-label hover:neo-shadow-md flex items-center gap-2 rounded-xl border-[3px] px-6 py-2 text-base font-bold transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Jawaban'}
                                <span className="material-symbols-outlined text-lg">
                                    save
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
};

interface SessionStateEvent {
    action: 'started' | 'phase_changed' | 'ended';
    session: {
        id: number;
        session_type: string;
        state: string;
    };
}

const FeedbackForm = ({
    moduleId,
    assistants,
    existingFeedback,
}: {
    moduleId: number;
    assistants: Assistant[];
    existingFeedback?: ExistingFeedback | null;
}) => {
    const [isEditing, setIsEditing] = useState(!existingFeedback);
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        module_id: moduleId,
        target_assistant_id: existingFeedback?.target_assistant_id ? String(existingFeedback.target_assistant_id) : '',
        rating: existingFeedback?.rating || 5,
        content: existingFeedback?.content || '',
        feedback_type: 'personal',
    });

    const ratingDescriptions: Record<number, string> = {
        1: 'Sangat Kurang - Perlu evaluasi bimbingan',
        2: 'Kurang - Pembahasan kurang memadai',
        3: 'Cukup - Sesuai standar minimal',
        4: 'Baik - Bimbingan jelas dan responsif',
        5: 'Sangat Memuaskan - Bimbingan interaktif dan sangat membantu',
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/praktikan/feedback', {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    if (existingFeedback && !isEditing) {
        return (
            <div className="border-primary bg-surface-container-lowest neo-shadow-xl mx-auto my-8 max-w-3xl rounded-[24px] border-[4px] p-8 md:p-12">
                <div className="border-primary mb-8 border-b-[3px] pb-6 text-center">
                    <div className="bg-tertiary-fixed border-primary neo-shadow-sm mb-4 inline-flex items-center gap-2 rounded-full border-[2px] px-5 py-2">
                        <span className="material-symbols-outlined text-on-tertiary-fixed text-xl">
                            verified
                        </span>
                        <span className="font-label text-on-tertiary-fixed text-sm font-black uppercase tracking-wider">
                            Feedback Terkirim
                        </span>
                    </div>
                    <h2 className="font-headline text-on-surface text-3xl font-black uppercase">
                        Terima Kasih Atas Ulasan Anda!
                    </h2>
                    <p className="font-body text-outline mt-2 text-base">
                        Feedback Anda sangat berharga untuk meningkatkan kualitas bimbingan praktikum berikutnya.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface-container rounded-2xl border-[3px] border-primary p-6 neo-shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-outline-variant pb-4 mb-4">
                            <div>
                                <span className="font-label text-xs font-bold text-outline uppercase tracking-wider">
                                    Asisten Pembimbing
                                </span>
                                <h3 className="font-headline text-xl font-bold text-on-surface">
                                    {existingFeedback.target_assistant?.name || 'Asisten Pengajar'}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex text-amber-400 text-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className="material-symbols-outlined">
                                            {star <= existingFeedback.rating ? 'star' : 'star_outline'}
                                        </span>
                                    ))}
                                </div>
                                <span className="font-label text-base font-black text-on-surface ml-1">
                                    {existingFeedback.rating}/5
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="font-label text-xs font-bold text-outline uppercase tracking-wider block mb-1">
                                Pesan / Masukan Anda
                            </span>
                            <p className="font-body text-on-surface text-lg leading-relaxed italic bg-surface-container-lowest p-4 rounded-xl border-2 border-primary">
                                "{existingFeedback.content}"
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="bg-surface-container border-primary font-label text-on-surface neo-shadow-sm hover:neo-shadow flex items-center justify-center gap-2 rounded-xl border-[3px] px-6 py-3 font-bold uppercase transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Ubah Ulasan
                        </button>
                        <Link
                            href="/praktikan/praktikum"
                            className="bg-primary text-on-primary border-primary font-label neo-shadow hover:neo-shadow-md flex items-center justify-center gap-2 rounded-xl border-[3px] px-8 py-3 font-bold uppercase transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-lg">dashboard</span>
                            Kembali ke Workspace
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentRating = hoverRating !== null ? hoverRating : data.rating;

    return (
        <div className="border-primary bg-surface-container-lowest neo-shadow-xl mx-auto my-8 max-w-3xl rounded-[24px] border-[4px] p-8 md:p-12">
            <div className="border-primary mb-8 border-b-[3px] pb-6 text-center">
                <div className="bg-primary-container border-primary neo-shadow-sm mb-4 inline-flex items-center gap-2 rounded-full border-[2px] px-5 py-2">
                    <span className="material-symbols-outlined text-on-primary-container text-xl">
                        rate_review
                    </span>
                    <span className="font-label text-on-primary-container text-sm font-black uppercase tracking-wider">
                        Tahap Terakhir Praktikum
                    </span>
                </div>
                <h2 className="font-headline text-on-surface text-3xl font-black uppercase">
                    Feedback Praktikum
                </h2>
                <p className="font-body text-outline mt-2 text-base">
                    Pilih asisten yang membimbing Anda pada modul ini dan berikan penilaian serta ulasan konstruktif.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Asisten Selector */}
                <div>
                    <label className="font-label text-on-surface mb-2 block text-sm font-bold uppercase">
                        1. Pilih Asisten Pengajar / Jaga <span className="text-error">*</span>
                    </label>
                    <select
                        value={data.target_assistant_id}
                        onChange={(e) => setData('target_assistant_id', e.target.value)}
                        className="bg-surface-container-lowest border-primary font-headline text-on-surface neo-shadow-sm w-full rounded-xl border-[3px] px-4 py-3 text-base font-bold focus:ring-0 focus:outline-none"
                    >
                        <option value="" disabled>
                            -- Pilih Asisten yang mengajar Anda pada modul ini --
                        </option>
                        {assistants.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                    {errors.target_assistant_id && (
                        <p className="font-label text-error mt-1 text-sm font-bold">
                            {errors.target_assistant_id}
                        </p>
                    )}
                </div>

                {/* Star Rating */}
                <div>
                    <label className="font-label text-on-surface mb-2 block text-sm font-bold uppercase">
                        2. Rating Bimbingan Asisten (1-5 Bintang) <span className="text-error">*</span>
                    </label>
                    <div className="bg-surface-container rounded-xl border-[3px] border-primary p-4 neo-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setData('rating', star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                                >
                                    <span
                                        className={`material-symbols-outlined text-4xl transition-colors ${
                                            star <= currentRating
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-outline-variant hover:text-amber-300'
                                        }`}
                                        style={{ fontVariationSettings: star <= currentRating ? "'FILL' 1" : "'FILL' 0" }}
                                    >
                                        star
                                    </span>
                                </button>
                            ))}
                        </div>
                        <span className="font-label text-sm font-bold text-on-surface-variant">
                            {ratingDescriptions[currentRating] || `${currentRating} Bintang`}
                        </span>
                    </div>
                    {errors.rating && (
                        <p className="font-label text-error mt-1 text-sm font-bold">
                            {errors.rating}
                        </p>
                    )}
                </div>

                {/* Feedback Content */}
                <div>
                    <label className="font-label text-on-surface mb-2 block text-sm font-bold uppercase">
                        3. Ulasan / Masukan Praktikum <span className="text-error">*</span>
                    </label>
                    <textarea
                        rows={5}
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        placeholder="Tuliskan ulasan Anda mengenai pemahaman materi, keramahan dan kejelasan bimbingan asisten, atau masukan untuk pelaksanaan modul..."
                        className="bg-surface-container-lowest border-primary font-body text-on-surface neo-shadow-sm w-full resize-y rounded-xl border-[3px] px-4 py-3 text-base leading-relaxed focus:ring-0 focus:outline-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                        <span className="font-label text-xs text-outline font-bold">
                            Minimal 5 karakter
                        </span>
                        <span className="font-label text-xs text-outline font-bold">
                            {data.content.length} karakter
                        </span>
                    </div>
                    {errors.content && (
                        <p className="font-label text-error mt-1 text-sm font-bold">
                            {errors.content}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {existingFeedback && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-surface-container border-primary font-label text-on-surface neo-shadow-sm hover:neo-shadow flex items-center justify-center gap-2 rounded-xl border-[3px] px-6 py-4 font-bold uppercase transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                        >
                            Batal
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={processing || !data.target_assistant_id || !data.content || data.content.length < 5}
                        className="bg-primary text-on-primary border-primary font-headline neo-shadow-md hover:neo-shadow-lg flex-1 flex items-center justify-center gap-3 rounded-xl border-[3px] px-8 py-4 text-lg font-black uppercase transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">send</span>
                        {processing ? 'Mengirim...' : 'Kirim Feedback Praktikum'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function WorkspaceShow({
    session,
    existingAnswers,
    assistants = [],
    existingFeedback = null,
}: Props) {
    const connectionStatus = useConnectionStatus();

    useEchoPresence<SessionStateEvent>(
        `practicum.${session.id}`,
        '.SessionStateUpdated',
        (event) => {
            if (
                event.action === 'ended' ||
                ['closed', 'completed'].includes(event.session.state)
            ) {
                router.visit('/praktikan/praktikum');
                return;
            }

            if (
                event.action === 'phase_changed' &&
                event.session.id !== session.id
            ) {
                router.visit(`/praktikan/praktikum/${event.session.id}`);
            }
        },
        [session.id],
    );

    const questions = session.practicum_schedule.module.questions.filter(
        (q) => q.session_type === session.session_type,
    );

    const isFeedbackPhase = session.session_type === 'feedback';

    const renderPhaseBanner = () => {
        const labels: Record<string, string> = {
            initial_task: 'Tugas Awal',
            journal: 'Jurnal Praktikum',
            independent_task: 'Tugas Akhir',
            feedback: 'Feedback Praktikum',
        };
        const title = labels[session.session_type] || session.session_type;

        return (
            <div className="bg-primary-fixed border-primary neo-shadow-md mb-10 rounded-2xl border-[3px] p-6">
                <h2 className="font-headline text-on-primary-fixed mb-2 text-2xl font-black uppercase">
                    Tahap: {title}
                </h2>
                <p className="font-body text-on-primary-fixed font-bold">
                    {isFeedbackPhase
                        ? 'Berikan penilaian dan masukan konstruktif kepada asisten pengajar Anda untuk modul ini.'
                        : 'Selesaikan pertanyaan-pertanyaan berikut dengan baik.'}
                </p>
            </div>
        );
    };

    // Check if on independent_task and all questions are answered
    const isIndependentTask = session.session_type === 'independent_task';
    const allIndependentAnswered = isIndependentTask && questions.length > 0 && questions.every(q => !!existingAnswers[q.id]?.content);

    return (
        <>
            <Head title={`Sesi Praktikum - ${session.practicum_schedule.module.title}`} />
            <div className="bg-background relative flex h-full w-full flex-col overflow-hidden pt-14">
                <Link
                    href="/praktikan/praktikum"
                    className="bg-primary-container text-on-primary-container border-primary neo-shadow hover:neo-shadow-md absolute top-20 left-4 z-50 flex items-center justify-center rounded-full border-[3px] p-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                    <span className="material-symbols-outlined">
                        arrow_back
                    </span>
                </Link>
                <header className="border-primary bg-surface-container-lowest neo-shadow relative z-40 flex shrink-0 items-center justify-between border-b-[4px] px-6 py-4 pl-20">
                    <div className="flex items-center gap-4">
                        <h1 className="font-headline text-on-surface text-xl font-black uppercase md:text-2xl">
                            {session.practicum_schedule.module.title}
                        </h1>
                        <div className="bg-primary-fixed border-primary neo-shadow-sm hidden items-center gap-2 rounded-full border-[2px] px-4 py-1.5 md:flex">
                            <div className="bg-on-primary-fixed h-2.5 w-2.5 animate-pulse rounded-full"></div>
                            <span className="font-label text-on-primary-fixed text-xs font-bold tracking-wider uppercase">
                                {session.session_type === 'feedback' ? 'Feedback Praktikum' : session.session_type.replace('_', ' ')}
                            </span>
                        </div>
                        <div
                            className={`border-primary neo-shadow-sm flex items-center gap-2 rounded-full border-[2px] px-3 py-1 ${
                                connectionStatus === 'connected'
                                    ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200'
                                    : connectionStatus === 'connecting' ||
                                        connectionStatus === 'reconnecting'
                                      ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200'
                                      : 'bg-surface-container-high text-on-surface'
                            }`}
                        >
                            <div
                                className={`border-primary h-2.5 w-2.5 rounded-full border-2 ${
                                    connectionStatus === 'connected'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : connectionStatus === 'connecting' ||
                                            connectionStatus === 'reconnecting'
                                          ? 'bg-amber-500 animate-ping'
                                          : 'bg-outline'
                                }`}
                            />
                            <span className="font-label text-xs font-bold uppercase">
                                {connectionStatus === 'connected'
                                    ? 'Online'
                                    : connectionStatus === 'connecting' ||
                                        connectionStatus === 'reconnecting'
                                      ? 'Connecting...'
                                      : 'Offline'}
                            </span>
                        </div>
                    </div>
                </header>
                <section className="hide-scrollbar flex-1 overflow-y-auto p-6 pb-32 md:p-12">
                    <div className="mx-auto w-full max-w-4xl">
                        {renderPhaseBanner()}

                        {/* Completion banner when independent_task is done */}
                        {allIndependentAnswered && (
                            <div className="bg-tertiary-fixed border-primary neo-shadow-md mb-8 rounded-2xl border-[3px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-on-tertiary-fixed text-4xl">
                                        check_circle
                                    </span>
                                    <div>
                                        <h3 className="font-headline text-lg font-black uppercase text-on-tertiary-fixed">
                                            Tugas Akhir Selesai Dikerjakan!
                                        </h3>
                                        <p className="font-body text-sm font-bold text-on-tertiary-fixed/90">
                                            Tahap selanjutnya adalah memberikan Feedback Praktikum kepada asisten pengajar Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isFeedbackPhase ? (
                            <FeedbackForm
                                moduleId={session.practicum_schedule.module.questions[0]?.module_id || 1}
                                assistants={assistants}
                                existingFeedback={existingFeedback}
                            />
                        ) : questions.length === 0 ? (
                            <div className="bg-surface-container border-outline-variant rounded-2xl border-[3px] border-dashed p-12 text-center">
                                <span className="material-symbols-outlined text-outline mb-4 text-6xl">
                                    inventory_2
                                </span>
                                <h3 className="font-headline text-on-surface-variant text-xl font-bold">
                                    Tidak ada soal untuk tahap ini.
                                </h3>
                            </div>
                        ) : (
                            questions.map((q, idx) => (
                                <QuestionCell
                                    key={q.id}
                                    index={idx}
                                    question={q}
                                    existingAnswer={existingAnswers[q.id]}
                                    sessionId={session.id}
                                />
                            ))
                        )}

                        {!isFeedbackPhase && (
                            <div className="border-primary mt-16 border-t-[4px] border-dashed pt-8 text-center opacity-50">
                                <span className="material-symbols-outlined text-on-surface text-4xl">
                                    flag
                                </span>
                                <h3 className="font-headline text-on-surface mt-2 text-xl font-bold uppercase">
                                    Akhir Tahap
                                </h3>
                                <p className="font-body text-outline mt-1">
                                    Anda telah mencapai akhir soal untuk tahap ini.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
