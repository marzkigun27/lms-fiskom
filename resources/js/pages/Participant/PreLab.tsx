import { Head, useForm } from "@inertiajs/react";
import React, {
    FormEvent,
} from "react"; /* --- MOCK DATA FOR DESIGN PURPOSES --- */
const mockQuestions = [
    {
        id: 1,
        text: "Jelaskan secara singkat perbedaan mendasar antara gesekan statis dan gesekan kinetis beserta contoh penerapannya dalam kehidupan sehari-hari!",
        type: "text",
        points: 20,
    },
    {
        id: 2,
        text: "Gambarkan dan jelaskan diagram gaya bebas pada sebuah balok bermassa m yang diam di atas bidang miring kasar dengan sudut kemiringan theta!",
        type: "text",
        points: 20,
    },
    {
        id: 3,
        text: "Apa yang dimaksud dengan koefisien gesekan statis maksimum (μs) dan faktor apa saja yang mempengaruhinya?",
        type: "text",
        points: 20,
    },
    {
        id: 4,
        text: "Mengapa secara fisis gaya gesekan statis maksimum umumnya selalu bernilai lebih besar dibandingkan dengan gaya gesekan kinetis pada permukaan yang sama?",
        type: "text",
        points: 20,
    },
    {
        id: 5,
        text: "Sebuah balok bermassa 5 kg ditarik dengan gaya horizontal 20 N di atas lantai kasar. Jika koefisien gesekan statis 0.5 dan kinetis 0.3, analisislah apakah balok tersebut akan bergerak atau tetap diam! (Gunakan g = 10 m/s²)",
        type: "text",
        points: 20,
    },
];
/* ------------------------------------- */ export default function ParticipantPreLab() {
    const { data, setData, post, processing } = useForm({
        answers: mockQuestions.reduce((acc, q) => ({ ...acc, [q.id]: "" }), {}),
    });
    const [showModal, setShowModal] = React.useState(false);
    const handleSubmitClick = (e: FormEvent) => {
        e.preventDefault();
        setShowModal(true);
    };
    const confirmSubmit = () => {
        setShowModal(false);
        /* Mock submission */ alert(
            "Jawaban Tugas Pendahuluan berhasil disubmit!",
        );
    };
    return (
        <>
            {" "}
            <Head title="Tugas Pendahuluan" /> {/* Confirmation Modal */}{" "}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    {" "}
                    <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[24px] w-full max-w-md neo-shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {" "}
                        <div className="bg-tertiary-container border-b-[4px] border-primary px-6 py-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-tertiary-container text-3xl">
                                help_center
                            </span>
                            <h2 className="font-headline font-black text-2xl text-on-tertiary-container uppercase tracking-tight">
                                Konfirmasi
                            </h2>{" "}
                        </div>{" "}
                        <div className="p-6 md:p-8 space-y-6">
                            {" "}
                            <p className="font-body text-lg text-on-surface-variant font-bold leading-relaxed">
                                {" "}
                                Apakah Anda yakin ingin mengumpulkan
                                jawaban?{" "}
                            </p>{" "}
                            <p className="font-body text-sm text-outline">
                                {" "}
                                Jawaban tidak dapat diubah lagi setelah
                                disubmit. Pastikan Anda telah memeriksa kembali
                                seluruh jawaban Anda.{" "}
                            </p>{" "}
                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                                {" "}
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-surface-container-lowest text-on-surface-variant border-[3px] border-primary rounded-xl px-6 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                >
                                    {" "}
                                    Periksa Lagi{" "}
                                </button>{" "}
                                <button
                                    type="button"
                                    onClick={confirmSubmit}
                                    className="bg-tertiary-fixed text-on-tertiary-fixed border-[3px] border-primary rounded-xl px-6 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 justify-center"
                                >
                                    {" "}
                                    <span className="material-symbols-outlined text-xl">
                                        send
                                    </span>{" "}
                                    Ya, Kumpulkan{" "}
                                </button>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>
            )}{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                {" "}
                <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    {" "}
                    {/* Header Section */}{" "}
                    <div className="bg-primary-container border-[4px] border-primary rounded-[20px] p-6 md:p-8 neo-shadow-lg text-on-primary-container relative overflow-hidden">
                        {" "}
                        {/* Decorative Circles */}{" "}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-fixed rounded-full opacity-20 blur-xl"></div>{" "}
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-tertiary-container rounded-full opacity-10 blur-xl"></div>{" "}
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                            {" "}
                            <div>
                                {" "}
                                <span className="bg-tertiary-container text-on-tertiary-container font-label font-bold text-xs uppercase px-3 py-1 rounded-full border-[2px] border-primary mb-3 inline-block neo-shadow-sm">
                                    {" "}
                                    Modul 3{" "}
                                </span>{" "}
                                <h1 className="font-headline text-[36px] font-extrabold tracking-tight uppercase leading-none mb-2">
                                    {" "}
                                    Tugas Pendahuluan{" "}
                                </h1>{" "}
                                <p className="font-body text-primary-fixed text-lg font-bold">
                                    {" "}
                                    Koefisien Gesekan Statis & Kinetis{" "}
                                </p>{" "}
                            </div>{" "}
                            <div className="bg-surface-container-lowest text-black border-[3px] border-primary rounded-xl p-4 neo-shadow shrink-0 flex items-center gap-4">
                                {" "}
                                <span className="material-symbols-outlined text-[32px] text-red-500">
                                    timer
                                </span>{" "}
                                <div>
                                    {" "}
                                    <p className="font-label text-xs uppercase font-bold text-outline">
                                        Batas Waktu
                                    </p>{" "}
                                    <p className="font-headline font-black text-xl">
                                        23:59 WIB
                                    </p>{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>{" "}
                    {/* Warning Card */}{" "}
                    <div className="bg-secondary-container border-[3px] border-primary rounded-xl p-4 neo-shadow flex gap-4">
                        {" "}
                        <span className="material-symbols-outlined text-on-secondary-container text-3xl">
                            warning
                        </span>{" "}
                        <p className="font-body text-on-secondary-container font-bold text-sm leading-relaxed">
                            {" "}
                            Pastikan Anda menjawab semua soal dengan bahasa Anda
                            sendiri. Indikasi plagiarisme akan mengakibatkan
                            nilai Tugas Pendahuluan (TP) menjadi 0 tanpa
                            kompensasi. Jawaban tidak dapat diubah setelah
                            disubmit!{" "}
                        </p>{" "}
                    </div>{" "}
                    {/* Questions Form */}{" "}
                    <form onSubmit={handleSubmitClick} className="space-y-8">
                        {" "}
                        {mockQuestions.map((q, index) => (
                            <div
                                key={q.id}
                                className="bg-surface-container-lowest border-[3px] border-primary rounded-[20px] p-6 md:p-8 neo-shadow-md relative transition-transform hover:-translate-y-1 hover:neo-shadow-lg"
                            >
                                {" "}
                                <div className="absolute -left-[3px] -top-[3px] bg-primary-fixed border-[3px] border-primary rounded-br-[20px] rounded-tl-[17px] px-4 py-2 flex flex-col items-center justify-center">
                                    {" "}
                                    <span className="font-label font-bold text-xs uppercase text-on-primary-fixed">
                                        Soal
                                    </span>{" "}
                                    <span className="font-headline font-black text-2xl text-on-primary-fixed leading-none">
                                        {index + 1}
                                    </span>{" "}
                                </div>{" "}
                                <div className="absolute -right-[3px] -top-[3px] bg-surface-container border-[3px] border-primary rounded-bl-[20px] rounded-tr-[17px] px-3 py-1">
                                    {" "}
                                    <span className="font-label font-bold text-xs uppercase text-outline">
                                        {q.points} Poin
                                    </span>{" "}
                                </div>{" "}
                                <div className="pt-10 space-y-4">
                                    {" "}
                                    <p className="font-body text-lg font-bold text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                                        {" "}
                                        {q.text}{" "}
                                    </p>{" "}
                                    <textarea
                                        rows={4}
                                        value={
                                            data.answers[
                                                q.id as keyof typeof data.answers
                                            ] || ""
                                        }
                                        onChange={(e) =>
                                            setData("answers", {
                                                ...data.answers,
                                                [q.id]: e.target.value,
                                            })
                                        }
                                        placeholder="Ketik jawaban Anda di sini..."
                                        className="w-full bg-background border-[3px] border-outline-variant rounded-xl px-5 py-4 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors resize-y min-h-[120px]"
                                        required
                                    />{" "}
                                </div>{" "}
                            </div>
                        ))}{" "}
                        {/* Submit Button (Sticky Bottom or Inline) */}{" "}
                        <div className="flex justify-end pt-4">
                            {" "}
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-tertiary-fixed text-on-tertiary-fixed border-[4px] border-primary rounded-xl px-10 py-4 font-headline font-black text-xl uppercase neo-shadow-md hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {" "}
                                <span className="material-symbols-outlined text-3xl">
                                    task_alt
                                </span>{" "}
                                {processing
                                    ? "Memproses..."
                                    : "Submit Semua Jawaban"}{" "}
                            </button>{" "}
                        </div>{" "}
                    </form>{" "}
                </div>{" "}
            </div>{" "}
        </>
    );
}
