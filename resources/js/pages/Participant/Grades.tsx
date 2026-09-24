import { Head, usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";

const PARAMETERS = ["TP", "TA", "D1", "D2", "D3", "D4", "I1", "I2"];

interface SessionQuestion {
    id: number | string;
    question: string;
    answer: string;
}

interface ModuleSession {
    name: string;
    questions: SessionQuestion[];
}

interface ModuleGradeData {
    id: number;
    code: string;
    order_number: number;
    title: string;
    average_score: number;
    paramScores: Record<string, number>;
    assistant_name: string;
    assistant_feedback: string | null;
    completed_at: string;
    is_completed?: boolean;
    sessions: ModuleSession[];
}

function parseFileAnswer(answerText: string) {
    if (answerText && typeof answerText === 'string' && answerText.trim().startsWith('{') && answerText.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(answerText);
            if (parsed && typeof parsed === 'object' && parsed.path && (parsed.url || parsed.original_name)) {
                return parsed as {
                    original_name: string;
                    mime_type?: string;
                    size_bytes?: number;
                    url?: string;
                };
            }
        } catch {
            return null;
        }
    }
    return null;
}

interface PageProps {
    modules: ModuleGradeData[];
    totalAverage: number;
    letterGrade: string;
    [key: string]: any;
}

