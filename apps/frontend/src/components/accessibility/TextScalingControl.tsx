'use client';

import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const TextScalingControl = () => {
    const { textScaling, setTextScaling } = useAccessibility();

    return (
        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border dark:border-gray-700">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Size</span>
            <div className="flex space-x-1">
                {[1, 1.25, 1.5].map((scale) => (
                    <button
                        key={scale}
                        onClick={() => setTextScaling(scale)}
                        aria-label={`Set text scaling to ${scale * 100}%`}
                        className={`h-8 w-8 rounded-lg font-black text-xs transition-all ${textScaling === scale ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {scale === 1 ? 'A' : scale === 1.25 ? 'A+' : 'A++'}
                    </button>
                ))}
            </div>
        </div>
    );
};
