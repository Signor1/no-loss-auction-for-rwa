'use client';

import React, { useState, useEffect } from 'react';

interface Rule {
    _id: string;
    name: string;
    type: string;
    status: string;
    priority: number;
    executionCount: number;
}

export const RuleManager = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        try {
            const response = await fetch('/api/compliance/rules');
            if (response.ok) {
                setRules(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch rules', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    if (loading) return <div>Loading rules...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Rules</h3>
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    Create Rule
                </button>
            </div>

            <div className="space-y-4">
                {rules.length === 0 ? (
                    <p className="text-gray-500">No rules defined yet.</p>
                ) : (
                    rules.map((rule) => (
                        <div key={rule._id} className="border dark:border-gray-700 p-4 rounded-md flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                                <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase">{rule.type}</span>
                                    <span>Priority: {rule.priority}</span>
                                    <span>Executions: {rule.executionCount}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${rule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {rule.status}
                                </span>
                                <button className="text-gray-400 hover:text-indigo-600">
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
