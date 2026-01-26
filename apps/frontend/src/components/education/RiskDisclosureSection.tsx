'use client';

import React from 'react';

export const RiskDisclosureSection = ({ disclosures }: { disclosures: any[] }) => {
    return (
        <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] p-10 shadow-inner">
            <div className="flex items-center space-x-4 mb-8">
                <div className="h-12 w-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-red-700 dark:text-red-500 uppercase tracking-tighter italic leading-none">Critical Risk Disclosures</h3>
                    <p className="text-xs font-bold text-red-600/60 uppercase tracking-widest mt-1">Regulatory & Protocol Safety Information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {disclosures.map((d) => (
                    <div key={d._id} className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight">{d.title}</h4>
                        <p className="text-xs text-red-700 dark:text-red-400 opacity-80 leading-relaxed font-medium">
                            {d.content}
                        </p>
                    </div>
                ))}
            </div>

            <p className="mt-10 text-[10px] text-red-600/40 text-center uppercase font-black tracking-[0.2em] leading-loose">
                Institutional-Grade Compliance Monitoring Active • Verifiable Risk Framework v2.1
            </p>
        </div>
    );
};
