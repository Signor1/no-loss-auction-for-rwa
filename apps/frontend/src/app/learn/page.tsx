'use client';

import React, { useState, useEffect } from 'react';
import { FAQAccordion } from '../../../components/education/FAQAccordion';
import { TutorialCard } from '../../../components/education/TutorialCard';
import { GlossaryEntry } from '../../../components/education/GlossaryEntry';
import { RiskDisclosureSection } from '../../../components/education/RiskDisclosureSection';

export default function KnowledgeBasePage() {
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tutorials');

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch('/api/help/content');
                if (res.ok) {
                    setContent(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const filterByType = (type: string) => content.filter(c => c.type === type);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-black font-black text-4xl animate-pulse text-indigo-600 italic tracking-tighter">LOADING KNOWLEDGE BASE...</div>;

    return (
        <div className="container mx-auto px-4 py-20 max-w-7xl">
            <header className="mb-24 text-center">
                <div className="inline-flex items-center space-x-2 mb-6 bg-indigo-50 dark:bg-indigo-900/30 px-6 py-2 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Platform Academy v3.2</span>
                </div>
                <h1 className="text-7xl xl:text-9xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-4 uppercase">
                    Learn & <span className="text-indigo-600">Grow.</span>
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Master the mechanics of RWA tokenization and no-loss auctions with our institutional-grade educational resources.
                </p>
            </header>

            <div className="flex flex-wrap justify-center gap-4 mb-20">
                {['tutorials', 'guides', 'faq', 'glossary', 'risks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-xl ${activeTab === tab ? 'bg-indigo-600 text-white scale-110' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <main className="min-h-[600px] animate-in fade-in slide-in-from-bottom-5 duration-700">
                {activeTab === 'tutorials' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filterByType('tutorial').map(t => <TutorialCard key={t._id} tutorial={t} />)}
                    </div>
                )}

                {activeTab === 'guides' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {filterByType('guide').map(g => (
                            <div key={g._id} className="p-10 bg-white dark:bg-gray-800 rounded-[3rem] border dark:border-gray-700 shadow-sm hover:shadow-2xl transition-shadow group">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter italic">{g.title}</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-10 min-h-[100px]">
                                    {g.content}
                                </div>
                                <button className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center group-hover:translate-x-2 transition-transform">
                                    Read Full Guide <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="max-w-3xl mx-auto">
                        <FAQAccordion faqs={filterByType('faq')} />
                    </div>
                )}

                {activeTab === 'glossary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filterByType('glossary').map(item => <GlossaryEntry key={item._id} item={item} />)}
                    </div>
                )}

                {activeTab === 'risks' && (
                    <div className="max-w-5xl mx-auto">
                        <RiskDisclosureSection disclosures={filterByType('risk_disclosure')} />
                    </div>
                )}
            </main>

            <footer className="mt-32 pt-20 border-t dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em] mb-10">Still have questions?</p>
                <button className="px-12 py-5 bg-black text-white dark:bg-white dark:text-black font-black text-sm uppercase tracking-widest rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    Chat with Support
                </button>
            </footer>
        </div>
    );
}
