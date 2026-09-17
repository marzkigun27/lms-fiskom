import { Head, router, usePage } from "@inertiajs/react";
import React from "react";

declare const route: any;

interface User {
    id: number;
    name: string;
}

interface Module {
    id: number;
    code: string;
    title: string;
}

interface FeedbackItem {
    id: number;
    sender_id: number;
    feedback_type: "general" | "personal";
    target_assistant_id: number | null;
    module_id: number | null;
    rating?: number | null;
    content: string;
    is_anonymous_to_target: boolean;
    status: "submitted" | "reviewed" | "archived";
    created_at: string;
    sender: User | null;
    module: Module | null;
    target_assistant: User | null;
}

export default function FeedbackIndex() {
    const { feedbackItems } = usePage<{ feedbackItems: FeedbackItem[] }>().props;

    const generalFeedbacks = feedbackItems.filter(
        (item) => item.feedback_type === "general"
    );
    const personalFeedbacks = feedbackItems.filter(
        (item) => item.feedback_type === "personal"
    );

    const handleUpdateStatus = (id: number, status: string) => {
        router.patch(
            route("assistant.feedback.update", id),
            { status },
            { preserveScroll: true }
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <>
            {" "}
            <Head title="Feedback Praktikan" />{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                {" "}
                <div className="max-w-7xl mx-auto space-y-8 pb-32">
                    {" "}
                    {/* Page Header */}{" "}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[4px] border-primary pb-6">
                        {" "}
                        <div>
                            {" "}
                            <h1 className="font-headline text-[32px] font-extrabold text-on-surface tracking-tight uppercase">
                                {" "}
                                Feedback Praktikan{" "}
                            </h1>{" "}
                            <p className="font-body text-outline mt-2 text-[15px] max-w-3xl leading-relaxed">
                                {" "}
                                Ulasan, rating kepuasan, dan saran terverifikasi
                                dari mahasiswa terkait modul praktikum
                                computational physics serta bimbingan asisten
                                laboratorium.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="bg-tertiary-fixed border-[3px] border-primary px-4 py-2 rounded-xl neo-shadow font-headline font-black text-xl text-on-tertiary-fixed transform rotate-2">
                            {" "}
                            Total {feedbackItems.length} Ulasan{" "}
                        </div>{" "}
                    </div>{" "}
                    {/* Main Grid */}{" "}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {" "}
                        {/* COLUMN 1: Praktikum */}{" "}
                        <div className="space-y-6">
                            {" "}
                            {/* Column Header Card */}{" "}
                            <div className="bg-primary-container border-[4px] border-primary rounded-[20px] p-6 text-on-primary-container neo-shadow-lg flex flex-col justify-between h-[160px] relative overflow-hidden group">
                                {" "}
                                <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    {" "}
                                    <span className="material-symbols-outlined text-[150px]">
                                        menu_book
                                    </span>{" "}
                                </div>{" "}
                                <div className="flex justify-between items-start relative z-10">
                                    {" "}
                                    <div className="flex items-center gap-3">
                                        {" "}
                                        <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border-[3px] border-primary flex items-center justify-center text-on-primary-container neo-shadow">
                                            {" "}
                                            <span className="material-symbols-outlined text-[24px]">
                                                menu_book
                                            </span>{" "}
                                        </div>{" "}
                                        <h2 className="font-headline text-xl font-black uppercase tracking-tight">
                                            Feedback Umum
                                            <br />
                                            (Materi & Modul)
                                        </h2>{" "}
                                    </div>{" "}
                                    <div className="font-headline bg-primary-fixed border-[3px] border-primary text-on-primary-fixed text-sm font-black px-4 py-2 rounded-xl text-center leading-tight neo-shadow">
                                        {" "}
                                        {generalFeedbacks.length}
                                        <br />
                                        Ulasan{" "}
                                    </div>{" "}
                                </div>{" "}
                                <p className="font-body text-inverse-on-surface text-sm leading-relaxed pr-8 relative z-10 font-medium">
                                    {" "}
                                    Ulasan mengenai modul eksperimen, kejernihan
                                    instruksi lab, dan environment coding.{" "}
                                </p>{" "}
                            </div>{" "}
                            {generalFeedbacks.length === 0 ? (
                                <div className="bg-surface-container-lowest border-[4px] border-primary border-dashed rounded-[20px] p-8 text-center text-outline font-headline font-bold uppercase">
                                    Belum ada feedback umum.
                                </div>
                            ) : (
                                generalFeedbacks.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-6 neo-shadow-md space-y-4 hover:-translate-y-1 transition-transform flex flex-col"
                                    >
                                        {" "}
                                        <div className="flex justify-between items-start border-b-2 border-primary pb-4">
                                            {" "}
                                            <div>
                                                {" "}
                                                <h3 className="font-headline font-black text-on-surface text-lg uppercase tracking-tight">
                                                    {item.module
                                                        ? `Modul ${item.module.code} - ${item.module.title}`
                                                        : "Feedback Umum"}
                                                </h3>{" "}
                                                <div className="font-label text-xs font-bold text-outline mt-1 flex items-center gap-2 uppercase tracking-wider flex-wrap">
                                                    <span className="text-on-surface">
                                                        {item.is_anonymous_to_target
                                                            ? "Anonim"
                                                            : item.sender?.name ||
                                                              "Praktikan"}
                                                    </span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                                    <span>
                                                        {formatDate(
                                                            item.created_at
                                                        )}
                                                    </span>
                                                    {item.rating && (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                                            <span className="bg-tertiary-fixed border border-primary text-on-tertiary-fixed font-black text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                                {item.rating}/5
                                                            </span>
                                                        </>
                                                    )}
                                                </div>{" "}
                                            </div>{" "}
                                            <div
                                                className={`flex items-center gap-1 border-2 border-primary px-3 py-1.5 rounded-lg font-black text-sm font-headline neo-shadow-sm transform rotate-2 ${item.status === "reviewed" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container text-outline"}`}
                                            >
                                                {" "}
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {item.status === "reviewed"
                                                        ? "check_circle"
                                                        : "pending"}
                                                </span>{" "}
                                                <span className="uppercase">
                                                    {item.status}
                                                </span>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                        <p className="font-body text-on-surface-variant text-base leading-relaxed font-medium whitespace-pre-wrap flex-grow">
                                            {" "}
                                            "{item.content}"{" "}
                                        </p>{" "}
                                        <div className="flex justify-end items-end pt-4 border-t border-outline-variant">
                                            {" "}
                                            {item.status !== "reviewed" && (
                                                <button
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            item.id,
                                                            "reviewed"
                                                        )
                                                    }
                                                    className="bg-primary-container text-on-primary-container border-[2px] border-primary px-4 py-2 rounded-xl font-label font-bold text-xs uppercase hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 neo-shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        done_all
                                                    </span>
                                                    Tandai Telah Dibaca
                                                </button>
                                            )}
                                        </div>{" "}
                                    </div>
                                ))
                            )}{" "}
                        </div>{" "}
                        {/* COLUMN 2: Khusus di Luar Praktikum */}{" "}
                        <div className="space-y-6">
                            {" "}
                            {/* Column Header Card */}{" "}
                            <div className="bg-tertiary-container border-[4px] border-primary rounded-[20px] p-6 text-on-surface neo-shadow-lg flex flex-col justify-between h-[160px] relative overflow-hidden group">
                                {" "}
                                <div className="absolute -right-10 -top-10 opacity-20 group-hover:scale-110 transition-transform duration-500 text-on-secondary-container">
                                    {" "}
                                    <span className="material-symbols-outlined text-[150px]">
                                        forum
                                    </span>{" "}
                                </div>{" "}
                                <div className="flex justify-between items-start relative z-10">
                                    {" "}
                                    <div className="flex items-center gap-3">
                                        {" "}
                                        <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border-[3px] border-primary flex items-center justify-center text-on-secondary-container neo-shadow">
                                            {" "}
                                            <span className="material-symbols-outlined text-[24px]">
                                                forum
                                            </span>{" "}
                                        </div>{" "}
                                        <h2 className="font-headline text-xl font-black uppercase tracking-tight text-on-secondary-container">
                                            Feedback Khusus
                                            <br />
                                            (Layanan Asisten)
                                        </h2>{" "}
                                    </div>{" "}
                                    <div className="font-headline bg-secondary-container border-[3px] border-primary text-on-secondary-container text-sm font-black px-4 py-2 rounded-xl text-center leading-tight neo-shadow">
                                        {" "}
                                        {personalFeedbacks.length}
                                        <br />
                                        Ulasan{" "}
                                    </div>{" "}
                                </div>{" "}
                                <p className="font-body text-on-secondary-container text-sm leading-relaxed pr-8 relative z-10 font-bold">
                                    {" "}
                                    Ulasan terkait komunikasi, konsultasi
                                    (office hours), keramahan, dan bimbingan di
                                    luar jadwal.{" "}
                                </p>{" "}
                            </div>{" "}
                            {personalFeedbacks.length === 0 ? (
                                <div className="bg-surface-container-lowest border-[4px] border-primary border-dashed rounded-[20px] p-8 text-center text-outline font-headline font-bold uppercase">
                                    Belum ada feedback personal.
                                </div>
                            ) : (
                                personalFeedbacks.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-6 neo-shadow-md space-y-4 hover:-translate-y-1 transition-transform flex flex-col"
                                    >
                                        {" "}
                                        <div className="flex justify-between items-start border-b-2 border-primary pb-4">
                                            {" "}
                                            <div className="flex-1 pr-4">
                                                {" "}
                                                <div className="flex items-center gap-2 flex-wrap mb-2 font-label">
                                                    <span className="bg-secondary-container border-2 border-primary text-on-secondary-container font-bold text-[11px] px-2 py-1 rounded-md uppercase tracking-wider neo-shadow-sm">
                                                        Untuk:{" "}
                                                        {item.target_assistant
                                                            ?.name || "Asisten"}
                                                    </span>
                                                    {item.module && (
                                                        <span className="bg-surface-container border-2 border-primary text-on-surface font-bold text-[11px] px-2 py-1 rounded-md uppercase tracking-wider neo-shadow-sm">
                                                            Modul {item.module.code}
                                                        </span>
                                                    )}
                                                    {item.rating && (
                                                        <span className="bg-tertiary-fixed border-2 border-primary text-on-tertiary-fixed font-black text-[11px] px-2 py-1 rounded-md uppercase tracking-wider neo-shadow-sm flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            {item.rating}/5
                                                        </span>
                                                    )}
                                                </div>{" "}
                                                <div className="font-label text-xs font-bold text-outline flex items-center gap-2 uppercase tracking-wider">
                                                    {" "}
                                                    <span className="text-on-surface">
                                                        {item.is_anonymous_to_target
                                                            ? "Anonim"
                                                            : item.sender?.name ||
                                                              "Praktikan"}
                                                    </span>{" "}
                                                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>{" "}
                                                    <span>
                                                        {formatDate(
                                                            item.created_at
                                                        )}
                                                    </span>{" "}
                                                </div>{" "}
                                            </div>{" "}
                                            <div
                                                className={`flex items-center gap-1 border-2 border-primary px-3 py-1.5 rounded-lg font-black text-sm font-headline neo-shadow-sm transform rotate-1 ${item.status === "reviewed" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container text-outline"}`}
                                            >
                                                {" "}
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {item.status === "reviewed"
                                                        ? "check_circle"
                                                        : "pending"}
                                                </span>{" "}
                                                <span className="uppercase">
                                                    {item.status}
                                                </span>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                        <p className="font-body text-on-surface-variant text-base leading-relaxed font-medium whitespace-pre-wrap flex-grow">
                                            {" "}
                                            "{item.content}"{" "}
                                        </p>{" "}
                                        <div className="flex justify-end items-end pt-4 border-t border-outline-variant">
                                            {" "}
                                            {item.status !== "reviewed" && (
                                                <button
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            item.id,
                                                            "reviewed"
                                                        )
                                                    }
                                                    className="bg-primary-container text-on-primary-container border-[2px] border-primary px-4 py-2 rounded-xl font-label font-bold text-xs uppercase hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2 neo-shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        done_all
                                                    </span>
                                                    Tandai Telah Dibaca
                                                </button>
                                            )}
                                        </div>{" "}
                                    </div>
                                ))
                            )}{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
                {/* Bottom Floating Bar */}{" "}
                <div className="fixed bottom-6 left-6 md:left-[280px] right-6 z-10 flex justify-center pointer-events-none">
                    {" "}
                    <div className="bg-surface-container-lowest border-[4px] border-primary p-6 rounded-[24px] neo-shadow-lg flex flex-col xl:flex-row items-center justify-between gap-6 pointer-events-auto max-w-5xl w-full">
                        {" "}
                        <div className="flex items-center gap-5">
                            {" "}
                            <div className="w-14 h-14 rounded-2xl bg-primary-container border-[3px] border-primary flex items-center justify-center text-on-primary-container shrink-0 neo-shadow transform -rotate-3">
                                {" "}
                                <span className="material-symbols-outlined text-[28px]">
                                    summarize
                                </span>{" "}
                            </div>{" "}
                            <div>
                                {" "}
                                <h4 className="font-headline font-black text-on-surface text-lg uppercase tracking-tight">
                                    Tindak Lanjut & Evaluasi
                                </h4>{" "}
                                <p className="font-body text-[15px] text-outline font-medium max-w-2xl mt-1">
                                    {" "}
                                    Rangkuman saran diagregasi otomatis. Gunakan
                                    menu ini untuk mengekspor data laporan ke
                                    PDF atau membagikannya ke Tim Koordinator
                                    Asisten.{" "}
                                </p>{" "}
                            </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-4 shrink-0 w-full xl:w-auto">
                            {" "}
                            <button className="flex-1 xl:flex-none bg-surface-container-lowest border-[3px] border-primary text-on-surface px-6 py-3 rounded-xl font-headline font-black text-sm uppercase hover:-translate-y-1 hover:neo-shadow transition-all flex justify-center items-center gap-2">
                                {" "}
                                <span className="material-symbols-outlined text-lg">
                                    download
                                </span>{" "}
                                Unduh Laporan{" "}
                            </button>{" "}
                            <button className="flex-1 xl:flex-none bg-secondary-container text-on-secondary-container border-[3px] border-primary px-6 py-3 rounded-xl font-headline font-black text-sm uppercase hover:-translate-y-1 hover:neo-shadow transition-all flex justify-center items-center gap-2">
                                {" "}
                                <span className="material-symbols-outlined text-lg">
                                    send
                                </span>{" "}
                                Share ke Koordinator{" "}
                            </button>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
        </>
    );
}
