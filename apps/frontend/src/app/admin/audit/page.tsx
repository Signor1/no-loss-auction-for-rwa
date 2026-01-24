'use client';

import React from 'react';
import { AuditTimeline } from '../../../components/audit/AuditTimeline';
import { FinancialReconciliation } from '../../../components/audit/FinancialReconciliation';
import { ReportGenerator } from '../../../components/audit/ReportGenerator';

export default function AuditTrailPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between space-y-4 lg:space-y-0">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="h-4 w-4 bg-indigo-600 rounded-sm"></span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Trust & Transparency</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Audit Operations</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
                        Centralized command for cryptographic record verification, financial proof of reserves, and regulatory document generation.
                    </p>
                </div>

                <div className="flex space-x-3">
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">ledger integrity: OK</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <AuditTimeline />

                    <div className="bg-gray-50 dark:bg-gray-900/40 p-8 rounded-2xl border dark:border-white/5">
                        <h3 className="text-xl font-bold mb-6 flex items-center dark:text-white">
                            <svg className="h-5 w-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Compliance Verification
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center font-bold">Q4</div>
                                    <div>
                                        <p className="text-sm font-bold dark:text-gray-200">Regulatory Compliance Audit</p>
                                        <p className="text-[10px] text-gray-500">Performed by Deloitte • Dec 20, 2025</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-green-600">PASSED</span>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center font-bold">SEC</div>
                                    <div>
                                        <p className="text-sm font-bold dark:text-gray-200">Rule 506(c) Filing Evidence</p>
                                        <p className="text-[10px] text-gray-500">Automated verification • 3 days ago</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-green-600">VALID</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-10">
                    <ReportGenerator />
                    <FinancialReconciliation />

                    <div className="p-8 bg-gradient-to-tr from-gray-900 to-black rounded-2xl text-white shadow-2xl relative overflow-hidden text-center">
                        <p className="text-xs uppercase font-black tracking-widest text-indigo-400 mb-2">Security Note</p>
                        <h4 className="text-lg font-bold mb-4">WORM Storage</h4>
                        <p className="text-[10px] opacity-70 leading-relaxed">
                            All audit logs are stored in <span className="text-white font-bold">Write-Once-Read-Many</span> (WORM) compliant buckets, preventing any hardware-level deletion before the required 7-year retention period ends.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
