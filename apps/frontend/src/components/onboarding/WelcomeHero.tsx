'use client';

import React from 'react';

export const WelcomeHero = ({ onNext }: { onNext: () => void }) => {
    return (
        <div className="text-center animate-in fade-in zoom-in duration-1000">
            <div className="inline-flex items-center space-x-2 mb-6 bg-indigo-50 dark:bg-indigo-900/30 px-6 py-2 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Deployment Success v1.0</span>
            </div>

            <h1 className="text-7xl md:text-9xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.8] mb-8">
                Welcome to the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Future of RWA.</span>
            </h1>

            <p className="max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-12 font-medium">
                You're just minutes away from participating in secure, no-loss auctions for high-trust real world assets. Let's set up your command center.
            </p>

            <button
                onClick={onNext}
                className="group relative px-12 py-5 bg-gray-900 text-white dark:bg-white dark:text-black font-black text-xl uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
            >
                <div className="relative z-10 flex items-center space-x-3">
                    <span>Initialize Onboarding</span>
                    <svg className="h-6 w-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <div className="mt-16 flex justify-center items-center space-x-12 opacity-40 grayscale">
                <img src="/base-logo.svg" alt="Base" className="h-6" />
                <img src="/ethereum-logo.svg" alt="Ethereum" className="h-8" />
                <img src="/verified-badge.svg" alt="Verified" className="h-6" />
            </div>
        </div>
    );
};
