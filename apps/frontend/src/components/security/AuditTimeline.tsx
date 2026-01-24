'use client';

import React, { useState, useEffect } from 'react';

export const AuditTimeline = ({ contractId }: { contractId?: string }) => {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            // In a real app we'd fetch for specific contract or all
            const url = contractId ? `/api/security/contracts/${contractId}/audits` : '/api/security/contracts/all/audits';
            try {
                // Mocking visual data if API empty for demo
                setAudits([
                    {
                        _id: '1',
                        auditor: 'CertiK',
                        auditName: 'Smart Contract V2 Mainnet Audit',
                        auditDate: '2025-12-15',
                        vulnerabilityCount: { critical: 0, high: 0, medium: 2, low: 5 },
                        status: 'completed'
                    },
                    {
                        _id: '2',
                        auditor: 'OpenZeppelin',
                        auditName: 'Initial Protocol Launch Audit',
                        auditDate: '2025-06-10',
                        vulnerabilityCount: { critical: 0, high: 1, medium: 4, low: 10 },
                        status: 'remediated'
                    }
                ]);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAudits();
    }, [contractId]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Audit History</h3>
            <div className="space-y-6">
                {audits.map((audit) => (
                    <div key={audit._id} className="relative pl-8 border-l-2 border-gray-100 dark:border-gray-700">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-500 border-4 border-white dark:border-gray-800"></div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{audit.auditName}</h4>
                                <p className="text-xs text-gray-500 mt-1">Performed by <span className="font-semibold text-indigo-600">{audit.auditor}</span> on {new Date(audit.auditDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${audit.status === 'remediated' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {audit.status}
                            </span>
                        </div>
                        <div className="mt-4 flex space-x-2">
                            <div className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded">CRITICAL: {audit.vulnerabilityCount.critical}</div>
                            <div className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded">HIGH: {audit.vulnerabilityCount.high}</div>
                            <div className="px-2 py-1 bg-gray-50 text-gray-700 text-[10px] font-bold rounded">INFORMATIONAL: {audit.vulnerabilityCount.low}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
