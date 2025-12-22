import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTimelineStore } from '../store/timelineStore';
import { format } from 'date-fns';

export function NetWorthChart() {
    const { wealthItems } = useTimelineStore();

    // Prepare chart data from wealth items history
    const chartData = useMemo(() => {
        if (wealthItems.length === 0) return [];

        // Create a map of dates to net worth values
        const dataPoints = wealthItems.map(item => ({
            date: new Date(item.lastUpdated),
            value: item.value,
            category: item.category,
            name: item.name,
        }));

        // Sort by date
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate cumulative net worth over time
        const netWorthOverTime: { date: string; netWorth: number; liquidAssets: number; debt: number }[] = [];
        let runningNetWorth = 0;
        let runningLiquid = 0;
        let runningDebt = 0;

        dataPoints.forEach((point, index) => {
            // Calculate net worth at this point in time
            if (point.category === 'debt') {
                runningDebt += Math.abs(point.value);
                runningNetWorth -= Math.abs(point.value);
            } else {
                runningNetWorth += point.value;
                if (point.category === 'savings' || point.category === 'investment') {
                    runningLiquid += point.value;
                }
            }

            netWorthOverTime.push({
                date: format(point.date, 'MMM yyyy'),
                netWorth: runningNetWorth,
                liquidAssets: runningLiquid,
                debt: runningDebt,
            });
        });

        // If we have less than 2 data points, create a baseline
        if (netWorthOverTime.length === 0) {
            netWorthOverTime.push({
                date: format(new Date(), 'MMM yyyy'),
                netWorth: 0,
                liquidAssets: 0,
                debt: 0,
            });
        }

        return netWorthOverTime;
    }, [wealthItems]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Net Worth Over Time</h3>
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        Add wealth items to see your net worth chart
                    </p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}k`;
        }
        return `$${value.toFixed(0)}`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-lg shadow-xl border border-gray-700">
                    <p className="font-semibold mb-2">{payload[0].payload.date}</p>
                    <p className="text-green-400">Net Worth: ${payload[0].value.toLocaleString()}</p>
                    {payload[1] && <p className="text-blue-400">Liquid: ${payload[1].value.toLocaleString()}</p>}
                    {payload[2] && <p className="text-red-400">Debt: ${payload[2].value.toLocaleString()}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Net Worth Over Time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Track your financial progress as you add and update wealth items
            </p>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="netWorth"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Net Worth"
                    />
                    <Line
                        type="monotone"
                        dataKey="liquidAssets"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="Liquid Assets"
                    />
                    <Line
                        type="monotone"
                        dataKey="debt"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 3 }}
                        name="Total Debt"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
