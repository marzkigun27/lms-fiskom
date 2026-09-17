import { Head, useForm, usePage } from "@inertiajs/react";
import React, { useState } from "react";
import { AVATAR_LIST, AVAILABLE_AVATARS } from "@/lib/avatars";

export default function Profile() {
    const { auth } = usePage().props as any;
    const user = auth?.user || {
        name: "Siti Asisten",
        email: "siti@example.com",
        identity_number: "1301201235",
        user_type: "assistant",
        status: "active",
    };
    const [activeTab, setActiveTab] = useState<"profile" | "password">(
        "profile",
    );
    const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0]);
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        identity_number: user.identity_number || "",
    });
    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Simulasi: Profil berhasil diperbarui!");
    };
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Simulasi: Password berhasil diperbarui!");
        passwordForm.reset();
    };
    return (
        <>
            {" "}
            <Head title="Pengaturan Profil" />{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 font-body relative pb-24">
                {" "}
                <div className="max-w-4xl mx-auto space-y-8">
                    {" "}
                    {/* HEADER SECTION */}{" "}
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-primary-container p-8 rounded-[24px] border-[4px] border-primary neo-shadow-lg relative overflow-hidden">
                        {" "}
                        {/* Decorative Background Elements */}{" "}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-container rounded-full translate-x-12 -translate-y-12 border-[4px] border-primary opacity-20"></div>{" "}
                        <div className="absolute bottom-0 right-32 w-16 h-16 bg-tertiary-fixed rounded-full translate-y-8 border-[4px] border-primary opacity-20"></div>{" "}
                        <div className="relative">
                            {" "}
                            <div className="w-28 h-28 rounded-full border-[4px] border-primary overflow-hidden bg-surface-container-lowest neo-shadow">
                                {" "}
                                <img
                                    src={selectedAvatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />{" "}
                            </div>{" "}
                            <span
                                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-primary neo-shadow-sm ${user.status === "active" ? "bg-tertiary-fixed" : "bg-secondary-container"}`}
                            ></span>{" "}
                        </div>{" "}
                        <div className="text-center md:text-left text-on-primary-container z-10 flex-1">
                            {" "}
                            <h1 className="font-headline font-black text-3xl uppercase tracking-tight">
                                {user.name}
                            </h1>{" "}
                            <p className="font-body text-primary-fixed font-medium text-lg mt-1">
                                {user.identity_number || "NIM/NIP Belum Diisi"}
                            </p>{" "}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                {" "}
                                <span className="bg-surface-container-lowest text-on-primary-container border-2 border-primary rounded-lg px-3 py-1 font-label font-bold text-xs uppercase neo-shadow-sm">
                                    {" "}
                                    {user.user_type === "assistant"
                                        ? "Asisten Lab"
                                        : "Praktikan"}{" "}
                                </span>{" "}
                                <span
                                    className={`border-2 border-primary rounded-lg px-3 py-1 font-label font-bold text-xs uppercase neo-shadow-sm ${user.status === "active" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-secondary-container text-on-secondary-container"}`}
                                >
                                    {" "}
                                    Status: {user.status}{" "}
                                </span>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>{" "}
                    {/* TABS NAVIGATION */}{" "}
                    <div className="flex gap-4">
                        {" "}
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all flex items-center gap-2 ${activeTab === "profile" ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            <span className="material-symbols-outlined text-[20px]">
                                manage_accounts
                            </span>{" "}
                            Data Profil{" "}
                        </button>{" "}
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all flex items-center gap-2 ${activeTab === "password" ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            <span className="material-symbols-outlined text-[20px]">
                                lock_reset
                            </span>{" "}
                            Ubah Password{" "}
                        </button>{" "}
                    </div>{" "}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {" "}
                        {/* LEFT COLUMN: AVATAR PICKER */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-6 neo-shadow-lg">
                                <div className="flex items-center justify-between border-b-2 border-outline-variant pb-3 mb-4">
                                    <h3 className="font-headline font-black text-xl text-on-surface uppercase">
                                        Pilih Avatar
                                    </h3>
                                    <span className="text-xs font-bold font-label bg-surface-container px-2.5 py-0.5 rounded-full text-outline border border-outline-variant">
                                        {AVATAR_LIST.length} Opsi
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 p-0.5">
                                    {AVATAR_LIST.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedAvatar(item.url)}
                                            title={item.label}
                                            className={`rounded-xl border-[3px] overflow-hidden transition-all ${
                                                selectedAvatar === item.url
                                                    ? "border-primary neo-shadow scale-105"
                                                    : "border-transparent hover:border-outline-variant"
                                            }`}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.label}
                                                className="w-full h-auto bg-surface-container"
                                                loading="lazy"
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="font-label text-xs text-outline mt-4 text-center">
                                    Avatar digunakan untuk mengidentifikasi Anda
                                    di platform Praktikum.
                                </p>
                            </div>
                        </div>{" "}
                        {/* RIGHT COLUMN: FORMS */}{" "}
                        <div className="lg:col-span-2">
                            {" "}
                            {/* PROFILE FORM */}{" "}
                            {activeTab === "profile" && (
                                <form
                                    onSubmit={handleProfileSubmit}
                                    className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-8 neo-shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-200"
                                >
                                    {" "}
                                    <h2 className="font-headline font-black text-2xl text-on-surface uppercase tracking-tight">
                                        Informasi Dasar
                                    </h2>{" "}
                                    <p className="font-body text-sm text-outline mb-6">
                                        Perbarui nama dan informasi identitas
                                        Anda.
                                    </p>{" "}
                                    <div className="space-y-4">
                                        {" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Nama Lengkap
                                            </label>{" "}
                                            <input
                                                type="text"
                                                value={profileForm.data.name}
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                            />{" "}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Nomor Identitas (NIM/NIP)
                                            </label>{" "}
                                            <input
                                                type="text"
                                                value={
                                                    profileForm.data
                                                        .identity_number
                                                }
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        "identity_number",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                            />{" "}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Email
                                            </label>{" "}
                                            <input
                                                type="email"
                                                value={profileForm.data.email}
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                            />{" "}
                                        </div>{" "}
                                    </div>{" "}
                                    <div className="pt-4 flex justify-end">
                                        {" "}
                                        <button
                                            type="submit"
                                            className="bg-tertiary-fixed text-on-tertiary-fixed font-label font-bold text-sm uppercase px-8 py-3 rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md active:translate-y-0 active:neo-shadow-sm transition-all flex items-center gap-2"
                                        >
                                            {" "}
                                            <span className="material-symbols-outlined text-[18px]">
                                                save
                                            </span>{" "}
                                            Simpan Perubahan{" "}
                                        </button>{" "}
                                    </div>{" "}
                                </form>
                            )}{" "}
                            {/* PASSWORD FORM */}{" "}
                            {activeTab === "password" && (
                                <form
                                    onSubmit={handlePasswordSubmit}
                                    className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] p-8 neo-shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-200"
                                >
                                    {" "}
                                    <h2 className="font-headline font-black text-2xl text-on-surface uppercase tracking-tight">
                                        Ubah Password
                                    </h2>{" "}
                                    <p className="font-body text-sm text-outline mb-6">
                                        Pastikan akun Anda menggunakan password
                                        yang panjang dan unik demi keamanan.
                                    </p>{" "}
                                    <div className="space-y-4">
                                        {" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Password Saat Ini
                                            </label>{" "}
                                            <input
                                                type="password"
                                                value={
                                                    passwordForm.data
                                                        .current_password
                                                }
                                                onChange={(e) =>
                                                    passwordForm.setData(
                                                        "current_password",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                                placeholder="••••••••"
                                            />{" "}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Password Baru
                                            </label>{" "}
                                            <input
                                                type="password"
                                                value={
                                                    passwordForm.data.password
                                                }
                                                onChange={(e) =>
                                                    passwordForm.setData(
                                                        "password",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                                placeholder="Minimal 8 karakter"
                                            />{" "}
                                        </div>{" "}
                                        <div>
                                            {" "}
                                            <label className="font-label font-bold text-sm text-on-surface uppercase">
                                                Konfirmasi Password Baru
                                            </label>{" "}
                                            <input
                                                type="password"
                                                value={
                                                    passwordForm.data
                                                        .password_confirmation
                                                }
                                                onChange={(e) =>
                                                    passwordForm.setData(
                                                        "password_confirmation",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 border-[3px] border-primary rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:neo-shadow transition-shadow"
                                                placeholder="Ulangi password baru"
                                            />{" "}
                                        </div>{" "}
                                    </div>{" "}
                                    <div className="pt-4 flex justify-end">
                                        {" "}
                                        <button
                                            type="submit"
                                            className="bg-primary-container text-on-primary-container font-label font-bold text-sm uppercase px-8 py-3 rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md active:translate-y-0 active:neo-shadow-sm transition-all flex items-center gap-2"
                                        >
                                            {" "}
                                            <span className="material-symbols-outlined text-[18px]">
                                                key
                                            </span>{" "}
                                            Perbarui Password{" "}
                                        </button>{" "}
                                    </div>{" "}
                                </form>
                            )}{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
        </>
    );
}
