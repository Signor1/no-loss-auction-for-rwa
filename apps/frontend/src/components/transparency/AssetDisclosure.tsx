'use client';

import React, { useState, useEffect } from 'react';

export const AssetDisclosure = ({ assetId }: { assetId: string }) => {
    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisclosure = async () => {
            try {
                const res = await fetch(`/api/transparency/assets/${assetId}/disclosure`);
                if (res.ok) {
                    setAsset(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (assetId) fetchDisclosure();
    }, [assetId]);

    if (loading) return <div className="text-gray-400 p-6 animate-pulse">Scanning digital vault...</div>;
    if (!asset) return null;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 shadow-2xl rounded-[2rem] p-10 border dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Official Disclosure</span>
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mt-4">{asset.title}</h3>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Est. Valuation</p>
                    <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter mt-1">{asset.valuation.estimatedValue.toLocaleString()} {asset.valuation.currency}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="space-y-8">
                    <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ownership Provenance</h4>
                        <div className="space-y-3">
                            {asset.ownership.ownershipHistory.map((h: any, i: number) => (
                                <div key={i} className="flex items-center space-x-3 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-gray-500 font-mono text-[10px]">{new Date(h.acquisitionDate).toLocaleDateString()}</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-300 capitalize">{h.acquisitionMethod}</span>
                                    <span className="text-gray-400 text-xs">by {h.owner.substring(0, 8)}...</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Asset Attributes</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(asset.metadata.attributes || {}).map(([k, v]: [string, any]) => (
                                <div key={k} className="p-3 bg-white dark:bg-black/20 rounded-xl border dark:border-gray-800">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-tight">{k}</p>
                                    <p className="text-xs font-bold dark:text-gray-300 mt-1">{String(v)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800/50 p-8 rounded-3xl border-2 border-indigo-50 dark:border-indigo-900/30">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Verified Documentation</h4>
                    <div className="space-y-4">
                        {asset.documents.map((doc: any, i: number) => (
                            <a
                                key={i}
                                href={doc.url}
                                target="_blank"
                                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group transition border border-transparent hover:border-indigo-100"
                            >
                                <div className="h-10 w-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 transition">
                                    <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">{doc.title}</p>
                                    <p className="text-[10px] text-gray-500 font-bold">{(doc.size / 1024).toFixed(1)} KB • {doc.type}</p>
                                </div>
                                <svg className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        ))}
                    </div>
                    <div className="mt-10 p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 text-center">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest leading-relaxed">
                            This factsheet is cryptographically tied to Asset ID: {asset._id}
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};
