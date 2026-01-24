'use client';

import React, { useState } from 'react';

export const ReportGenerator = () => {
    const [generating, setGenerating] = useState(false);

    const downloadCSV = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/security/trail/export');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-2xl font-black italic tracking-tighter mb-4 uppercase">Log Generation Center</h3>
                <p className="text-indigo-200 text-sm leading-relaxed mb-8 opacity-80">
                    Securely export complete transaction and system history for regulatory filing or internal compliance review.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={downloadCSV}
                        disabled={generating}
                        className="w-full py-4 bg-white text-indigo-900 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-50 transition shadow-lg flex items-center justify-center space-x-3"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>{generating ? 'Compiling Ledger...' : 'Export FULL Audit Log (CSV)'}</span>
                    </button>

                    <button className="w-full py-4 bg-indigo-700 text-indigo-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-800 transition border border-indigo-600 flex items-center justify-center space-x-3 opacity-50 cursor-not-allowed">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Generate PDF Certification</span>
                    </button>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none pointer-events-none">
                TRAIL
            </div>
            <div className="absolute -left-10 -bottom-10 h-48 w-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>
    );
};
