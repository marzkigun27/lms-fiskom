import React from 'react';

interface ComicsBrandProps {
    className?: string;
    alt?: string;
}

export default function ComicsBrand({
    className = '',
    alt = 'COMICS - Computational Physics Laboratory',
}: ComicsBrandProps) {
    return (
        <img
            src="/images/comics-text.png"
            alt={alt}
            className={`w-full h-auto object-contain select-none pointer-events-none transition-all duration-300 dark:brightness-150 dark:contrast-110 dark:drop-shadow-[0_0_15px_rgba(244,166,181,0.35)] ${className}`}
            width={972}
            height={257}
            loading="eager"
            decoding="async"
        />
    );
}
