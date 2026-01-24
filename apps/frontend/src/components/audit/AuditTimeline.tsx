'use client';

import React, { useState, useEffect } from 'react';

export const AuditTimeline = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [integrity, setIntegrity] = useState<{ valid: boolean; brokenAt?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const checkIntegrity = async () => {
        try {
            const res = await fetch('/api/security/trail/verify');
            if (res.ok) {
                setIntegrity(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/security/logs?limit=30');
            if (res.ok) {
                setEvents(await res.json());
                checkIntegrity();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    if (loading) return <div>Loading audit records...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Immutable Audit Trail</h3>
                    <p className="text-xs text-gray-500 font-mono">Proof-of-Integrity: {integrity?.valid ? <span className="text-green-600 font-bold">VERIFIED</span> : <span className="text-red-600 font-bold">TAMPERED</span>}</p>
                </div>
                <button
                    onClick={fetchEvents}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            <div className="space-y-4">
                {events.map((e, i) => (
                    <div key={e._id} className="group relative flex space-x-6 pb-6">
                        {/* Connecting Line */}
                        {i !== events.length - 1 && <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700"></div>}

                        <div className={`z-10 h-6 w-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm ${e.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(e.timestamp).toLocaleString()}</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-500">{e.source}</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-white mt-1 group-hover:text-indigo-600 transition tracking-tight">
                                {e.action} on <span className="opacity-50">{e.resource}</span>
                            </h4>
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-[10px] font-mono text-gray-400 break-all leading-relaxed">
                                <p>Hash: {e.hash}</p>
                                <p className="opacity-40">Link: {e.previousHash || 'ROOT_ORIGIN'}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
