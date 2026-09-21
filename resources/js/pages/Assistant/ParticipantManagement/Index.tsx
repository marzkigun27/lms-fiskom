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
    const { participants } = usePage<{ participants: Participant[] }>().props;
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
            onSuccess: () => setConfirmDelete({ isOpen: false, participant: null, isLoading: false }),
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
                        <div className="flex items-center gap-4">
                            {" "}
                            <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl px-5 py-3 font-label font-bold text-on-surface neo-shadow">
                                {" "}
                                Total: {filteredUsers.length} pengguna{" "}
                            </div>{" "}
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
        </>
    );
}
