import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/comics-icon-logo.png"
            alt="COMICS"
            className={`object-contain select-none dark:brightness-125 ${className}`}
            {...props}
        />
    );
}
