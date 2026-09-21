import { Head, router } from "@inertiajs/react";
import React, { useState } from "react";
import ConfirmModal from "@/components/confirm-modal";
import { schedulePayload, type Assistant, type Participant, type Schedule, type ScheduleGroup } from './form';

type Props = {
    selectedSemesterId?: number | null;
    schedules: Schedule[];
    assistants: Assistant[];
    participants: Participant[];
    semesters: { id: number; name: string; is_active: boolean }[];
    days: string[];
    shifts: string[];
};

export default function AssistantSchedule({ schedules, assistants, participants, semesters, selectedSemesterId, days, shifts }: Props) {
    const [activeTab, setActiveTab] = useState<"list" | "add">("list");
    const [semesterId, setSemesterId] = useState(String(selectedSemesterId ?? semesters.find(s => s.is_active)?.id ?? semesters[0]?.id ?? ''));
    const [day, setDay] = useState(days[0] ?? 'Senin');
    const [shift, setShift] = useState(shifts[0] ?? '');
    const [dutyAssistants, setDutyAssistants] = useState<Assistant[]>([]);
    const [groupCount, setGroupCount] = useState(1);
    const [groups, setGroups] = useState<ScheduleGroup[]>([{ id: 1, number: 1, members: [] }]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        submessage?: React.ReactNode;
        confirmText?: string;
        variant?: 'danger' | 'warning';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: 'Konfirmasi Hapus',
        message: '',
        onConfirm: () => {},
    });
    const visibleSchedules = schedules.filter(s => s.semester_id === Number(semesterId));
    const selectedParticipantIds = new Set(groups.flatMap(g => g.members.map(m => m.id)));

    function resetForm() {
        setEditingId(null);
        setDay(days[0] ?? 'Senin');
        setShift(shifts[0] ?? '');
        setDutyAssistants([]);
        setGroupCount(1);
        setGroups([{ id: 1, number: 1, members: [] }]);
        setErrors({});
    }

    function editSchedule(schedule: Schedule) {
        resetForm();
        setEditingId(schedule.id);
        setSemesterId(String(schedule.semester_id));
        setDay(schedule.day);
        setShift(schedule.shift);
        setDutyAssistants(schedule.assistants);
        setGroups(schedule.groups.map(g => ({ ...g, members: [...g.members] })));
        setGroupCount(schedule.groups.length);
        setNotice('');
        setActiveTab('add');
    }

    function saveSchedule() {
        if (processing) return;
        setErrors({});
        setNotice('');
        setProcessing(true);
        const payload = schedulePayload({ semesterId, day, shift, assistants: dutyAssistants, groups });
        const options = {
            preserveScroll: true,
            onSuccess: () => { resetForm(); setActiveTab('list'); setNotice('Jadwal berhasil disimpan.'); },
            onError: (validationErrors: Record<string, string>) => setErrors(validationErrors),
            onFinish: () => setProcessing(false),
        };
        if (editingId !== null) router.put(`/asisten/jadwal/${editingId}`, payload, options);
        else router.post('/asisten/jadwal', payload, options);
    }

    function deleteSchedule(schedule: Schedule) {
        if (processing) return;
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Jadwal',
            message: (
                <span>
                    Apakah Anda yakin ingin menghapus jadwal{' '}
                    <span className="text-error font-black">{schedule.day}, {schedule.shift}</span>?
                </span>
            ),
            submessage: 'Tindakan ini tidak dapat dibatalkan. Jadwal dan penugasan terkait akan dihapus secara permanen.',
            confirmText: 'Ya, Hapus',
            variant: 'danger',
            onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setProcessing(true);
                setErrors({});
                setNotice('');
                router.delete(`/asisten/jadwal/${schedule.id}`, {
                    preserveScroll: true,
                    onSuccess: () => setNotice('Jadwal berhasil dihapus.'),
                    onError: (validationErrors) => setErrors(validationErrors),
                    onFinish: () => setProcessing(false),
                });
            },
        });
    }

    const applyGroupCountChange = (count: number) => {
        setGroupCount(count);
        setGroups(Array.from({ length: count }, (_, i) => ({
            id: groups[i]?.id ?? -(i + 1), number: i + 1, members: groups[i]?.members ?? [],
        })));
    };

    const handleGroupCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = Number(e.target.value);
        if (count < groups.length && groups.slice(count).some(g => g.members.length)) {
            setConfirmModal({
                isOpen: true,
                title: 'Kurangi Kelompok',
                message: 'Anggota kelompok yang dikurangi akan dilepas dari form jadwal ini.',
                submessage: 'Data anggota pada kelompok yang dikurangi tidak akan tersimpan.',
                confirmText: 'Lanjutkan',
                variant: 'warning',
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    applyGroupCountChange(count);
                },
            });
            return;
        }
        applyGroupCountChange(count);
    };
    return (
        <>
            {" "}
            <Head title="Manajemen Jadwal" />{" "}
            <div className="h-full overflow-y-auto bg-background p-6 md:p-10 relative font-body">
                {" "}
                <fieldset disabled={processing} aria-busy={processing} className="max-w-6xl mx-auto space-y-8 pb-24 min-w-0">
                    {" "}
                    {/* HEADER */}{" "}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[4px] border-primary pb-6">
                        {" "}
                        <div>
                            {" "}
                            <h1 className="font-headline text-[32px] font-extrabold text-on-surface tracking-tight uppercase">
                                {" "}
                                Manajemen Jadwal{" "}
                            </h1>{" "}
                            <p className="font-body text-outline mt-2 text-[15px] max-w-2xl leading-relaxed">
                                {" "}
                                Pantau jadwal shift praktikum, kelola asisten
                                jaga, dan atur pembagian kelompok
                                praktikan.{" "}
                            </p>{" "}
                        </div>{" "}
                    </div>{" "}
                    <div className="space-y-3">
                        <label htmlFor="schedule-semester" className="font-label font-bold uppercase">Semester</label>
                        <select id="schedule-semester" value={semesterId} disabled={editingId !== null}
                            onChange={e => {
                                const requestedSemesterId = Number(e.target.value);
                                setProcessing(true);
                                setErrors({});
                                router.get('/asisten/jadwal', { semester_id: requestedSemesterId }, {
                                    preserveState: false,
                                    preserveScroll: true,
                                    onError: validationErrors => setErrors(validationErrors),
                                    onFinish: () => setProcessing(false),
                                });
                            }}
                            className="block w-full md:w-96 bg-surface-container-lowest border-[3px] border-primary rounded-xl p-3 font-bold">
                            {semesters.length === 0 && <option value="">Belum ada semester</option>}
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' (Aktif)' : ''}</option>)}
                        </select>
                        {semesters.length === 0 && <p role="status">Buat semester terlebih dahulu sebelum menambahkan jadwal.</p>}
                        {notice && <p role="status" className="font-bold text-on-surface">{notice}</p>}
                        {Object.keys(errors).length > 0 && <div role="alert" className="border-2 border-red-700 rounded-xl p-4 text-red-700 bg-surface-container-lowest">
                            <p className="font-bold">Jadwal belum tersimpan:</p>
                            <ul>{Object.entries(errors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>
                        </div>}
                    </div>
                    {/* TABS */}{" "}
                    <div className="flex gap-4">
                        {" "}
                        <button
                            onClick={() => { resetForm(); setActiveTab("list"); }}
                            className={`px-6 py-3 font-headline font-black text-base uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all ${activeTab === "list" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            Daftar Jadwal{" "}
                        </button>{" "}
                        <button
                            onClick={() => { resetForm(); setNotice(''); setActiveTab("add"); }}
                            className={`px-6 py-3 font-headline font-black text-base uppercase rounded-xl border-[3px] border-primary neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all flex items-center gap-2 ${activeTab === "add" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container-lowest text-on-surface"}`}
                        >
                            {" "}
                            <span className="material-symbols-outlined text-xl">
                                add
                            </span>{" "}
                            Tambah Jadwal{" "}
                        </button>{" "}
                    </div>{" "}
                    {/* LIST VIEW */}{" "}
                    {activeTab === 'list' && visibleSchedules.length === 0 && <p className="p-8 border-[3px] border-dashed border-primary rounded-xl text-center font-bold">Belum ada jadwal pada semester ini. Klik Tambah Jadwal untuk mulai.</p>}

                    {activeTab === "list" && (
                        <div className="space-y-8">
                            {" "}
                            {days.map(
                                (dayName) => {
                                    const daySchedules = visibleSchedules.filter(
                                        (s) => s.day === dayName,
                                    );
                                    if (daySchedules.length === 0) return null;
                                    return (
                                        <div
                                            key={dayName}
                                            className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] neo-shadow-lg overflow-hidden"
                                        >
                                            {" "}
                                            <div className="bg-tertiary-container border-b-[4px] border-primary px-6 py-4 flex justify-between items-center">
                                                <h2 className="font-headline font-black text-2xl text-on-tertiary-container uppercase tracking-tight">
                                                    {dayName}
                                                </h2>
                                                <span className="bg-surface-container-lowest text-on-surface border-2 border-primary px-3 py-1 font-label font-bold text-sm rounded-lg neo-shadow-sm">
                                                    {daySchedules.length}{" "}
                                                    Jadwal{" "}
                                                </span>
                                            </div>{" "}
                                            <div className="p-6 md:p-8">
                                                {" "}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {" "}
                                                    {daySchedules.map(
                                                        (schedule) => (
                                                            <div
                                                                key={
                                                                    schedule.id
                                                                }
                                                                className="border-[3px] border-primary rounded-[16px] p-6 bg-background relative hover:neo-shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
                                                            >
                                                                {" "}
                                                                <div className="flex justify-between items-start mb-6 border-b-2 border-primary pb-4">
                                                                    {" "}
                                                                    <div className="bg-primary-fixed text-on-primary-fixed border-2 border-primary rounded-lg px-3 py-1 font-headline font-bold text-sm uppercase neo-shadow-sm">
                                                                        {" "}
                                                                        {
                                                                            schedule.shift
                                                                        }{" "}
                                                                    </div>{" "}
                                                                    <div className="flex gap-2">
                                                                        {" "}
                                                                        <button
                                                                            className="w-8 h-8 flex items-center justify-center bg-surface-container-lowest border-2 border-primary rounded-lg hover:bg-surface-container neo-shadow-sm transition-transform hover:-translate-y-0.5"
                                                                            title="Edit"
                                                                            onClick={() => editSchedule(schedule)}
                                                                        >
                                                                            {" "}
                                                                            <span className="material-symbols-outlined text-sm font-bold">
                                                                                edit
                                                                            </span>{" "}
                                                                        </button>{" "}
                                                                        <button
                                                                            className="w-8 h-8 flex items-center justify-center bg-secondary-container border-2 border-primary rounded-lg hover:bg-red-300 neo-shadow-sm transition-transform hover:-translate-y-0.5 text-on-secondary-container"
                                                                            title="Hapus"
                                                                            onClick={() => deleteSchedule(schedule)}
                                                                        >
                                                                            {" "}
                                                                            <span className="material-symbols-outlined text-sm font-bold">
                                                                                delete
                                                                            </span>{" "}
                                                                        </button>{" "}
                                                                    </div>{" "}
                                                                </div>{" "}
                                                                <div className="space-y-6">
                                                                    {" "}
                                                                    <div>
                                                                        {" "}
                                                                        <div className="font-label font-bold text-xs uppercase text-outline mb-3 flex items-center gap-2">
                                                                            {" "}
                                                                            <span className="material-symbols-outlined text-base">
                                                                                support_agent
                                                                            </span>{" "}
                                                                            Asisten
                                                                            Jaga
                                                                            (
                                                                            {
                                                                                schedule
                                                                                    .assistants
                                                                                    .length
                                                                            }

                                                                            ){" "}
                                                                        </div>{" "}
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {" "}
                                                                            {schedule.assistants.map(
                                                                                (
                                                                                    asst,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            asst.id
                                                                                        }
                                                                                        className="flex items-center gap-2 bg-surface-container-lowest border-2 border-primary rounded-full pr-3 p-1 neo-shadow-sm"
                                                                                    >
                                                                                        {" "}
                                                                                        <span aria-hidden="true" className="w-6 h-6 rounded-full border border-primary bg-surface-container text-center font-bold">{asst.name.charAt(0)}</span>{" "}
                                                                                        <span className="font-headline font-bold text-xs">
                                                                                            {asst.name}
                                                                                        </span>{" "}
                                                                                    </div>
                                                                                ),
                                                                            )}{" "}
                                                                        </div>{" "}
                                                                    </div>{" "}
                                                                    <div>
                                                                        {" "}
                                                                        <div className="font-label font-bold text-xs uppercase text-outline mb-3 flex items-center gap-2">
                                                                            {" "}
                                                                            <span className="material-symbols-outlined text-base">
                                                                                groups
                                                                            </span>{" "}
                                                                            Kelompok
                                                                            Praktikan
                                                                            (
                                                                            {
                                                                                schedule
                                                                                    .groups
                                                                                    .length
                                                                            }

                                                                            ){" "}
                                                                        </div>{" "}
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                            {" "}
                                                                            {schedule.groups.map(
                                                                                (
                                                                                    group,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            group.id
                                                                                        }
                                                                                        className="bg-surface-container-lowest border-2 border-primary rounded-lg p-2 flex flex-col justify-center items-center neo-shadow-sm"
                                                                                    >
                                                                                        {" "}
                                                                                        <span className="font-headline font-bold text-sm uppercase text-on-surface mb-1">
                                                                                            Klp{" "}
                                                                                            {
                                                                                                group.number
                                                                                            }
                                                                                        </span>{" "}
                                                                                        <span className="bg-tertiary-fixed border border-primary text-on-tertiary-fixed text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                                                            {" "}
                                                                                            {
                                                                                                group
                                                                                                    .members
                                                                                                    .length
                                                                                            }{" "}
                                                                                            /
                                                                                            4
                                                                                            Orang{" "}
                                                                                        </span>{" "}
                                                                                    </div>
                                                                                ),
                                                                            )}{" "}
                                                                        </div>{" "}
                                                                    </div>{" "}
                                                                </div>{" "}
                                                            </div>
                                                        ),
                                                    )}{" "}
                                                </div>{" "}
                                            </div>{" "}
                                        </div>
                                    );
                                },
                            )}{" "}
                        </div>
                    )}{" "}
                    {/* ADD VIEW */}{" "}
                    {activeTab === "add" && (
                        <div className="bg-surface-container-lowest border-[4px] border-primary rounded-[20px] neo-shadow-lg overflow-hidden">
                            {" "}
                            <div className="p-6 md:p-8 border-b-[4px] border-primary bg-primary-fixed">
                                {" "}
                                <h2 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">
                                    {" "}
                                    {editingId === null ? 'Form Tambah Jadwal Baru' : 'Edit Jadwal'}
                                </h2>{" "}
                            </div>{" "}
                            <div className="p-6 md:p-8 space-y-8">
                                {" "}
                                {/* BASIC INFO */}{" "}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {" "}
                                    <div className="space-y-3">
                                        {" "}
                                        <label className="font-label font-bold text-sm uppercase text-on-surface-variant">
                                            Hari
                                        </label>{" "}
                                        <select
                                            value={day}
                                            onChange={(e) =>
                                                setDay(e.target.value)
                                            }
                                            className="w-full bg-background border-[3px] border-primary rounded-xl px-4 py-3 font-headline font-bold text-lg text-on-surface neo-shadow focus:outline-none focus:ring-0 focus:border-primary focus:-translate-y-1 focus:neo-shadow-md transition-all appearance-none cursor-pointer"
                                        >
                                            {" "}
                                            {days.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}{" "}
                                        </select>{" "}
                                    </div>{" "}
                                    <div className="space-y-3">
                                        {" "}
                                        <label className="font-label font-bold text-sm uppercase text-on-surface-variant">
                                            Shift
                                        </label>{" "}
                                        <select
                                            value={shift}
                                            onChange={(e) =>
                                                setShift(e.target.value)
                                            }
                                            className="w-full bg-background border-[3px] border-primary rounded-xl px-4 py-3 font-headline font-bold text-lg text-on-surface neo-shadow focus:outline-none focus:ring-0 focus:border-primary focus:-translate-y-1 focus:neo-shadow-md transition-all appearance-none cursor-pointer"
                                        >
                                            {" "}
                                            {shifts.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}{" "}
                                        </select>{" "}
                                    </div>{" "}
                                </div>{" "}
                                {/* DUTY ASSISTANTS */}{" "}
                                <div className="space-y-3 border-t-[3px] border-primary border-dashed pt-8">
                                    {" "}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                        {" "}
                                        <div>
                                            {" "}
                                            <h3 className="font-headline font-black text-xl text-on-surface uppercase">
                                                Asisten Jaga
                                            </h3>{" "}
                                            <p className="font-label text-sm text-outline">
                                                Pilih 1 - 5 asisten yang
                                                bertugas pada jadwal ini.
                                            </p>{" "}
                                        </div>{" "}
                                        <select aria-label="Tambah Asisten" value="" disabled={dutyAssistants.length >= 5}
                                            onChange={e => {
                                                const assistant = assistants.find(a => a.id === Number(e.target.value));
                                                if (assistant && dutyAssistants.length < 5) setDutyAssistants([...dutyAssistants, assistant]);
                                            }}
                                            className="max-w-full bg-tertiary-fixed text-on-tertiary-fixed border-[3px] border-primary rounded-xl px-4 py-2 font-label font-bold neo-shadow disabled:opacity-50">
                                            <option value="">Tambah Asisten</option>
                                            {assistants.filter(a => !dutyAssistants.some(d => d.id === a.id)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>{" "}
                                    </div>{" "}
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        {" "}
                                        {dutyAssistants.map((assistant) => (
                                            <div
                                                key={assistant.id}
                                                className="flex items-center gap-3 bg-surface-container-lowest border-[3px] border-primary rounded-full pr-4 p-1 neo-shadow hover:-translate-y-1 transition-transform cursor-pointer"
                                            >
                                                {" "}
                                                <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-surface-container">
                                                    {" "}
                                                    <span aria-hidden="true" className="w-full h-full flex items-center justify-center font-bold">{assistant.name.charAt(0)}</span>{" "}
                                                </div>{" "}
                                                <span className="font-headline font-bold text-sm text-on-surface">
                                                    {assistant.name}
                                                </span>{" "}
                                                <button aria-label={`Hapus asisten ${assistant.name}`} onClick={() => setDutyAssistants(dutyAssistants.filter(a => a.id !== assistant.id))} className="ml-2 w-6 h-6 rounded-full bg-secondary-container border-2 border-primary flex items-center justify-center hover:bg-red-300 transition-colors">
                                                    {" "}
                                                    <span className="material-symbols-outlined text-[14px] font-bold text-red-900">
                                                        close
                                                    </span>{" "}
                                                </button>{" "}
                                            </div>
                                        ))}{" "}
                                        {dutyAssistants.length === 0 && (
                                            <div className="w-full p-4 border-[3px] border-dashed border-outline-variant rounded-xl text-center text-outline font-label font-bold uppercase">
                                                {" "}
                                                Belum ada asisten yang
                                                dipilih{" "}
                                            </div>
                                        )}{" "}
                                    </div>{" "}
                                </div>{" "}
                                {/* GROUP DIVISION SECTION */}{" "}
                                <div className="bg-tertiary-container border-[4px] border-primary rounded-[20px] p-6 md:p-8 mt-8 neo-shadow-md">
                                    {" "}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                        {" "}
                                        <div>
                                            {" "}
                                            <h3 className="font-headline font-black text-2xl text-on-tertiary-container uppercase flex items-center gap-2">
                                                <span className="material-symbols-outlined text-3xl">
                                                    groups
                                                </span>
                                                Pembagian Kelompok
                                            </h3>
                                            <p className="font-label text-sm text-on-tertiary-container font-medium mt-1">
                                                Tentukan jumlah kelompok (1-5)
                                                dan anggota untuk setiap
                                                kelompok (3-4 orang).
                                            </p>{" "}
                                        </div>{" "}
                                        <div className="flex items-center gap-3 bg-surface-container-lowest border-[3px] border-primary rounded-xl p-2 neo-shadow">
                                            {" "}
                                            <label className="font-label font-bold text-sm uppercase text-on-surface-variant ml-2">
                                                Jml Kelompok:
                                            </label>{" "}
                                            <select
                                                value={groupCount}
                                                onChange={
                                                    handleGroupCountChange
                                                }
                                                className="bg-background border-[2px] border-primary rounded-lg px-3 py-1 font-headline font-bold text-base text-on-surface focus:outline-none cursor-pointer"
                                            >
                                                {" "}
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <option key={n} value={n}>
                                                        {n}
                                                    </option>
                                                ))}{" "}
                                            </select>{" "}
                                        </div>{" "}
                                    </div>{" "}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {" "}
                                        {groups.map((group) => (
                                            <div
                                                key={group.id}
                                                className="bg-surface-container-lowest border-[3px] border-primary rounded-2xl p-5 neo-shadow flex flex-col h-full hover:-translate-y-1 transition-transform"
                                            >
                                                {" "}
                                                <div className="flex justify-between items-center border-b-2 border-primary pb-3 mb-4">
                                                    {" "}
                                                    <h4 className="font-headline font-black text-lg uppercase text-on-surface">
                                                        {" "}
                                                        Kelompok {group.number}{" "}
                                                    </h4>{" "}
                                                    <span className="bg-primary-fixed border-2 border-primary text-on-primary-fixed font-label font-bold text-xs px-2 py-1 rounded-lg">
                                                        {" "}
                                                        {group.members.length} /
                                                        4 Orang{" "}
                                                    </span>{" "}
                                                </div>{" "}
                                                <div className="flex-1 space-y-3 mb-4">
                                                    {" "}
                                                    {group.members.map(
                                                        (member, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center bg-surface-container border-[2px] border-primary rounded-lg p-2 hover:bg-surface-container transition-colors"
                                                            >
                                                                {" "}
                                                                <div>
                                                                    {" "}
                                                                    <div className="font-headline font-bold text-sm text-on-surface">
                                                                        {
                                                                            member.name
                                                                        }
                                                                    </div>{" "}
                                                                    <div className="font-mono text-xs text-outline">
                                                                        {
                                                                            member.nim
                                                                        }
                                                                    </div>{" "}
                                                                </div>{" "}
                                                                <button aria-label={`Hapus praktikan ${member.name}`} onClick={() => setGroups(groups.map(g => g.id === group.id ? { ...g, members: g.members.filter(m => m.id !== member.id) } : g))} className="text-outline-variant hover:text-red-600 transition-colors flex items-center justify-center bg-surface-container-lowest border-2 border-primary rounded-full w-6 h-6">
                                                                    {" "}
                                                                    <span className="material-symbols-outlined text-[14px]">
                                                                        remove
                                                                    </span>{" "}
                                                                </button>{" "}
                                                            </div>
                                                        ),
                                                    )}{" "}
                                                    {/* Empty Slots visualization */}{" "}
                                                    {Array.from({
                                                        length: Math.max(
                                                            0,
                                                            4 -
                                                                group.members
                                                                    .length,
                                                        ),
                                                    }).map((_, idx) => (
                                                        <div
                                                            key={`empty-${idx}`}
                                                            className="border-2 border-dashed border-outline rounded-lg p-3 flex justify-center items-center text-outline-variant bg-surface-container-lowest/50 h-[52px]"
                                                        >
                                                            {" "}
                                                            <span className="font-label text-xs uppercase font-bold tracking-widest">
                                                                + KOSONG
                                                            </span>{" "}
                                                        </div>
                                                    ))}{" "}
                                                </div>{" "}
                                                <select aria-label={`Tambah Praktikan Kelompok ${group.number}`} value="" disabled={group.members.length >= 4}
                                                    onChange={e => {
                                                        const member = participants.find(p => p.id === Number(e.target.value));
                                                        if (member && !selectedParticipantIds.has(member.id) && group.members.length < 4) {
                                                            setGroups(groups.map(g => g.id === group.id ? { ...g, members: [...g.members, member] } : g));
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-background border-[2px] border-primary rounded-xl font-label font-bold text-xs neo-shadow-sm disabled:opacity-50">
                                                    <option value="">Tambah Praktikan</option>
                                                    {participants.filter(p => !selectedParticipantIds.has(p.id)).map(p => <option key={p.id} value={p.id}>{p.name} ({p.nim ?? '-'})</option>)}
                                                </select>{" "}
                                            </div>
                                        ))}{" "}
                                    </div>{" "}
                                </div>{" "}
                                {/* ACTION BUTTONS */}{" "}
                                <div className="pt-8 border-t-[3px] border-primary border-dashed flex flex-col-reverse sm:flex-row justify-end gap-4">
                                    {" "}
                                    <button
                                        onClick={() => { resetForm(); setActiveTab("list"); }}
                                        className="w-full sm:w-auto px-6 py-3 font-label font-bold text-sm uppercase rounded-xl border-[3px] border-primary bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container neo-shadow hover:-translate-y-1 transition-all text-center"
                                    >
                                        {" "}
                                        Batal{" "}
                                    </button>{" "}
                                    <button
                                        onClick={saveSchedule}
                                        disabled={processing || !semesterId}
                                        className="disabled:opacity-50 w-full sm:w-auto px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-primary bg-primary-container text-on-primary-container neo-shadow hover:-translate-y-1 hover:neo-shadow-md transition-all flex justify-center items-center gap-2"
                                    >
                                        {" "}
                                        <span className="material-symbols-outlined">
                                            save
                                        </span>{" "}
                                        {processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                                    </button>{" "}
                                </div>{" "}
                            </div>{" "}
                        </div>
                    )}{" "}
                </fieldset>{" "}
            </div>{" "}

            {/* Custom Neo-Brutalist Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                submessage={confirmModal.submessage}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
}
