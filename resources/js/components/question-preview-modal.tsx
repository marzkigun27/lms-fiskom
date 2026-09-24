import React, { useEffect, useState } from 'react';

export interface QuestionPreviewData {
    id?: number | null;
    order_number: number;
    description: string;
    answer_type: 'text' | 'code' | 'file';
    programming_language?: string | null;
    session_type?: 'preliminary' | 'initial_task' | 'journal' | 'independent_task';
    is_required?: boolean;
    module_title?: string;
}

export interface QuestionPreviewModalProps {
    isOpen: boolean;
    question: QuestionPreviewData | null;
    defaultMode?: 'prelab' | 'practicum';
    onClose: () => void;
}

const sessionLabels: Record<string, string> = {
    preliminary: 'Tugas Pendahuluan (TP)',
    initial_task: 'Tugas Awal',
    journal: 'Jurnal',
    independent_task: 'Tugas Akhir',
};

export default function QuestionPreviewModal({
    isOpen,
    question,
    defaultMode,
    onClose,
}: QuestionPreviewModalProps) {
    const [viewMode, setViewMode] = useState<'prelab' | 'practicum'>('prelab');

    useEffect(() => {
        if (!isOpen) return;

        if (defaultMode) {
            setViewMode(defaultMode);
        } else if (question?.session_type === 'preliminary') {
            setViewMode('prelab');
        } else {
            setViewMode('practicum');
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, defaultMode, question?.session_type, onClose]);

    if (!isOpen || !question) return null;

    const sessionLabel = question.session_type
        ? sessionLabels[question.session_type] || question.session_type
        : 'Soal Praktikum';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
        >
            <div
                className="bg-surface-container-lowest border-[4px] border-primary rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col neo-shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary-fixed border-b-[3px] border-primary p-4 md:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border-[2px] border-primary flex items-center justify-center shrink-0 neo-shadow-sm">
                            <span className="material-symbols-outlined text-primary text-2xl">
                                visibility
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                    id="preview-modal-title"
                                    className="font-headline font-black text-lg md:text-xl text-on-primary-fixed uppercase tracking-tight truncate"
                                >
                                    Pratinjau Tampilan Soal di Praktikan
                                </h3>
                                <span className="bg-surface-container-lowest text-on-surface border-[2px] border-primary px-2.5 py-0.5 rounded-full font-label font-bold text-xs uppercase neo-shadow-sm">
                                    {sessionLabel}
                                </span>
                            </div>
                            <p className="font-body text-xs text-on-primary-fixed/80 mt-0.5 truncate">
                                {question.module_title ? `Modul: ${question.module_title} • ` : ''}
                                Nomor Urut #{question.order_number}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg bg-surface-container-lowest border-[2px] border-primary flex items-center justify-center text-on-surface hover:bg-error-container hover:text-error transition-colors neo-shadow-sm shrink-0"
                        title="Tutup (Esc)"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Subheader Controls */}
                <div className="bg-surface-container border-b-[2px] border-primary/20 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-label text-xs font-bold uppercase text-outline">
                            Mode Simulasi:
                        </span>
                        <div className="inline-flex rounded-xl p-1 bg-surface-container-lowest border-[2px] border-primary neo-shadow-sm">
                            <button
                                type="button"
                                onClick={() => setViewMode('prelab')}
                                className={`px-3 py-1 text-xs font-label font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                    viewMode === 'prelab'
                                        ? 'bg-secondary-fixed text-black border border-primary neo-shadow-sm'
                                        : 'text-on-surface hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    assignment
                                </span>
                                Halaman TP
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('practicum')}
                                className={`px-3 py-1 text-xs font-label font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                    viewMode === 'practicum'
                                        ? 'bg-secondary-fixed text-black border border-primary neo-shadow-sm'
                                        : 'text-on-surface hover:text-primary'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    desktop_windows
                                </span>
                                Halaman Praktikum
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-body text-outline">
                        <span className="material-symbols-outlined text-base text-primary">
                            info
                        </span>
                        <span>
                            Karakter baris baru (enter) dan spasi ditampilkan sesuai tampilan praktikan.
                        </span>
                    </div>
                </div>

                {/* Preview Content Area */}
                <div className="p-5 md:p-8 overflow-y-auto flex-1 bg-surface space-y-6">
                    {viewMode === 'prelab' ? (
                        /* Mode Halaman TP (PreLab) */
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="text-xs font-label font-bold uppercase text-outline flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">devices</span>
                                Simulasi Tampilan Halaman Tugas Pendahuluan Praktikan
                            </div>

                            <div className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-2xl p-6 md:p-8 neo-shadow-lg space-y-5">
                                {/* Header bar inside question card */}
                                <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                                    <span className="font-headline font-black text-sm uppercase text-on-surface bg-surface-container px-3 py-1 rounded-lg border-2 border-black">
                                        Soal #{question.order_number}
                                    </span>
                                    {question.answer_type === 'code' ? (
                                        <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 bg-tertiary-fixed text-black rounded-md border border-black">
                                            Code ({question.programming_language || 'General'})
                                        </span>
                                    ) : question.answer_type === 'file' ? (
                                        <span className="text-xs font-label font-bold uppercase px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-md border border-black">
                                            Upload Berkas
                                        </span>
                                    ) : (
                                        <span className="text-xs font-label font-bold uppercase px-2.5 py-0.5 bg-surface-variant text-outline rounded-md border border-black/20">
                                            Uraian Teks
                                        </span>
                                    )}
                                </div>

                                {/* Question Description with faithful newlines and wrapping */}
                                <div className="font-headline font-bold text-lg text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                                    {question.description ? (
                                        question.description
                                    ) : (
                                        <span className="italic text-outline/60 font-normal">
                                            (Isi teks soal masih kosong...)
                                        </span>
                                    )}
                                </div>

                                {/* Simulated Participant Answer Input */}
                                <div className="space-y-2 pt-2 border-t border-black/10">
                                    <label className="block font-label font-bold text-xs uppercase text-outline">
                                        Jawaban Anda:
                                    </label>

                                    {question.answer_type === 'code' ? (
                                        <div className="w-full font-mono text-sm p-4 bg-surface-container border-[3px] border-black rounded-xl text-outline/70 leading-relaxed min-h-[140px] select-none">
                                            // [Simulasi Praktikan] Solusi kode praktikan akan diketikkan di sini...
                                        </div>
                                    ) : question.answer_type === 'file' ? (
                                        <div className="border-[3px] border-dashed border-primary/50 bg-surface-container-lowest rounded-xl p-8 text-center flex flex-col items-center justify-center select-none">
                                            <div className="w-12 h-12 rounded-full bg-secondary-fixed/40 border-[2px] border-primary flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-2xl text-primary">
                                                    cloud_upload
                                                </span>
                                            </div>
                                            <span className="font-headline font-bold text-sm text-primary mb-1">
                                                Pilih berkas atau seret dan lepas di sini
                                            </span>
                                            <span className="font-body text-xs text-outline">
                                                Mendukung file PDF, Gambar JPG, PNG (Maks 10 MB)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="w-full font-body text-sm p-4 bg-surface-container border-[3px] border-black rounded-xl text-outline/70 leading-relaxed min-h-[120px] select-none">
                                            [Simulasi Praktikan] Uraian teks jawaban praktikan akan diketikkan di sini...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Mode Halaman Praktikum (Workspace) */
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="text-xs font-label font-bold uppercase text-outline flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">devices</span>
                                Simulasi Tampilan Lembar Praktikum (Workspace Praktikan)
                            </div>

                            <div className="flex w-full flex-col gap-6">
                                <div className="border-primary mb-2 flex items-start justify-between border-b-[3px] pb-4">
                                    <div className="w-full">
                                        <h2 className="font-headline text-on-surface text-3xl font-bold">
                                            Soal {question.order_number}
                                        </h2>
                                        {/* Question Description with whitespace-pre-wrap break-words */}
                                        <div className="font-body text-outline mt-2 text-lg leading-relaxed whitespace-pre-wrap break-words">
                                            {question.description ? (
                                                question.description
                                            ) : (
                                                <span className="italic text-outline/60">
                                                    (Isi teks soal masih kosong...)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-primary bg-primary-container neo-shadow-lg overflow-hidden rounded-[16px] border-[3px]">
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
                                            <div className="border-[3px] border-dashed border-primary/50 rounded-xl p-8 text-center flex flex-col items-center justify-center select-none">
                                                <div className="w-12 h-12 rounded-full bg-secondary-fixed/40 border-[2px] border-primary flex items-center justify-center mb-3">
                                                    <span className="material-symbols-outlined text-2xl text-primary">
                                                        cloud_upload
                                                    </span>
                                                </div>
                                                <span className="font-headline font-bold text-sm text-primary mb-1">
                                                    Pilih berkas atau seret dan lepas di sini
                                                </span>
                                                <span className="font-body text-xs text-outline">
                                                    Berkas otomatis tersimpan saat diunggah
                                                </span>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="bg-tertiary-container text-on-tertiary-container border-primary neo-shadow font-label flex items-center gap-2 rounded-xl border-[3px] px-6 py-2 text-base font-bold opacity-75 cursor-not-allowed"
                                                >
                                                    Simpan Jawaban
                                                    <span className="material-symbols-outlined text-lg">
                                                        save
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-surface-container-lowest relative p-0">
                                            <div
                                                className={`h-44 w-full p-6 ${
                                                    question.answer_type === 'code'
                                                        ? 'bg-inverse-surface font-mono text-green-400/70'
                                                        : 'font-body bg-surface-container-lowest text-outline/70'
                                                } text-base leading-relaxed select-none`}
                                            >
                                                {question.answer_type === 'code'
                                                    ? '// [Simulasi Praktikan] Editor kode praktikan...'
                                                    : '[Simulasi Praktikan] Jawaban teks praktikan...'}
                                            </div>
                                            <div className="p-4 bg-surface-container border-t border-primary/20 flex justify-end">
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="bg-tertiary-container text-on-tertiary-container border-primary neo-shadow font-label flex items-center gap-2 rounded-xl border-[3px] px-6 py-2 text-base font-bold opacity-75 cursor-not-allowed"
                                                >
                                                    Simpan Jawaban
                                                    <span className="material-symbols-outlined text-lg">
                                                        save
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-surface-container border-t-[3px] border-primary p-4 px-6 flex justify-between items-center gap-3">
                    <span className="font-label text-xs text-outline font-medium hidden sm:inline">
                        Tips: Gunakan tombol Enter (baris baru) di editor untuk memisahkan instruksi atau poin soal.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto bg-surface-container-lowest border-[2px] border-primary text-on-surface font-label font-bold text-sm px-6 py-2.5 rounded-xl neo-shadow-sm hover:bg-secondary-fixed hover:text-black transition-all"
                    >
                        Tutup Pratinjau
                    </button>
                </div>
            </div>
        </div>
    );
}
