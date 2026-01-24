'use client';

import React, { useState } from 'react';

export const BugBountyProgram = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/security/bounty/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    severity,
                    reporterName: 'Researcher',
                    reporterContact: 'anonymous@security.net'
                })
            });
            if (res.ok) {
                setSubmitted(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-indigo-50 border border-indigo-200 p-8 rounded-lg text-center">
                <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-indigo-900 mb-2">Report Submitted</h3>
                <p className="text-sm text-indigo-700">Thank you for your contribution to the protocol security. Our team will triage your report within 48 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-indigo-600 font-bold text-sm underline uppercase">Submit another</button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 border-dashed border-indigo-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vulnerability Disclosure Program</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Found a bug? We offer rewards up to <span className="font-bold text-indigo-600">50,000 USDC</span> for critical vulnerabilities impacting user funds or protocol logic.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Issue Title</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief summary of the vulnerability"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Severity Assessment</label>
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none"
                    >
                        <option value="low">Low (UI/UX or Informational)</option>
                        <option value="medium">Medium (Potential loss of gas/access)</option>
                        <option value="high">High (Manipulation of state)</option>
                        <option value="critical">Critical (Loss of protocol funds)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Detailed Description</label>
                    <textarea
                        rows={4}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="How to reproduce, impact, and suggested fix..."
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {submitting ? 'Enciphering & Sending...' : 'Securely Report Vulnerability'}
                </button>
            </form>
        </div>
    );
};
