'use client';

import { useState, useEffect } from 'react';
import { paymentService, PaymentRecord } from '@/lib/payment-service';

export function PaymentHistory() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const data = await paymentService.getHistory();
                setPayments(data);
            } catch (err) {
                setError('Failed to load payment history');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'failed': return 'text-red-600 bg-red-50';
            case 'refunded': return 'text-purple-600 bg-purple-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✓';
            case 'pending': return '⏳';
            case 'failed': return '✗';
            case 'refunded': return '↺';
            default: return '○';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">No Transactions</h4>
                    <p className="text-gray-600 text-sm">You haven't made any payments yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>

            <div className="space-y-4 overflow-y-auto max-h-[400px]">
                {payments.map((payment) => (
                    <div key={payment._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                    {getStatusIcon(payment.status)} {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500 uppercase font-semibold">
                                    {payment.type}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                                {payment.amount} {payment.currency}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <div className="text-gray-600">
                                {payment.auctionId ? `Auction: ${payment.auctionId.slice(-8)}` : 'General Transaction'}
                            </div>
                            <div className="text-gray-400">
                                {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        {payment.transactionHash && (
                            <div className="mt-2 text-xs font-mono text-blue-500 truncate">
                                {payment.transactionHash}
                            </div>
                        )}

                        {payment.status === 'completed' && payment.type === 'bid' && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => handleRefundRequest(payment._id)}
                                    className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition-colors font-medium border border-red-100"
                                >
                                    Request Refund
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    async function handleRefundRequest(paymentId: string) {
        if (!confirm('Are you sure you want to request a refund for this bid?')) return;

        try {
            await paymentService.processRefund(paymentId, undefined, 'User requested refund via dashboard');
            // Refresh history
            const data = await paymentService.getHistory();
            setPayments(data);
            alert('Refund request submitted successfully');
        } catch (err) {
            alert('Failed to process refund request');
            console.error(err);
        }
    }
}

