'use client';

import React, { useState, useEffect } from 'react';

export const SecurityTokenStatus = ({ assetId }: { assetId: string }) => {
    const [eligibility, setEligibility] = useState<{ allowed: boolean; reason?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch(`/api/compliance/securities/eligibility/${assetId}`);
                if (res.ok) {
                    setEligibility(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (assetId) check();
    }, [assetId]);

    if (loading) return <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>;

    return (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${eligibility?.allowed ? 'bg-green-50 border-green-200 dark:bg-green-900/10' : 'bg-red-50 border-red-200 dark:bg-red-900/10'}`}>
            <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-3 ${eligibility?.allowed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                    <span className="text-sm font-semibold dark:text-white">
                        {eligibility?.allowed ? 'Eligible to Invest' : 'Restricted'}
                    </span>
                    {!eligibility?.allowed && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{eligibility?.reason}</p>
                    )}
                </div>
            </div>
            {eligibility?.allowed ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-300">Verified</span>
            ) : (
                <button className="text-[10px] font-bold underline uppercase text-red-700 dark:text-red-300 hover:opacity-80">
                    Fix Issues
                </button>
            )}
        </div>
    );
};
