'use client';

import React, { useState, useEffect } from 'react';

interface Report {
    _id: string;
    title: string;
    type: string;
    jurisdiction: string;
    status: string;
    createdAt: string;
    metrics: {
        overallComplianceScore: number;
    };
}

export const ComplianceReports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/compliance/reports');
            if (response.ok) {
                setReports(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const generateReport = async () => {
        // Simplified trigger
        await fetch('/api/compliance/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Quarterly Audit US',
                type: 'regulatory',
                jurisdiction: 'US',
                periodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                periodEnd: new Date()
            })
        });
        fetchReports();
    }

    if (loading) return <div>Loading reports...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Reports</h3>
                <button
                    onClick={generateReport}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                >
                    Generate New
                </button>
            </div>

            <div className="space-y-3">
                {reports.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reports available.</p>
                ) : (
                    reports.map((report) => (
                        <div key={report._id} className="p-3 border dark:border-gray-700 rounded-md flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                            <div>
                                <span className="text-xs text-indigo-600 font-bold uppercase">{report.jurisdiction}</span>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</h4>
                                <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(report.metrics.overallComplianceScore)}%</div>
                                <span className="text-[10px] text-gray-400 uppercase">{report.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
