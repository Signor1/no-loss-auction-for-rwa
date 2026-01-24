'use client';

import React, { useState, useEffect } from 'react';

export const AlertCenter = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/security/alerts?status=open');
            if (res.ok) {
                setAlerts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (alertId: string) => {
        try {
            const res = await fetch('/api/security/alerts/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, resolution: 'Handled via dashboard' })
            });
            if (res.ok) {
                fetchAlerts();
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        fetchAlerts();
    }, []);

    if (loading) return <div>Loading alerts...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 border-red-50 dark:border-red-900/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase italic">Security Incident Center</h3>
            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="text-center py-10 bg-green-50 dark:bg-green-900/10 rounded-xl">
                        <svg className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm font-bold text-green-700">No active incidents</p>
                    </div>
                ) : (
                    alerts.map((a) => (
                        <div key={a._id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{a.severity} Risk</span>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{a.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.description}</p>
                                </div>
                                <button
                                    onClick={() => handleResolve(a._id)}
                                    className="bg-white dark:bg-gray-700 px-3 py-1 text-xs font-bold rounded shadow-sm hover:shadow-md transition"
                                >
                                    Dismiss
                                </button>
                            </div>
                            <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 flex justify-between items-center italic">
                                <span className="text-[10px] text-gray-400">Triggered: {new Date(a.triggeredAt).toLocaleString()}</span>
                                <span className="text-[10px] font-mono text-indigo-500 font-bold">{a.source}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
