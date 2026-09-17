import { Link, usePage } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';
import { useState } from 'react';

interface AppSidebarProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

export function AppSidebar({
    isCollapsed: externalIsCollapsed,
    onToggleCollapse,
    isMobileOpen,
    onCloseMobile,
}: AppSidebarProps) {
    const page = usePage();
    const user = page.props.auth?.user;

    const [internalIsCollapsed, setInternalIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    const isCollapsed = externalIsCollapsed ?? internalIsCollapsed;

    const handleToggle = () => {
        if (onToggleCollapse) {
            onToggleCollapse();
        } else {
            setInternalIsCollapsed((prev) => {
                const next = !prev;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('sidebar_collapsed', String(next));
                }
                return next;
            });
        }
    };

    // Determine dashboard URL based on role
    let dashboardUrl = '/';
    if (user?.user_type === 'participant') dashboardUrl = '/praktikan';
    if (user?.user_type === 'assistant') dashboardUrl = '/asisten';

    const currentUrl = page.url;
    const isActive = (path: string) => currentUrl.startsWith(path);

    const { updateAppearance, appearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    let profileUrl = '/settings/profile';
    if (user?.user_type === 'participant') profileUrl = '/praktikan/profile';
    if (user?.user_type === 'assistant') profileUrl = '/asisten/profile';

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onCloseMobile}
                />
            )}

            <nav
                className={`bg-surface-container-lowest text-on-surface font-label font-bold text-sm border-r-[4px] border-black dark:border-white h-screen sticky top-0 left-0 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_0px_0px_0px_rgba(255,255,255,1)] flex flex-col pt-6 pb-4 z-40 shrink-0 transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'w-20 px-2' : 'w-64 px-4'
                } ${
                    isMobileOpen
                        ? 'translate-x-0 fixed inset-y-0 left-0 z-50 w-64'
                        : 'max-md:-translate-x-full max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50'
                }`}
            >
                {/* Header Section */}
                <div className="mb-6 border-b-2 border-primary/20 pb-4">
                    {!isCollapsed ? (
                        <div className="px-1">
                            <div className="flex items-center">
                                <Link href={dashboardUrl} className="flex items-center group" title="COMICS - Computational Physics Laboratory">
                                    <img
                                        src="/images/comics-full-logo.png"
                                        alt="COMICS"
                                        className="h-12 w-auto max-w-full object-contain dark:brightness-125"
                                    />
                                </Link>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-primary/10">
                                <button
                                    onClick={toggleTheme}
                                    className="w-8 h-8 rounded-lg neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-surface-container hover-neo flex items-center justify-center text-on-surface"
                                    title={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {appearance === 'dark' ? 'light_mode' : 'dark_mode'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleToggle}
                                    className="w-8 h-8 rounded-lg neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-surface-container hover-neo flex items-center justify-center text-on-surface max-md:hidden"
                                    title="Collapse Sidebar"
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        chevron_left
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Link href={dashboardUrl} className="flex items-center justify-center w-full" title="COMICS">
                                <img
                                    src="/images/comics-icon-logo.png"
                                    alt="COMICS"
                                    className="w-11 h-11 object-contain shrink-0 dark:brightness-125"
                                />
                            </Link>

                            <div className="flex flex-col items-center gap-2 mt-4 pt-2 border-t border-primary/10">
                                <button
                                    onClick={toggleTheme}
                                    className="w-8 h-8 rounded-lg neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-surface-container hover-neo flex items-center justify-center text-on-surface"
                                    title={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {appearance === 'dark' ? 'light_mode' : 'dark_mode'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleToggle}
                                    className="w-8 h-8 rounded-lg neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-surface-container hover-neo flex items-center justify-center text-on-surface max-md:hidden"
                                    title="Expand Sidebar"
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        chevron_right
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto space-y-1 py-2 hide-scrollbar">
                    <Link
                        href={dashboardUrl}
                        title={isCollapsed ? 'Dashboard' : undefined}
                        className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                            isCollapsed ? 'justify-center px-0' : ''
                        } ${
                            currentUrl === dashboardUrl
                                ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">dashboard</span>
                        {!isCollapsed && <span className="truncate">Dashboard</span>}
                    </Link>

                    {/* --- ASSISTANT AND ADMIN MENUS --- */}
                    {user?.user_type === 'assistant' && (
                        <>
                            {!isCollapsed ? (
                                <div className="px-3 mt-6 mb-2 text-[11px] font-headline font-black text-outline uppercase tracking-wider">
                                    Assistant
                                </div>
                            ) : (
                                <div className="my-3 border-t-2 border-primary/20" />
                            )}
                            <Link
                                href="/asisten/jadwal"
                                title={isCollapsed ? 'Jadwal Management' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/jadwal')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">calendar_month</span>
                                {!isCollapsed && <span className="truncate">Jadwal Management</span>}
                            </Link>
                            <Link
                                href="/asisten/praktikum"
                                title={isCollapsed ? 'Praktikum Management' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/praktikum')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">science</span>
                                {!isCollapsed && <span className="truncate">Praktikum Management</span>}
                            </Link>
                            <Link
                                href="/asisten/nilai"
                                title={isCollapsed ? 'Nilai Management' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/nilai')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">grade</span>
                                {!isCollapsed && <span className="truncate">Nilai Management</span>}
                            </Link>
                            <Link
                                href="/asisten/soal"
                                title={isCollapsed ? 'Soal Management' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/soal')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">library_books</span>
                                {!isCollapsed && <span className="truncate">Soal Management</span>}
                            </Link>
                            <Link
                                href="/asisten/peserta"
                                title={isCollapsed ? 'Peserta Management' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/peserta')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">group</span>
                                {!isCollapsed && <span className="truncate">Peserta Management</span>}
                            </Link>
                            <Link
                                href="/asisten/feedback"
                                title={isCollapsed ? 'Feedback' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/feedback')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">forum</span>
                                {!isCollapsed && <span className="truncate">Feedback</span>}
                            </Link>
                            <Link
                                href="/asisten/global-control"
                                title={isCollapsed ? 'Global Control Panel' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/asisten/global-control')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">tune</span>
                                {!isCollapsed && <span className="truncate">Global Control</span>}
                            </Link>
                        </>
                    )}

                    {/* --- PARTICIPANT MENUS --- */}
                    {user?.user_type === 'participant' && (
                        <>
                            {!isCollapsed ? (
                                <div className="px-3 mt-6 mb-2 text-[11px] font-headline font-black text-outline uppercase tracking-wider">
                                    Participant
                                </div>
                            ) : (
                                <div className="my-3 border-t-2 border-primary/20" />
                            )}
                            <Link
                                href="/praktikan/praktikum"
                                title={isCollapsed ? 'Praktikum' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/praktikan/praktikum')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">code</span>
                                {!isCollapsed && <span className="truncate">Praktikum</span>}
                            </Link>
                            <Link
                                href="/praktikan/nilai"
                                title={isCollapsed ? 'Lihat Nilai' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/praktikan/nilai')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">military_tech</span>
                                {!isCollapsed && <span className="truncate">Lihat Nilai</span>}
                            </Link>
                            <Link
                                href="/praktikan/tugas-pendahuluan"
                                title={isCollapsed ? 'Tugas Pendahuluan' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/praktikan/tugas-pendahuluan')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">assignment</span>
                                {!isCollapsed && <span className="truncate">Tugas Pendahuluan</span>}
                            </Link>
                            <Link
                                href="/praktikan/feedback"
                                title={isCollapsed ? 'Feedback' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/praktikan/feedback')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">forum</span>
                                {!isCollapsed && <span className="truncate">Feedback</span>}
                            </Link>
                            <Link
                                href="/praktikan/voting"
                                title={isCollapsed ? 'Voting Asisten' : undefined}
                                className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                                    isCollapsed ? 'justify-center px-0' : ''
                                } ${
                                    isActive('/praktikan/voting')
                                        ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined shrink-0 text-xl">how_to_vote</span>
                                {!isCollapsed && <span className="truncate">Voting Asisten</span>}
                            </Link>
                        </>
                    )}
                </div>

                {/* Footer Links */}
                <div className="mt-auto pt-3 border-t-[3px] border-black dark:border-white space-y-1">
                    <Link
                        href={profileUrl}
                        title={isCollapsed ? 'Profile / Settings' : undefined}
                        className={`p-3 m-1 flex items-center gap-3 rounded-xl transition-all duration-100 ${
                            isCollapsed ? 'justify-center px-0' : ''
                        } ${
                            isActive(profileUrl)
                                ? 'bg-tertiary-fixed text-black neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                : 'text-on-surface hover:bg-secondary-fixed hover:text-black neo-border border-transparent hover:border-black dark:hover:border-white hover:translate-x-1 active:scale-95'
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">manage_accounts</span>
                        {!isCollapsed && <span className="truncate">Profile / Settings</span>}
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        title={isCollapsed ? 'Logout' : undefined}
                        className={`w-full text-on-surface p-3 m-1 flex items-center gap-3 hover:bg-error hover:text-white neo-border border-transparent hover:border-black dark:hover:border-white rounded-xl hover:translate-x-1 transition-all active:scale-95 duration-100 ${
                            isCollapsed ? 'justify-center px-0' : ''
                        }`}
                    >
                        <span className="material-symbols-outlined shrink-0 text-xl">logout</span>
                        {!isCollapsed && <span className="truncate">Logout</span>}
                    </Link>
                </div>
            </nav>
        </>
    );
}
