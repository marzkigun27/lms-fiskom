import { Head, useForm, usePage } from "@inertiajs/react";
import React, { FormEvent } from "react";

declare const route: any;

interface Module {
    id: number;
    code: string;
    title: string;
}
interface Assistant {
    id: number;
    name: string;
}
export default function ParticipantFeedback() {
    const { modules, assistants, flash } = usePage<{
        modules: Module[];
        assistants: Assistant[];
        flash: { success?: string };
    }>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        feedback_type: "general" as "general" | "personal",
        module_id: "",
        target_assistant_id: "",
        rating: 5,
        content: "",
        is_anonymous_to_target: false,
    });
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route("participant.feedback.store"), {
            onSuccess: () => {
                reset(
                    "content",
                    "module_id",
                    "target_assistant_id",
                    "rating",
                    "is_anonymous_to_target",
                );
            },
        });
    };
    return (
        <>
            {" "}
            <Head title="Kirim Feedback" />{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                {" "}
                <div className="max-w-4xl mx-auto space-y-8 pb-24">
                    {" "}
                    {/* Header Section */}{" "}
                    <div>
                        {" "}
                        <h1 className="font-headline text-[32px] font-extrabold text-on-surface tracking-tight uppercase">
                            {" "}
                            Kirim Feedback{" "}
                        </h1>{" "}
                        <p className="font-body text-outline mt-2 text-[15px] max-w-3xl leading-relaxed">
                            {" "}
                            Bantu kami meningkatkan kualitas modul dan bimbingan
                            dengan memberikan ulasan, saran, atau masukan yang
                            konstruktif.{" "}
                        </p>{" "}
                    </div>{" "}
                    {/* Success Flash Message */}{" "}
                    {flash?.success && (
                        <div className="bg-tertiary-fixed border-[3px] border-primary rounded-xl p-4 neo-shadow flex items-center gap-3">
                            {" "}
                            <span className="material-symbols-outlined text-on-tertiary-fixed text-2xl">
                                check_circle
                            </span>{" "}
                            <p className="font-label font-bold text-on-tertiary-fixed text-sm uppercase">
                                {" "}
                                {flash.success}{" "}
                            </p>{" "}
                        </div>
                    )}{" "}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {" "}
                        {/* Info Column */}{" "}
                        <div className="md:col-span-1 space-y-6">
                            {" "}
                            <div className="bg-primary-container rounded-[20px] p-6 text-on-primary-container shadow-sm flex flex-col justify-between">
                                {" "}
                                <div className="flex items-center gap-3 mb-4">
                                    {" "}
                                    <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center text-primary-fixed">
                                        {" "}
                                        <span className="material-symbols-outlined">
                                            lightbulb
                                        </span>{" "}
                                    </div>{" "}
                                    <h2 className="font-headline text-lg font-bold">
                                        Panduan Feedback
                                    </h2>{" "}
                                </div>{" "}
                                <div className="space-y-4 font-body text-inverse-on-surface text-sm leading-relaxed">
                                    {" "}
                                    <p>
                                        {" "}
                                        <strong className="text-on-primary-container">
                                            Feedback Umum:
                                        </strong>{" "}
                                        Gunakan untuk ulasan modul, kendala
                                        server, waktu pengerjaan, atau materi
                                        eksperimen.{" "}
                                    </p>{" "}
                                    <p>
                                        {" "}
                                        <strong className="text-tertiary-fixed">
                                            Feedback Personal:
                                        </strong>{" "}
                                        Gunakan untuk memberi apresiasi atau
                                        saran komunikasi kepada asisten
                                        tertentu.{" "}
                                    </p>{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                        {/* Form Column */}{" "}
                        <div className="md:col-span-2">
                            {" "}
                            <form
                                onSubmit={handleSubmit}
                                className="bg-surface-container-lowest border-[3px] border-primary rounded-[20px] p-6 md:p-8 neo-shadow-md space-y-6"
                            >
                                {" "}
                                {/* Type Tabs */}{" "}
                                <div className="flex gap-4 border-b-2 border-outline-variant pb-4">
                                    {" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData("feedback_type", "general")
                                        }
                                        className={`flex-1 py-3 rounded-xl font-label font-bold text-sm uppercase border-[2px] border-primary transition-all ${data.feedback_type === "general" ? "bg-primary-fixed text-on-primary-fixed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-surface-container-lowest text-outline hover:bg-surface-container"}`}
                                    >
                                        {" "}
                                        Feedback Umum{" "}
                                    </button>{" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData("feedback_type", "personal")
                                        }
                                        className={`flex-1 py-3 rounded-xl font-label font-bold text-sm uppercase border-[2px] border-primary transition-all ${data.feedback_type === "personal" ? "bg-tertiary-container text-on-tertiary-container shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-surface-container-lowest text-outline hover:bg-surface-container"}`}
                                    >
                                        {" "}
                                        Feedback Personal{" "}
                                    </button>{" "}
                                </div>{" "}
                                {/* Dynamic Field: Module or Assistant */}{" "}
                                <div className="space-y-2">
                                    {" "}
                                    <label className="font-label font-bold text-sm text-on-surface uppercase">
                                        {" "}
                                        {data.feedback_type === "general"
                                            ? "Terkait Modul Apa?"
                                            : "Pilih Asisten"}{" "}
                                    </label>{" "}
                                    {data.feedback_type === "general" ? (
                                        <select
                                            value={data.module_id}
                                            onChange={(e) =>
                                                setData(
                                                    "module_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-background border-[2px] border-outline-variant rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                                        >
                                            {" "}
                                            <option value="">
                                                -- Pilih Modul (Opsional) --
                                            </option>{" "}
                                            {modules.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {" "}
                                                    Modul {m.code} -{" "}
                                                    {m.title}{" "}
                                                </option>
                                            ))}{" "}
                                        </select>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <select
                                                    value={data.target_assistant_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            "target_assistant_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`w-full bg-background border-[2px] ${errors.target_assistant_id ? "border-red-500" : "border-outline-variant"} rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors`}
                                                >
                                                    <option value="">
                                                        -- Wajib Pilih Asisten Pembimbing --
                                                    </option>
                                                    {assistants.map((a) => (
                                                        <option key={a.id} value={a.id}>
                                                            Kak {a.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.target_assistant_id && (
                                                    <p className="text-red-500 text-sm font-label mt-1">
                                                        {errors.target_assistant_id}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="font-label font-bold text-xs text-outline uppercase block mb-1">
                                                    Terkait Modul Praktikum (Opsional)
                                                </label>
                                                <select
                                                    value={data.module_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            "module_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-background border-[2px] border-outline-variant rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                                                >
                                                    <option value="">
                                                        -- Pilih Modul (Opsional) --
                                                    </option>
                                                    {modules.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            Modul {m.code} - {m.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="font-label font-bold text-xs text-outline uppercase block mb-2">
                                                    Rating Kinerja Asisten (1 - 5)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setData("rating", star)}
                                                            className={`w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center transition-all ${
                                                                star <= data.rating
                                                                    ? "bg-tertiary-fixed text-on-tertiary-fixed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                                                                    : "bg-surface text-outline hover:bg-surface-container"
                                                            }`}
                                                        >
                                                            <span
                                                                className="material-symbols-outlined text-xl"
                                                                style={{
                                                                    fontVariationSettings:
                                                                        star <= data.rating ? "'FILL' 1" : "'FILL' 0",
                                                                }}
                                                            >
                                                                star
                                                            </span>
                                                        </button>
                                                    ))}
                                                    <span className="font-headline font-black text-lg ml-2 text-on-surface">
                                                        {data.rating}/5
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>{" "}
                                {/* Content */}{" "}
                                <div className="space-y-2">
                                    {" "}
                                    <label className="font-label font-bold text-sm text-on-surface uppercase">
                                        {" "}
                                        Isi Ulasan / Pesan{" "}
                                    </label>{" "}
                                    <textarea
                                        rows={5}
                                        value={data.content}
                                        onChange={(e) =>
                                            setData("content", e.target.value)
                                        }
                                        placeholder={
                                            data.feedback_type === "general"
                                                ? "Ceritakan pengalaman mengerjakan modul, waktu yang diberikan, atau materi yang sulit dipahami..."
                                                : "Berikan ucapan terima kasih, kritik membangun, atau saran cara mengajar..."
                                        }
                                        className={`w-full bg-background border-[2px] ${errors.content ? "border-red-500" : "border-outline-variant"} rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors resize-none`}
                                    />{" "}
                                    {errors.content && (
                                        <p className="text-red-500 text-sm font-label mt-1">
                                            {errors.content}
                                        </p>
                                    )}{" "}
                                </div>{" "}
                                {/* Anonymous Switch */}{" "}
                                <div className="flex items-center gap-3 bg-surface-container border border-outline-variant p-4 rounded-xl">
                                    {" "}
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={data.is_anonymous_to_target}
                                        onChange={(e) =>
                                            setData(
                                                "is_anonymous_to_target",
                                                e.target.checked,
                                            )
                                        }
                                        className="w-5 h-5 rounded border-[2px] border-primary text-black focus:ring-black"
                                    />{" "}
                                    <div className="flex flex-col">
                                        {" "}
                                        <label
                                            htmlFor="anonymous"
                                            className="font-headline font-bold text-[15px] text-on-surface cursor-pointer"
                                        >
                                            {" "}
                                            Kirim sebagai Anonim{" "}
                                        </label>{" "}
                                        <span className="font-body text-xs text-outline">
                                            {" "}
                                            Identitas Anda akan disembunyikan
                                            dari asisten, namun tercatat secara
                                            sistem oleh admin.{" "}
                                        </span>{" "}
                                    </div>{" "}
                                </div>{" "}
                                {/* Submit Action */}{" "}
                                <div className="pt-4 flex justify-end">
                                    {" "}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-primary-container text-on-primary-container border-[3px] border-primary rounded-xl px-8 py-3 font-label font-bold text-[15px] uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {" "}
                                        <span className="material-symbols-outlined text-[20px]">
                                            send
                                        </span>{" "}
                                        {processing
                                            ? "Mengirim..."
                                            : "Kirim Feedback"}{" "}
                                    </button>{" "}
                                </div>{" "}
                            </form>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
        </>
    );
}
