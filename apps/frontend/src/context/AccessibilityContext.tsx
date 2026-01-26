'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityState {
    highContrast: boolean;
    textScaling: number; // 1, 1.25, 1.5
    reducedMotion: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
    setHighContrast: (val: boolean) => void;
    setTextScaling: (val: number) => void;
    setReducedMotion: (val: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [highContrast, setHighContrast] = useState(false);
    const [textScaling, setTextScaling] = useState(1);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        // Apply high contrast class to html
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [highContrast]);

    useEffect(() => {
        // Apply text scaling to html font-size
        document.documentElement.style.fontSize = `${textScaling * 100}%`;
    }, [textScaling]);

    return (
        <AccessibilityContext.Provider value={{
            highContrast,
            textScaling,
            reducedMotion,
            setHighContrast,
            setTextScaling,
            setReducedMotion
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
    return context;
};
