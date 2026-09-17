import { Head, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface CategoryItem {
    id: number;
    name: string;
    description: string | null;
    order_number: number;
}

interface AssistantItem {
    id: number;
    name: string;
    identity_number: string;
    avatar: string;
}

interface Props {
    period: {
        id: number;
        title: string;
        opens_at: string;
        closes_at: string;
        opens_at_formatted: string;
        closes_at_formatted: string;
        is_ongoing: boolean;
        computed_status: 'not_started' | 'ongoing' | 'closed';
        status_label: string;
    };
    categories: CategoryItem[];
    assistants: AssistantItem[];
    my_votes: Record<number, number>;
}

export default function ParticipantVoting({ period, categories, assistants, my_votes }: Props) {
    const { flash } = usePage().props as any;

    const [activeCategoryId, setActiveCategoryId] = useState<number>(categories[0]?.id || 0);
    const [votes, setVotes] = useState<Record<number, number>>(my_votes || {});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        categoryId: number;
        assistantId: number | null;
    }>({ isOpen: false, categoryId: 0, assistantId: null });

    const [submitModal, setSubmitModal] = useState(false);

    const handleSelectAssistant = (assistantId: number) => {
        if (!period.is_ongoing) return;
        setConfirmModal({
            isOpen: true,
            categoryId: activeCategoryId,
            assistantId,
        });
    };

    const confirmVote = () => {
        if (confirmModal.assistantId && confirmModal.categoryId) {
            setVotes((prev) => ({
                ...prev,
                [confirmModal.categoryId]: confirmModal.assistantId!,
            }));
        }
        setConfirmModal({ isOpen: false, categoryId: 0, assistantId: null });
    };

    const handleSubmitAll = () => {
        setSubmitModal(true);
    };

    const confirmSubmitAll = () => {
        setIsSubmitting(true);
        router.post(
            '/praktikan/voting',
            { votes },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setSubmitModal(false);
                },
            }
        );
    };

    const currentCategoryDetails = categories.find((c) => c.id === activeCategoryId) || categories[0];
    const totalCategoriesCount = categories.length || 1;
    const answeredCount = Object.keys(votes).length;
    const progress = Math.min(100, Math.round((answeredCount / totalCategoriesCount) * 100));

    return (
        <>
            <Head title="Voting Asisten" />

            {/* Modal Konfirmasi Pilihan Satuan */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-[24px] w-full max-w-md neo-shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-secondary-container border-b-[4px] border-black dark:border-white px-6 py-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-secondary-container text-3xl">how_to_vote</span>
                            <h2 className="font-headline font-black text-2xl text-on-surface uppercase tracking-tight">
                                Konfirmasi Pilihan
                            </h2>
                        </div>
                        <div className="p-6 md:p-8 space-y-4">
                            <p className="font-body text-lg text-on-surface-variant font-bold leading-relaxed text-center">
                                Anda akan memilih{' '}
                                <span className="text-on-primary-container text-xl font-black">
                                    {assistants.find((a) => a.id === confirmModal.assistantId)?.name}
                                </span>{' '}
                                untuk kategori{' '}
                                <span className="text-on-primary-container text-xl font-black">
                                    {categories.find((c) => c.id === confirmModal.categoryId)?.name}
                                </span>.
                            </p>
                            <p className="font-body text-sm text-outline text-center">
                                Pilihan ini masih bisa diubah sebelum Anda menekan tombol Submit Semua di akhir.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setConfirmModal({ isOpen: false, categoryId: 0, assistantId: null })}
                                    className="bg-surface-container-lowest text-on-surface-variant border-[3px] border-black rounded-xl px-6 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmVote}
                                    className="bg-tertiary-fixed text-black border-[3px] border-black rounded-xl px-6 py-3 font-label font-black uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                                >
                                    Ya, Pilih
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Submit Final All Votes */}
            {submitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-[24px] w-full max-w-lg neo-shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-tertiary-fixed border-b-[4px] border-black px-6 py-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-black text-3xl">task_alt</span>
                            <h2 className="font-headline font-black text-2xl text-black uppercase tracking-tight">
                                Submit Hasil Voting
                            </h2>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <p className="font-body text-base text-on-surface font-semibold leading-relaxed">
                                Apakah Anda yakin ingin menyimpan dan mengirim suara voting Anda?
                            </p>
                            <div className="bg-surface-container border-[2px] border-black rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                                <h3 className="font-label font-bold text-xs uppercase text-outline mb-3 border-b-2 border-outline-variant pb-2">
                                    Ringkasan Pilihan Anda
                                </h3>
                                {categories.map((c) => (
                                    <div key={c.id} className="flex justify-between items-center text-sm py-1">
                                        <span className="font-body font-bold text-on-surface-variant">{c.name}</span>
                                        <span className="font-body text-on-surface font-black">
                                            {votes[c.id] ? (
                                                assistants.find((a) => a.id === votes[c.id])?.name
                                            ) : (
                                                <span className="text-rose-600 font-bold">Belum Memilih</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSubmitModal(false)}
                                    className="bg-surface-container-lowest text-on-surface-variant border-[3px] border-black rounded-xl px-6 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmSubmitAll}
                                    disabled={isSubmitting}
                                    className="bg-tertiary-fixed text-black border-[3px] border-black rounded-xl px-6 py-3 font-headline font-black uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Kumpulkan Suara'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-full overflow-y-auto bg-background p-4 md:p-8 relative font-body pb-36">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="max-w-7xl mx-auto mb-6 bg-emerald-100 border-[3px] border-emerald-800 text-emerald-950 p-4 rounded-xl font-body font-bold flex items-center gap-3 neo-shadow-sm">
                        <span className="material-symbols-outlined text-2xl text-emerald-800">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="max-w-7xl mx-auto mb-6 bg-rose-100 border-[3px] border-rose-800 text-rose-950 p-4 rounded-xl font-body font-bold flex items-center gap-3 neo-shadow-sm">
                        <span className="material-symbols-outlined text-2xl text-rose-800">error</span>
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Status Alert if closed / not started */}
                {!period.is_ongoing && (
                    <div className="max-w-7xl mx-auto mb-6 bg-amber-100 border-[3px] border-amber-800 text-amber-950 p-5 rounded-2xl neo-shadow flex items-start gap-4">
                        <span className="material-symbols-outlined text-3xl text-amber-800">info</span>
                        <div>
                            <h3 className="font-headline font-black text-lg uppercase">
                                Voting Saat Ini Sedang {period.status_label}
                            </h3>
                            <p className="text-sm font-medium mt-1">
                                {period.computed_status === 'not_started'
                                    ? `Periode voting akan dibuka pada ${period.opens_at_formatted} s/d ${period.closes_at_formatted}.`
                                    : `Periode voting telah ditutup pada ${period.closes_at_formatted}. Anda tidak dapat mengirimkan suara baru.`}
                            </p>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar */}
                    <aside className="w-full lg:w-80 shrink-0 space-y-6">
                        {/* Status Card */}
                        <div className="bg-primary-container text-on-primary-container border-[4px] border-black dark:border-white rounded-[20px] p-6 neo-shadow-md">
                            <h1 className="font-headline text-3xl font-black uppercase tracking-tight mb-2">
                                Voting Asisten
                            </h1>
                            <p className="font-body text-xs font-semibold text-on-primary-container/80 leading-relaxed">
                                Pilih asisten favorit Anda untuk setiap kategori. Suara Anda tersimpan secara rahasia dan aman.
                            </p>

                            <div className="mt-6">
                                <div className="flex justify-between font-label font-bold text-xs uppercase mb-2">
                                    <span>Progress Pilihan</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full h-4 bg-surface-container-highest rounded-full border-2 border-black overflow-hidden relative">
                                    <div
                                        className="h-full bg-tertiary-fixed transition-all duration-500 ease-out border-r-2 border-black"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category List Tabs */}
                        <div className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-[20px] p-4 neo-shadow-md space-y-2">
                            <h3 className="font-label font-bold text-xs uppercase text-outline ml-2 mb-4">
                                Kategori Voting
                            </h3>
                            {categories.map((cat) => {
                                const isSelected = activeCategoryId === cat.id;
                                const isVoted = !!votes[cat.id];
                                const chosenAssistant = assistants.find((a) => a.id === votes[cat.id]);

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActiveCategoryId(cat.id)}
                                        className={`w-full text-left px-4 py-4 rounded-xl border-[3px] border-black transition-all flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-tertiary-container neo-shadow translate-x-1 text-black'
                                                : 'bg-surface-container-lowest hover:bg-surface-container hover:neo-shadow'
                                        }`}
                                    >
                                        <div>
                                            <span className="font-headline font-bold text-base text-on-surface block leading-tight">
                                                {cat.name}
                                            </span>
                                            {isVoted && (
                                                <span className="font-label text-xs font-bold text-emerald-800 uppercase mt-1 block">
                                                    Terpilih: {chosenAssistant?.name.split(' ')[0]}
                                                </span>
                                            )}
                                        </div>
                                        {isVoted && (
                                            <span className="material-symbols-outlined text-emerald-700 font-bold">
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Main Assistant Selection Area */}
                    <main className="flex-1">
                        <div className="bg-surface-container-lowest border-[4px] border-black dark:border-white rounded-[20px] p-6 md:p-8 neo-shadow-lg min-h-[600px] flex flex-col">
                            {currentCategoryDetails && (
                                <div className="border-b-[4px] border-black pb-6 mb-8">
                                    <span className="bg-primary-fixed text-black font-label font-bold text-xs uppercase px-3 py-1 rounded-full border-2 border-black mb-3 inline-block neo-shadow-sm">
                                        Kategori Aktif
                                    </span>
                                    <h2 className="font-headline text-3xl font-black text-on-surface uppercase tracking-tight">
                                        {currentCategoryDetails.name}
                                    </h2>
                                    {currentCategoryDetails.description && (
                                        <p className="font-body text-base text-outline mt-2 font-medium">
                                            {currentCategoryDetails.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Assistant Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assistants.map((ast) => {
                                    const isChosen = votes[activeCategoryId] === ast.id;

                                    return (
                                        <div
                                            key={ast.id}
                                            onClick={() => handleSelectAssistant(ast.id)}
                                            className={`relative group border-[4px] border-black rounded-2xl overflow-hidden transition-all duration-300 ${
                                                period.is_ongoing ? 'cursor-pointer hover:-translate-y-2 hover:neo-shadow-lg' : 'opacity-80'
                                            } ${
                                                isChosen
                                                    ? 'bg-primary-fixed neo-shadow-md -translate-y-1'
                                                    : 'bg-surface-container-lowest'
                                            }`}
                                        >
                                            {isChosen && (
                                                <div className="absolute top-0 left-0 w-full bg-tertiary-fixed text-black text-center py-1 border-b-[3px] border-black font-headline font-black text-xs uppercase z-10">
                                                    Pilihan Anda
                                                </div>
                                            )}

                                            <div className="p-6 flex flex-col items-center text-center mt-2">
                                                <div className="w-24 h-24 rounded-full border-[3px] border-black overflow-hidden bg-background mb-4 neo-shadow group-hover:scale-105 transition-transform">
                                                    <img src={ast.avatar} alt={ast.name} className="w-full h-full object-cover" />
                                                </div>
                                                <h3 className="font-headline font-black text-lg text-on-surface leading-tight">
                                                    {ast.name}
                                                </h3>
                                                <p className="font-body text-xs font-bold text-outline mt-1 uppercase tracking-wider">
                                                    {ast.identity_number}
                                                </p>
                                            </div>

                                            <div className="p-4 border-t-[3px] border-black bg-surface-container flex justify-center">
                                                <button
                                                    type="button"
                                                    disabled={!period.is_ongoing}
                                                    className={`font-label font-black text-xs uppercase px-4 py-2 rounded-xl border-2 border-black transition-colors ${
                                                        isChosen
                                                            ? 'bg-tertiary-fixed text-black'
                                                            : 'bg-surface-container-lowest text-on-surface hover:bg-primary-container'
                                                    }`}
                                                >
                                                    {isChosen ? 'Terpilih' : 'Pilih Asisten'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </main>
                </div>

                {/* Floating Bottom Bar for Final Submit */}
                {period.is_ongoing && (
                    <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t-[4px] border-black p-4 md:p-6 flex justify-between items-center z-50 neo-shadow-lg">
                        <div className="max-w-7xl mx-auto flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="font-headline font-bold text-base text-on-surface">
                                    Progress Memilih: {answeredCount} dari {totalCategoriesCount} Kategori
                                </p>
                                <p className="font-body text-xs text-outline">
                                    Pastikan Anda telah mengisi kategori sebelum melakukan submit akhir.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmitAll}
                                disabled={answeredCount === 0 || isSubmitting}
                                className="w-full sm:w-auto bg-tertiary-fixed text-black border-[3px] border-black rounded-xl px-8 py-3 font-headline font-black text-base uppercase neo-shadow hover:-translate-y-0.5 hover:neo-shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                                Submit Semua Pilihan
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
