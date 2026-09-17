import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { AVATAR_LIST, AVAILABLE_AVATARS } from '@/lib/avatars';

export default function Profile() {
    const { auth } = usePage().props as any;
    const user = auth?.user || {
        name: 'Budi Praktikan',
        email: 'budi@example.com',
        identity_number: '1301201234',
        user_type: 'participant',
        status: 'active'
    };

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0]);

    const profileForm = useForm({
        name: user.name,
        email: user.email,
        identity_number: user.identity_number || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Simulasi: Profil berhasil diperbarui!');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Simulasi: Password berhasil diperbarui!');
        passwordForm.reset();
    };

    return (
        <AppSidebarLayout>
            <Head title="Pengaturan Profil" />

            <div className="h-full overflow-y-auto bg-[#F8F9FA] p-6 md:p-10 font-body relative pb-24">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* HEADER SECTION */}
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-[#0A2540] p-8 rounded-[24px] border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fce4b3] rounded-full translate-x-12 -translate-y-12 border-[4px] border-black opacity-20"></div>
                        <div className="absolute bottom-0 right-32 w-16 h-16 bg-[#b2f2bb] rounded-full translate-y-8 border-[4px] border-black opacity-20"></div>

                        <div className="relative">
                            <div className="w-28 h-28 rounded-full border-[4px] border-black overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${user.status === 'active' ? 'bg-[#b2f2bb]' : 'bg-[#fdbec9]'}`}></span>
                        </div>

                        <div className="text-center md:text-left text-white z-10 flex-1">
                            <h1 className="font-headline font-black text-3xl uppercase tracking-tight">{user.name}</h1>
                            <p className="font-body text-[#afc8f0] font-medium text-lg mt-1">{user.identity_number || 'NIM/NIP Belum Diisi'}</p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                <span className="bg-white text-[#0A2540] border-2 border-black rounded-lg px-3 py-1 font-label font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {user.user_type === 'assistant' ? 'Asisten Lab' : 'Praktikan'}
                                </span>
                                <span className={`border-2 border-black rounded-lg px-3 py-1 font-label font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${user.status === 'active' ? 'bg-[#b2f2bb] text-[#00250d]' : 'bg-[#fdbec9] text-[#5c001a]'}`}>
                                    Status: {user.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TABS NAVIGATION */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-[#fce4b3] text-[#7a4a54]' : 'bg-white text-slate-900'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                            Data Profil
                        </button>
                        <button 
                            onClick={() => setActiveTab('password')}
                            className={`px-8 py-3 font-headline font-black text-lg uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${activeTab === 'password' ? 'bg-[#fce4b3] text-[#7a4a54]' : 'bg-white text-slate-900'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                            Ubah Password
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COLUMN: AVATAR PICKER */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white border-[4px] border-black rounded-[20px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
                                    <h3 className="font-headline font-black text-xl text-slate-900 uppercase">Pilih Avatar</h3>
                                    <span className="text-xs font-bold font-label bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600 border border-slate-300">
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
                                            className={`rounded-xl border-[3px] overflow-hidden transition-all relative ${
                                                selectedAvatar === item.url 
                                                    ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105 ring-2 ring-primary ring-offset-1' 
                                                    : 'border-transparent hover:border-slate-300'
                                            }`}
                                        >
                                            <img src={item.url} alt={item.label} className="w-full h-auto bg-slate-50" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                                <p className="font-label text-xs text-slate-500 mt-4 text-center">Avatar digunakan untuk mengidentifikasi Anda di platform Praktikum.</p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: FORMS */}
                        <div className="lg:col-span-2">
                            {/* PROFILE FORM */}
                            {activeTab === 'profile' && (
                                <form onSubmit={handleProfileSubmit} className="bg-white border-[4px] border-black rounded-[20px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                    <h2 className="font-headline font-black text-2xl text-slate-900 uppercase tracking-tight">Informasi Dasar</h2>
                                    <p className="font-body text-sm text-slate-600 mb-6">Perbarui nama dan informasi identitas Anda.</p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Nama Lengkap</label>
                                            <input 
                                                type="text" 
                                                value={profileForm.data.name}
                                                onChange={e => profileForm.setData('name', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Nomor Identitas (NIM/NIP)</label>
                                            <input 
                                                type="text" 
                                                value={profileForm.data.identity_number}
                                                onChange={e => profileForm.setData('identity_number', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Email</label>
                                            <input 
                                                type="email" 
                                                value={profileForm.data.email}
                                                onChange={e => profileForm.setData('email', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit"
                                            className="bg-[#b2f2bb] text-[#00250d] font-label font-bold text-sm uppercase px-8 py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">save</span> Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* PASSWORD FORM */}
                            {activeTab === 'password' && (
                                <form onSubmit={handlePasswordSubmit} className="bg-white border-[4px] border-black rounded-[20px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                    <h2 className="font-headline font-black text-2xl text-slate-900 uppercase tracking-tight">Ubah Password</h2>
                                    <p className="font-body text-sm text-slate-600 mb-6">Pastikan akun Anda menggunakan password yang panjang dan unik demi keamanan.</p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Password Saat Ini</label>
                                            <input 
                                                type="password" 
                                                value={passwordForm.data.current_password}
                                                onChange={e => passwordForm.setData('current_password', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Password Baru</label>
                                            <input 
                                                type="password" 
                                                value={passwordForm.data.password}
                                                onChange={e => passwordForm.setData('password', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                                placeholder="Minimal 8 karakter"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-label font-bold text-sm text-slate-900 uppercase">Konfirmasi Password Baru</label>
                                            <input 
                                                type="password" 
                                                value={passwordForm.data.password_confirmation}
                                                onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                                                className="w-full mt-1 border-[3px] border-black rounded-xl p-3 font-body focus:ring-0 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                                placeholder="Ulangi password baru"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit"
                                            className="bg-[#0A2540] text-white font-label font-bold text-sm uppercase px-8 py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">key</span> Perbarui Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
