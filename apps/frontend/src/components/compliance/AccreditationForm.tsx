'use client';

import React, { useState, useEffect } from 'react';

export const AccreditationForm = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('individual');
    const [jurisdiction, setJurisdiction] = useState('US');
    const [submitting, setSubmitting] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/compliance/securities/accreditation');
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/compliance/securities/accreditation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, jurisdiction })
            });
            if (res.ok) {
                fetchStatus();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading accreditation status...</div>;

    if (status && status.status !== 'unverified') {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Investor Accreditation</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">Current Status:</span>
                    <span className={`font-bold capitalize ${status.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {status.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Type: {status.type.replace('_', ' ')} ({status.jurisdiction})
                </p>
                {status.status === 'approved' && (
                    <p className="text-xs text-gray-400 mt-1">Expires: {new Date(status.expiresAt).toLocaleDateString()}</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Apply for Accreditation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Certain assets require you to be an accredited investor. Please provide your details for verification.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Investor Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="individual">Accredited Individual</option>
                        <option value="institutional">Institutional Investor</option>
                        <option value="qualified_purchaser">Qualified Purchaser</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jurisdiction</label>
                    <select
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="US">United States (SEC)</option>
                        <option value="GB">United Kingdom (FCA)</option>
                        <option value="EU">European Union</option>
                        <option value="SG">Singapore (MAS)</option>
                    </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                    By submitting, you certify that you meet the financial requirements for your selected investor type. Supporting documents may be requested.
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </form>
        </div>
    );
};
