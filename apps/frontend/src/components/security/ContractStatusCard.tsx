'use client';

import React, { useState } from 'react';

interface Contract {
    _id: string;
    name: string;
    address: string;
    status: string;
    network: string;
    version: string;
    isEmergencyPausable: boolean;
}

export const ContractStatusCard = ({ contract }: { contract: Contract }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState(contract.status);

    const handleTogglePause = async () => {
        setActionLoading(true);
        try {
            const isPaused = status === 'active';
            const res = await fetch('/api/security/contracts/pause', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractId: contract._id,
                    isPaused,
                    reason: isPaused ? 'Triggered by admin via dashboard' : 'Resumed by admin'
                })
            });
            if (res.ok) {
                setStatus(isPaused ? 'paused' : 'active');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{contract.name}</h4>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{contract.address}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Network</p>
                    <p className="text-sm dark:text-gray-300 capitalize">{contract.network.replace('_', ' ')}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Version</p>
                    <p className="text-sm dark:text-gray-300">{contract.version}</p>
                </div>
            </div>

            {contract.isEmergencyPausable && (
                <button
                    onClick={handleTogglePause}
                    disabled={actionLoading}
                    className={`w-full py-2 rounded text-xs font-bold uppercase transition ${status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                    {actionLoading ? 'Processing...' : status === 'active' ? 'Emergency Pause' : 'Resume Operations'}
                </button>
            )}
        </div>
    );
};
