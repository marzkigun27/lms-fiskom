import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import DynamicAtom from '@/components/dynamic-atom';
import ComicsBrand from '@/components/comics-brand';
import LottieAnimation from '@/components/lottie-animation';

type WelcomeProps = {
    auth: any;
    currentTeam?: any;
    showLoginModal?: boolean;
    defaultAuthMode?: 'login' | 'register';
    defaultRole?: 'praktikan' | 'asisten';
    status?: string;
    errors?: any;
};

export default function Welcome({ 
    auth, 
    currentTeam, 
    showLoginModal = false,
    defaultAuthMode = 'login',
    defaultRole = 'praktikan',
    status,
}: WelcomeProps) {
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';

    const { resolvedAppearance, updateAppearance } = useAppearance();

    const [isModalOpen, setIsModalOpen] = useState(showLoginModal);
    const [authMode, setAuthMode] = useState<'login' | 'register'>(defaultAuthMode);
    const [role, setRole] = useState<'praktikan' | 'asisten'>(defaultRole);

    const page = usePage();
    const registration = (page.props as any).registration;
    const participantRegistration = registration?.participant;
    const assistantRegistration = registration?.assistant;

    const isPraktikanRegistrationBlocked = authMode === 'register' && role === 'praktikan' && (
        participantRegistration ? !participantRegistration.is_allowed : (registration && !registration.is_allowed)
    );

    const isAsistenRegistrationBlocked = authMode === 'register' && role === 'asisten' && (
        assistantRegistration ? !assistantRegistration.is_allowed : false
    );

    const isRegistrationBlocked = isPraktikanRegistrationBlocked || isAsistenRegistrationBlocked;

    const classes = registration?.options?.classes || [];
    const shifts = registration?.options?.shifts || [];

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        identity_number: '',
        password: '',
        password_confirmation: '',
        remember: false,
        login_type: defaultRole,
        register_type: defaultRole,
        class_id: '',
        weekly_schedule_id: '',
        group_number: '',
    });

    const selectedShift = shifts.find((s: any) => String(s.id) === String(data.weekly_schedule_id));
    const availableGroups = selectedShift?.groups || [];

    const handleShiftChange = (shiftId: string) => {
        setData((prev) => ({
            ...prev,
            weekly_schedule_id: shiftId,
            group_number: '',
        }));
    };

    const handleSetRole = (newRole: 'praktikan' | 'asisten') => {
        setRole(newRole);
        setData((prev) => ({ ...prev, login_type: newRole, register_type: newRole }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (authMode === 'login') {
            post('/login', {
                onFinish: () => reset('password'),
            });
        } else {
            post('/register', {
                onFinish: () => reset('password', 'password_confirmation'),
            });
        }
    };

    const toggleMode = () => {
        setAuthMode(prev => prev === 'login' ? 'register' : 'login');
        clearErrors();
        reset('name', 'email', 'identity_number', 'password', 'password_confirmation', 'class_id', 'weekly_schedule_id', 'group_number');
    };

    return (
        <>
            <Head title="COMICS - Computational Physics Laboratory" />
            <div className="min-h-screen flex flex-col font-body antialiased selection:bg-tertiary-fixed selection:text-on-tertiary-fixed relative bg-background text-on-background">
                {/* CSS for Background Grid & Animations */}
                <style dangerouslySetInnerHTML={{__html: `
                    .bg-grid {
                        background-size: 60px 60px;
                        background-image: 
                            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
                    }
                    .dark .bg-grid {
                        background-image: 
                            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
                    }
                    @keyframes float {
                        0% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(10deg); }
                        100% { transform: translateY(0px) rotate(0deg); }
                    }
                    .floating-shape { animation: float 6s ease-in-out infinite; }
                    .floating-shape-delay-1 { animation: float 7s ease-in-out infinite 1s; }
                    .floating-shape-delay-2 { animation: float 5s ease-in-out infinite 2s; }
                `}} />

                <div className="absolute inset-0 bg-grid pointer-events-none z-[-2]"></div>

                {/* TopAppBar */}
                <header className="w-full top-0 z-50">
                    <div className="flex justify-between items-center px-8 py-6 max-w-full mx-auto">
                        <Link href="/" className="flex items-center">
                            <img
                                src="/images/comics-full-logo.png"
                                alt="COMICS - Computational Physics Laboratory"
                                className="h-9 md:h-11 w-auto object-contain select-none dark:brightness-125 transition-all"
                            />
                        </Link>
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-surface-container-lowest text-on-surface rounded-full border-[3px] border-primary hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)]"
                                aria-label="Toggle dark mode"
                            >
                                <span className="material-symbols-outlined">
                                    {resolvedAppearance === 'dark' ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                            {auth.user && (
                                <Link
                                    href={dashboardUrl}
                                    className="hidden md:flex items-center gap-2 font-label font-bold text-lg px-6 py-2.5 bg-transparent text-on-background rounded-full border-[3px] border-primary hover:bg-primary hover:text-on-primary transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)]"
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 w-full relative z-10 min-h-[819px]">
                    {/* Floating Shapes Background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
                        <svg className="absolute top-[10%] left-[30%] w-12 h-12 floating-shape text-tertiary-fixed" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M12 2L3 20h18L12 2z"></path>
                        </svg>
                        <svg className="absolute top-[15%] left-[55%] w-20 h-20 floating-shape-delay-1 text-secondary-fixed-dim" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" x2="12" y1="22.08" y2="12"></line>
                        </svg>
                        <svg className="absolute top-[25%] right-[15%] w-16 h-16 floating-shape-delay-2 text-inverse-primary" fill="currentColor" stroke="var(--color-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 2L3 20h18L12 2z"></path>
                        </svg>
                        <svg className="absolute top-[30%] left-[8%] w-24 h-24 floating-shape-delay-2 text-secondary-container" fill="currentColor" stroke="var(--color-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" x2="12" y1="22.08" y2="12"></line>
                        </svg>
                        <svg className="absolute bottom-[25%] left-[5%] w-16 h-16 floating-shape text-tertiary-fixed-dim" fill="currentColor" stroke="var(--color-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 12a9 9 0 1 0 18 0"></path>
                            <line x1="3" x2="21" y1="12" y2="12"></line>
                        </svg>
                        <svg className="absolute bottom-[30%] right-[15%] w-10 h-10 floating-shape-delay-1 text-surface-variant dark:text-surface-bright" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" x2="12" y1="22.08" y2="12"></line>
                        </svg>
                        <svg className="absolute bottom-[5%] left-[25%] w-24 h-24 floating-shape text-surface-variant dark:text-surface-bright" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                            <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
                        </svg>
                        <svg className="absolute bottom-[5%] right-[25%] w-28 h-28 floating-shape-delay-2 text-inverse-primary" fill="currentColor" stroke="var(--color-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" x2="12" y1="22.08" y2="12"></line>
                        </svg>
                    </div>

                    <div className="flex-1 text-center w-full max-w-5xl mx-auto flex flex-col items-center justify-center -mt-6">
                        {/* Dynamic COMICS Hero Brand - Tightly Aligned & Proportional */}
                        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-full max-w-4xl mx-auto mb-10 bg-transparent">
                            <DynamicAtom className="w-[100px] sm:w-[150px] md:w-[190px] lg:w-[220px] h-auto shrink-0" />
                            <div className="flex-1 max-w-[320px] sm:max-w-[460px] md:max-w-[580px] lg:max-w-[650px]">
                                <ComicsBrand className="w-full" />
                            </div>
                        </div>

                        <p className="font-body text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
                            Access computational physics simulations, lab assignments, and student workspaces.
                        </p>

                        {auth.user ? (
                            <Link
                                href={dashboardUrl}
                                className="py-4 px-10 bg-tertiary-fixed text-black font-label font-black text-2xl rounded-xl neo-border hover-neo flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
                            >
                                Enter Workspace
                                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                            </Link>
                        ) : (
                            <button
                                onClick={() => { setAuthMode('login'); setIsModalOpen(true); }}
                                className="py-4 px-10 bg-tertiary-fixed text-black font-label font-black text-2xl rounded-xl neo-border hover-neo flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
                            >
                                Login to Portal
                                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                            </button>
                        )}
                    </div>
                </main>
            </div>

            {/* Login / Register Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-primary/80 backdrop-blur-sm" 
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    
                    {/* Modal Content - 1x2 Column Layout */}
                    <div className="bg-surface-bright rounded-3xl w-full max-w-4xl lg:max-w-5xl relative z-10 border-[4px] border-primary shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-h-[92vh] overflow-hidden flex flex-col md:flex-row my-auto">
                        {/* Close Button - positioned cleanly inside the card */}
                        <button 
                            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center bg-error-container text-error rounded-full border-[3px] border-primary hover-neo shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] z-30 transition-transform cursor-pointer" 
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                        >
                            <span className="material-symbols-outlined font-black text-2xl">close</span>
                        </button>

                        {/* Column 1: Input Form */}
                        <div className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-h-[92vh]">
                            <div className="pr-12 md:pr-0 mb-6">
                                <h2 className="font-headline text-3xl sm:text-4xl font-black text-primary">
                                    {authMode === 'login' ? 'Portal Login' : 'Register'}
                                </h2>
                                <p className="font-body text-sm font-medium text-on-surface-variant mt-1">
                                    {authMode === 'login'
                                        ? 'Enter your credentials to access the laboratory workspace.'
                                        : 'Create your account to join laboratory practicum sessions.'}
                                </p>
                            </div>
                            
                            {/* Role Toggle */}
                            <div className="flex p-1.5 bg-surface-variant rounded-xl border-[3px] border-primary mb-6 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                <button 
                                    className={`flex-1 py-2.5 font-label font-black rounded-lg transition-all ${
                                        role === 'praktikan' 
                                            ? 'bg-tertiary-fixed border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black'
                                            : 'text-on-surface-variant hover:text-primary border-2 border-transparent'
                                    }`}
                                    onClick={() => handleSetRole('praktikan')}
                                    type="button"
                                >
                                    Praktikan
                                </button>
                                <button 
                                    className={`flex-1 py-2.5 font-label font-bold transition-all rounded-lg ${
                                        role === 'asisten' 
                                            ? 'bg-secondary-fixed border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black'
                                            : 'text-on-surface-variant hover:text-primary border-2 border-transparent'
                                    }`}
                                    onClick={() => handleSetRole('asisten')}
                                    type="button"
                                >
                                    Asisten
                                </button>
                            </div>
                            
                            {isRegistrationBlocked ? (
                                <div className="p-6 bg-rose-100 border-[3px] border-rose-800 text-rose-950 rounded-2xl text-center space-y-2 neo-shadow-sm my-4">
                                    <span className="material-symbols-outlined text-4xl text-rose-800 block mx-auto">lock</span>
                                    <h3 className="font-headline font-black text-xl uppercase tracking-tight">
                                        Registrasi {role === 'asisten' ? 'Asisten' : 'Praktikan'} Ditutup
                                    </h3>
                                    <p className="font-body text-xs font-semibold text-rose-900 leading-relaxed">
                                        {role === 'asisten'
                                            ? 'Pendaftaran akun asisten laboratorium saat ini sedang dinonaktifkan.'
                                            : 'Pendaftaran akun praktikan baru sedang dinonaktifkan oleh asisten laboratorium.'}
                                    </p>
                                    {((role === 'asisten' ? assistantRegistration?.start_at_formatted : participantRegistration?.start_at_formatted) || registration?.start_at_formatted) && (
                                        <p className="font-mono text-[11px] font-bold text-rose-800 mt-2 bg-rose-200 py-1 px-2 rounded-lg border border-rose-800 inline-block">
                                            Periode: {(role === 'asisten' ? assistantRegistration?.start_at_formatted : participantRegistration?.start_at_formatted) || registration?.start_at_formatted} s/d {(role === 'asisten' ? assistantRegistration?.end_at_formatted : participantRegistration?.end_at_formatted) || registration?.end_at_formatted || 'Selesai'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                /* Form */
                                <form className="space-y-4" onSubmit={submit}>
                                    {/* Validation Errors Global or Fallback */}
                                    {Object.keys(errors).length > 0 && !errors.email && !errors.name && !errors.password && !errors.identity_number && !errors.class_id && !errors.weekly_schedule_id && !errors.group_number && (
                                        <div className="p-3 bg-error-container text-on-error-container border-2 border-error rounded-xl font-label text-sm font-bold">
                                            Please check your input and try again.
                                        </div>
                                    )}

                                {authMode === 'register' && (
                                    <div>
                                        <label className="block font-label font-bold text-primary mb-2 text-lg">Full Name</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] placeholder-outline transition-colors" 
                                            placeholder="Isaac Newton" 
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
                                    </div>
                                )}

                                {authMode === 'register' && (
                                    <div>
                                        <label className="block font-label font-bold text-primary mb-2 text-lg">Email Address</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] placeholder-outline transition-colors" 
                                            placeholder="physicist@university.edu" 
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block font-label font-bold text-primary mb-2 text-lg">
                                        {role === 'asisten' ? 'Kode Asisten' : 'NIM'}
                                    </label>
                                    <input 
                                        className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] placeholder-outline transition-colors" 
                                        placeholder={role === 'asisten' ? 'Masukkan kode asisten' : 'Masukkan NIM'} 
                                        type="text"
                                        value={data.identity_number}
                                        onChange={e => setData('identity_number', e.target.value)}
                                        required
                                        autoFocus={authMode === 'login'}
                                    />
                                    {errors.identity_number && <p className="text-error text-sm mt-1">{errors.identity_number}</p>}
                                </div>

                                {authMode === 'register' && role === 'praktikan' && (
                                    <>
                                        <div>
                                            <label className="block font-label font-bold text-primary mb-2 text-lg">
                                                Kelas Praktikum
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors cursor-pointer"
                                                value={data.class_id}
                                                onChange={(e) => setData('class_id', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Pilih Kelas --</option>
                                                {classes.map((c: any) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} ({c.code})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.class_id && <p className="text-error text-sm mt-1">{errors.class_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block font-label font-bold text-primary mb-2 text-lg">
                                                Shift Praktikum
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors cursor-pointer"
                                                value={data.weekly_schedule_id}
                                                onChange={(e) => handleShiftChange(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Pilih Shift Praktikum --</option>
                                                {shifts.map((s: any) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.label || (s.day && s.shift ? `${s.day} - ${s.shift}` : `${s.name || 'Shift'} (${s.day_of_week || '-'}, ${s.formatted_time || '-'})`)}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.weekly_schedule_id && <p className="text-error text-sm mt-1">{errors.weekly_schedule_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block font-label font-bold text-primary mb-2 text-lg">
                                                Kode Kelompok
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={data.group_number}
                                                onChange={(e) => setData('group_number', e.target.value)}
                                                required
                                                disabled={!data.weekly_schedule_id}
                                            >
                                                <option value="">
                                                    {!data.weekly_schedule_id ? '-- Pilih Shift Terlebih Dahulu --' : '-- Pilih Kelompok --'}
                                                </option>
                                                {availableGroups.map((g: any) => (
                                                    <option key={g.number} value={g.number}>
                                                        {g.code ? `${g.code} (Kelompok ${g.number})` : `Kelompok ${g.number}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.group_number && <p className="text-error text-sm mt-1">{errors.group_number}</p>}
                                        </div>
                                    </>
                                )}
                                
                                <div>
                                    <label className="block font-label font-bold text-primary mb-2 text-lg">Password</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] placeholder-outline transition-colors" 
                                        placeholder="••••••••" 
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        required
                                    />
                                    {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
                                </div>

                                {authMode === 'register' && (
                                    <div>
                                        <label className="block font-label font-bold text-primary mb-2 text-lg">Confirm Password</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-surface rounded-xl border-[3px] border-primary focus:outline-none focus:border-tertiary-fixed focus:ring-0 font-body text-primary font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] placeholder-outline transition-colors" 
                                            placeholder="••••••••" 
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                
                                <button 
                                    className="w-full py-4 mt-8 bg-primary text-on-primary font-label font-black text-2xl rounded-xl border-[3px] border-primary hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2" 
                                    type="submit"
                                    disabled={processing}
                                >
                                    {authMode === 'login' ? "Let's Go!" : "Sign Up"}
                                    <span className="material-symbols-outlined font-bold">
                                        {authMode === 'login' ? 'arrow_forward' : 'person_add'}
                                    </span>
                                </button>
                            </form>
                            )}

                            <div className="mt-6 text-center font-body text-sm font-medium text-on-surface-variant">
                                {authMode === 'login' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <button 
                                            type="button"
                                            onClick={toggleMode}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            Register here
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button 
                                            type="button"
                                            onClick={toggleMode}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            Login here
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Lottie Animation */}
                        <div className="hidden md:flex md:w-[45%] lg:w-[48%] bg-surface-variant/40 dark:bg-surface-container/30 border-t-[4px] md:border-t-0 md:border-l-[4px] border-primary flex-col items-center justify-center p-6 lg:p-8 relative select-none overflow-hidden">

                            {/* Lottie Animation Display */}
                            <div className="w-full max-w-[300px] lg:max-w-[340px] aspect-square flex items-center justify-center">
                                <LottieAnimation
                                    src="/animations/physics-computation.json"
                                    className="w-full h-full"
                                    autoplay={true}
                                    loop={true}
                                />
                            </div>

                            {/* Caption */}
                            <div className="text-center mt-3 px-4 max-w-xs">
                                <h4 className="font-headline font-black text-lg text-primary">
                                    Computational Physics Lab
                                </h4>
                                <p className="font-body text-xs font-medium text-on-surface-variant mt-1">
                                    Simulate experiments, manage lab reports, and analyze data in real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
