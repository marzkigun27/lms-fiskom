import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';



interface Module {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
}

export default function ModuleIndex() {
    const { modules } = usePage<{ modules: Module[] }>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/asisten/soal/modules', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleEdit = (module: Module) => {
        setEditingModule(module);
        setData({
            name: module.name,
            description: module.description || '',
            is_active: module.is_active,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingModule) return;
        put(`/asisten/soal/modules/${editingModule.id}`, {
            onSuccess: () => {
                setEditingModule(null);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this module?')) {
            destroy(`/asisten/soal/modules/${id}`);
        }
    };

    return (
        <>
            <Head title="Manage Modules" />

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background text-on-background">
                <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
                    
                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 border-[3px] border-black dark:border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                        <div>
                            <h3 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Curriculum Structure</h3>
                            <p className="font-body text-on-surface-variant mt-2">Manage computational track modules and assignments.</p>
                        </div>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-tertiary-fixed text-black border-[3px] border-black dark:border-white rounded-lg py-3 px-6 font-label font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover-neo transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                            Add New Module
                        </button>
                    </div>

                    {/* Create Dialog */}
                    {isCreateOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}></div>
                            <div className="bg-surface rounded-2xl p-8 max-w-md w-full mx-4 relative z-10 border-[4px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
                                <button className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center bg-error-container text-error rounded-full border-[3px] border-black dark:border-white hover-neo shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-20 transition-transform" onClick={() => setIsCreateOpen(false)}>
                                    <span className="material-symbols-outlined font-black text-2xl">close</span>
                                </button>
                                
                                <h2 className="font-headline text-2xl font-black text-on-surface mb-6">Create New Module</h2>
                                
                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Module Name</label>
                                        <input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                        {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Description</label>
                                        <input
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-6 h-6 rounded border-[3px] border-black dark:border-white text-tertiary-fixed focus:ring-0 neo-shadow"
                                        />
                                        <label className="font-label font-bold text-on-surface">Active Module</label>
                                    </div>
                                    <button type="submit" disabled={processing} className="w-full py-4 mt-8 bg-tertiary-fixed text-black font-label font-black text-xl rounded-xl border-[3px] border-black dark:border-white hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                                        Save Module
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Dialog */}
                    {editingModule && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" onClick={() => setEditingModule(null)}></div>
                            <div className="bg-surface rounded-2xl p-8 max-w-md w-full mx-4 relative z-10 border-[4px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
                                <button className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center bg-error-container text-error rounded-full border-[3px] border-black dark:border-white hover-neo shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-20 transition-transform" onClick={() => setEditingModule(null)}>
                                    <span className="material-symbols-outlined font-black text-2xl">close</span>
                                </button>
                                
                                <h2 className="font-headline text-2xl font-black text-on-surface mb-6">Edit Module</h2>
                                
                                <form onSubmit={handleUpdate} className="space-y-5">
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Module Name</label>
                                        <input
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label font-bold text-on-surface mb-2">Description</label>
                                        <input
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full px-4 py-3 bg-surface-container rounded-xl border-[3px] border-black dark:border-white focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-on-surface font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-6 h-6 rounded border-[3px] border-black dark:border-white text-tertiary-fixed focus:ring-0 neo-shadow"
                                        />
                                        <label className="font-label font-bold text-on-surface">Active Module</label>
                                    </div>
                                    <button type="submit" disabled={processing} className="w-full py-4 mt-8 bg-tertiary-fixed text-black font-label font-black text-xl rounded-xl border-[3px] border-black dark:border-white hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                                        Update Module
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Modules Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {modules.map((module) => (
                            <div key={module.id} className="bg-surface border-[3px] border-black dark:border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden flex flex-col">
                                <div className="p-6 border-b-[3px] border-black dark:border-white bg-surface-container-highest flex justify-between items-start">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded bg-secondary-fixed border-[2px] border-black flex items-center justify-center flex-shrink-0">
                                            <span className="font-headline font-black text-xl text-black">M{module.id}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-headline text-xl font-bold text-on-surface">{module.name}</h4>
                                                {module.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed border-[2px] border-black font-label text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-surface-variant border-[2px] border-black font-label text-xs font-bold text-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Draft</span>
                                                )}
                                            </div>
                                            <p className="font-body text-sm text-on-surface-variant line-clamp-2">{module.description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 ml-4">
                                        <button 
                                            onClick={() => handleEdit(module)}
                                            className="p-2 bg-surface border-[2px] border-black dark:border-white rounded hover:bg-secondary-fixed transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover-neo text-on-surface" 
                                            title="Edit Module"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(module.id)}
                                            className="p-2 bg-surface border-[2px] border-black dark:border-white rounded hover:bg-error-container hover:text-error transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover-neo text-on-surface" 
                                            title="Delete Module"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 bg-surface flex-1 flex flex-col items-center justify-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-secondary-fixed border-[2px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <span className="material-symbols-outlined text-3xl text-black">quiz</span>
                                    </div>
                                    <p className="font-label font-bold text-on-surface-variant mb-4">Questions are managed separately.</p>
                                    <a 
                                        href="/asisten/soal"
                                        className="text-sm font-label font-bold bg-white text-black px-4 py-2 border-[2px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover-neo flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span> Manage Questions
                                    </a>
                                </div>
                            </div>
                        ))}

                        {modules.length === 0 && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center border-[4px] border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest opacity-80 text-center px-4">
                                <span className="material-symbols-outlined text-5xl text-outline mb-4">folder_off</span>
                                <h3 className="font-headline text-xl font-bold text-on-surface mb-2">No Modules Found</h3>
                                <p className="font-body text-sm text-on-surface-variant">Create your first module to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
