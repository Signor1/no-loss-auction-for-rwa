'use client';

import React from 'react';

interface CoinbaseButtonProps {
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children: React.ReactNode;
    icon?: boolean;
}

export function CoinbaseButton({
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    icon = true,
}: CoinbaseButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

    const variants = {
        primary: 'bg-[#0052FF] text-white hover:bg-[#0047DB]',
        secondary: 'bg-[#F0F3FA] text-[#0052FF] hover:bg-[#E1E6F0]',
        outline: 'border-2 border-[#0052FF] text-[#0052FF] hover:bg-[#F0F3FA]',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3.5 text-lg',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {icon && (
                <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                        fill="#0052FF"
                    />
                    <path
                        d="M7 12H17"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 7V17"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

export function CoinbaseLogo({ className = 'w-32' }: { className?: string }) {
    return (
        <div className={`flex items-center ${className}`}>
            <svg
                viewBox="0 0 156 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
            >
                <path
                    d="M12.42 24C5.55 24 0 18.6 0 12C0 5.4 5.55 0 12.42 0C19.29 0 24.84 5.4 24.84 12C24.84 18.6 19.29 24 12.42 24ZM12.42 4.8C8.55 4.8 5.46 7.92 5.46 12C5.46 16.08 8.55 19.2 12.42 19.2C16.29 19.2 19.38 16.08 19.38 12C19.38 7.92 16.29 4.8 12.42 4.8Z"
                    fill="#0052FF"
                />
                {/* Simplified rest of the logo for brevity in this mock */}
                <rect x="30" y="2" width="5" height="20" fill="#0052FF" />
                <rect x="40" y="2" width="5" height="20" fill="#0052FF" />
                <rect x="50" y="2" width="5" height="20" fill="#0052FF" />
                <rect x="60" y="2" width="5" height="20" fill="#0052FF" />
            </svg>
        </div>
    );
}

export function PoweredByCoinbase() {
    return (
        <div className="flex items-center space-x-2 text-gray-500 text-xs">
            <span>Powered by</span>
            <CoinbaseLogo className="w-16" />
        </div>
    );
}
