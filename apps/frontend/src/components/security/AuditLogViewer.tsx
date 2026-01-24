'use client';

import React, { useState, useEffect } from 'react';

export const AuditLogViewer = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/security/logs?limit=20');
                if (res.ok) {
                    setLogs(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div>Loading audit logs...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Audit Logs</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead>
                        <tr className="border-b dark:border-gray-700 text-gray-400 uppercase font-bold text-[10px] tracking-widest text-left">
                            <th className="pb-3">Timestamp</th>
                            <th className="pb-3">Event</th>
                            <th className="pb-3">User</th>
                            <th className="pb-3">Action</th>
                            <th className="pb-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {logs.length === 0 ? (
                            <tr><td colSpan={5} className="py-4 text-center text-gray-500 italic">No logs found</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-3 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td className="py-3">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono">{log.eventType}</span>
                                    </td>
                                    <td className="py-3 font-mono">{log.userId || 'system'}</td>
                                    <td className="py-3 dark:text-gray-300">{log.action}</td>
                                    <td className="py-3">
                                        <span className={`h-1.5 w-1.5 rounded-full inline-block mr-2 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="capitalize">{log.status}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
