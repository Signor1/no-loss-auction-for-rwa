'use client';

import React, { useState, useEffect } from 'react';

export const GovernanceLog = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGov = async () => {
            try {
                const res = await fetch('/api/transparency/governance');
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchGov();
    }, []);

    if (loading) return <div className="text-gray-400 p-6 animate-pulse">Querying governance state...</div>;
    if (!data) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border dark:border-gray-700">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8">Protocol Governance</h3>

            <section className="mb-10">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active System Proxies</h4>
                <div className="space-y-3">
                    {data.activeContracts.map((c: any) => (
                        <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div>
                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{c.name}</p>
                                <p className="text-[10px] font-mono text-gray-400">{c.address.substring(0, 16)}...</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {c.status}
                                </span>
                                <p className="text-[10px] text-gray-500 font-bold mt-1">v{c.version}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Governance Actions</h4>
                <div className="space-y-4">
                    {data.recentGovernanceActions.map((log: any) => (
                        <div key={log._id} className="relative pl-6 pb-4 border-l-2 border-gray-100 dark:border-gray-700 last:pb-0">
                            <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-indigo-500"></div>
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-300">{log.action} on {log.resource}</p>
                                <span className="text-[10px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">TX Hash: {log.hash.substring(0, 20)}...</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Verification Badge */}
            <div className="mt-8 p-4 bg-gradient-to-br from-indigo-900 to-black text-white rounded-2xl flex items-center justify-between shadow-2xl">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Governance Type</p>
                    <p className="text-sm font-bold mt-0.5 italic">Community-Led DAO Model</p>
                </div>
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
            </div>
        </div>
    );
};
