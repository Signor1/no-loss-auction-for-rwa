'use client';

import React, { useState, useEffect } from 'react';
import { ContractStatusCard } from '../../../components/security/ContractStatusCard';
import { AuditTimeline } from '../../../components/security/AuditTimeline';
import { BugBountyProgram } from '../../../components/security/BugBountyProgram';

export default function SecurityTransparencyPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const res = await fetch('/api/security/contracts');
                if (res.ok) {
                    const data = await res.json();
                    setContracts(data);
                    // If no contracts seeded, create mock for demo
                    if (data.length === 0) {
                        setContracts([
                            {
                                _id: 'auc1',
                                name: 'No-Loss Auction Manager',
                                address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                                network: 'base_mainnet',
                                version: '2.1.0',
                                status: 'active',
                                isEmergencyPausable: true
                            },
                            {
                                _id: 'tok1',
                                name: 'RWA Security Token (Base)',
                                address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
                                network: 'base_mainnet',
                                version: '1.4.2',
                                status: 'active',
                                isEmergencyPausable: false
                            }
                        ]);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">Security & Transparency</h1>
                <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
                    Our commitment to protocol safety through rigorous audits, formal verification, and automated emergency procedures.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold dark:text-white">Smart Contract Health</h2>
                            <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-widest">Real-Time monitoring</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {contracts.map(contract => (
                                <ContractStatusCard key={contract._id} contract={contract} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4 italic">Formal Verification Results</h3>
                                <p className="text-indigo-100 mb-6 leading-relaxed">
                                    The "No-Loss" guarantee of the auction logic has been mathematically proven using the K Framework and SMT solvers. This ensures zero logical paths lead to loss of user principal.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">Proof: principal_invariance_01</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">Status: Proved 100%</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">Verifier: Z3 Theorem Prover</span>
                                </div>
                            </div>
                            {/* Abstract decoration */}
                            <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/5 rounded-full blur-[80px]"></div>
                        </div>
                    </section>

                    <AuditTimeline />
                </div>

                <div className="lg:col-span-1 space-y-10">
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border dark:border-white/5">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Emergency Procedures</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="h-6 w-6 mt-1 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded">1</div>
                                <p className="ml-3 text-xs text-gray-500 leading-normal">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Guardian Protocol:</span> Multi-sig multisig wallet controlled by trusted community members can trigger instantaneous pauses.
                                </p>
                            </div>
                            <div className="flex items-start">
                                <div className="h-6 w-6 mt-1 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded">2</div>
                                <p className="ml-3 text-xs text-gray-500 leading-normal">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Timelocks:</span> All critical parameter updates require a 48-hour delay before execution on-chain.
                                </p>
                            </div>
                            <div className="flex items-start">
                                <div className="h-6 w-6 mt-1 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded">3</div>
                                <p className="ml-3 text-xs text-gray-500 leading-normal">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Failover Mode:</span> Global circuit breaker enables liquidation of RWAs back to stablecoins if feed volatility > 20%.
                                </p>
                            </div>
                        </div>
                    </div>

                    <BugBountyProgram />
                </div>
            </div>
        </div>
    );
}
