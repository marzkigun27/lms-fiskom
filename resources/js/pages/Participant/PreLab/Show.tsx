import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import AnswerFileDropzone from '@/components/answer-file-dropzone';

interface QuestionItem {
    id: number;
    title: string | null;
    description: string;
    instructions: string | null;
    answer_type: 'text' | 'code' | 'file';
    programming_language: string | null;
    order_number: number;
    is_required: boolean;
}

interface Props {
    module: {
        id: number;
        order_number: number;
        code: string;
        title: string;
        description: string;
    };
    period: {
        id: number;
        opens_at: string;
        deadline_at: string;
        opens_at_formatted: string;
        deadline_at_formatted: string;
        computed_status: 'not_started' | 'ongoing' | 'expired';
        status_label: string;
    };
    questions: QuestionItem[];
    saved_answers: Record<number, string>;
    is_submitted: boolean;
    is_readonly: boolean;
    submitted_at: string | null;
    last_saved_at: string | null;
    remaining_seconds: number;
}

export default function ParticipantPreLabShow({
    module,
    period,
    questions,
    saved_answers,
    is_submitted,
    is_readonly,
    submitted_at,
    last_saved_at,
    remaining_seconds: initialRemainingSeconds,
}: Props) {
    const { flash } = usePage().props as any;

    // Local answers state mapped from questions
    const initialAnswers = questions.reduce<Record<number, string>>((acc, q) => {
        acc[q.id] = saved_answers[q.id] || '';
        return acc;
    }, {});

    const { data, setData, post, processing } = useForm({
        answers: initialAnswers,
    });

    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(Math.floor(initialRemainingSeconds));

    // Live countdown timer
    useEffect(() => {
        if (is_readonly || secondsLeft <= 0) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return Math.floor(prev) - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [is_readonly, secondsLeft]);

    const formatRemaining = (sec: number) => {
        const totalSec = Math.max(0, Math.floor(sec));
        if (totalSec <= 0) return 'Waktu Habis';
        const d = Math.floor(totalSec / 86400);
        const h = Math.floor((totalSec % 86400) / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (d > 0) return `${d} hari ${h} jam ${m} menit`;
        if (h > 0) return `${h} jam ${m} menit ${s} detik`;
        if (m > 0) return `${m} menit ${s} detik`;
        return `${s} detik`;
    };

    const handleAnswerChange = (questionId: number, val: string) => {
        setData('answers', {
            ...data.answers,
            [questionId]: val,
        });
    };

    const handleSaveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/praktikan/tugas-pendahuluan/${module.id}/save-draft`, {
            preserveScroll: true,
        });
    };

    const handleSubmitFinal = () => {
        setIsConfirmSubmitOpen(false);
        post(`/praktikan/tugas-pendahuluan/${module.id}/submit`);
    };

    const answeredCount = Object.values(data.answers).filter((val) => (val || '').trim().length > 0).length;

    return (
        <>
            <Head title={`Tugas Pendahuluan - ${module.title}`} />

            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body pb-36">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Top navigation */}
                    <div>
                        <Link
                            href="/praktikan/tugas-pendahuluan"
                            className="inline-flex items-center gap-2 font-label font-bold text-xs uppercase px-3 py-1.5 bg-surface-container border-2 border-black rounded-xl hover:bg-surface-container-high transition-colors mb-4"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Kembali ke Daftar Modul
                        </Link>

                        <div className="border-b-[4px] border-black dark:border-white pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="font-mono text-xs font-black px-2.5 py-1 bg-surface-container border-2 border-black rounded-lg inline-block mb-2">
                                    MODUL {module.order_number} • {module.code}
                                </span>
                                <h1 className="font-headline text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight">
                                    {module.title}
                                </h1>
                                <p className="font-body text-outline mt-1 text-sm">
                                    Batas Pengumpulan: <span className="font-bold text-on-surface">{period.deadline_at_formatted}</span>
                                </p>
                            </div>

                            {/* Timer and Status badge */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {is_submitted ? (
                                    <span className="px-4 py-1.5 bg-emerald-300 text-black font-headline font-black text-xs uppercase rounded-full border-2 border-black flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">task_alt</span>
                                        Sudah Dikumpulkan
                                    </span>
                                ) : period.computed_status === 'ongoing' ? (
                                    <div className="bg-tertiary-fixed text-black px-4 py-2 rounded-xl border-[3px] border-black neo-shadow-sm flex items-center gap-2 font-headline font-black text-sm uppercase">
                                        <span className="material-symbols-outlined text-lg animate-spin">timelapse</span>
                                        <span>Sisa: {formatRemaining(secondsLeft)}</span>
                                    </div>
                                ) : (
                                    <span className="px-4 py-1.5 bg-gray-200 text-gray-800 font-headline font-black text-xs uppercase rounded-full border-2 border-black">
                                        Batas Waktu Berakhir
                                    </span>
                                )}

                                {last_saved_at && !is_submitted && (
                                    <span className="text-[11px] font-bold text-outline">
                                        Draft terakhir disimpan: {last_saved_at}
                                    </span>
                                )}
                                {submitted_at && (
                                    <span className="text-[11px] font-bold text-outline">
                                        Dikumpulkan pada: {submitted_at}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
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

                    {/* Read-only notice if submitted or expired */}
                    {is_readonly && (
                        <div className="bg-secondary-fixed/20 border-[3px] border-black rounded-xl p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-2xl text-black font-bold">lock</span>
                            <div className="text-sm font-medium">
                                <span className="font-headline font-bold uppercase block text-on-surface">Mode Pratinjau (Terkunci)</span>
                                <span>
                                    {is_submitted
                                        ? 'Jawaban Anda telah dikumpulkan secara final dan tidak dapat diubah lagi.'
                                        : 'Batas waktu pengerjaan telah berakhir. Anda tidak dapat lagi mengirim atau mengubah jawaban.'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Questions List */}
                    <div className="space-y-6">
                        {questions.length > 0 ? (
                            questions.map((q, idx) => (
                                <div
                                    key={q.id}
                                    className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                                        <span className="font-headline font-black text-sm uppercase text-on-surface bg-surface-container px-3 py-1 rounded-lg border-2 border-black">
                                            Soal #{idx + 1}
                                        </span>
                                        {q.answer_type === 'code' ? (
                                            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 bg-tertiary-fixed text-black rounded-md border border-black">
                                                Code ({q.programming_language || 'General'})
                                            </span>
                                        ) : q.answer_type === 'file' ? (
                                            <span className="text-xs font-label font-bold uppercase px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-md border border-black">
                                                Upload Berkas
                                            </span>
                                        ) : (
                                            <span className="text-xs font-label font-bold uppercase px-2.5 py-0.5 bg-surface-variant text-outline rounded-md border border-black/20">
                                                Uraian Teks
                                            </span>
                                        )}
                                    </div>

                                    {/* Question Text */}
                                    <div className="font-headline font-bold text-lg text-on-surface leading-relaxed">
                                        {q.description}
                                    </div>

                                    {q.instructions && (
                                        <p className="font-body text-xs text-outline italic bg-surface-container p-3 rounded-xl border border-black/20">
                                            Petunjuk: {q.instructions}
                                        </p>
                                    )}

                                    {/* Answer Input */}
                                    <div className="space-y-2">
                                        <label className="block font-label font-bold text-xs uppercase text-outline">
                                            Jawaban Anda:
                                        </label>
                                        {q.answer_type === 'code' ? (
                                            <textarea
                                                rows={8}
                                                disabled={is_readonly}
                                                value={data.answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                placeholder="// Tuliskan solusi kode Anda di sini..."
                                                className="w-full font-mono text-sm p-4 bg-surface-container border-[3px] border-black rounded-xl focus:outline-none focus:border-tertiary-fixed disabled:opacity-75 disabled:cursor-not-allowed leading-relaxed"
                                            />
                                        ) : q.answer_type === 'file' ? (
                                            <AnswerFileDropzone
                                                questionId={q.id}
                                                preliminaryTaskPeriodId={period.id}
                                                initialValue={data.answers[q.id]}
                                                disabled={is_readonly}
                                                onUploadSuccess={(_fileData, rawJson) => handleAnswerChange(q.id, rawJson)}
                                                onRemove={() => handleAnswerChange(q.id, '')}
                                            />
                                        ) : (
                                            <textarea
                                                rows={6}
                                                disabled={is_readonly}
                                                value={data.answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                placeholder="Tuliskan jawaban Anda secara jelas dan komprehensif..."
                                                className="w-full font-body text-sm p-4 bg-surface-container border-[3px] border-black rounded-xl focus:outline-none focus:border-tertiary-fixed disabled:opacity-75 disabled:cursor-not-allowed leading-relaxed"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl p-10 text-center text-outline">
                                <span className="material-symbols-outlined text-4xl block mb-2">quiz</span>
                                <p className="font-headline font-bold text-lg text-on-surface">Belum ada soal pada modul ini.</p>
                                <p className="text-xs">Asisten belum menambahkan soal untuk Tugas Pendahuluan modul ini.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Floating Action Bar for Draft & Submit */}
            {!is_readonly && questions.length > 0 && (
                <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t-[4px] border-black dark:border-white p-4 md:p-6 z-40 neo-shadow-lg">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-on-surface">
                            <span className="bg-surface-container px-3 py-1.5 rounded-lg border-2 border-black">
                                Terjawab: {answeredCount} dari {questions.length} Soal
                            </span>
                            <span className="text-outline hidden md:inline">
                                Draft disimpan sementara, Submit untuk finalisasi
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-5 py-3 bg-surface-container text-on-surface font-headline font-bold text-xs uppercase rounded-xl border-[3px] border-black neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">save</span>
                                {processing ? 'Menyimpan...' : 'Simpan Draft'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsConfirmSubmitOpen(true)}
                                disabled={processing}
                                className="flex-1 sm:flex-initial px-8 py-3 bg-tertiary-fixed text-black font-headline font-black text-sm uppercase rounded-xl border-[3px] border-black neo-shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                                Kumpulkan Jawaban
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL BEFORE FINAL SUBMIT */}
            {isConfirmSubmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black rounded-2xl max-w-md w-full p-6 neo-shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                            <div className="w-10 h-10 rounded-full bg-tertiary-fixed border-2 border-black flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-black">assignment_turned_in</span>
                            </div>
                            <h3 className="font-headline font-black text-xl uppercase text-on-surface">
                                Kumpulkan Tugas Pendahuluan?
                            </h3>
                        </div>

                        <div className="space-y-3 font-body text-sm leading-relaxed text-on-surface">
                            <p>
                                Anda akan mengumpulkan jawaban untuk <strong className="font-black">{module.title}</strong>.
                            </p>
                            <div className="bg-surface-container p-3 rounded-xl border-2 border-black text-xs font-semibold space-y-1">
                                <div>• Soal terjawab: <strong>{answeredCount} dari {questions.length}</strong></div>
                                <div>• Waktu tersisa: <strong>{formatRemaining(secondsLeft)}</strong></div>
                            </div>
                            <p className="text-xs text-rose-600 font-bold">
                                PERHATIAN: Setelah dikumpulkan, jawaban akan difinalisasi dan tidak dapat diubah lagi!
                            </p>
                        </div>

                        <div className="pt-3 border-t-2 border-black flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmSubmitOpen(false)}
                                className="px-4 py-2 font-label font-bold text-xs uppercase border-2 border-black rounded-xl hover:bg-surface-container"
                            >
                                Periksa Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitFinal}
                                disabled={processing}
                                className="px-6 py-2.5 bg-tertiary-fixed text-black font-label font-black text-xs uppercase border-2 border-black rounded-xl neo-shadow hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">send</span>
                                {processing ? 'Mengirim...' : 'Ya, Kumpulkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
