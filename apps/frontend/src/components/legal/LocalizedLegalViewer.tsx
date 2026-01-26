'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';

export const LocalizedLegalViewer = ({ assetId }: { assetId: string }) => {
    const { language, t } = useI18n();
    const [disclosures, setDisclosures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLegal = async () => {
            try {
                // Fetch disclosures for current language, fallback to 'en' is handled on backend if we wanted, 
                // but here we specifically ask for the current language.
                const res = await fetch(`/api/securities/assets/${assetId}/disclosures?lang=${language}`);
                if (res.ok) {
                    setDisclosures(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (assetId) fetchLegal();
    }, [assetId, language]);

    if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border dark:border-gray-700 shadow-xl">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 italic">
                {t('navigation.help')} - Legal Disclosures ({language.toUpperCase()})
            </h3>

            {disclosures.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-bold uppercase tracking-widest text-center italic">
                        No translated documents available for this locale. Please refer to English versions.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {disclosures.map((d) => (
                        <div key={d._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase">{d.title}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{d.authority} • {new Date(d.filingDate).toLocaleDateString()}</p>
                            </div>
                            <a
                                href={d.documentUrl}
                                target="_blank"
                                className="h-10 w-10 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                aria-label={`View document ${d.title}`}
                            >
                                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
