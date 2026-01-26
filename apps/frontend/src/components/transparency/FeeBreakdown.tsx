'use client';

import React, { useState, useEffect } from 'react';

export const FeeBreakdown = () => {
    const [fees, setFees] = useState<any>(null);

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const res = await fetch('/api/transparency/fees');
                setFees(await res.json());
            } catch (e) { }
        };
        fetchFees();
    }, []);

    if (!fees) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border dark:border-gray-700">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8">Platform Fee Structure</h3>
            <div className="space-y-6">
                {[
                    { label: 'Asset Primary Sale', value: fees.primarySaleFee, desc: 'Applied to the winning bid of a new issuance' },
                    { label: 'Secondary Market', value: fees.secondaryMarketFee, desc: 'Trading fee for p2p asset transfers' },
                    { label: 'Protocol Service', value: fees.protocolFee, desc: 'Base infrastructure maintenance fee' },
                    { label: 'Treasury Withdrawal', value: fees.withdrawalFee, desc: 'Transfer to external fiat or crypto wallet' }
                ].map((f, i) => (
                    <div key={i} className="group py-4 border-b dark:border-gray-700 last:border-0">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition">{f.label}</h4>
                                <p className="text-[10px] text-gray-500 font-bold">{f.desc}</p>
                            </div>
                            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tighter">{f.value}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 pt-8 border-t dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gas Optimized logic active</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">Last Update: {new Date(fees.lastUpdated).toLocaleDateString()}</p>
            </div>
        </div>
    );
};
