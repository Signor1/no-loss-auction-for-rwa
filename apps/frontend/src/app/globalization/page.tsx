'use client';

import React from 'react';
import { useI18n, i18nUtils } from '../../lib/i18n';
import { getCulturalAdaptation } from '../../utils/culturalAdaptation';
import { LocalizedLegalViewer } from '../../components/legal/LocalizedLegalViewer';

export default function GlobalizationPage() {
    const { language, t, formatDate, formatCurrency, isRTL } = useI18n();
    const cultural = getCulturalAdaptation(language);

    return (
        <div className="container mx-auto px-4 py-20 max-w-6xl">
            <header className="mb-20 text-center">
                <div className="inline-flex items-center space-x-2 mb-6 bg-indigo-50 dark:bg-indigo-900/30 px-6 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Global Protocol v4.0</span>
                </div>
                <h1 className="text-7xl xl:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-4 uppercase italic">
                    World Ready <br /> <span className="text-indigo-600">Local Feel.</span>
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Our platform scales across borders with native RTL support, localized legal documents, and cultural data adaptation.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    {/* Localization Samples */}
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-12 shadow-xl border dark:border-gray-700">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-10 italic">Data Localization</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency Format</p>
                                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900/30">
                                    <p className="text-4xl font-black text-indigo-600 font-mono tracking-tighter">{formatCurrency(1250000.50, 'USD')}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">Symbol: {cultural.currencySymbol}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date/Time Format</p>
                                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900/30">
                                    <p className="text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">{formatDate(new Date())}</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">Format: {cultural.dateFormat}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-8 bg-indigo-600 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Cultural Adaptation</h4>
                                <p className="text-2xl font-bold tracking-tight">Units: {cultural.measurementSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)'}</p>
                                <p className="text-xs mt-4 opacity-70 leading-relaxed font-medium">
                                    We automatically adjust distance units, document paper sizes, and calendar logic based on your selected locale: {i18nUtils.getLanguageDisplayName(language)}.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 h-full w-1/3 bg-white/10 skew-x-12 translate-x-10"></div>
                        </div>
                    </div>

                    <LocalizedLegalViewer assetId="global" />
                </div>

                <div className="lg:col-span-1 space-y-12">
                    <div className="p-10 bg-black dark:bg-gray-900 rounded-[2.5rem] text-white shadow-2xl">
                        <div className={`h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${isRTL ? 'mr-auto' : 'ml-0'}`}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">RTL Optimization</h3>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8">
                            Our layout engine dynamically flips mirrors, typography alignmets, and component ordering when an Right-To-Left language (like Arabic) is active.
                        </p>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Layout Direction: {isRTL ? 'RTL' : 'LTR'}</span>
                        </div>
                    </div>

                    {/* Translation Stats */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-10 rounded-[2.5rem] border dark:border-gray-700">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 px-2">Coverage Summary</h4>
                        <div className="space-y-6">
                            {[
                                { lang: 'English', level: 100 },
                                { lang: 'Español', level: 85 },
                                { lang: 'Français', level: 40 },
                                { lang: 'Arabic', level: 30 }
                            ].map((s) => (
                                <div key={s.lang} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                        <span>{s.lang}</span>
                                        <span className="text-indigo-600">{s.level}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${s.level}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
