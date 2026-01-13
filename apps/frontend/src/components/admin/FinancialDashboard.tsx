import React, { useState, useEffect } from 'react';
import { financialService, FinancialSummary, FeeBreakdown } from '../../lib/financial-service';

const FinancialDashboard: React.FC = () => {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [fees, setFees] = useState<FeeBreakdown | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, feeData] = await Promise.all([
                financialService.getSummary(dateRange.start, dateRange.end),
                financialService.getFeeBreakdown(dateRange.start, dateRange.end)
            ]);
            setSummary(summaryData);
            setFees(feeData);
        } catch (err) {
            setError('Failed to load financial data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await financialService.exportCSV(dateRange.start, dateRange.end);
        } catch (err) {
            alert('Failed to export data');
        }
    };

    if (loading && !summary) return <div className="p-8 text-center text-gray-500">Loading financial data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 space-y-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Tracking</h1>
                    <p className="text-gray-500 text-sm">Revenue, fees, and payout management</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-sm border-none focus:ring-0 p-1"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-sm border-none focus:ring-0 p-1"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">${summary?.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-green-600 text-xs font-semibold uppercase tracking-wider mb-1">Total Fees</p>
                    <p className="text-2xl font-bold text-green-900">${summary?.totalFees.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-purple-600 text-xs font-semibold uppercase tracking-wider mb-1">Total Payouts</p>
                    <p className="text-2xl font-bold text-purple-900">${summary?.totalPayouts.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">Net Income</p>
                    <p className="text-2xl font-bold text-indigo-900">${summary?.netIncome.toLocaleString()}</p>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-gray-700">Platform Fees</span>
                            </div>
                            <span className="font-semibold text-gray-900">${fees?.platform.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${fees && summary?.totalFees ? (fees.platform / summary.totalFees) * 100 : 0}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-700">Processor Fees</span>
                            </div>
                            <span className="font-semibold text-gray-900">${fees?.processor.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${fees && summary?.totalFees ? (fees.processor / summary.totalFees) * 100 : 0}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-700">Other</span>
                            </div>
                            <span className="font-semibold text-gray-900">${fees?.other.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gray-400 h-2 rounded-full"
                                style={{ width: `${fees && summary?.totalFees ? (fees.other / summary.totalFees) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-center text-center">
                    <p className="text-gray-500 text-sm mb-2">Year-to-Date Performance</p>
                    <p className="text-3xl font-bold text-gray-900">Up 12.5%</p>
                    <p className="text-green-500 text-xs font-medium mt-1">Comparing to previous 30 days</p>
                    <div className="mt-6 flex justify-center">
                        <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-700">85%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
