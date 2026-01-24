import React from 'react';
import { ComplianceDashboard } from '../../components/compliance/ComplianceDashboard';

export default function CompliancePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Compliance Center</h1>
            <ComplianceDashboard />
        </div>
    );
}
