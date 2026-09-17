import { Head } from "@inertiajs/react";
import React, { useState } from "react";
const MOCK_CATEGORIES = [
    {
        id: "terbaik",
        name: "Asisten Terbaik",
        isVisible: true,
        totalVotes: 120,
    },
    {
        id: "terfavorit",
        name: "Asisten Terfavorit",
        isVisible: true,
        totalVotes: 115,
    },
    {
        id: "tergalak",
        name: "Asisten Tertegas (Tergalak)",
        isVisible: true,
        totalVotes: 110,
    },
    {
        id: "terkocak",
        name: "Asisten Terkocak",
        isVisible: false,
        totalVotes: 0,
    },
];
const MOCK_RESULTS = {
    terbaik: [
        {
            name: "Kak Budi Santoso",
            votes: 45,
            rank: 1,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Budi&backgroundColor=fce4b3",
        },
        {
            name: "Kak Anton Wibowo",
            votes: 35,
            rank: 2,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Anton&backgroundColor=afc8f0",
        },
        {
            name: "Kak Diana Putri",
            votes: 20,
            rank: 3,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Diana&backgroundColor=b2f2bb",
        },
    ],
    terfavorit: [
        {
            name: "Kak Reza Rahadian",
            votes: 50,
            rank: 1,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Reza&backgroundColor=d4e3ff",
        },
        {
            name: "Kak Siti Aminah",
            votes: 40,
            rank: 2,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Siti&backgroundColor=fdbec9",
        },
    ],
    tergalak: [
        {
            name: "Kak Siti Aminah",
            votes: 60,
            rank: 1,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Siti&backgroundColor=fdbec9",
        },
        {
            name: "Kak Maya Sari",
            votes: 30,
            rank: 2,
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=f8f9fa",
        },
    ],
};
export default function AssistantVoting() {
    const [categories, setCategories] = useState(MOCK_CATEGORIES);
    const [activeTab, setActiveTab] = useState<"results" | "manage">("results");
    const [selectedCategory, setSelectedCategory] = useState(
        MOCK_CATEGORIES[0].id,
    );
    const toggleVisibility = (id: string) => {
        setCategories(
            categories.map((c) =>
                c.id === id ? { ...c, isVisible: !c.isVisible } : c,
            ),
        );
    };
    const currentResults =
        MOCK_RESULTS[selectedCategory as keyof typeof MOCK_RESULTS] || [];
    return (
        <>
            {" "}
            <Head title="Manajemen Voting" />{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                {" "}
                <div className="max-w-6xl mx-auto space-y-8 pb-24">
                    {" "}
                    {/* HEADER */}{" "}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[4px] border-primary pb-6">
                        {" "}
                        <div>
                            {" "}
                            <h1 className="font-headline text-[32px] font-extrabold text-on-surface tracking-tight uppercase">
                                {" "}
                                Manajemen Voting Asisten{" "}
                            </h1>{" "}
                            <p className="font-body text-outline mt-2 text-[15px] max-w-2xl leading-relaxed">
                                {" "}
                                Pantau hasil akhir voting (pemilu) asisten
                                laboratorium dan kelola kategori yang ingin
                                diaktifkan di sisi praktikan.{" "}
                            </p>{" "}
                        </div>{" "}
                    </div>{" "}
                    {/* TABS */}{" "}
                    <div className="flex gap-4">
                        {" "}
                        <button
                            onClick={() => setActiveTab("results")}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all ${activeTab === "results" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            Hasil Voting{" "}
                        </button>{" "}
                        <button
                            onClick={() => setActiveTab("manage")}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all ${activeTab === "manage" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            Kelola Kategori{" "}
                        </button>{" "}
                    </div>{" "}
                    {/* RESULTS VIEW */}{" "}
                    {activeTab === "results" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {" "}
                            <div className="lg:col-span-1 bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-6 neo-shadow-lg space-y-3">
                                {" "}
                                <h3 className="font-label font-bold text-xs uppercase text-outline mb-4 border-b-2 border-outline-variant pb-2">
                                    Pilih Kategori
                                </h3>{" "}
                                {categories
                                    .filter((c) => c.isVisible)
                                    .map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() =>
                                                setSelectedCategory(cat.id)
                                            }
                                            className={`w-full text-left px-4 py-4 rounded-xl border-[3px] border-primary transition-all flex justify-between items-center ${selectedCategory === cat.id ? "bg-tertiary-container neo-shadow translate-x-1" : "bg-surface-container-lowest hover:bg-surface-container hover:neo-shadow"}`}
                                        >
                                            {" "}
                                            <span className="font-headline font-bold text-lg text-on-surface">
                                                {cat.name}
                                            </span>{" "}
                                            <span className="bg-primary-container text-on-primary-container font-label font-bold text-xs px-2 py-1 rounded-lg border-2 border-primary">
                                                {" "}
                                                {cat.totalVotes} Suara{" "}
                                            </span>{" "}
                                        </button>
                                    ))}{" "}
                            </div>{" "}
                            <div className="lg:col-span-2 bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-8 neo-shadow-lg min-h-[500px]">
                                {" "}
                                <h2 className="font-headline text-3xl font-black text-on-surface uppercase tracking-tight mb-8">
                                    {" "}
                                    Peringkat:{" "}
                                    {
                                        categories.find(
                                            (c) => c.id === selectedCategory,
                                        )?.name
                                    }{" "}
                                </h2>{" "}
                                <div className="space-y-6">
                                    {" "}
                                    {currentResults.length > 0 ? (
                                        currentResults.map((result, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-6 bg-surface-container border-[3px] border-primary p-4 rounded-2xl relative overflow-hidden group hover:neo-shadow-md hover:-translate-y-1 transition-all"
                                            >
                                                {" "}
                                                {/* Rank Badge */}{" "}
                                                <div
                                                    className={`w-14 h-14 flex items-center justify-center border-[3px] border-primary rounded-xl font-headline font-black text-2xl neo-shadow z-10 ${result.rank === 1 ? "bg-tertiary-container text-on-tertiary-container" : result.rank === 2 ? "bg-primary-fixed text-on-primary-fixed" : "bg-background text-on-surface"}`}
                                                >
                                                    {" "}
                                                    #{result.rank}{" "}
                                                </div>{" "}
                                                {/* Avatar */}{" "}
                                                <div className="w-16 h-16 rounded-full border-[3px] border-primary overflow-hidden bg-surface-container-lowest shrink-0 z-10">
                                                    {" "}
                                                    <img
                                                        src={result.avatar}
                                                        alt={result.name}
                                                        className="w-full h-full object-cover"
                                                    />{" "}
                                                </div>{" "}
                                                {/* Info & Bar */}{" "}
                                                <div className="flex-1 z-10 relative">
                                                    {" "}
                                                    <h3 className="font-headline font-bold text-xl text-on-surface">
                                                        {result.name}
                                                    </h3>{" "}
                                                    <div className="w-full bg-surface-variant h-4 rounded-full border-2 border-primary mt-2 overflow-hidden">
                                                        {" "}
                                                        <div
                                                            className="h-full bg-tertiary-fixed border-r-2 border-primary"
                                                            style={{
                                                                width: `${(result.votes / (categories.find((c) => c.id === selectedCategory)?.totalVotes || 1)) * 100}%`,
                                                            }}
                                                        ></div>{" "}
                                                    </div>{" "}
                                                </div>{" "}
                                                {/* Score */}{" "}
                                                <div className="text-right z-10 pr-2">
                                                    {" "}
                                                    <span className="font-headline font-black text-3xl text-on-surface">
                                                        {result.votes}
                                                    </span>{" "}
                                                    <span className="font-label font-bold text-xs text-outline uppercase block">
                                                        Suara
                                                    </span>{" "}
                                                </div>{" "}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-outline font-body py-12">
                                            Belum ada data suara untuk kategori
                                            ini.
                                        </div>
                                    )}{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                    {/* MANAGE CATEGORIES VIEW */}{" "}
                    {activeTab === "manage" && (
                        <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-8 neo-shadow-lg">
                            {" "}
                            <div className="flex justify-between items-center mb-8 border-b-2 border-primary pb-4">
                                {" "}
                                <h2 className="font-headline text-2xl font-black text-on-surface uppercase">
                                    Daftar Kategori Voting
                                </h2>{" "}
                                <button className="bg-tertiary-fixed text-on-tertiary-fixed border-[3px] border-primary rounded-xl px-4 py-2 font-label font-bold uppercase neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md transition-all flex items-center gap-2">
                                    {" "}
                                    <span className="material-symbols-outlined">
                                        add
                                    </span>{" "}
                                    Tambah Kategori{" "}
                                </button>{" "}
                            </div>{" "}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {" "}
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="border-[3px] border-primary rounded-2xl p-6 bg-background relative overflow-hidden flex flex-col gap-4"
                                    >
                                        {" "}
                                        <div className="flex justify-between items-start">
                                            {" "}
                                            <h3 className="font-headline font-bold text-xl text-on-surface">
                                                {cat.name}
                                            </h3>{" "}
                                            <button
                                                onClick={() =>
                                                    toggleVisibility(cat.id)
                                                }
                                                className={`px-3 py-1 font-label font-bold text-xs uppercase border-2 border-primary rounded-lg neo-shadow-sm transition-colors ${cat.isVisible ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-secondary-container text-on-secondary-container"}`}
                                            >
                                                {" "}
                                                {cat.isVisible
                                                    ? "Tampil"
                                                    : "Disembunyikan"}{" "}
                                            </button>{" "}
                                        </div>{" "}
                                        <div className="font-label text-sm text-outline bg-surface-container-lowest border-[2px] border-primary p-3 rounded-xl mt-auto">
                                            {" "}
                                            ID Kategori:{" "}
                                            <span className="font-mono bg-surface-variant px-1 rounded">
                                                {cat.id}
                                            </span>{" "}
                                        </div>{" "}
                                        {/* Action buttons (dummy) */}{" "}
                                        <div className="flex gap-2 mt-2">
                                            {" "}
                                            <button className="flex-1 bg-surface-container-lowest border-[2px] border-primary rounded-lg py-2 font-label font-bold text-xs hover:bg-surface-container transition-colors">
                                                Edit Nama
                                            </button>{" "}
                                            <button className="flex-1 bg-surface-container-lowest border-[2px] border-primary rounded-lg py-2 font-label font-bold text-xs text-red-600 hover:bg-red-50 transition-colors">
                                                Hapus
                                            </button>{" "}
                                        </div>{" "}
                                    </div>
                                ))}{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                </div>{" "}
            </div>{" "}
        </>
    );
}
