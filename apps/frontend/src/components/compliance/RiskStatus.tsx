'use client';

import React, { useEffect, useState } from 'react';

interface RiskAssessment {
    overallRiskLevel: string;
    overallRiskScore: number;
    updatedAt: string;
    recommendations: any[];
}

export const RiskStatus = () => {
    const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAssessment = async () => {
        try {
            const response = await fetch('/api/compliance/risk/latest');
            if (response.ok) {
                const data = await response.json();
                setAssessment(data);
            }
        } catch (error) {
            console.error('Failed to fetch risk assessment');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssessment();
    }, []);

    const triggerAssessment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/compliance/risk/assess', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                setAssessment(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !assessment) {
        return <div>Loading risk status...</div>;
    }

    if (!assessment) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Risk Status</h3>
                <p className="text-gray-500 mb-4">No assessment found.</p>
                <button
                    onClick={triggerAssessment}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Run Assessment
                </button>
            </div>
        )
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-orange-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Risk Profile</h3>
                <button
                    onClick={triggerAssessment}
                    className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    Refresh
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-gray-500 dark:text-gray-400">Current Level:</span>
                    <span className={`ml-2 font-bold capitalize ${getRiskColor(assessment.overallRiskLevel)}`}>
                        {assessment.overallRiskLevel.replace('_', ' ')}
                    </span>
                </div>

                <div>
                    <span className="text-gray-500 dark:text-gray-400">Risk Score:</span>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${assessment.overallRiskScore}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{assessment.overallRiskScore}/100</span>
                </div>

                <div className="text-sm text-gray-400">
                    Last updated: {new Date(assessment.updatedAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};