export default function ParticipantGrades() {
    const { modules = [], totalAverage = 0, letterGrade = "E" } = usePage<PageProps>().props;

    const [selectedModule, setSelectedModule] = useState<ModuleGradeData | null>(
        modules.length > 0 ? modules[0] : null
    );
    const [chartMode, setChartMode] = useState<"overall" | string>("overall");

    useEffect(() => {
        if (!selectedModule && modules.length > 0) {
            setSelectedModule(modules[0]);
        } else if (selectedModule && modules.length > 0) {
            // Keep selected module in sync if props update
            const updated = modules.find((m) => m.id === selectedModule.id);
            if (updated) {
                setSelectedModule(updated);
            }
        }
    }, [modules]);

    const chartData = modules.map((m) => {
        if (chartMode === "overall") {
            return {
                label: m.code ? `M${m.order_number}` : `M${m.id}`,
                value: m.average_score,
            };
        } else {
            return {
                label: m.code ? `M${m.order_number}` : `M${m.id}`,
                value: m.paramScores[chartMode] || 0,
            };
        }
    });

    const getScoreColor = (score: number) => {
        if (score >= 85) {
            return {
                bg: "bg-tertiary-fixed",
                text: "text-on-tertiary-fixed",
            };
        } else if (score >= 75) {
            return {
                bg: "bg-primary-fixed",
                text: "text-on-primary-fixed",
            };
        } else if (score >= 60) {
            return {
                bg: "bg-tertiary-container",
                text: "text-on-secondary-container",
            };
        } else {
            return {
                bg: "bg-secondary-container",
                text: "text-on-secondary-container",
            };
        }
    };

    return (
        <>
            <Head title="Nilai Praktikum" />
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                <div className="max-w-7xl mx-auto space-y-8 pb-24">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[4px] border-primary pb-6">
                        <div>
                            <h1 className="font-headline text-[32px] font-extrabold text-on-surface tracking-tight uppercase">
                                Nilai Praktikum
                            </h1>
                            <p className="font-body text-outline mt-2 text-[15px] max-w-2xl leading-relaxed">
                                Pantau perkembangan nilai Anda dari modul ke modul. Klik pada modul untuk melihat rincian nilai per parameter beserta jawaban dan catatan asisten pembimbing.
                            </p>
                        </div>

                        {/* Overall Widget */}
                        <div className="bg-tertiary-fixed border-[3px] border-primary rounded-[20px] p-5 neo-shadow flex items-center gap-6 shrink-0">
                            <div>
                                <p className="font-label text-sm uppercase text-on-tertiary-fixed font-bold tracking-wider">
                                    Nilai Rata-rata
                                </p>
                                <p className="font-headline text-3xl font-black text-on-tertiary-fixed mt-1">
                                    {totalAverage}
                                </p>
                            </div>
                            <div className="h-12 w-1 bg-black rounded-full opacity-20"></div>
                            <div>
                                <p className="font-label text-sm uppercase text-on-tertiary-fixed font-bold tracking-wider">
                                    Indeks
                                </p>
                                <p className="font-headline text-3xl font-black text-on-tertiary-fixed mt-1">
                                    {letterGrade}
                                </p>
                            </div>
                        </div>
                    </div>

                    {modules.length === 0 ? (
                        <div className="bg-surface-container-lowest border-[3px] border-primary rounded-[20px] p-12 neo-shadow text-center space-y-3">
                            <span className="material-symbols-outlined text-5xl text-outline">assignment_late</span>
                            <h3 className="font-headline font-black text-xl text-on-surface uppercase">
                                Belum Ada Data Nilai Praktikum
                            </h3>
                            <p className="font-body text-sm text-outline max-w-md mx-auto">
                                Nilai praktikum Anda akan ditampilkan di sini setelah Anda menyelesaikan modul dan dinilai oleh asisten pengajar.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chart Section */}
                            <div className="bg-surface-container-lowest border-[3px] border-primary rounded-[20px] p-6 md:p-8 neo-shadow-md">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <div>
                                        <h2 className="font-headline text-2xl font-bold text-on-surface uppercase">
                                            Grafik Perkembangan
                                        </h2>
                                        <p className="font-body text-sm text-outline mt-1">
                                            Visualisasi nilai per modul praktikum
                                        </p>
                                    </div>
                                    {/* Chart Filter */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setChartMode("overall")}
                                            className={`px-4 py-2 font-label font-bold text-sm uppercase rounded-xl border-[2px] border-primary transition-all ${
                                                chartMode === "overall"
                                                    ? "bg-primary-container text-on-primary-container neo-shadow-sm"
                                                    : "bg-surface-container-lowest text-outline hover:bg-surface-container"
                                            }`}
                                        >
                                            Keseluruhan
                                        </button>
                                        {PARAMETERS.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setChartMode(p)}
                                                className={`px-3 py-2 font-label font-bold text-sm uppercase rounded-xl border-[2px] border-primary transition-all ${
                                                    chartMode === p
                                                        ? "bg-tertiary-container text-on-tertiary-container neo-shadow-sm"
                                                        : "bg-surface-container-lowest text-outline hover:bg-surface-container"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom CSS Bar Chart */}
                                <div className="relative h-64 flex items-end gap-2 sm:gap-4 md:gap-6 border-b-2 border-l-2 border-slate-800 pb-2 pl-2">
                                    {/* Y-Axis labels */}
                                    <div className="absolute -left-8 bottom-0 flex flex-col justify-between h-full font-label text-xs font-bold text-outline py-2">
                                        <span>100</span> <span>50</span> <span>0</span>
                                    </div>
                                    {/* Grid lines */}
                                    <div className="absolute left-0 bottom-1/2 w-full border-t border-dashed border-outline-variant z-0"></div>
                                    <div className="absolute left-0 top-0 w-full border-t border-dashed border-outline-variant z-0"></div>
                                    {/* Bars */}
                                    {chartData.map((data, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 flex flex-col items-center justify-end h-full z-10 relative group"
                                        >
                                            <div className="absolute -top-10 bg-black text-on-primary-container font-label font-bold text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                {data.label}: {data.value}
                                            </div>
                                            <div
                                                className="w-full max-w-[40px] bg-primary-fixed border-2 border-primary rounded-t-lg transition-all duration-500 hover:bg-primary-container"
                                                style={{ height: `${Math.max(data.value, 4)}%` }}
                                            ></div>
                                            <span className="font-label text-xs font-bold text-on-surface-variant mt-3 absolute -bottom-6">
                                                {data.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detail Section: Split Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                                {/* Left: Module List */}
                                <div className="lg:col-span-4 space-y-4">
                                    <h3 className="font-headline text-xl font-bold text-on-surface uppercase flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined">menu_book</span>
                                        Daftar Modul
                                    </h3>
                                    <div className="space-y-3 h-[850px] overflow-y-auto pr-2 hide-scrollbar">
                                        {modules.map((m) => {
                                            const isSelected = selectedModule?.id === m.id;
                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => setSelectedModule(m)}
                                                    className={`p-4 rounded-[16px] border-[3px] border-primary cursor-pointer transition-all ${
                                                        isSelected
                                                            ? "bg-primary-container text-on-primary-container neo-shadow translate-x-1"
                                                            : "bg-surface-container-lowest text-on-surface hover:bg-surface-container hover:neo-shadow hover:-translate-y-1"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-headline font-bold text-lg">
                                                                {m.title.split(":")[0]}
                                                            </h4>
                                                            <p
                                                                className={`font-body text-sm line-clamp-1 ${
                                                                    isSelected
                                                                        ? "text-inverse-on-surface"
                                                                        : "text-outline"
                                                                }`}
                                                            >
                                                                {m.title.includes(":")
                                                                    ? m.title.split(":")[1].trim()
                                                                    : m.title}
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={`font-headline font-black text-xl px-3 py-1 rounded-xl border-[2px] border-primary ${
                                                                isSelected
                                                                    ? "bg-tertiary-container text-on-tertiary-container"
                                                                    : "bg-surface-container text-on-surface-variant"
                                                            }`}
                                                        >
                                                            {m.average_score}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right: Detail Penilaian Modul */}
                                {selectedModule && (
                                    <div className="lg:col-span-8">
                                        <div className="bg-surface-container-lowest border-[3px] border-primary rounded-[20px] p-6 md:p-8 neo-shadow-md flex flex-col h-[850px]">
                                            {/* Header */}
                                            <div className="flex justify-between items-start border-b-[3px] border-primary pb-4 mb-6 shrink-0">
                                                <div>
                                                    <span className="bg-primary-fixed text-on-primary-fixed font-label font-bold text-xs uppercase px-3 py-1 rounded-full border-[2px] border-primary mb-3 inline-block">
                                                        Detail Penilaian Modul
                                                    </span>
                                                    <h2 className="font-headline text-2xl md:text-3xl font-black text-on-surface uppercase">
                                                        {selectedModule.title}
                                                    </h2>
                                                    <p className="font-body text-outline mt-1 text-sm">
                                                        Diselesaikan pada: {selectedModule.completed_at}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-label text-sm font-bold text-outline uppercase">
                                                        Nilai Akhir
                                                    </p>
                                                    <p className="font-headline text-4xl font-black text-on-surface">
                                                        {selectedModule.average_score}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* SCROLLABLE CONTENT AREA */}
                                            <div className="overflow-y-auto flex-1 pr-4 hide-scrollbar space-y-6">
                                                {/* Asisten Pembimbing & Feedback Section */}
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    {/* Asisten Pembimbing Card */}
                                                    <div className="md:col-span-5 bg-surface-container border-[2px] border-primary rounded-xl p-4 neo-shadow-sm flex items-center gap-3.5">
                                                        <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed border-[2px] border-primary flex items-center justify-center font-headline font-black text-lg shrink-0">
                                                            <span className="material-symbols-outlined text-[24px]">school</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-label font-bold text-xs text-outline uppercase tracking-wider block">
                                                                Asisten Pembimbing
                                                            </span>
                                                            <p className="font-headline font-bold text-base text-on-surface truncate mt-0.5">
                                                                {selectedModule.assistant_name || "Belum Ditugaskan"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Catatan / Feedback dari Asisten Card */}
                                                    <div className="md:col-span-7 bg-surface-container border-[2px] border-primary rounded-xl p-4 neo-shadow-sm flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="material-symbols-outlined text-base text-primary">rate_review</span>
                                                            <span className="font-label font-bold text-xs text-outline uppercase tracking-wider">
                                                                Catatan / Feedback Asisten
                                                            </span>
                                                        </div>
                                                        {selectedModule.assistant_feedback ? (
                                                            <p className="font-body text-sm text-on-surface italic font-medium leading-relaxed whitespace-pre-line">
                                                                "{selectedModule.assistant_feedback}"
                                                            </p>
                                                        ) : (
                                                            <p className="font-body text-xs text-outline italic">
                                                                Belum ada catatan dari asisten.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Parameter Scores Row */}
                                                <section>
                                                    <h3 className="font-label font-bold text-on-surface uppercase tracking-wider mb-3 border-l-4 border-primary pl-3">
                                                        Rekap Parameter Nilai
                                                    </h3>
                                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                                        {PARAMETERS.map((p) => {
                                                            const score = selectedModule.paramScores[p] ?? 0;
                                                            const color = getScoreColor(score);
                                                            return (
                                                                <div
                                                                    key={p}
                                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-[2px] border-primary neo-shadow-sm ${color.bg} ${color.text}`}
                                                                >
                                                                    <span className="font-headline font-black text-lg">
                                                                        {p}
                                                                    </span>
                                                                    <span className="font-label font-bold text-sm mt-1">
                                                                        {score}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>

                                                {/* Sessions and Answers */}
                                                <section>
                                                    <h3 className="font-label font-bold text-on-surface uppercase tracking-wider mb-4 border-l-4 border-secondary-fixed pl-3">
                                                        Riwayat Jawaban
                                                    </h3>
                                                    {selectedModule.sessions.length === 0 ? (
                                                        <div className="bg-surface-container border-[2px] border-primary border-dashed rounded-[16px] p-8 text-center text-outline neo-shadow-sm flex flex-col items-center justify-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-surface-container-high border-[2px] border-primary flex items-center justify-center text-outline">
                                                                <span className="material-symbols-outlined text-2xl">lock_clock</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-headline font-bold text-base text-on-surface uppercase">
                                                                    Sesi Modul Belum Selesai
                                                                </p>
                                                                <p className="font-body text-xs text-outline mt-1 max-w-md mx-auto">
                                                                    Soal-soal dan riwayat jawaban untuk modul ini belum dapat ditampilkan karena sesi belum selesai dilaksanakan.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {selectedModule.sessions.map((session, sIdx) => (
                                                                <div
                                                                    key={sIdx}
                                                                    className="bg-surface-container border-[2px] border-primary rounded-[16px] overflow-hidden"
                                                                >
                                                                    <div className="bg-primary-container text-on-primary-container px-5 py-3 border-b-[2px] border-primary">
                                                                        <h4 className="font-headline font-bold text-lg uppercase tracking-tight">
                                                                            {session.name}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="p-5 space-y-5">
                                                                        {session.questions.map((q, qIdx) => {
                                                                            const fileData = parseFileAnswer(q.answer);
                                                                            return (
                                                                                <div key={q.id} className="relative">
                                                                                    <div className="flex gap-4">
                                                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-tertiary-container border-[2px] border-primary flex items-center justify-center font-headline font-black text-sm text-on-tertiary-container mt-1">
                                                                                            {qIdx + 1}
                                                                                        </div>
                                                                                        <div className="flex-1 space-y-2">
                                                                                            <p className="font-label font-bold text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                                                                                                {q.question}
                                                                                            </p>
                                                                                            <div className="bg-surface-container-lowest border-[2px] border-primary rounded-xl p-4 neo-shadow-sm">
                                                                                                {fileData ? (
                                                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                                                                                            <span className="material-symbols-outlined text-primary text-2xl shrink-0">
                                                                                                                {fileData.original_name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                                                                                                            </span>
                                                                                                            <span className="font-headline font-bold text-sm text-on-surface truncate max-w-xs md:max-w-md" title={fileData.original_name}>
                                                                                                                {fileData.original_name}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        {fileData.url && (
                                                                                                            <a
                                                                                                                href={fileData.url}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className="bg-primary text-on-primary border-[2px] border-primary px-3 py-1 rounded-lg font-label text-xs font-bold uppercase flex items-center justify-center gap-1 neo-shadow-sm hover:neo-shadow transition-all shrink-0 self-start sm:self-auto"
                                                                                                            >
                                                                                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                                                                                Buka Berkas
                                                                                                            </a>
                                                                                                        )}
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                                                                                                        {q.answer}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {qIdx < session.questions.length - 1 && (
                                                                                        <div className="border-t-2 border-dashed border-outline-variant mt-5 ml-12"></div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </section>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
