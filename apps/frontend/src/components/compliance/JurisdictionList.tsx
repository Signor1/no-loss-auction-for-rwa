'use client';

import React, { useState, useEffect } from 'react';

interface Jurisdiction {
    _id: string;
    name: string;
    code: string;
    type: string;
    complianceLevel: string;
    isActive: boolean;
}

export const JurisdictionList = () => {
    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJurisdictions = async () => {
        try {
            const response = await fetch('/api/compliance/jurisdictions');
            if (response.ok) {
                setJurisdictions(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch jurisdictions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJurisdictions();
    }, []);

    if (loading) return <div>Loading jurisdictions...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Jurisdictions</h3>
                <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                    Add Jurisdiction
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Compliance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {jurisdictions.map((j) => (
                            <tr key={j._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{j.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{j.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{j.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full 
                        ${j.complianceLevel === 'high' ? 'bg-green-100 text-green-800' :
                                            j.complianceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {j.complianceLevel}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${j.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{j.isActive ? 'Active' : 'Inactive'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
