'use client';

import React from 'react';

export const WalletGuide = ({ onNext }: { onNext: () => void }) => {
    return (
        <div className="max-w-4xl mx-auto py-10 animate-in slide-in-from-right duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-gray-700">
                <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-1/2 p-12 bg-indigo-600 text-white flex flex-col justify-between">
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase italic">Secure Connection</h2>
                            <p className="text-indigo-100 leading-relaxed font-medium">To participate in RWA auctions, you need a secure portal to the blockchain. We recommend MetaMask or Coinbase Wallet.</p>
                        </div>
                        <div className="mt-10 p-6 bg-white/10 rounded-2xl border border-white/20">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-2 text-indigo-300">Security Tip</h4>
                            <p className="text-[10px] uppercase font-black leading-normal italic opacity-90">
                                Never share your seed phrase. Our platform will NEVER ask for it. Only sign transactions that you initiate.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 p-12 space-y-10">
                        <div className="space-y-8">
                            {[
                                { step: '01', title: 'Install Wallet', desc: 'Securely install a browser extension or mobile app.' },
                                { step: '02', title: 'Fund Account', desc: 'Ensure you have USDC or ETH on the Base L2 network.' },
                                { step: '03', title: 'Connect & Sign', desc: 'Authorize the platform to view your public address.' }
                            ].map((s) => (
                                <div key={s.step} className="flex items-start space-x-6">
                                    <span className="text-3xl font-black text-indigo-600/20 italic">{s.step}</span>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{s.title}</h3>
                                        <p className="text-sm text-gray-400 font-medium mt-1 leading-snug">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={onNext}
                            className="w-full py-5 bg-gray-900 text-white dark:bg-white dark:text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black dark:hover:bg-gray-100 transition-all"
                        >
                            Connect My Wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
