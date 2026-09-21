import React, { useEffect, useState } from 'react';

interface LottieAnimationProps {
    src: string;
    className?: string;
    speed?: number;
    loop?: boolean;
    autoplay?: boolean;
}

export default function LottieAnimation({
    src,
    className = '',
    speed = 1,
    loop = true,
    autoplay = true,
}: LottieAnimationProps) {
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && customElements.get('lottie-player')) {
            setIsPlayerReady(true);
            return;
        }

        const existingScript = document.querySelector('script[src="/vendor/lottie/lottie-player.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsPlayerReady(true));
            if (customElements.get('lottie-player')) {
                setIsPlayerReady(true);
            }
            return;
        }

        const script = document.createElement('script');
        script.src = '/vendor/lottie/lottie-player.js';
        script.async = true;
        script.onload = () => setIsPlayerReady(true);
        document.body.appendChild(script);
    }, []);

    if (!isPlayerReady) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return React.createElement('lottie-player', {
        src,
        background: 'transparent',
        speed,
        loop,
        autoplay,
        style: { width: '100%', height: '100%' },
        className,
    });
}
