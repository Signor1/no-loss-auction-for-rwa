import React from 'react';
import { JurisdictionList } from '../../../components/compliance/JurisdictionList';
import { RuleManager } from '../../../components/compliance/RuleManager';
import { ComplianceReports } from '../../../components/compliance/ComplianceReports';

export default function JurisdictionsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jurisdictional Compliance</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage global regulations, automated rules, and compliance reporting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <RuleManager />
                    <JurisdictionList />
                </div>

                <div className="space-y-8">
                    <ComplianceReports />

                    <div className="bg-indigo-600 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Legal Framework Adherence</h3>
                        <p className="text-sm opacity-90 mb-4">
                            The platform is configured to automatically adhere to Basel III, MiFID II, and local RWA tokenization standards.
                        </p>
                        <div className="flex justify-between items-center text-xs pt-4 border-t border-indigo-500">
                            <span>Overall Score</span>
                            <span className="font-bold text-lg">94/100</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
