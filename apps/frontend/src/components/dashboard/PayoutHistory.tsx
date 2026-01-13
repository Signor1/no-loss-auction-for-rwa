import React, { useState, useEffect } from 'react';
import { financialService } from '../../lib/financial-service';
import { PaymentRecord } from '../../lib/payment-service';

const PayoutHistory: React.FC = () => {
    const [payouts, setPayouts] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            const data = await financialService.getPayoutHistory();
            setPayouts(data);
        } catch (err) {
            setError('Failed to load payout history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading payouts...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Payout History</h2>
                <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    Total Payouts: {payouts.length}
                </div>
            </div>

            {payouts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No payout records found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {payouts.map((payout) => (
                        <div key={payout._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">${payout.amount.toLocaleString()} {payout.currency}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {payout.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{new Date(payout.createdAt).toLocaleDateString()} at {new Date(payout.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-mono mb-1">REF: {payout._id.slice(-8)}</p>
                                    {payout.transactionHash && (
                                        <a
                                            href={`https://etherscan.io/tx/${payout.transactionHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-indigo-600 hover:underline font-mono"
                                        >
                                            {payout.transactionHash.slice(0, 6)}...{payout.transactionHash.slice(-4)}
                                        </a>
                                    )}
                                </div>
                            </div>
                            {payout.metadata?.bankAccount && (
                                <div className="mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-500 flex items-center gap-1">
                                    <span>🏦</span>
                                    <span>Account ending in {payout.metadata.bankAccount.slice(-4)}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PayoutHistory;
