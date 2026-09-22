import { Head, usePage, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import ConfirmModal from "@/components/confirm-modal";

interface Enrollment {
    id: number;
    status: string;
    class: { id: number; code: string; name: string } | null;
    group: { id: number; code: string; name: string } | null;
}

interface Participant {
    id: number;
    name: string;
    email: string;
    identity_number: string | null;
    status: string;
    user_type: string;
    shift?: string;
    enrollments: Enrollment[];
}

const statusColor: Record<string, string> = {
    active: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    inactive: "bg-surface-container text-on-surface-variant",
    suspended: "bg-error-container text-error",
};

export default function ParticipantManagementIndex() {
    const { participants, flash } = usePage<{
        participants: Participant[];
        flash?: { success?: string; error?: string };
    }>().props;
    const [activeTab, setActiveTab] = useState<"participant" | "assistant">(
        "participant",
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] =
        useState<Participant | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        participant: Participant | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        participant: null,
        isLoading: false,
    });
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkTab, setBulkTab] = useState<"file" | "text">("file");
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkRawData, setBulkRawData] = useState("");
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkError, setBulkError] = useState("");

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBulkError("");
        if (bulkTab === "file" && !bulkFile) {
            setBulkError("Pilih file CSV terlebih dahulu.");
            return;
        }
        if (bulkTab === "text" && !bulkRawData.trim()) {
            setBulkError("Masukkan data praktikan terlebih dahulu.");
            return;
        }

        setBulkProcessing(true);

        router.post(
            "/asisten/peserta/bulk",
            {
                file: bulkTab === "file" ? bulkFile : null,
                raw_data: bulkTab === "text" ? bulkRawData : null,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsBulkModalOpen(false);
                    setBulkFile(null);
                    setBulkRawData("");
                    router.reload({ only: ["participants"] });
                },
                onError: (err) => {
                    setBulkError(err.raw_data || err.file || Object.values(err)[0] || "Gagal mengunggah data.");
                },
                onFinish: () => setBulkProcessing(false),
            }
        );
    };

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: "",
        email: "",
        identity_number: "",
        status: "active",
        user_type: "participant",
        password: "",
        shift: "",
    });

    const filteredUsers = participants.filter((p) => p.user_type === activeTab);

    const activeEnrollment = (p: Participant) =>
        p.enrollments?.find((e) => e.status === "active") ??
        p.enrollments?.[0] ??
        null;

    const openAddModal = () => {
        setSelectedParticipant(null);
        reset();
        clearErrors();
        setData("user_type", activeTab);
        setIsModalOpen(true);
    };

    const openEditModal = (p: Participant) => {
        setSelectedParticipant(p);
        reset();
        clearErrors();
        setData({
            name: p.name,
            email: p.email,
            identity_number: p.identity_number || "",
            status: p.status,
            user_type: p.user_type,
            password: "",
            shift: p.shift || "",
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedParticipant(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedParticipant) {
            put(`/asisten/peserta/${selectedParticipant.id}`, {
                onSuccess: () => handleCloseModal(),
            });
        } else {
            post(`/asisten/peserta`, {
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    const handleDelete = (p: Participant) => {
        setConfirmDelete({
            isOpen: true,
            participant: p,
            isLoading: false,
        });
    };

    const confirmDestroy = () => {
        if (!confirmDelete.participant) return;
        setConfirmDelete((prev) => ({ ...prev, isLoading: true }));
        destroy(`/asisten/peserta/${confirmDelete.participant.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDelete({ isOpen: false, participant: null, isLoading: false });
                router.reload({ only: ["participants"] });
            },
            onError: () => setConfirmDelete((prev) => ({ ...prev, isLoading: false })),
        });
    };

    return (
        <>
            {" "}
            <Head title="Manajemen Pengguna" />{" "}
            <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8 hide-scrollbar">
                {" "}
                <div className="max-w-7xl mx-auto space-y-6 pb-12">
                    {" "}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-[4px] border-primary pb-6">
                        {" "}
                        <div>
                            {" "}
                            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight uppercase">
                                {" "}
                                Manajemen Pengguna{" "}
                            </h1>{" "}
                            <p className="font-body text-on-surface-variant mt-2 font-medium">
                                {" "}
                                Kelola data Asisten dan Praktikan di dalam
                                sistem{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="flex flex-wrap items-center gap-4">
                            {" "}
                            <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl px-5 py-3 font-label font-bold text-on-surface neo-shadow">
                                {" "}
                                Total: {filteredUsers.length} pengguna{" "}
                            </div>{" "}
                            <button
                                onClick={() => {
                                    setBulkError("");
                                    setIsBulkModalOpen(true);
                                }}
                                className="bg-secondary-container text-on-secondary-container border-[3px] border-primary rounded-xl px-5 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-1 hover:-translate-y-1 hover:neo-shadow-md active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">
                                    upload_file
                                </span>{" "}
                                Bulk Upload Praktikan
                            </button>
                            <button
                                onClick={openAddModal}
                                className="bg-primary text-on-primary border-[3px] border-primary rounded-xl px-6 py-3 font-label font-bold uppercase neo-shadow hover:-translate-x-1 hover:-translate-y-1 hover:neo-shadow-md active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">
                                    person_add
                                </span>{" "}
                                Tambah Pengguna
                            </button>
                        </div>{" "}
                    </header>{" "}
                    {flash?.success && (
                        <div className="bg-tertiary-fixed text-on-tertiary-fixed border-[3px] border-primary rounded-xl p-4 neo-shadow flex items-center gap-3 animate-in fade-in duration-200">
                            <span className="material-symbols-outlined font-bold text-xl">check_circle</span>
                            <span className="font-label font-bold text-sm">{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-error-container text-on-error-container border-[3px] border-primary rounded-xl p-4 neo-shadow flex items-center gap-3 animate-in fade-in duration-200">
                            <span className="material-symbols-outlined font-bold text-xl">error</span>
                            <span className="font-label font-bold text-sm">{flash.error}</span>
                        </div>
                    )}
                    {/* Tabs */}
                    <div className="flex gap-4 border-b-[3px] border-primary pb-0 mb-6">
                        <button
                            onClick={() => setActiveTab("participant")}
                            className={`px-8 py-4 font-headline text-xl font-bold uppercase transition-all rounded-t-xl border-[3px] border-b-0 border-primary ${
                                activeTab === "participant"
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                            }`}
                        >
                            Praktikan
                        </button>
                        <button
                            onClick={() => setActiveTab("assistant")}
                            className={`px-8 py-4 font-headline text-xl font-bold uppercase transition-all rounded-t-xl border-[3px] border-b-0 border-primary ${
                                activeTab === "assistant"
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                            }`}
                        >
                            Asisten
                        </button>
                    </div>
                    {filteredUsers.length === 0 ? (
                        <div className="border-[4px] border-dashed border-outline-variant bg-surface-container rounded-2xl p-16 flex flex-col items-center justify-center text-center opacity-70">
                            {" "}
                            <span className="material-symbols-outlined text-6xl text-outline mb-4">
                                group_off
                            </span>{" "}
                            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
                                Belum Ada Data
                            </h3>{" "}
                            <p className="font-body text-on-surface-variant max-w-md">
                                Tidak ada{" "}
                                {activeTab === "assistant"
                                    ? "asisten"
                                    : "praktikan"}{" "}
                                yang terdaftar saat ini.
                            </p>{" "}
                        </div>
                    ) : (
                        <div className="bg-surface-container-lowest border-[3px] border-primary rounded-2xl neo-shadow-lg overflow-hidden">
                            {" "}
                            {/* Table Header */}{" "}
                            <div className="grid grid-cols-12 gap-4 p-4 border-b-[3px] border-primary bg-surface-container font-label font-bold text-xs uppercase text-on-surface-variant items-center">
                                {" "}
                                <div className="col-span-1">#</div>{" "}
                                <div className="col-span-3">Nama</div>{" "}
                                <div className="col-span-3">
                                    NIM/NIP & Email
                                </div>{" "}
                                {activeTab === "participant" && (
                                    <div className="col-span-2">Kelas</div>
                                )}
                                {activeTab === "assistant" && (
                                    <div className="col-span-2">Role</div>
                                )}
                                <div className="col-span-1">Status</div>{" "}
                                <div className="col-span-2 text-right">
                                    Action
                                </div>{" "}
                            </div>{" "}
                            {/* Table Rows */}{" "}
                            <div className="divide-y-[2px] divide-primary dark:divide-white">
                                {" "}
                                {filteredUsers.map((p, idx) => {
                                    const enroll =
                                        activeTab === "participant"
                                            ? activeEnrollment(p)
                                            : null;
                                    return (
                                        <div
                                            key={p.id}
                                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-container transition-colors"
                                        >
                                            {" "}
                                            <div className="col-span-1 font-label font-bold text-sm text-on-surface-variant">
                                                {idx + 1}
                                            </div>{" "}
                                            <div className="col-span-3">
                                                {" "}
                                                <p className="font-label font-bold text-sm text-on-surface truncate">
                                                    {p.name}
                                                </p>{" "}
                                            </div>{" "}
                                            <div className="col-span-3 overflow-hidden">
                                                {" "}
                                                <p className="font-label font-bold text-sm text-on-surface">
                                                    {p.identity_number ?? "-"}
                                                </p>{" "}
                                                <p
                                                    className="font-body text-xs text-on-surface-variant truncate"
                                                    title={p.email}
                                                >
                                                    {p.email}
                                                </p>{" "}
                                            </div>{" "}
                                            {activeTab === "participant" && (
                                                <div className="col-span-2 font-label font-bold text-sm text-on-surface truncate">
                                                    {" "}
                                                    {enroll?.class
                                                        ? `${enroll.class.code} (${enroll.group ? enroll.group.code : "-"})`
                                                        : "-"}{" "}
                                                </div>
                                            )}
                                            {activeTab === "assistant" && (
                                                <div className="col-span-2 font-label font-bold text-sm text-on-surface truncate">
                                                    <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded font-bold uppercase text-[10px] border-2 border-primary">
                                                        Asisten
                                                    </span>
                                                </div>
                                            )}
                                            <div className="col-span-1">
                                                {" "}
                                                <span
                                                    className={`px-2 py-1 border-[2px] border-primary rounded-full font-label font-bold text-[10px] uppercase neo-shadow-sm ${statusColor[p.status] ?? "bg-surface-container text-on-surface-variant"}`}
                                                >
                                                    {" "}
                                                    {p.status}{" "}
                                                </span>{" "}
                                            </div>{" "}
                                            <div className="col-span-2 text-right flex justify-end gap-2">
                                                {" "}
                                                <button
                                                    onClick={() =>
                                                        openEditModal(p)
                                                    }
                                                    className="bg-primary-container text-on-primary-container border-[2px] border-primary p-2 rounded font-label font-bold text-sm neo-shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        edit
                                                    </span>
                                                </button>{" "}
                                                <button
                                                    onClick={() =>
                                                        handleDelete(p)
                                                    }
                                                    className="bg-error text-on-error border-[2px] border-primary p-2 rounded font-label font-bold text-sm neo-shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        delete
                                                    </span>
                                                </button>{" "}
                                            </div>{" "}
                                        </div>
                                    );
                                })}{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                </div>{" "}
                {/* Form Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        {" "}
                        <div className="bg-surface-container-lowest border-[4px] border-primary rounded-xl neo-shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                            {" "}
                            {/* Modal Header */}{" "}
                            <div className="p-6 border-b-[4px] border-primary flex justify-between items-start bg-surface-container-low">
                                {" "}
                                <div>
                                    {" "}
                                    <h3 className="font-headline text-2xl font-bold text-on-surface">
                                        {selectedParticipant
                                            ? "Edit Pengguna"
                                            : "Tambah Pengguna"}
                                    </h3>{" "}
                                    <p className="font-label font-bold text-sm text-on-surface-variant mt-1">
                                        {selectedParticipant
                                            ? `Update data untuk ${selectedParticipant.name}`
                                            : `Menambahkan pengguna baru ke sistem`}
                                    </p>{" "}
                                </div>{" "}
                                <button
                                    onClick={handleCloseModal}
                                    className="text-on-surface-variant hover:text-on-surface p-1 border-[2px] border-transparent hover:border-primary rounded"
                                >
                                    {" "}
                                    <span className="material-symbols-outlined">
                                        close
                                    </span>{" "}
                                </button>{" "}
                            </div>{" "}
                            {/* Modal Body */}{" "}
                            <div className="p-6 overflow-y-auto flex-1 bg-surface">
                                {" "}
                                <form
                                    id="user-form"
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-5"
                                >
                                    {" "}
                                    {/* Personal Info */}{" "}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                Nama Lengkap{" "}
                                                <span className="text-error">
                                                    *
                                                </span>
                                            </label>{" "}
                                            <input
                                                type="text"
                                                required
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            />{" "}
                                            {errors.name && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                Email{" "}
                                                <span className="text-error">
                                                    *
                                                </span>
                                            </label>{" "}
                                            <input
                                                type="email"
                                                required
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            />{" "}
                                            {errors.email && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>{" "}
                                    </div>{" "}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                NIM / NIP / ID
                                            </label>{" "}
                                            <input
                                                type="text"
                                                value={data.identity_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "identity_number",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            />{" "}
                                            {errors.identity_number && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.identity_number}
                                                </p>
                                            )}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                Password{" "}
                                                {selectedParticipant &&
                                                    "(Kosongkan jika tidak diubah)"}
                                            </label>{" "}
                                            <input
                                                type="password"
                                                value={data.password}
                                                onChange={(e) =>
                                                    setData(
                                                        "password",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    !selectedParticipant
                                                        ? "Default: password"
                                                        : ""
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            />{" "}
                                            {errors.password && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.password}
                                                </p>
                                            )}
                                        </div>{" "}
                                    </div>{" "}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                Status{" "}
                                                <span className="text-error">
                                                    *
                                                </span>
                                            </label>{" "}
                                            <select
                                                required
                                                value={data.status}
                                                onChange={(e) =>
                                                    setData(
                                                        "status",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            >
                                                {" "}
                                                <option value="active">
                                                    Active
                                                </option>{" "}
                                                <option value="inactive">
                                                    Inactive
                                                </option>{" "}
                                                <option value="suspended">
                                                    Suspended
                                                </option>{" "}
                                            </select>{" "}
                                            {errors.status && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="block font-label font-bold text-sm text-on-surface mb-1">
                                                Role{" "}
                                                <span className="text-error">
                                                    *
                                                </span>
                                            </label>{" "}
                                            <select
                                                required
                                                value={data.user_type}
                                                onChange={(e) =>
                                                    setData(
                                                        "user_type",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full bg-surface-container-lowest dark:bg-surface border-[3px] border-primary rounded-lg px-3 py-2 font-body focus:outline-none neo-shadow-sm focus:-translate-y-0.5 focus:neo-shadow transition-all"
                                            >
                                                {" "}
                                                <option value="participant">
                                                    Praktikan
                                                </option>{" "}
                                                <option value="assistant">
                                                    Asisten
                                                </option>{" "}
                                            </select>{" "}
                                            {errors.user_type && (
                                                <p className="text-error text-xs font-bold mt-1">
                                                    {errors.user_type}
                                                </p>
                                            )}
                                        </div>{" "}
                                    </div>{" "}
                                </form>{" "}
                            </div>{" "}
                            {/* Modal Footer */}{" "}
                            <div className="p-6 border-t-[4px] border-primary bg-surface-container-low flex justify-end gap-4">
                                {" "}
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="bg-surface-container-highest border-[3px] border-primary rounded-lg px-6 py-2 font-label font-bold text-sm neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                >
                                    {" "}
                                    Batal{" "}
                                </button>{" "}
                                <button
                                    form="user-form"
                                    type="submit"
                                    disabled={processing}
                                    className="bg-primary text-on-primary border-[3px] border-primary rounded-lg px-8 py-2 font-label font-bold text-sm neo-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:neo-shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {" "}
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan"}{" "}
                                </button>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>
                )}{" "}
            </div>{" "}

            {/* Custom Neo-Brutalist Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Hapus Pengguna"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus pengguna{" "}
                        <span className="text-error font-black">{confirmDelete.participant?.name}</span>?
                    </span>
                }
                submessage="Tindakan ini tidak dapat dibatalkan. Seluruh data terkait pengguna ini akan hilang permanen."
                confirmText="Ya, Hapus"
                isLoading={confirmDelete.isLoading}
                onConfirm={confirmDestroy}
                onClose={() => setConfirmDelete({ isOpen: false, participant: null, isLoading: false })}
            />

            {/* Bulk Upload Praktikan Modal */}
            {isBulkModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-body animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="bulk-modal-title"
                >
                    <div
                        className="w-full max-w-2xl bg-surface-container-lowest border-[4px] border-primary rounded-2xl neo-shadow-lg overflow-hidden animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-secondary-container border-b-[3px] border-primary px-6 py-4 flex justify-between items-center text-on-secondary-container">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-2xl font-bold">
                                    upload_file
                                </span>
                                <div>
                                    <h3 id="bulk-modal-title" className="font-headline font-black text-xl uppercase">
                                        Bulk Upload Akun Praktikan
                                    </h3>
                                    <p className="font-label text-xs font-bold opacity-85 mt-0.5">
                                        Username & Password otomatis menggunakan NIM • Email dikosongkan
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBulkModalOpen(false)}
                                className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleBulkSubmit}>
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                <div className="bg-surface-container p-4 rounded-xl border-2 border-primary space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-headline font-black text-sm uppercase text-on-surface flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">info</span>
                                            Format Kolom yang Diperlukan:
                                        </span>
                                        <a
                                            href="/asisten/peserta/template"
                                            download
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-label font-bold text-xs bg-primary-fixed/40 px-2.5 py-1 rounded border border-primary/30"
                                        >
                                            <span className="material-symbols-outlined text-sm">download</span>
                                            Unduh Template CSV
                                        </a>
                                    </div>
                                    <p className="font-mono text-xs text-on-surface font-semibold bg-surface-container-lowest p-2 rounded border border-primary/20">
                                        nama,nim,kelas,shift,kelompok
                                    </p>
                                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                                        Kolom <code className="font-bold text-primary">kelas</code> bersifat <strong>opsional</strong> (bisa dikosongkan jika belum ada kelas). Contoh: <code className="font-bold text-primary">Ahmad Dahlan,1301210001,,Senin - Shift 1,K-01</code>.
                                        Sistem otomatis membuat akun dan memploting ke shift serta kelompok terkait.
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-400/40 rounded-lg p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                                        <span className="material-symbols-outlined text-sm font-bold mt-0.5 text-amber-600">lightbulb</span>
                                        <span>
                                            <strong>Tips Excel:</strong> Jika membuka / menyimpan file di Excel, pastikan kolom <strong>NIM</strong> berformat <strong>Text</strong> agar digit NIM tidak terpotong menjadi notasi ilmiah (seperti <code>1.01042E+11</code>).
                                        </span>
                                    </div>
                                </div>

                                {bulkError && (
                                    <div className="p-3 bg-red-100 border-2 border-red-600 rounded-xl text-red-700 font-label font-bold text-sm">
                                        {bulkError}
                                    </div>
                                )}

                                {/* Method Switch Tabs */}
                                <div className="flex border-b-2 border-primary gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBulkTab("file")}
                                        className={`px-4 py-2 font-headline font-bold text-sm uppercase rounded-t-lg border-2 border-b-0 border-primary transition-all ${
                                            bulkTab === "file"
                                                ? "bg-primary text-on-primary"
                                                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                                        }`}
                                    >
                                        Upload File CSV / TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkTab("text")}
                                        className={`px-4 py-2 font-headline font-bold text-sm uppercase rounded-t-lg border-2 border-b-0 border-primary transition-all ${
                                            bulkTab === "text"
                                                ? "bg-primary text-on-primary"
                                                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                                        }`}
                                    >
                                        Paste Teks / Baris Data
                                    </button>
                                </div>

                                {bulkTab === "file" ? (
                                    <div className="space-y-3">
                                        <label className="block font-label font-bold text-xs uppercase text-on-surface-variant">
                                            Pilih File CSV atau TXT
                                        </label>
                                        <div className="border-2 border-dashed border-primary rounded-xl p-6 text-center bg-surface-container-lowest hover:bg-surface-container transition-colors">
                                            <input
                                                type="file"
                                                accept=".csv,.txt"
                                                onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                                                className="block w-full text-sm font-label font-bold text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-primary file:text-xs file:font-headline file:font-black file:uppercase file:bg-tertiary-fixed file:text-on-tertiary-fixed cursor-pointer"
                                            />
                                            {bulkFile && (
                                                <p className="mt-3 font-label font-bold text-xs text-primary flex items-center justify-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    File terpilih: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="block font-label font-bold text-xs uppercase text-on-surface-variant">
                                            Paste Data Praktikan (Format: nama,nim,kelas,shift,kelompok)
                                        </label>
                                        <textarea
                                            rows={7}
                                            value={bulkRawData}
                                            onChange={(e) => setBulkRawData(e.target.value)}
                                            placeholder={`nama,nim,kelas,shift,kelompok\nAhmad Dahlan,1301210001,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\nBudi Santoso,1301210002,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01`}
                                            className="w-full font-mono text-xs bg-surface-container-lowest border-2 border-primary rounded-xl p-3 text-on-surface focus:outline-none focus:ring-0 focus:border-primary"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t-[3px] border-primary bg-surface-container flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={bulkProcessing}
                                    onClick={() => setIsBulkModalOpen(false)}
                                    className="px-5 py-2 rounded-xl border-2 border-primary font-label font-bold text-sm uppercase bg-surface-container-lowest hover:bg-surface-container"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkProcessing}
                                    className="px-6 py-2 rounded-xl border-2 border-primary font-headline font-black text-sm uppercase bg-primary text-on-primary neo-shadow-sm hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                                    {bulkProcessing ? "Mengunggah..." : "Import Praktikan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
