'use client';

import React, { useState, useEffect } from 'react';

export const MultiSigWalletList = () => {
    const [wallets, setWallets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallets = async () => {
            try {
                const res = await fetch('/api/security/platform/multisigs');
                if (res.ok) {
                    setWallets(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchWallets();
    }, []);

    if (loading) return <div>Loading multisig wallets...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security & Governance Wallets</h3>
            <div className="space-y-4">
                {wallets.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                        <p className="text-sm text-gray-400 italic">No treasury wallets registered</p>
                    </div>
                ) : (
                    wallets.map((w) => (
                        <div key={w._id} className="p-4 border dark:border-gray-700 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-tight uppercase">{w.id}</h4>
                                <p className="text-[10px] font-mono text-gray-400 mt-1">{w.address}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold dark:text-gray-300">{w.requiredSignatures}/{w.owners.length}</span>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">Required Signatures</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
