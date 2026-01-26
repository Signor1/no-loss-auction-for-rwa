'use client';

import React, { useState } from 'react';

const TOUR_STEPS = [
    { title: 'Live Auctions', desc: 'Browse and participate in institutional-grade RWA auctions with no-loss guarantees.', img: 'auctions' },
    { title: 'Portfolio Command', desc: 'Monitor your fractional shares, yield, and secondary market performance.', img: 'portfolio' },
    { title: 'Compliance Hub', desc: 'Manage your KYC and jurisdictional access in one secure location.', img: 'compliance' }
];

export const PlatformTour = ({ onNext }: { onNext: () => void }) => {
    const [active, setActive] = useState(0);

    return (
        <div className="max-w-6xl mx-auto py-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-4 space-y-12">
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">The Grand Tour</h3>
                    <div className="space-y-4">
                        {TOUR_STEPS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`w-full text-left p-6 rounded-3xl transition-all duration-300 border-2 ${active === i ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-xl' : 'bg-white dark:bg-gray-800 text-gray-500 border-transparent hover:border-indigo-100'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60">Module {i + 1}</span>
                                <h4 className="text-xl font-black uppercase tracking-tight">{s.title}</h4>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onNext}
                        className="w-full py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition"
                    >
                        Finish & Proceed
                    </button>
                </div>

                <div className="lg:col-span-8">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-[3rem] p-10 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-2xl relative overflow-hidden">
                        <div className="text-center z-10">
                            <div className="h-20 w-20 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter uppercase">{TOUR_STEPS[active].title}</h2>
                            <p className="text-lg text-gray-500 max-w-md mx-auto font-medium">{TOUR_STEPS[active].desc}</p>
                        </div>
                        {/* Abstract background */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 font-bold text-[30rem] select-none pointer-events-none text-indigo-600">
                            {active + 1}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
