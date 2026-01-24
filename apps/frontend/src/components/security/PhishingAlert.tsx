'use client';

import React, { useState, useEffect } from 'react';

export const PhishingAlert = () => {
    const [isSafe, setIsSafe] = useState(true);
    const [threat, setThreat] = useState('');

    useEffect(() => {
        const checkCurrentUrl = async () => {
            // In real app, we check document.location
            const url = window.location.href;
            if (url.includes('localhost')) return; // Ignore dev

            try {
                const res = await fetch(`/api/users/security/check-url?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!data.safe) {
                        setIsSafe(false);
                        setThreat(data.threat || 'Known malicious domain');
                    }
                }
            } catch (e) {
                // Fail safe
            }
        };
        checkCurrentUrl();
    }, []);

    if (isSafe) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[9999] animate-bounce-slow">
            <div className="bg-red-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between border-b-4 border-red-800">
                <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tighter text-lg">Phishing Warning!</h4>
                        <p className="text-xs opacity-90 font-bold">This domain ({window.location.hostname}) has been identified as a security risk: {threat}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsSafe(true)}
                    className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border border-white/20"
                >
                    I Understand the Risk
                </button>
            </div>
        </div>
    );
};
