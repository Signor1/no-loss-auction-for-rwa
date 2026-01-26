'use client';

import React, { useState, useEffect } from 'react';
import { WelcomeHero } from '../../components/onboarding/WelcomeHero';
import { WalletGuide } from '../../components/onboarding/WalletGuide';
import { PlatformTour } from '../../components/onboarding/PlatformTour';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProgress = async () => {
            try {
                const res = await fetch('/api/users/onboarding/progress');
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'completed') {
                        window.location.href = '/dashboard';
                    } else if (data.lastStep) {
                        // setStep(parseInt(data.lastStep));
                    }
                }
            } catch (e) { } finally {
                setLoading(false);
            }
        };
        checkProgress();
    }, []);

    const nextStep = async (s: number) => {
        setStep(s);
        try {
            await fetch('/api/users/onboarding/progress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: s.toString(), status: 'in-progress' })
            });
        } catch (e) { }
    };

    const complete = async () => {
        try {
            await fetch('/api/users/onboarding/complete', { method: 'POST' });
            window.location.href = '/dashboard';
        } catch (e) { }
    };

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-black text-indigo-600 font-black italic tracking-tighter text-4xl animate-pulse">BOOTING COMMAND CENTER...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-500 overflow-x-hidden">
            {/* Top Navigation */}
            <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg shadow-xl shadow-indigo-500/20"></div>
                    <span className="font-black text-xl tracking-tighter dark:text-white uppercase italic">NoLoss</span>
                </div>
                <button
                    onClick={complete}
                    className="text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-600 transition"
                >
                    Skip Onboarding
                </button>
            </nav>

            <main className="container mx-auto px-4 py-16">
                {step === 1 && <WelcomeHero onNext={() => nextStep(2)} />}
                {step === 2 && <WalletGuide onNext={() => nextStep(3)} />}
                {step === 3 && <PlatformTour onNext={complete} />}
            </main>

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-900 pointer-events-none">
                <div
                    className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>

            {/* Visual Deco */}
            <div className="fixed -bottom-40 -left-40 h-[600px] w-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed -top-40 -right-40 h-[600px] w-[600px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
    );
}
