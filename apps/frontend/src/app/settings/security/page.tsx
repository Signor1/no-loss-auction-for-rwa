'use client';

import React from 'react';
import { TwoFactorSetup } from '../../../components/security/TwoFactorSetup';
import { RecoveryCodes } from '../../../components/security/RecoveryCodes';
import { SecurityEducation } from '../../../components/security/SecurityEducation';
import { PhishingAlert } from '../../../components/security/PhishingAlert';

export default function UserSettingsSecurityPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <PhishingAlert />

            <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Account Security</h1>
                    <p className="text-gray-500 mt-2">Manage your authentication methods and learn how to keep your digital assets safe.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <TwoFactorSetup />
                    <div className="space-y-8">
                        <RecoveryCodes />
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border dark:border-gray-800">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 uppercase text-[10px] tracking-widest text-gray-400">Recent Security Activity</h4>
                            <div className="space-y-4 mt-6">
                                <div className="flex items-center space-x-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <div>
                                        <p className="text-xs font-bold dark:text-gray-300">Login from Chrome on Linux</p>
                                        <p className="text-[10px] text-gray-500">2 hours ago • IP: 192.168.1.1</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                    <div>
                                        <p className="text-xs font-bold dark:text-gray-300">Password Changed</p>
                                        <p className="text-[10px] text-gray-500">3 days ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SecurityEducation />

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400">
                        Need help recovering your account? Contact our <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Security Specialists</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
