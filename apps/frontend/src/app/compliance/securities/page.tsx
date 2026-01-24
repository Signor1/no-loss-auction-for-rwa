import React from 'react';
import { AccreditationForm } from '../../../components/compliance/AccreditationForm';
import { SecurityTokenStatus } from '../../../components/compliance/SecurityTokenStatus';
import { DisclosureList } from '../../../components/compliance/DisclosureList';

export default function SecuritiesPage() {
    // In a real app we'd get current asset context if browsing specific asset, 
    // or show overall investor status. Showcasing global status here.
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Securities Compliance</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage investor accreditation and view asset-specific transfer restrictions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <AccreditationForm />
                    <div className="bg-indigo-900 text-white p-6 rounded-lg shadow-lg">
                        <h4 className="font-bold mb-2">SEC Regulation D / Rule 506(c)</h4>
                        <p className="text-xs opacity-80 leading-relaxed">
                            Under US law, Rule 506(c) allows issuers to broadly solicit and generally advertise an offering, provided that all purchasers in the offering are accredited investors.
                        </p>
                        <div className="mt-4 pt-4 border-t border-indigo-800 flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Verified by platform</span>
                            <div className="h-5 w-5 bg-green-400 rounded-full flex items-center justify-center">
                                <svg className="h-3 w-3 text-indigo-900" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Active Compliance Monitoring</h3>
                        <p className="text-sm text-gray-500 mb-6">Real-time status for tracked security tokens in your portfolio.</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Asset: NYC Commercial Real Estate fund</span>
                                    <span className="text-[10px] text-gray-400">ID: asset_88291</span>
                                </div>
                                <SecurityTokenStatus assetId="asset_88291" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Asset: Global Green Bond Fund</span>
                                    <span className="text-[10px] text-gray-400">ID: asset_bond_v1</span>
                                </div>
                                <SecurityTokenStatus assetId="asset_bond_v1" />
                            </div>
                        </div>
                    </div>

                    <DisclosureList assetId="global" />
                </div>
            </div>
        </div>
    );
}
