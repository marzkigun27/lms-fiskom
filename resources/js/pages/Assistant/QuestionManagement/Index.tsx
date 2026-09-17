import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
type SessionType =
    "preliminary" | "initial_task" | "journal" | "independent_task";
type AnswerType = "text" | "code";
type Status = "draft" | "published" | "archived";
interface Module {
    id: number;
    title: string;
    code: string;
    semester_id: number;
    description?: string | null;
    order_number: number;
    status: Status;
}
interface Semester {
    id: number;
    name: string;
}
interface Question {
    id: number;
    module_id: number;
    description: string;
    answer_type: AnswerType;
    programming_language: string | null;
    session_type: SessionType;
    order_number: number;
    is_required: boolean;
    status: Status;
    module?: Module;
}
interface QuestionEdit {
    id?: number | null;
    tempId?: string;
    description: string;
    answer_type: AnswerType;
    programming_language: string;
    session_type: SessionType;
    order_number: number;
    is_required: boolean;
    status: Status;
}
const labels: Record<SessionType, string> = {
    preliminary: "Tugas Pendahuluan",
    initial_task: "Tugas Awal",
    journal: "Jurnal",
    independent_task: "Tugas Akhir",
};
const sessionTypesList: SessionType[] = [
    "preliminary",
    "initial_task",
    "journal",
    "independent_task",
];
const toEdit = (question: Question): QuestionEdit => ({
    id: question.id,
    tempId: String(question.id),
    description: question.description,
    answer_type: question.answer_type,
    programming_language: question.programming_language ?? "",
    session_type: question.session_type,
    order_number: question.order_number,
    is_required: question.is_required,
    status: question.status,
});
const createEmptyQuestion = (
    sessionType: SessionType,
    orderNumber: number = 1,
): QuestionEdit => ({
    id: null,
    tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    answer_type: "text",
    programming_language: "",
    session_type: sessionType,
    order_number: orderNumber,
    is_required: true,
    status: "draft",
});
const buildBatchQuestions = (
    allQuestions: Question[],
    moduleId: number,
): QuestionEdit[] => {
    const moduleQuestions = allQuestions.filter((q) => q.module_id === moduleId);
    const result: QuestionEdit[] = [];

    sessionTypesList.forEach((type) => {
        const forType = moduleQuestions.filter((q) => q.session_type === type);
        if (forType.length > 0) {
            result.push(...forType.map(toEdit));
        } else {
            result.push(createEmptyQuestion(type, 1));
        }
    });

    return result;
};
export default function QuestionManagementIndex() {
    const { questions, modules, semesters } = usePage<{
        questions: Question[];
        modules: Module[];
        semesters: Semester[];
    }>().props;
    const [editing, setEditing] = useState<Question | null>(null);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [open, setOpen] = useState(false);
    const [moduleMode, setModuleMode] = useState(false);
    const [batchMode, setBatchMode] = useState(false);
    const [selectedModule, setSelectedModule] = useState(modules[0]?.id ?? 0);
    const form = useForm({
        module_id: modules[0]?.id ?? 0,
        description: "",
        answer_type: "text" as AnswerType,
        programming_language: "",
        session_type: "preliminary" as SessionType,
        order_number: 1,
        is_required: true,
        status: "draft" as Status,
    });
    const moduleForm = useForm({
        semester_id: semesters[0]?.id ?? 0,
        code: "",
        title: "",
        description: "",
        order_number: 1,
        status: "draft" as Status,
    });
    const batchForm = useForm<{ module_id: number; questions: QuestionEdit[] }>(
        {
            module_id: selectedModule,
            questions: buildBatchQuestions(questions, selectedModule),
        },
    );
    const visibleQuestions = useMemo(
        () => questions.filter((q) => q.module_id === selectedModule),
        [questions, selectedModule],
    );
    const close = () => {
        setOpen(false);
        setEditing(null);
        form.reset();
    };
    const closeModule = () => {
        setEditingModule(null);
        moduleForm.reset();
    };
    const editModule = (module: Module) => {
        setEditingModule(module);
        moduleForm.setData({
            semester_id: module.semester_id,
            code: module.code,
            title: module.title,
            description: module.description ?? "",
            order_number: module.order_number,
            status: module.status,
        });
    };
    const submitModule = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: closeModule };
        editingModule
            ? moduleForm.put(
                  `/asisten/soal/modules/${editingModule.id}`,
                  options,
              )
            : moduleForm.post("/asisten/soal/modules", options);
    };
    const removeModule = (id: number) => {
        if (window.confirm("Hapus module ini?"))
            moduleForm.delete(`/asisten/soal/modules/${id}`);
    };
    const edit = (question: Question) => {
        setEditing(question);
        setOpen(true);
        form.setData({
            module_id: question.module_id,
            description: question.description,
            answer_type: question.answer_type,
            programming_language: question.programming_language ?? "",
            session_type: question.session_type,
            order_number: question.order_number,
            is_required: question.is_required,
            status: question.status,
        });
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: close };
        editing
            ? form.put(`/asisten/soal/${editing.id}`, options)
            : form.post("/asisten/soal", options);
    };
    const remove = (id: number) => {
        if (window.confirm("Hapus soal ini?"))
            form.delete(`/asisten/soal/${id}`);
    };
    const changeModule = (moduleId: number) => {
        setSelectedModule(moduleId);
        batchForm.setData({
            module_id: moduleId,
            questions: buildBatchQuestions(questions, moduleId),
        });
    };
    const addBatchRow = (sessionType: SessionType) => {
        const currentForType = batchForm.data.questions.filter(
            (q) => q.session_type === sessionType,
        );
        const maxOrder = currentForType.reduce(
            (max, q) => Math.max(max, q.order_number || 0),
            0,
        );
        const newRow = createEmptyQuestion(sessionType, maxOrder + 1);
        batchForm.setData("questions", [...batchForm.data.questions, newRow]);
    };
    const removeBatchRow = (tempKey: string) => {
        batchForm.setData(
            "questions",
            batchForm.data.questions.filter(
                (q) => (q.tempId ?? String(q.id)) !== tempKey,
            ),
        );
    };
    const updateBatchQuestion = <K extends keyof QuestionEdit>(
        tempKey: string,
        key: K,
        value: QuestionEdit[K],
    ) =>
        batchForm.setData(
            "questions",
            batchForm.data.questions.map((q) =>
                (q.tempId ?? String(q.id)) === tempKey
                    ? { ...q, [key]: value }
                    : q,
            ),
        );
    const toggleBatchMode = () => {
        if (!batchMode) {
            batchForm.setData({
                module_id: selectedModule,
                questions: buildBatchQuestions(questions, selectedModule),
            });
        }
        setBatchMode(!batchMode);
    };
    const submitBatch = (event: React.FormEvent) => {
        event.preventDefault();
        const filledQuestions = batchForm.data.questions.filter(
            (q) => q.id != null || q.description.trim() !== "",
        );

        if (filledQuestions.length === 0) {
            alert("Mohon isi minimal satu soal sebelum menyimpan batch.");
            return;
        }

        const missingDesc = filledQuestions.find((q) => !q.description.trim());
        if (missingDesc) {
            alert("Semua soal yang disimpan harus memiliki isi soal.");
            return;
        }

        const seenOrders = new Set<string>();
        for (const q of filledQuestions) {
            const key = `${q.session_type}-${q.order_number}`;
            if (seenOrders.has(key)) {
                alert(
                    `Nomor urut ${q.order_number} pada kategori "${labels[q.session_type]}" duplikat. Harap gunakan nomor urut yang berbeda.`,
                );
                return;
            }
            seenOrders.add(key);
        }

        const validQuestions = filledQuestions.map(({ tempId, ...rest }) => rest);

        router.patch(
            "/asisten/soal/batch",
            {
                module_id: selectedModule,
                questions: validQuestions,
            },
            {
                onSuccess: () => setBatchMode(false),
            },
        );
    };
    const openCreateForSection = (sessionType: SessionType) => {
        const existingInSession = questions.filter(
            (q) => q.module_id === selectedModule && q.session_type === sessionType,
        );
        const maxOrder = existingInSession.reduce(
            (max, q) => Math.max(max, q.order_number || 0),
            0,
        );

        setEditing(null);
        form.setData({
            module_id: selectedModule,
            description: "",
            answer_type: "text",
            programming_language: "",
            session_type: sessionType,
            order_number: maxOrder + 1,
            is_required: true,
            status: "draft",
        });
        setOpen(true);
    };
    return (
        <>
            <Head title="Manajemen Soal" />
            <main className="h-full overflow-y-auto bg-surface-container p-6 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <header className="flex flex-col gap-4 border-b-[4px] border-primary pb-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="font-headline text-4xl font-extrabold uppercase">
                                {moduleMode
                                    ? "Manajemen Modul"
                                    : "Manajemen Soal"}
                            </h1>
                            <p className="text-on-surface-variant mt-2">
                                {moduleMode
                                    ? "Kelola daftar modul praktikum."
                                    : "Kelola soal per modul dan jenis tugas sesuai PRD."}
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                            <div className="flex bg-surface-container-lowest border-[3px] border-primary rounded-lg p-1 neo-shadow-sm">
                                <button
                                    onClick={() => setModuleMode(false)}
                                    className={`px-4 py-2 font-bold rounded-md transition-all ${!moduleMode ? "bg-primary-fixed text-black border-[2px] border-primary neo-shadow-sm" : "text-on-surface-variant hover:text-black border-[2px] border-transparent"}`}
                                >
                                    Soal
                                </button>
                                <button
                                    onClick={() => setModuleMode(true)}
                                    className={`px-4 py-2 font-bold rounded-md transition-all ${moduleMode ? "bg-primary-fixed text-black border-[2px] border-primary neo-shadow-sm" : "text-on-surface-variant hover:text-black border-[2px] border-transparent"}`}
                                >
                                    Modul
                                </button>
                            </div>
                            {!moduleMode && (
                                <div className="flex gap-2">
                                    <select
                                        className="border-[3px] border-primary rounded-lg p-3 bg-surface-container-lowest font-bold neo-shadow-sm"
                                        value={selectedModule}
                                        onChange={(e) =>
                                            changeModule(Number(e.target.value))
                                        }
                                    >
                                        {modules.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.code} — {m.title}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={toggleBatchMode}
                                        className="bg-secondary-fixed text-black border-[3px] border-primary rounded-lg px-4 py-2 font-bold neo-shadow-sm hover:-translate-y-0.5 transition-transform flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-lg leading-none">
                                            {batchMode ? "close" : "edit_note"}
                                        </span>
                                        {batchMode
                                            ? "Tutup Batch Edit"
                                            : "Edit Banyak"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>{" "}
                    {moduleMode && (
                        <section className="space-y-8">
                            <div className="bg-surface-container-lowest border-[4px] border-primary neo-shadow-lg rounded-2xl p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="font-headline text-2xl font-extrabold uppercase">
                                            {editingModule
                                                ? "Edit Modul"
                                                : "Tambah Modul Baru"}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeModule}
                                        className="font-label font-bold text-sm bg-surface-container border-[2px] border-primary px-4 py-2 rounded neo-shadow-sm hover:bg-error-container hover:text-error transition-colors"
                                    >
                                        Batal / Reset
                                    </button>
                                </div>
                                <form
                                    onSubmit={submitModule}
                                    className="grid gap-6 md:grid-cols-2"
                                >
                                    <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Semester
                                        <select
                                            className="bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            value={moduleForm.data.semester_id}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "semester_id",
                                                    Number(e.target.value),
                                                )
                                            }
                                        >
                                            {semesters.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        {moduleForm.errors.semester_id && <p className="text-error text-xs font-bold">{moduleForm.errors.semester_id}</p>}
                                    </label>
                                    <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Kode Modul
                                        <input
                                            className="bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            required
                                            value={moduleForm.data.code}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "code",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Misal: MOD-01"
                                        />
                                        {moduleForm.errors.code && <p className="text-error text-xs font-bold">{moduleForm.errors.code}</p>}
                                    </label>
                                    <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Judul Modul
                                        <input
                                            className="bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            required
                                            value={moduleForm.data.title}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "title",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Misal: Kinematika Dasar"
                                        />
                                        {moduleForm.errors.title && <p className="text-error text-xs font-bold">{moduleForm.errors.title}</p>}
                                    </label>
                                    <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Urutan Modul
                                        <input
                                            className="bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            type="number"
                                            min="1"
                                            required
                                            value={moduleForm.data.order_number}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "order_number",
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                        {moduleForm.errors.order_number && <p className="text-error text-xs font-bold">{moduleForm.errors.order_number}</p>}
                                    </label>
                                    <label className="md:col-span-2 flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Deskripsi Modul
                                        <textarea
                                            className="min-h-24 bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            value={moduleForm.data.description}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Deskripsi singkat tentang modul praktikum..."
                                        />
                                        {moduleForm.errors.description && <p className="text-error text-xs font-bold">{moduleForm.errors.description}</p>}
                                    </label>
                                    <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                        Status
                                        <select
                                            className="bg-surface border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                            value={moduleForm.data.status}
                                            onChange={(e) =>
                                                moduleForm.setData(
                                                    "status",
                                                    e.target.value as Status,
                                                )
                                            }
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">
                                                Published
                                            </option>
                                            <option value="archived">
                                                Archived
                                            </option>
                                        </select>
                                    </label>
                                    <button
                                        disabled={moduleForm.processing}
                                        className="md:col-span-2 mt-2 bg-tertiary-fixed text-black border-[4px] border-primary rounded-xl p-4 font-headline font-extrabold text-xl neo-shadow hover:bg-tertiary-fixed-dim hover:-translate-y-1 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                                    >
                                        {moduleForm.processing
                                            ? "Menyimpan..."
                                            : editingModule
                                              ? "Simpan Perubahan"
                                              : "Tambah Modul"}
                                    </button>
                                </form>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {modules.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-surface border-[3px] border-primary rounded-2xl p-5 neo-shadow flex flex-col justify-between gap-4 transition-transform hover:-translate-y-1"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-label font-black text-xs uppercase bg-secondary-fixed border-[2px] border-primary rounded px-2 py-1 neo-shadow-sm">
                                                    {m.code}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 border-[2px] border-primary rounded-full font-label font-bold text-[10px] uppercase neo-shadow-sm ${m.status === "published" ? "bg-tertiary-fixed text-black" : "bg-surface-container text-on-surface-variant"}`}
                                                >
                                                    {m.status}
                                                </span>
                                            </div>
                                            <h3 className="font-headline font-bold text-xl mt-3">
                                                {m.title}
                                            </h3>
                                            <p className="text-sm text-on-surface-variant font-bold mt-1">
                                                Urutan: {m.order_number}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => editModule(m)}
                                                className="flex-1 bg-surface-container hover:bg-secondary-fixed text-on-surface hover:text-black transition-colors border-[2px] border-primary rounded-lg py-2 font-label font-bold neo-shadow-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    removeModule(m.id)
                                                }
                                                className="flex-1 bg-surface-container hover:bg-error-container text-error hover:text-error transition-colors border-[2px] border-primary rounded-lg py-2 font-label font-bold neo-shadow-sm"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}{" "}
                    {!moduleMode && (
                        <>
                            {open && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget) close();
                                    }}
                                >
                                    <div className="bg-surface-container-lowest border-[4px] border-primary neo-shadow-xl rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto">
                                        <div className="flex justify-between items-start mb-6 pb-4 border-b-[3px] border-primary">
                                            <div>
                                                <span className="font-label font-black text-xs uppercase bg-secondary-fixed border-[2px] border-primary rounded px-2.5 py-1 neo-shadow-sm inline-block mb-1.5">
                                                    {labels[form.data.session_type]}
                                                </span>
                                                <h2 className="font-headline text-2xl font-extrabold uppercase">
                                                    {editing
                                                        ? "Edit Soal"
                                                        : "Tambah Soal Baru"}
                                                </h2>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={close}
                                                className="font-label font-bold text-sm bg-surface-container border-[2px] border-primary px-3 py-1.5 rounded-lg neo-shadow-sm hover:bg-error-container hover:text-error transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-lg leading-none">
                                                    close
                                                </span>
                                                Tutup
                                            </button>
                                        </div>
                                        <form
                                            onSubmit={submit}
                                            className="grid gap-6 md:grid-cols-2"
                                        >
                                            <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                                Nomor Soal
                                                <input
                                                    className="bg-surface-container-lowest border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                                    type="number"
                                                    min="1"
                                                    value={form.data.order_number}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "order_number",
                                                            Number(e.target.value),
                                                        )
                                                    }
                                                />
                                                {form.errors.order_number && (
                                                    <p className="text-error text-xs font-bold">
                                                        {form.errors.order_number}
                                                    </p>
                                                )}
                                            </label>
                                            <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                                Status
                                                <select
                                                    className="bg-surface-container-lowest border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                                    value={form.data.status}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "status",
                                                            e.target.value as Status,
                                                        )
                                                    }
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">
                                                        Published
                                                    </option>
                                                    <option value="archived">
                                                        Archived
                                                    </option>
                                                </select>
                                                {form.errors.status && (
                                                    <p className="text-error text-xs font-bold">
                                                        {form.errors.status}
                                                    </p>
                                                )}
                                            </label>
                                            <label className="md:col-span-2 flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                                Isi Soal
                                                <textarea
                                                    className="min-h-32 bg-surface-container-lowest border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                                    required
                                                    value={form.data.description}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "description",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Tuliskan isi pertanyaan / soal secara lengkap di sini..."
                                                />
                                                {form.errors.description && (
                                                    <p className="text-error text-xs font-bold">
                                                        {form.errors.description}
                                                    </p>
                                                )}
                                            </label>
                                            <label className="flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                                Tipe Jawaban
                                                <select
                                                    className="bg-surface-container-lowest border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                                    value={form.data.answer_type}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "answer_type",
                                                            e.target.value as AnswerType,
                                                        )
                                                    }
                                                >
                                                    <option value="text">
                                                        Teks (Essay)
                                                    </option>
                                                    <option value="code">
                                                        Source Code
                                                    </option>
                                                </select>
                                                {form.errors.answer_type && (
                                                    <p className="text-error text-xs font-bold">
                                                        {form.errors.answer_type}
                                                    </p>
                                                )}
                                            </label>
                                            <label className="flex items-center gap-3 font-label font-bold text-sm text-on-surface p-3 bg-surface border-[3px] border-primary rounded-lg neo-shadow-sm cursor-pointer h-[56px] self-end">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 accent-primary cursor-pointer border-[2px] border-primary"
                                                    checked={form.data.is_required}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "is_required",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                Wajib Dijawab
                                            </label>
                                            {form.data.answer_type === "code" && (
                                                <label className="md:col-span-2 flex flex-col gap-2 font-label font-bold text-sm text-on-surface">
                                                    Bahasa Pemrograman
                                                    <input
                                                        className="bg-surface-container-lowest border-[3px] border-primary rounded-lg p-3 font-body text-base text-on-surface focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all neo-shadow-sm"
                                                        value={form.data.programming_language}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                "programming_language",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Contoh: python, cpp, java, php"
                                                    />
                                                    {form.errors.programming_language && (
                                                        <p className="text-error text-xs font-bold">
                                                            {form.errors.programming_language}
                                                        </p>
                                                    )}
                                                </label>
                                            )}
                                            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t-[2px] border-primary/20">
                                                <button
                                                    type="button"
                                                    onClick={close}
                                                    className="px-5 py-3 border-[2px] border-primary bg-surface-container font-label font-bold rounded-xl neo-shadow-sm hover:bg-error-container hover:text-error transition-colors"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={form.processing}
                                                    className="bg-tertiary-fixed text-black border-[3px] border-primary rounded-xl px-6 py-3 font-headline font-extrabold text-base neo-shadow hover:bg-tertiary-fixed-dim hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                                                >
                                                    {form.processing
                                                        ? "Menyimpan..."
                                                        : editing
                                                          ? "Simpan Perubahan"
                                                          : "Tambah Soal"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {batchMode && (
                                <form
                                    onSubmit={submitBatch}
                                    className="bg-surface-container border-[4px] border-primary rounded-2xl p-6 md:p-8 space-y-8 neo-shadow-lg"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-primary pb-6">
                                        <div>
                                            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase">
                                                Batch Edit —{" "}
                                                {
                                                    modules.find(
                                                        (m) =>
                                                            m.id ===
                                                            selectedModule,
                                                    )?.title
                                                }
                                            </h2>
                                            <p className="font-body text-sm text-on-surface-variant mt-1">
                                                Edit banyak soal sekaligus atau tambah baris soal baru pada setiap kategori.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setBatchMode(false)}
                                                className="border-[3px] border-primary bg-surface-container-lowest font-label font-bold px-5 py-3 rounded-xl neo-shadow-sm hover:bg-error-container hover:text-error transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={batchForm.processing}
                                                className="bg-tertiary-fixed text-black border-[3px] border-primary rounded-xl px-6 py-3 font-headline font-extrabold text-base md:text-lg neo-shadow hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-xl">
                                                    save
                                                </span>
                                                {batchForm.processing
                                                    ? "Menyimpan..."
                                                    : "Simpan Semua"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-12">
                                        {sessionTypesList.map((type) => {
                                            const sessionQuestions =
                                                batchForm.data.questions.filter(
                                                    (q) =>
                                                        q.session_type === type,
                                                );
                                            return (
                                                <section
                                                    key={type}
                                                    className="space-y-6"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="font-headline text-xl font-bold uppercase tracking-tight whitespace-nowrap">
                                                            {labels[type]}
                                                        </h3>
                                                        <div className="h-[2px] flex-1 bg-outline-variant/60"></div>
                                                        <button
                                                            type="button"
                                                            onClick={() => addBatchRow(type)}
                                                            className="bg-primary-fixed text-black border-[2px] border-primary font-label font-bold text-xs px-3.5 py-1.5 rounded-lg neo-shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center gap-1 shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-base leading-none">
                                                                add
                                                            </span>
                                                            Tambah Baris
                                                        </button>
                                                    </div>

                                                    {sessionQuestions.length === 0 ? (
                                                        <div className="border-[2px] border-dashed border-primary/40 bg-surface/50 rounded-xl p-6 text-center">
                                                            <p className="font-body text-xs text-on-surface-variant mb-2">
                                                                Belum ada baris soal untuk kategori ini di batch edit.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => addBatchRow(type)}
                                                                className="bg-surface-container-lowest border border-primary font-label font-bold text-xs px-3 py-1 rounded neo-shadow-sm hover:bg-secondary-fixed transition-colors"
                                                            >
                                                                + Tambah Baris
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-6 md:grid-cols-2">
                                                            {sessionQuestions.map((q) => {
                                                                const rowKey = q.tempId ?? String(q.id);
                                                                return (
                                                                    <div
                                                                        key={rowKey}
                                                                        className="bg-surface border-[3px] border-primary rounded-xl p-5 neo-shadow flex flex-col justify-between gap-4"
                                                                    >
                                                                        <div className="flex items-center justify-between gap-3 border-b-2 border-primary/10 pb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-8 h-8 bg-secondary-fixed border-[2px] border-primary rounded flex items-center justify-center font-headline font-bold text-sm text-black shrink-0 neo-shadow-sm">
                                                                                    {q.order_number}
                                                                                </div>
                                                                                {q.id == null ? (
                                                                                    <span className="bg-primary-fixed text-black text-[10px] font-black uppercase px-2 py-0.5 rounded border border-primary neo-shadow-sm">
                                                                                        Baru
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[11px] font-bold text-on-surface-variant font-label">
                                                                                        ID #{q.id}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeBatchRow(rowKey)}
                                                                                className="text-error hover:bg-error-container font-label font-bold text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-primary transition-all flex items-center gap-1"
                                                                                title="Hapus baris ini dari batch"
                                                                            >
                                                                                <span className="material-symbols-outlined text-base">
                                                                                    delete
                                                                                </span>
                                                                                Hapus Baris
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                Isi Soal
                                                                                <textarea
                                                                                    className="w-full min-h-24 bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2.5 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                    value={q.description}
                                                                                    placeholder="Tuliskan soal lengkap..."
                                                                                    onChange={(e) =>
                                                                                        updateBatchQuestion(
                                                                                            rowKey,
                                                                                            "description",
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </label>

                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                    Nomor Urutan
                                                                                    <input
                                                                                        className="bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={q.order_number}
                                                                                        onChange={(e) =>
                                                                                            updateBatchQuestion(
                                                                                                rowKey,
                                                                                                "order_number",
                                                                                                Number(e.target.value),
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </label>
                                                                                <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                    Status
                                                                                    <select
                                                                                        className="bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                        value={q.status}
                                                                                        onChange={(e) =>
                                                                                            updateBatchQuestion(
                                                                                                rowKey,
                                                                                                "status",
                                                                                                e.target.value as Status,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <option value="draft">
                                                                                            Draft
                                                                                        </option>
                                                                                        <option value="published">
                                                                                            Published
                                                                                        </option>
                                                                                        <option value="archived">
                                                                                            Archived
                                                                                        </option>
                                                                                    </select>
                                                                                </label>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                    Pindah Kategori
                                                                                    <select
                                                                                        className="bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                        value={q.session_type}
                                                                                        onChange={(e) =>
                                                                                            updateBatchQuestion(
                                                                                                rowKey,
                                                                                                "session_type",
                                                                                                e.target.value as SessionType,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {Object.entries(labels).map(
                                                                                            ([val, lab]) => (
                                                                                                <option key={val} value={val}>
                                                                                                    {lab}
                                                                                                </option>
                                                                                            ),
                                                                                        )}
                                                                                    </select>
                                                                                </label>
                                                                                <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                    Tipe Jawaban
                                                                                    <select
                                                                                        className="bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                        value={q.answer_type}
                                                                                        onChange={(e) =>
                                                                                            updateBatchQuestion(
                                                                                                rowKey,
                                                                                                "answer_type",
                                                                                                e.target.value as AnswerType,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <option value="text">
                                                                                            Teks (Essay)
                                                                                        </option>
                                                                                        <option value="code">
                                                                                            Source Code
                                                                                        </option>
                                                                                    </select>
                                                                                </label>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-3 items-center">
                                                                                <label className="flex items-center gap-2 font-label font-bold text-xs text-on-surface bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2.5 cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 accent-primary cursor-pointer border-[2px] border-primary"
                                                                                        checked={q.is_required}
                                                                                        onChange={(e) =>
                                                                                            updateBatchQuestion(
                                                                                                rowKey,
                                                                                                "is_required",
                                                                                                e.target.checked,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    Wajib Dijawab
                                                                                </label>
                                                                                {q.answer_type === "code" && (
                                                                                    <label className="flex flex-col gap-1 font-label font-bold text-xs text-on-surface">
                                                                                        Bahasa
                                                                                        <input
                                                                                            className="bg-surface-container-lowest border-[2px] border-primary rounded-lg p-2 font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary-fixed/50 transition-all"
                                                                                            value={q.programming_language}
                                                                                            onChange={(e) =>
                                                                                                updateBatchQuestion(
                                                                                                    rowKey,
                                                                                                    "programming_language",
                                                                                                    e.target.value,
                                                                                                )
                                                                                            }
                                                                                            placeholder="python, cpp, dll"
                                                                                        />
                                                                                    </label>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </section>
                                            );
                                        })}
                                    </div>
                                </form>
                            )}

                            {!batchMode && (
                                <div className="space-y-12">
                                    {sessionTypesList.map((type) => {
                                        const sessionQuestions =
                                            visibleQuestions.filter(
                                                (q) => q.session_type === type,
                                            );
                                        return (
                                            <section
                                                key={type}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <h2 className="font-headline text-xl md:text-2xl font-black uppercase tracking-tight text-on-surface whitespace-nowrap">
                                                        {labels[type]}
                                                    </h2>
                                                    <div className="h-[2px] flex-1 bg-outline-variant/60"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openCreateForSection(type)
                                                        }
                                                        className="bg-primary-fixed text-black border-[2px] border-primary font-label font-bold text-xs md:text-sm px-3.5 py-2 rounded-lg neo-shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center gap-1.5 shrink-0"
                                                    >
                                                        <span className="material-symbols-outlined text-base md:text-lg leading-none">
                                                            add
                                                        </span>
                                                        Tambah Soal
                                                    </button>
                                                </div>

                                                {sessionQuestions.length === 0 ? (
                                                    <div className="border-[3px] border-dashed border-primary/30 bg-surface-container-lowest/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                        <p className="font-body text-sm text-on-surface-variant mb-3">
                                                            Belum ada soal untuk {labels[type]}.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openCreateForSection(type)
                                                            }
                                                            className="bg-surface-container-lowest border-[2px] border-primary text-on-surface hover:bg-secondary-fixed font-label font-bold text-xs px-4 py-2 rounded-lg neo-shadow-sm transition-colors"
                                                        >
                                                            + Tambah Soal Pertama
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                                        {sessionQuestions.map((q) => (
                                                            <article
                                                                key={q.id}
                                                                className="bg-surface-container-lowest border-[3px] border-primary rounded-2xl neo-shadow-md p-5 transition-transform hover:-translate-y-1 flex flex-col"
                                                            >
                                                                <div className="flex justify-between gap-3 items-start">
                                                                    <div className="flex gap-3 min-w-0">
                                                                        <div className="w-10 h-10 bg-secondary-fixed border-[2px] border-primary rounded flex items-center justify-center font-headline font-bold text-lg text-black shrink-0 mt-0.5 neo-shadow-sm">
                                                                            {q.order_number}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h3
                                                                                className="font-headline font-bold text-lg text-on-surface truncate"
                                                                                title={`Soal ${q.order_number}`}
                                                                            >
                                                                                Soal {q.order_number}
                                                                            </h3>
                                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                                <span className="px-2 py-0.5 border-[2px] border-primary rounded-full font-label font-bold text-[10px] uppercase neo-shadow-sm bg-primary-fixed text-on-primary-fixed-variant">
                                                                                    {q.answer_type ===
                                                                                    "code"
                                                                                        ? "Code"
                                                                                        : "Text"}
                                                                                </span>
                                                                                {q.is_required && (
                                                                                    <span className="px-2 py-0.5 border-[2px] border-primary rounded-full font-label font-bold text-[10px] uppercase neo-shadow-sm bg-surface-container text-on-surface-variant">
                                                                                        Wajib
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span
                                                                        className={`px-2 py-0.5 border-[2px] border-primary rounded-full font-label font-bold text-[10px] uppercase neo-shadow-sm shrink-0 ${q.status === "published" ? "bg-tertiary-fixed text-black" : "bg-surface-container text-on-surface-variant"}`}
                                                                    >
                                                                        {q.status}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-4 p-4 bg-surface-container rounded-xl border-[2px] border-primary border-dashed flex-1">
                                                                    <p className="font-body text-sm text-on-surface-variant whitespace-pre-wrap line-clamp-3">
                                                                        {q.description}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-3 mt-5">
                                                                    <button
                                                                        onClick={() => edit(q)}
                                                                        className="flex-1 bg-surface-container hover:bg-secondary-fixed text-on-surface hover:text-black transition-colors border-[2px] border-primary rounded-lg py-2 font-label font-bold neo-shadow-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => remove(q.id)}
                                                                        className="flex-1 bg-surface-container hover:bg-error-container text-error hover:text-error transition-colors border-[2px] border-primary rounded-lg py-2 font-label font-bold neo-shadow-sm"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </article>
                                                        ))}
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
