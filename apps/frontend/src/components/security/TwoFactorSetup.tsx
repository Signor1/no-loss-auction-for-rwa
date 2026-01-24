'use client';

import React, { useState } from 'react';

export const TwoFactorSetup = () => {
    const [step, setStep] = useState(1); // 1: Initial, 2: Scan, 3: Success
    const [secret, setSecret] = useState('');
    const [qrUrl, setQrUrl] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const startSetup = async () => {
        try {
            const res = await fetch('/api/users/security/2fa/setup', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setSecret(data.secret);
                setQrUrl(data.qrCode);
                setStep(2);
            }
        } catch (e) {
            setError('Failed to start 2FA setup');
        }
    };

    const verifyCode = async () => {
        try {
            const res = await fetch('/api/users/security/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            if (res.ok) {
                setStep(3);
            } else {
                setError('Invalid code. Please try again.');
            }
        } catch (e) {
            setError('Verification failed');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500 italic">Protect your account with an extra layer of security</p>
                </div>
            </div>

            {step === 1 && (
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        We recommend using an authenticator app (like Google Authenticator or Authy) to receive login codes.
                    </p>
                    <button
                        onClick={startSetup}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                    >
                        Enable 2FA
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="h-48 w-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-inner">
                            {/* In real app, render actual QR code */}
                            <span className="text-[10px] uppercase font-black text-gray-400 text-center px-4">Scan this QR in your Auth App</span>
                        </div>
                        <p className="mt-4 text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-black/20 px-2 py-1 rounded">Secret: {secret}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Enter 6-digit Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="000000"
                            className="w-full text-center text-2xl tracking-[1em] font-mono py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {error && <p className="text-[10px] text-red-500 mt-2 font-bold">{error}</p>}
                    </div>

                    <button
                        onClick={verifyCode}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                    >
                        Verify & Active
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="text-center py-6">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-lg font-bold dark:text-white">2FA is Active!</h4>
                    <p className="text-sm text-gray-500 mt-2">Your account is now guarded by multi-factor authentication.</p>
                </div>
            )}
        </div>
    );
};
