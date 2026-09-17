import { Head, useForm, usePage, router } from "@inertiajs/react";
import { useEcho } from "@laravel/echo-react";
import React, { useState } from "react";
import { type User } from "@/types";

interface Grade {
    id: number;
    score?: number;
    tp?: number;
    ta?: number;
    d1?: number;
    d2?: number;
    d3?: number;
    d4?: number;
    i1?: number;
    i2?: number;
    feedback: string | null;
    participant_feedback?: string | null;
}

interface Question {
    id: number;
    title: string;
    content: string;
    points: number;
    module?: { id: number; name: string };
}

interface SessionAnswer {
    question_title: string;
    answer_text: string;
}

interface Submission {
    id: number;
    user: User & {
        identity_number?: string;
        shift?: string;
        kelompok?: string;
    };
    question: Question;
    answer_text: string;
    answers?: Record<string, SessionAnswer[]>;
    is_correct: boolean;
    created_at: string;
    execution_date?: string | null;
    formatted_execution_date?: string | null;
    grade?: Grade | null;
}

interface ModuleOption {
    id: number;
    code?: string;
    title?: string;
    name: string;
}

interface PageProps {
    submissions: Submission[];
    modules?: ModuleOption[];
    selectedModuleId?: number | string;
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

function initials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const avatarColors = [
    "bg-secondary-container",
    "bg-primary-fixed",
    "bg-tertiary-fixed",
    "bg-surface-container-highest",
];

const RUBRIC_INFO: Record<string, { title: string; desc: string }> = {
    tp: { title: "TP", desc: "Tugas Pendahuluan" },
    ta: { title: "TA", desc: "Tugas Awal" },
    d1: { title: "D1", desc: "Pemahaman Teori" },
    d2: { title: "D2", desc: "Prosedur Praktikum" },
    d3: { title: "D3", desc: "Pengolahan Data" },
    d4: { title: "D4", desc: "Analisis & Hasil" },
    i1: { title: "I1", desc: "Mandiri / Kreativitas" },
    i2: { title: "I2", desc: "Tugas Akhir / Kesimpulan" },
};

export default function GradingIndex() {
    const { submissions = [], modules = [], selectedModuleId = "all", flash } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState("");
    const [moduleFilter, setModuleFilter] = useState<string>(String(selectedModuleId));
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        tp: 0,
        ta: 0,
        d1: 0,
        d2: 0,
        d3: 0,
        d4: 0,
        i1: 0,
        i2: 0,
        score: 0,
        feedback: "",
    });

    useEcho("grading", [".SubmissionCreated", ".SubmissionUpdated"], () => {
        router.reload({ only: ["submissions"] });
    });

    const handleModuleChange = (newModuleId: string) => {
        setModuleFilter(newModuleId);
        router.get(
            "/asisten/nilai",
            { module_id: newModuleId },
            { preserveState: true, preserveScroll: true, only: ["submissions", "selectedModuleId"] }
        );
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const matchesSearch =
            sub.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sub.user.identity_number && sub.user.identity_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            sub.question.title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const handleSelect = (submission: Submission) => {
        setSelectedSubmission(submission);
        const tp = submission.grade?.tp || 0;
        const ta = submission.grade?.ta || 0;
        const d1 = submission.grade?.d1 || 0;
        const d2 = submission.grade?.d2 || 0;
        const d3 = submission.grade?.d3 || 0;
        const d4 = submission.grade?.d4 || 0;
        const i1 = submission.grade?.i1 || 0;
        const i2 = submission.grade?.i2 || 0;
        const comp = [tp, ta, d1, d2, d3, d4, i1, i2].filter((v) => v > 0);
        const avg = comp.length > 0 ? Math.round(comp.reduce((a, b) => a + b, 0) / comp.length) : 0;

        setData({
            tp,
            ta,
            d1,
            d2,
            d3,
            d4,
            i1,
            i2,
            score: submission.grade?.score || avg,
            feedback: submission.grade?.feedback || "",
        });
    };

    // Calculate live average score
    const liveCalculatedScore = (() => {
        const comp = [data.tp, data.ta, data.d1, data.d2, data.d3, data.d4, data.i1, data.i2].filter((v) => v > 0);
        return comp.length > 0 ? Math.round(comp.reduce((a, b) => a + b, 0) / comp.length) : 0;
    })();

    const handleGradeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;

        post(`/asisten/nilai/${selectedSubmission.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedSubmission(null);
                reset();
            },
        });
    };

    const getStatus = (sub: Submission) => {
        if (sub.grade && (sub.grade.score ?? 0) > 0) return "graded";
        const hasAnswers = sub.answer_text || (sub.answers && Object.values(sub.answers).some((arr) => arr.length > 0));
        if (!hasAnswers) return "missing";
        return "pending";
    };

    const sessionNames = [
        { key: "TP", label: "Tugas Pendahuluan (TP)" },
        { key: "TA", label: "Tugas Awal (TA)" },
        { key: "Jurnal", label: "Jurnal Praktikum" },
        { key: "Mandiri", label: "Tugas Akhir / Mandiri" },
    ];

    return (
        <>
            <Head title="Penilaian Asisten" />
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
                {/* Page Header */}
                <header className="px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[4px] border-primary bg-surface-container-lowest shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed border-[2px] border-primary rounded-full font-label font-bold text-xs uppercase tracking-widest neo-shadow-sm">
                                Asisten Pengajar
                            </span>
                            <span className="font-label text-sm text-on-surface-variant">
                                Filter: Praktikan Bimbingan Saja
                            </span>
                        </div>
                        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight uppercase">
                            Penilaian Asisten
                        </h1>
                        <p className="font-body text-on-surface-variant mt-1 max-w-2xl text-sm md:text-base">
                            Kelola penilaian nilai rubrik, baca feedback bimbingan praktikan, dan input nilai untuk mahasiswa bimbingan Anda.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="bg-tertiary-fixed border-[3px] border-primary rounded-xl px-4 py-3 neo-shadow flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-tertiary-fixed">check_circle</span>
                            <span className="font-label text-sm font-bold text-on-tertiary-fixed">{flash.success}</span>
                        </div>
                    )}
                </header>

                {/* Filters + Table */}
                <div className="flex-1 overflow-y-auto p-6 bg-surface-container-low hide-scrollbar">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Module Filter */}
                            <div className="flex items-center gap-2">
                                <label className="font-label text-xs font-black uppercase text-on-surface">Modul:</label>
                                <div className="relative">
                                    <select
                                        value={moduleFilter}
                                        onChange={(e) => handleModuleChange(e.target.value)}
                                        className="appearance-none bg-surface-container-lowest border-[3px] border-primary rounded-lg pl-4 pr-10 py-2.5 font-label font-bold text-sm text-on-surface focus:outline-none neo-shadow-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                                    >
                                        <option value="all">Semua Modul Bimbingan</option>
                                        {modules.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.code ? `[${m.code}] ` : ""}{m.title || m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface text-lg">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                                search
                            </span>
                            <input
                                className="w-full bg-surface-container-lowest border-[3px] border-primary rounded-lg pl-10 pr-4 py-2.5 font-body text-on-surface placeholder:text-outline focus:outline-none focus:neo-shadow transition-shadow neo-shadow-sm"
                                placeholder="Cari nama atau NIM praktikan..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl neo-shadow-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b-[3px] border-primary bg-surface-container-high items-center">
                            <div className="col-span-3 font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                Nama Praktikan
                            </div>
                            <div className="col-span-2 font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                NIM
                            </div>
                            <div className="col-span-2 font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                Kelas / Kelompok
                            </div>
                            <div className="col-span-2 font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                Tanggal Pelaksanaan
                            </div>
                            <div className="col-span-2 font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                Status Nilai
                            </div>
                            <div className="col-span-1 text-right font-headline text-base md:text-lg font-bold text-on-surface uppercase tracking-wider">
                                Aksi
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="flex flex-col">
                            {filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub, idx) => {
                                    const status = getStatus(sub);
                                    const isSelected = selectedSubmission?.id === sub.id;
                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => handleSelect(sub)}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b-[3px] border-primary items-center cursor-pointer transition-colors last:border-0 ${
                                                status === "missing" ? "bg-error-container/20 dark:bg-error-container/10" : ""
                                            } ${isSelected ? "bg-primary-fixed/30" : "hover:bg-surface-container-low dark:hover:bg-surface-container-high"}`}
                                        >
                                            {/* Nama */}
                                            <div className="col-span-3 flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full border-[2px] border-primary ${
                                                        avatarColors[idx % avatarColors.length]
                                                    } flex items-center justify-center font-headline font-bold text-sm text-on-surface shrink-0`}
                                                >
                                                    {initials(sub.user.name)}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-label font-bold text-sm text-on-surface truncate">
                                                        {sub.user.name}
                                                    </p>
                                                    {sub.grade?.score !== undefined && sub.grade.score > 0 && (
                                                        <span className="font-body text-xs text-primary font-bold">
                                                            Nilai: {sub.grade.score}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* NIM */}
                                            <div className="col-span-2">
                                                <p className="font-label text-sm text-on-surface-variant font-bold">
                                                    {sub.user.identity_number || "NIM Tidak Ada"}
                                                </p>
                                            </div>

                                            {/* Shift/Kelompok */}
                                            <div className="col-span-2">
                                                <p className="font-label text-sm text-on-surface-variant">
                                                    {sub.user.shift || "Kelas A"} / {sub.user.kelompok || "Kelompok 1"}
                                                </p>
                                            </div>

                                            {/* Tanggal Pelaksanaan */}
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-1.5 text-on-surface font-label font-bold text-sm">
                                                    <span className="material-symbols-outlined text-[18px] text-outline">calendar_today</span>
                                                    <span className="truncate">{sub.formatted_execution_date || "-"}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                {status === "graded" && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-fixed border-[2px] border-primary rounded-full font-label font-bold text-xs text-on-tertiary-fixed neo-shadow-sm">
                                                        <span className="material-symbols-outlined text-[14px]">verified</span>
                                                        Dinilai ({sub.grade?.score ?? 0})
                                                    </div>
                                                )}
                                                {status === "pending" && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-fixed border-[2px] border-primary rounded-full font-label font-bold text-xs text-on-primary-fixed neo-shadow-sm">
                                                        <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                                                        Menunggu
                                                    </div>
                                                )}
                                                {status === "missing" && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-fixed border-[2px] border-primary rounded-full font-label font-bold text-xs text-on-secondary-fixed neo-shadow-sm">
                                                        <span className="material-symbols-outlined text-[14px]">sentiment_dissatisfied</span>
                                                        Belum Mengerjakan
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action */}
                                            <div className="col-span-1 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(sub);
                                                    }}
                                                    className="bg-primary text-on-primary border-[2px] border-primary px-3 py-1.5 rounded-lg font-label font-bold text-xs uppercase neo-shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all whitespace-nowrap"
                                                >
                                                    {status === "graded" ? "Ubah" : "Nilai"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                                    <span className="material-symbols-outlined text-6xl text-outline mb-4">
                                        person_search
                                    </span>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-2 uppercase">
                                        Tidak Ada Praktikan Bimbingan
                                    </h3>
                                    <p className="font-body text-sm text-on-surface-variant max-w-md">
                                        Halaman ini hanya memuat praktikan yang menjadi tanggung jawab bimbingan Anda pada modul terkait. Silakan pilih modul lain atau periksa penugasan jadwal Anda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer count */}
                    <div className="mt-4 flex justify-between items-center text-sm font-label text-on-surface-variant font-bold">
                        <span>Menampilkan {filteredSubmissions.length} praktikan bimbingan</span>
                    </div>

                    {/* Grade Modal */}
                    {selectedSubmission && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-surface-container-lowest border-[4px] border-primary rounded-2xl neo-shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {/* Modal Header */}
                                <div className="p-6 border-b-[4px] border-primary flex justify-between items-start bg-surface-container-low">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-label text-xs uppercase font-black px-2.5 py-0.5 bg-primary-fixed border border-primary rounded-md">
                                                Input & Perbarui Nilai
                                            </span>
                                            <span className="font-label text-xs font-bold text-outline">
                                                NIM: {selectedSubmission.user.identity_number || "-"}
                                            </span>
                                        </div>
                                        <h3 className="font-headline text-2xl font-black text-on-surface">
                                            {selectedSubmission.user.name}
                                        </h3>
                                        <p className="font-label font-bold text-sm text-on-surface-variant mt-0.5">
                                            Modul: {selectedSubmission.question.module?.name || selectedSubmission.question.title}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="text-on-surface-variant hover:text-on-surface p-1.5 border-[2px] border-primary rounded-lg bg-surface-container-lowest neo-shadow-sm hover:neo-shadow transition-all"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto flex-1 bg-surface space-y-8">
                                    {/* Error Alert if any */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="bg-error-container border-[3px] border-error rounded-xl p-4 neo-shadow-sm text-on-error-container">
                                            <div className="flex items-center gap-2 font-bold mb-1">
                                                <span className="material-symbols-outlined">error</span>
                                                Gagal Menyimpan Nilai
                                            </div>
                                            <ul className="list-disc list-inside text-sm">
                                                {Object.values(errors).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Answers Section */}
                                    <div>
                                        <h4 className="font-headline text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            Jawaban Sesi Praktikum
                                        </h4>
                                        <div className="flex flex-col gap-4">
                                            {sessionNames.map((session, index) => {
                                                const answersForSession = selectedSubmission.answers?.[session.key] || [];
                                                const isLegacyMatch = !selectedSubmission.answers && index === 0;
                                                return (
                                                    <div
                                                        key={session.key}
                                                        className="bg-surface-container-lowest border-[3px] border-primary rounded-xl overflow-hidden shadow-sm"
                                                    >
                                                        <div className="bg-surface-container-high px-4 py-2 border-b-[3px] border-primary font-headline font-bold text-sm text-on-surface flex justify-between items-center">
                                                            <span>{session.label}</span>
                                                            <span className="font-label text-xs font-bold text-outline">
                                                                {answersForSession.length} Soal Dijawab
                                                            </span>
                                                        </div>
                                                        <div className="p-4 font-body text-sm text-on-surface whitespace-pre-wrap">
                                                            {answersForSession.length > 0 ? (
                                                                answersForSession.map((ans, i) => (
                                                                    <div key={i} className="mb-4 last:mb-0">
                                                                        <p className="font-label font-bold mb-1 text-primary">
                                                                            {ans.question_title}
                                                                        </p>
                                                                        <div className="bg-surface-container p-3 rounded-lg border-[2px] border-outline-variant font-mono text-xs leading-relaxed">
                                                                            {ans.answer_text}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : isLegacyMatch && selectedSubmission.answer_text ? (
                                                                <div>
                                                                    <p className="font-label font-bold mb-1 text-primary">
                                                                        {selectedSubmission.question?.title}
                                                                    </p>
                                                                    <div className="bg-surface-container p-3 rounded-lg border-[2px] border-outline-variant font-mono text-xs leading-relaxed">
                                                                        {selectedSubmission.answer_text}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-outline italic text-xs">
                                                                    Belum ada jawaban tersimpan untuk {session.label}.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Grade Parameters (Rubric Input) */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                            <h4 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">fact_check</span>
                                                Komponen Penilaian Rubrik (Skala 0 - 100)
                                            </h4>
                                            <div className="bg-primary-container border-[2px] border-primary px-3 py-1 rounded-lg neo-shadow-sm flex items-center gap-2">
                                                <span className="font-label text-xs font-bold uppercase text-on-primary-container">
                                                    Estimasi Nilai Rata-rata:
                                                </span>
                                                <span className="font-headline text-lg font-black text-on-primary-container">
                                                    {liveCalculatedScore}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {["tp", "ta", "d1", "d2", "d3", "d4", "i1", "i2"].map((g) => {
                                                const info = RUBRIC_INFO[g] || { title: g.toUpperCase(), desc: "" };
                                                return (
                                                    <div key={g} className="bg-surface-container p-3 rounded-xl border-[2px] border-primary neo-shadow-sm">
                                                        <label className="block font-label font-black text-sm text-on-surface uppercase mb-0.5">
                                                            {info.title}
                                                        </label>
                                                        <span className="block font-body text-[11px] text-on-surface-variant truncate mb-2">
                                                            {info.desc}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={data[g as keyof typeof data] as number}
                                                            onChange={(e) => {
                                                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                setData(g as any, val);
                                                            }}
                                                            className="w-full bg-surface-container-lowest border-[2px] border-primary rounded-lg px-3 py-2 font-headline font-black text-xl text-center focus:outline-none neo-shadow-sm"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Participant Feedback Section */}
                                    <div>
                                        <h4 className="font-headline text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-500">reviews</span>
                                            Feedback dari Praktikan
                                        </h4>
                                        <div className="bg-surface-container-high border-[2px] border-dashed border-primary rounded-xl p-5 neo-shadow-sm">
                                            {selectedSubmission.grade?.participant_feedback ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 font-label text-sm font-black text-amber-600 dark:text-amber-400">
                                                        <span className="material-symbols-outlined text-xl">star</span>
                                                        Ulasan Praktikan untuk Asisten Pengajar
                                                    </div>
                                                    <p className="font-body text-base text-on-surface italic leading-relaxed">
                                                        "{selectedSubmission.grade.participant_feedback}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-on-surface-variant font-body text-sm italic">
                                                    <span className="material-symbols-outlined text-outline">info</span>
                                                    Praktikan belum mengirimkan feedback untuk modul ini.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t-[4px] border-primary bg-surface-container-low flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                            Catatan / Feedback Asisten untuk Praktikan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.feedback}
                                            onChange={(e) => setData("feedback", e.target.value)}
                                            placeholder="Tuliskan catatan apresiasi atau evaluasi untuk praktikan ini..."
                                            className="w-full bg-surface-container-lowest border-[3px] border-primary rounded-xl px-4 py-3 font-body text-sm focus:outline-none neo-shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGradeSubmit}
                                        disabled={processing}
                                        className="w-full md:w-auto bg-primary text-on-primary border-[3px] border-primary rounded-xl px-8 py-3.5 font-headline font-black text-base neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2 shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-lg">save</span>
                                        {processing ? "Menyimpan Nilai..." : "Simpan Nilai"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
