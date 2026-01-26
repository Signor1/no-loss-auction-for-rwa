'use client';

import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ContrastToggle = () => {
    const { highContrast, setHighContrast } = useAccessibility();

    return (
        <button
            onClick={() => setHighContrast(!highContrast)}
            aria-label={highContrast ? "Disable High Contrast Mode" : "Enable High Contrast Mode"}
            aria-pressed={highContrast}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${highContrast ? 'bg-black text-white border-2 border-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
        >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" /></svg>
            <span>Contrast</span>
            <div className={`h-2 w-2 rounded-full ${highContrast ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        </button>
    );
};
