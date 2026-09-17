import React, { useState } from 'react';

interface DynamicAtomProps {
    className?: string;
    size?: number;
    interactive?: boolean;
}

export default function DynamicAtom({
    className = '',
    size = 280,
    interactive = true,
}: DynamicAtomProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`relative flex items-center justify-center select-none bg-transparent transition-transform duration-500 ease-out shrink-0 ${
                isHovered ? 'scale-105' : 'scale-100'
            } ${className}`}
            style={{ width: size, height: size }}
            onMouseEnter={() => interactive && setIsHovered(true)}
            onMouseLeave={() => interactive && setIsHovered(false)}
        >
            <svg
                viewBox="36 22 228 256"
                className="w-full h-full text-[#b85b6c] dark:text-[#f4a6b5] overflow-visible transition-colors duration-300 bg-transparent"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="nucleus-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="currentColor" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    <filter id="electron-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Central Quantum Energy Ripple Waves */}
                <circle
                    cx="150"
                    cy="150"
                    r="28"
                    fill="url(#nucleus-glow)"
                    className="origin-center animate-ping"
                    style={{
                        animationDuration: isHovered ? '1.5s' : '3s',
                    }}
                />

                {/* Orbit 1: Vertical (0 deg) */}
                <g transform="rotate(0, 150, 150)">
                    <ellipse
                        cx="150"
                        cy="150"
                        rx="40"
                        ry="115"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all duration-300 opacity-90"
                    />
                    <g filter="url(#electron-glow)">
                        <circle
                            r="7.5"
                            className="fill-white dark:fill-slate-900 stroke-current stroke-[3.5] transition-colors"
                        >
                            <animateMotion
                                path="M 150,35 A 40 115 0 1 1 150,265 A 40 115 0 1 1 150,35 Z"
                                dur={isHovered ? '2.4s' : '4.6s'}
                                repeatCount="indefinite"
                            />
                        </circle>
                    </g>
                </g>

                {/* Orbit 2: Tilted Clockwise (+60 deg) */}
                <g transform="rotate(60, 150, 150)">
                    <ellipse
                        cx="150"
                        cy="150"
                        rx="40"
                        ry="115"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all duration-300 opacity-90"
                    />
                    <g filter="url(#electron-glow)">
                        <circle
                            r="7.5"
                            className="fill-white dark:fill-slate-900 stroke-current stroke-[3.5] transition-colors"
                        >
                            <animateMotion
                                path="M 150,35 A 40 115 0 1 1 150,265 A 40 115 0 1 1 150,35 Z"
                                dur={isHovered ? '2.8s' : '5.4s'}
                                repeatCount="indefinite"
                                keyPoints="0.25;1;0.25"
                                keyTimes="0;0.75;1"
                            />
                        </circle>
                    </g>
                    <g filter="url(#electron-glow)">
                        <circle
                            r="6.5"
                            className="fill-white dark:fill-slate-900 stroke-current stroke-[3] opacity-85 transition-colors"
                        >
                            <animateMotion
                                path="M 150,35 A 40 115 0 1 1 150,265 A 40 115 0 1 1 150,35 Z"
                                dur={isHovered ? '2.8s' : '5.4s'}
                                repeatCount="indefinite"
                                keyPoints="0.75;1;0.75"
                                keyTimes="0;0.25;1"
                            />
                        </circle>
                    </g>
                </g>

                {/* Orbit 3: Tilted Counter-Clockwise (120 deg) */}
                <g transform="rotate(120, 150, 150)">
                    <ellipse
                        cx="150"
                        cy="150"
                        rx="40"
                        ry="115"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all duration-300 opacity-90"
                    />
                    <g filter="url(#electron-glow)">
                        <circle
                            r="7.5"
                            className="fill-white dark:fill-slate-900 stroke-current stroke-[3.5] transition-colors"
                        >
                            <animateMotion
                                path="M 150,35 A 40 115 0 1 1 150,265 A 40 115 0 1 1 150,35 Z"
                                dur={isHovered ? '2.1s' : '4.0s'}
                                repeatCount="indefinite"
                                keyPoints="0.6;1;0.6"
                                keyTimes="0;0.4;1"
                            />
                        </circle>
                    </g>
                </g>

                {/* Central Nucleus */}
                <circle
                    cx="150"
                    cy="150"
                    r="22"
                    fill="currentColor"
                    className="opacity-20 animate-pulse"
                />
                <circle
                    cx="150"
                    cy="150"
                    r="15"
                    fill="currentColor"
                    className="drop-shadow-sm"
                />
                <circle
                    cx="146"
                    cy="146"
                    r="4"
                    fill="#ffffff"
                    className="opacity-40 pointer-events-none"
                />
            </svg>
        </div>
    );
}
