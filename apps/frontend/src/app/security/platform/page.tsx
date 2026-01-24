'use client';

import React from 'react';
import { EncryptionStatus } from '../../../components/security/EncryptionStatus';
import { AuditLogViewer } from '../../../components/security/AuditLogViewer';
import { MultiSigWalletList } from '../../../components/security/MultiSigWalletList';
import { AlertCenter } from '../../../components/security/AlertCenter';

export default function PlatformSecurityMonitoringPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-12">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="h-4 w-4 bg-indigo-600 rounded-sm"></div>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Platform Infrastructure</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Security Operations Center</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
                    Real-time monitoring of infrastructure encryption, access controls, and security incidents across the entire application stack.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <EncryptionStatus />
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Key Management Service</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Master DB Key</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">ACTIVE</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full w-[65%]"></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic">Next rotation: In 42 days (Google Cloud KMS)</p>
                                </div>
                                <div className="pt-4 border-t dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">JWT Signing Key</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">ACTIVE</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full w-[12%]"></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic">Next rotation: In 104 days (HSM Tier 1)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AuditLogViewer />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <AlertCenter />
                    <MultiSigWalletList />

                    <div className="p-6 bg-gradient-to-br from-indigo-900 to-black text-white rounded-2xl shadow-xl">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-4">Incident Response</h4>
                        <p className="text-xs opacity-80 leading-relaxed mb-6">
                            In the event of a critical breach, the platform initiates <span className="text-red-400 font-bold underline">Level 1 Isolation</span> protocols, severing all outbound transaction routes.
                        </p>
                        <button className="w-full py-2 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-700 transition shadow-lg">
                            Trigger Panic Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
