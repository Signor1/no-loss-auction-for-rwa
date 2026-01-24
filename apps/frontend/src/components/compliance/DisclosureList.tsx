'use client';

import React, { useState, useEffect } from 'react';

export const DisclosureList = ({ assetId }: { assetId: string }) => {
    const [disclosures, setDisclosures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await fetch(`/api/compliance/securities/disclosures/${assetId}`);
                if (res.ok) {
                    setDisclosures(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (assetId) fetch();
    }, [assetId]);

    if (loading) return <div>Loading disclosures...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Regulatory Disclosures</h3>
            {disclosures.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-500 text-sm">No filings found for this asset.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {disclosures.map((d) => (
                        <div key={d._id} className="flex items-start justify-between p-3 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white capitalize">{d.title}</h4>
                                <div className="flex space-x-3 mt-1 text-[10px] text-gray-400 font-mono uppercase">
                                    <span>{d.type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{new Date(d.filingDate).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{d.authority}</span>
                                </div>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold">
                                View PDF
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
