'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CoinbaseButton, PoweredByCoinbase } from '../CoinbaseBranding';

export function KYCVerification() {
    const { address, isConnected } = useAccount();
    const [status, setStatus] = useState<'idle' | 'checking' | 'verified' | 'unverified' | 'error'>('idle');
    const [verificationLink, setVerificationLink] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            checkVerification();
        }
    }, [isConnected, address]);

    const checkVerification = async () => {
        setStatus('checking');
        try {
            // In a real implementation, this would call our backend checkKYC endpoint
            const response = await fetch(`/api/compliance/kyc-status/${address}`);
            const data = await response.json();

            if (data.isVerified) {
                setStatus('verified');
            } else {
                setStatus('unverified');
                setVerificationLink(data.verificationLink);
            }
        } catch (error) {
            console.error('Failed to check KYC status:', error);
            setStatus('error');
        }
    };

    if (!isConnected) {
        return (
            <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 mb-4 text-sm">Please connect your wallet to verify your identity.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                    <p className="text-sm text-gray-500 mt-1">Required for RWA auction participation</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'verified' ? 'bg-green-100 text-green-700' :
                        status === 'unverified' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {status.toUpperCase()}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Coinbase Verification</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                        We use Coinbase to securely verify your identity. You can use your existing Coinbase account or an on-chain attestation to verify instantly.
                    </p>

                    {status === 'verified' ? (
                        <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Your identity is verified via Coinbase</span>
                        </div>
                    ) : (
                        <CoinbaseButton
                            onClick={() => verificationLink && window.open(verificationLink, '_blank')}
                            className="w-full"
                            variant="primary"
                            disabled={status === 'checking' || !verificationLink}
                        >
                            {status === 'checking' ? 'Checking status...' : 'Verify with Coinbase'}
                        </CoinbaseButton>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-xl">
                        <h4 className="text-xs font-bold text-gray-900 mb-1">On-chain Attestation</h4>
                        <p className="text-[10px] text-gray-500">Fast, secure verification using Base EAS attestations.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-xl">
                        <h4 className="text-xs font-bold text-gray-900 mb-1">Institutional Friendly</h4>
                        <p className="text-[10px] text-gray-500">Supports complex institutional entity verification.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                <PoweredByCoinbase />
                <button
                    onClick={checkVerification}
                    className="text-xs text-blue-600 font-medium hover:underline focus:outline-none"
                >
                    Refresh status
                </button>
            </div>
        </div>
    );
}
