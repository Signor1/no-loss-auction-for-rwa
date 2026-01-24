'use client';

import React, { useState, useEffect } from 'react';

export const EncryptionStatus = () => {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('/api/security/platform/summary');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data.metrics || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div>Loading encryption status...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Infrastructure Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((m) => (
                    <div key={m._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{m.name}</p>
                            <p className="text-sm font-bold dark:text-gray-200 mt-0.5">{String(m.value)}</p>
                        </div>
                        <div className={`p-1.5 rounded-full ${m.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
