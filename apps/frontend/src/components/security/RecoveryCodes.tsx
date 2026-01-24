'use client';

import React, { useState } from 'react';

export const RecoveryCodes = () => {
    const [codes, setCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users/security/recovery-codes');
            if (res.ok) {
                const data = await res.json();
                setCodes(data);
                setShow(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-2">Recovery Codes</h3>
            <p className="text-xs text-gray-500 mb-6">Generated codes for account recovery in case of device loss</p>

            {!show ? (
                <button
                    onClick={fetchCodes}
                    disabled={loading}
                    className="w-full py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-100 transition"
                >
                    {loading ? 'Decrypting...' : 'View Recovery Codes'}
                </button>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-3">
                        {codes.map((code, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-black/20 p-2 rounded text-center font-mono text-sm dark:text-indigo-300 border dark:border-indigo-900/30">
                                {code}
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold leading-normal">
                            ⚠️ WARNING: Keep these codes offline. Each code can only be used once. If you lose them, you may be permanently locked out of your account.
                        </p>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="w-full py-2 text-xs font-bold text-gray-400 underline uppercase"
                    >
                        Hide Codes
                    </button>
                </div>
            )}
        </div>
    );
};
