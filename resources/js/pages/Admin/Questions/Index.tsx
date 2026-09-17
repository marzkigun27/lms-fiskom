import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';



interface Module {
    id: number;
    name: string;
}

interface Question {
    id: number;
    module_id: number;
    title: string;
    content: string;
    type: string;
    phase: string;
    expected_output?: string;
    points: number;
    module?: Module;
}

export default function QuestionIndex() {
    const { questions, modules, currentModuleId } = usePage<{ 
        questions: Question[], 
        modules: Module[],
        currentModuleId: string | null 
    }>().props;
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        module_id: currentModuleId || (modules.length > 0 ? modules[0].id : ''),
        title: '',
        content: '',
        type: 'code',
        phase: 'tugas_pendahuluan',
        expected_output: '',
        points: 10,
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/asisten/soal', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setData({
            module_id: question.module_id,
            title: question.title,
            content: question.content,
            type: question.type,
            phase: question.phase,
            expected_output: question.expected_output || '',
            points: question.points,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuestion) return;
        put(`/asisten/soal/${editingQuestion.id}`, {
            onSuccess: () => {
                setEditingQuestion(null);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this question?')) {
            destroy(`/asisten/soal/${id}`);
        }
    };

    return (
        <>
            <Head title="Manage Questions" />

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background text-on-background">
                <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
                    
                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 border-[3px] border-black dark:border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                        <div>
                            <h3 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Question Bank</h3>
                            <p className="font-body text-on-surface-variant mt-2">Manage tasks, coding challenges, and assessments for modules.</p>
                        </div>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-primary-fixed text-black border-[3px] border-black dark:border-white rounded-lg py-3 px-6 font-label font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover-neo transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_task</span>
                            New Question
                        </button>
                    </div>

                    {/* Create Dialog */}
                    {isCreateOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center py-8">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}></div>
                            <div className="bg-surface rounded-2xl p-8 max-w-2xl w-full mx-4 relative z-10 border-[4px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-h-full overflow-y-auto">
                                <button className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center bg-error-container text-error rounded-full border-[3px] border-black dark:border-white hover-neo shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-20 transition-transform" onClick={() => setIsCreateOpen(false)}>
                                    <span className="material-symbols-outlined font-black text-2xl">close</span>
                                </button>
                                
                                <h2 className="font-headline text-2xl font-black text-on-surface mb-6">Create New Question</h2>
                                
                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Module</label>
                                            <select 
                                                value={data.module_id} 
                                                onChange={e => setData('module_id', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                {modules.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                            {errors.module_id && <p className="text-error text-sm mt-1">{errors.module_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Type</label>
                                            <select 
                                                value={data.type} 
                                                onChange={e => setData('type', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                <option value="code">Code (Python)</option>
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="essay">Essay</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Phase</label>
                                            <select 
                                                value={data.phase} 
                                                onChange={e => setData('phase', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                <option value="tugas_pendahuluan">Tugas Pendahuluan</option>
                                                <option value="tugas_awal">Tugas Awal</option>
                                                <option value="jurnal">Jurnal</option>
                                                <option value="tugas_mandiri">Tugas Mandiri</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Title</label>
                                        <input
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                        {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Content (Question Text)</label>
                                        <textarea
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors min-h-[120px]"
                                        />
                                        {errors.content && <p className="text-error text-sm mt-1">{errors.content}</p>}
                                    </div>
                                    
                                    {data.type === 'code' && (
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Expected Output (Optional)</label>
                                            <textarea
                                                value={data.expected_output}
                                                onChange={(e) => setData('expected_output', e.target.value)}
                                                placeholder="Expected stdout..."
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-code text-sm text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors min-h-[80px]"
                                            />
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.points}
                                            onChange={(e) => setData('points', parseInt(e.target.value))}
                                            className="w-full md:w-1/3 px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    
                                    <button type="submit" disabled={processing} className="w-full py-4 mt-8 bg-tertiary-fixed text-black font-label font-black text-xl rounded-xl border-[3px] border-black dark:border-white hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                                        Save Question
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Dialog */}
                    {editingQuestion && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center py-8">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setEditingQuestion(null)}></div>
                            <div className="bg-surface rounded-2xl p-8 max-w-2xl w-full mx-4 relative z-10 border-[4px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-h-full overflow-y-auto">
                                <button className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center bg-error-container text-error rounded-full border-[3px] border-black dark:border-white hover-neo shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-20 transition-transform" onClick={() => setEditingQuestion(null)}>
                                    <span className="material-symbols-outlined font-black text-2xl">close</span>
                                </button>
                                
                                <h2 className="font-headline text-2xl font-black text-on-surface mb-6">Edit Question</h2>
                                
                                <form onSubmit={handleUpdate} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Module</label>
                                            <select 
                                                value={data.module_id} 
                                                onChange={e => setData('module_id', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                {modules.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Type</label>
                                            <select 
                                                value={data.type} 
                                                onChange={e => setData('type', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                <option value="code">Code (Python)</option>
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="essay">Essay</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Phase</label>
                                            <select 
                                                value={data.phase} 
                                                onChange={e => setData('phase', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                            >
                                                <option value="tugas_pendahuluan">Tugas Pendahuluan</option>
                                                <option value="tugas_awal">Tugas Awal</option>
                                                <option value="jurnal">Jurnal</option>
                                                <option value="tugas_mandiri">Tugas Mandiri</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Title</label>
                                        <input
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Content (Question Text)</label>
                                        <textarea
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors min-h-[120px]"
                                        />
                                    </div>
                                    
                                    {data.type === 'code' && (
                                        <div>
                                            <label className="block font-label font-bold text-on-surface mb-2">Expected Output (Optional)</label>
                                            <textarea
                                                value={data.expected_output}
                                                onChange={(e) => setData('expected_output', e.target.value)}
                                                className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-code text-sm text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors min-h-[80px]"
                                            />
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.points}
                                            onChange={(e) => setData('points', parseInt(e.target.value))}
                                            className="w-full md:w-1/3 px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    
                                    <button type="submit" disabled={processing} className="w-full py-4 mt-8 bg-tertiary-fixed text-black font-label font-black text-xl rounded-xl border-[3px] border-black dark:border-white hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                                        Update Question
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Questions Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {questions.map((question) => (
                            <div key={question.id} className="bg-surface border-[3px] border-black dark:border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b-[3px] border-black dark:border-white bg-surface-container-highest flex justify-between items-start">
                                    <div className="flex flex-col gap-2 w-full pr-4">
                                        <h4 className="font-headline text-xl font-bold text-on-surface line-clamp-2">{question.title}</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="px-2 py-1 rounded-md bg-secondary-container border-[2px] border-black dark:border-white font-label text-xs font-bold text-on-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                                {question.module?.name}
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-tertiary-container border-[2px] border-black dark:border-white font-label text-xs font-bold text-on-tertiary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                                {question.phase.replace('_', ' ')}
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-surface-container border-[2px] border-black dark:border-white font-label text-xs font-bold text-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                                {question.type}
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-white text-black border-[2px] border-black font-label text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                {question.points} Pts
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => handleEdit(question)}
                                            className="p-2 bg-surface border-[2px] border-black dark:border-white rounded hover:bg-secondary-fixed transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover-neo text-on-surface" 
                                            title="Edit Question"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(question.id)}
                                            className="p-2 bg-surface border-[2px] border-black dark:border-white rounded hover:bg-error-container hover:text-error transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover-neo text-on-surface" 
                                            title="Delete Question"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 bg-surface flex-1">
                                    <div className="bg-surface-container-low border-[2px] border-black dark:border-white rounded-lg p-4 font-body text-sm text-on-surface-variant max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                                        {question.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {questions.length === 0 && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center border-[4px] border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest opacity-80 text-center px-4">
                                <span className="material-symbols-outlined text-5xl text-outline mb-4">quiz</span>
                                <h3 className="font-headline text-xl font-bold text-on-surface mb-2">No Questions Found</h3>
                                <p className="font-body text-sm text-on-surface-variant max-w-sm">Create questions to test the students' understanding of the practicum modules.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
