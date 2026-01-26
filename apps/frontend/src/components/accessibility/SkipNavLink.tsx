'use client';

import React from 'react';

export const SkipNavLink = () => {
    return (
        <a
            href="#main-content"
            className="fixed top-[-100px] left-4 z-[10000] bg-indigo-600 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest focus:top-4 transition-all"
        >
            Skip to Main Content
        </a>
    );
};
