'use client';

import React, { useState, useEffect } from 'react';

export const FinancialReconciliation = () => {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const res = await fetch('/api/security/trail/financial');
                if (res.ok) {
                    setAudits(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, []);

    if (loading) return <div className="text-gray-400 font-mono text-xs">Syncing financial state...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 italic">Reserve & Reconciliation</h3>
            <div className="space-y-6">
                {audits.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl text-center">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No recent proofs of reserve</p>
                    </div>
                ) : (
                    audits.map((a) => (
                        <div key={a._id} className="p-5 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{a.type.replace('_', ' ')}</span>
                                    <h4 className="text-lg font-bold dark:text-white mt-0.5">{new Date(a.auditDate).toLocaleDateString()}</h4>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${a.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {a.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-black/20 p-4 rounded-lg">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">System Ledger</p>
                                    <p className="text-sm font-bold dark:text-gray-300">{a.systemBalance.toLocaleString()} {a.currency}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">Actual Balance</p>
                                    <p className="text-sm font-bold dark:text-gray-300">{a.actualBalance.toLocaleString()} {a.currency}</p>
                                </div>
                            </div>
                            {a.discrepancy !== 0 && (
                                <p className="mt-3 text-xs text-red-500 font-bold">⚠️ Discrepancy: {a.discrepancy.toLocaleString()} {a.currency}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
