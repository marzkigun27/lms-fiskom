import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <AppLogoIcon className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-black font-headline text-base">
                    COMICS
                </span>
                <span className="truncate text-[10px] uppercase font-label tracking-wider text-muted-foreground">
                    Computational Physics Lab
                </span>
            </div>
        </div>
    );
}
