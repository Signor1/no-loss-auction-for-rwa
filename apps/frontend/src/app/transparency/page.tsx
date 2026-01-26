'use client';

import React from 'react';
import { PublicLedger } from '../../../components/transparency/PublicLedger';
import { FeeBreakdown } from '../../../components/transparency/FeeBreakdown';
import { GovernanceLog } from '../../../components/transparency/GovernanceLog';

export default function TransparencyPortalPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <header className="mb-20 text-center xl:text-left xl:max-w-4xl">
                <div className="inline-flex items-center space-x-2 mb-4 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Platform Transparency Protocol 1.0</span>
                </div>
                <h1 className="text-6xl xl:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">
                    Radical Openness <br /> <span className="text-indigo-600">Built-in.</span>
                </h1>
                <p className="mt-8 text-xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                    Our commitment to verifiable operations. Explore the public ledger, audit governance actions, and review our fee structures in real-time.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <PublicLedger />

                    {/* Open Source Section */}
                    <section className="bg-gray-50 dark:bg-gray-900/50 p-10 rounded-[2.5rem] border dark:border-gray-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Open Source Core</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm max-w-md">
                                    All core protocol logic, smart contracts, and frontend components are open-source. Verification is the ultimate form of trust.
                                </p>
                            </div>
                            <a
                                href="https://github.com/Signor1/no-loss-auction-for-rwa"
                                target="_blank"
                                className="flex items-center space-x-4 bg-white dark:bg-gray-800 px-8 py-4 rounded-2xl shadow-sm hover:shadow-xl transition border dark:border-gray-700"
                            >
                                <svg className="h-6 w-6 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Project GitHub</p>
                                    <p className="text-sm font-bold dark:text-gray-200">Examine Source Code</p>
                                </div>
                            </a>
                        </div>
                    </section>

                    <section className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Public Documentation</h3>
                                <p className="text-indigo-100 text-sm max-w-sm">
                                    Comprehensive guides on protocol architecture, jurisdictional rules, and fee calculations.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {['Governance', 'Risk Framework', 'User Safety', 'Integration API'].map(link => (
                                    <button key={link} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition border border-white/10">
                                        {link}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Abstract Art */}
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-12"></div>
                        <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-white/5 rounded-full blur-3xl"></div>
                    </section>
                </div>

                <div className="lg:col-span-1 space-y-12">
                    <FeeBreakdown />
                    <GovernanceLog />

                    <div className="p-8 bg-black dark:bg-gray-900 rounded-[2.5rem] text-white border border-white/5 shadow-2xl">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Real-Time Sync</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            This transparency portal is directly linked to our main sequence on-chain event stream. Changes are reflected with sub-second latency across all modules.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
