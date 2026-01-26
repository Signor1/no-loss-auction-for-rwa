'use client';

import React, { useState, useEffect } from 'react';

export const PublicLedger = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await fetch('/api/transparency/ledger');
                if (res.ok) {
                    setLogs(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, []);

    if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-4 bg-gray-200 rounded"></div></div></div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase italic">Public Transaction Ledger</h3>
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-10">No public records available yet.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition overflow-hidden">
                            <div className="flex items-center space-x-4 min-w-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{log.action}</p>
                                    <p className="text-[10px] text-gray-400 font-mono truncate">Hash: {log.hash.substring(0, 16)}...</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 px-2 py-0.5 rounded-full font-bold ml-auto">{log.source}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <p className="mt-8 text-[10px] text-gray-400 text-center uppercase font-black tracking-widest leading-loose">
                Verified Cryptographic History • Powered by Base
            </p>
        </div>
    );
};
