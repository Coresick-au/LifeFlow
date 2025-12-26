import React, { useMemo, useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { WealthItem } from '../types';
import { format, differenceInMonths, addMonths, startOfMonth, isBefore, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Filter } from 'lucide-react';

export const NetWorthChart: React.FC = () => {
    const { wealthItems, wealthHistory } = useTimelineStore();
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['real-estate', 'investment', 'superannuation']);

    const categories = [
        { id: 'real-estate', label: 'Property', color: '#10b981' },
        { id: 'investment', label: 'Investments', color: '#8b5cf6' },
        { id: 'superannuation', label: 'Super', color: '#f59e0b' },
        { id: 'cash', label: 'Cash', color: '#3b82f6' },
        { id: 'vehicle', label: 'Vehicles', color: '#64748b' },
        { id: 'debt', label: 'Debt', color: '#ef4444' },
    ];

    const chartData = useMemo(() => {
        if (wealthItems.length === 0) return [];

        // 1. Determine Date Range
        const now = new Date();
        const dates = wealthItems
            .map(i => i.purchaseDate ? new Date(i.purchaseDate) : (i.lastUpdated ? new Date(i.lastUpdated) : now));

        const historyDates = wealthHistory.map(h => new Date(h.timestamp));

        let minDate = dates.reduce((min, d) => d < min ? d : min, now);
        // Also consider history dates
        if (historyDates.length > 0) {
            const minHistory = historyDates.reduce((min, d) => d < min ? d : min, now);
            if (minHistory < minDate) minDate = minHistory;
        }

        minDate = startOfMonth(minDate);
        const monthsDiff = differenceInMonths(now, minDate);

        const dataPoints = [];

        // 2. Generate Monthly Points
        for (let i = 0; i <= monthsDiff; i++) {
            const date = addMonths(minDate, i);
            const dataPoint: any = {
                date: date.getTime(),
                displayDate: format(date, 'MMM yy'),
                netWorth: 0
            };

            // Calculate value for each category
            categories.forEach(cat => {
                dataPoint[cat.id] = 0;
            });

            // 3. Sum up items for this date
            wealthItems.forEach(item => {
                const purchaseDate = item.purchaseDate ? new Date(item.purchaseDate) : (item.lastUpdated ? new Date(item.lastUpdated) : new Date());

                // Skip if not owned yet
                if (isBefore(date, startOfMonth(purchaseDate))) return;

                let itemValue = 0;

                // Find history for this item
                const itemHistory = wealthHistory
                    .filter(h => h.wealthItemId === item.id)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                if (itemHistory.length === 0) {
                    // No history: Interpolate Purchase -> Current
                    const totalMonths = differenceInMonths(now, purchaseDate);
                    const monthsSincePurchase = differenceInMonths(date, purchaseDate);

                    if (totalMonths <= 0) {
                        itemValue = item.value;
                    } else {
                        const startValue = item.purchasePrice || item.value; // Fallback to current if no purchase price
                        const growth = item.value - startValue;
                        // Linear interpolation
                        itemValue = startValue + (growth * (monthsSincePurchase / totalMonths));
                    }
                } else {
                    // Has history: Interpolate between history points
                    const firstHistory = new Date(itemHistory[0].timestamp);
                    const lastHistory = new Date(itemHistory[itemHistory.length - 1].timestamp);

                    if (isBefore(date, firstHistory)) {
                        // Interpolate Purchase -> First History
                        const totalMonths = differenceInMonths(firstHistory, purchaseDate);
                        const monthsSincePurchase = differenceInMonths(date, purchaseDate);

                        const startValue = item.purchasePrice || itemHistory[0].newValue;
                        const endValue = itemHistory[0].newValue;

                        if (totalMonths <= 0) itemValue = startValue;
                        else itemValue = startValue + ((endValue - startValue) * (monthsSincePurchase / totalMonths));

                    } else if (isAfter(date, lastHistory)) {
                        // Interpolate Last History -> Current
                        const totalMonths = differenceInMonths(now, lastHistory);
                        const monthsSinceLast = differenceInMonths(date, lastHistory);

                        const startValue = itemHistory[itemHistory.length - 1].newValue;
                        const endValue = item.value;

                        if (totalMonths <= 0) itemValue = endValue;
                        else itemValue = startValue + ((endValue - startValue) * (monthsSinceLast / totalMonths));
                    } else {
                        // Interpolate between history points
                        // Find closest before and after
                        let prev = itemHistory[0];
                        let next = itemHistory[itemHistory.length - 1];

                        for (let j = 0; j < itemHistory.length - 1; j++) {
                            const d1 = new Date(itemHistory[j].timestamp);
                            const d2 = new Date(itemHistory[j + 1].timestamp);
                            if (date >= d1 && date <= d2) {
                                prev = itemHistory[j];
                                next = itemHistory[j + 1];
                                break;
                            }
                        }

                        const d1 = new Date(prev.timestamp);
                        const d2 = new Date(next.timestamp);
                        const totalTime = d2.getTime() - d1.getTime();
                        const progress = date.getTime() - d1.getTime();

                        if (totalTime <= 0) itemValue = prev.newValue;
                        else itemValue = prev.newValue + ((next.newValue - prev.newValue) * (progress / totalTime));
                    }
                }

                // Add to Category Sum
                if (item.category) {
                    dataPoint[item.category] += Math.abs(itemValue);

                    if (item.category === 'debt') {
                        dataPoint.netWorth -= Math.abs(itemValue);
                    } else {
                        dataPoint.netWorth += itemValue;
                    }
                }
            });

            dataPoints.push(dataPoint);
        }

        return dataPoints;
    }, [wealthItems, wealthHistory]);

    const toggleCategory = (id: string) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(c => c !== id));
        } else {
            setSelectedCategories([...selectedCategories, id]);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Net Worth History</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Asset growth over time (interpolated from purchase date)
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {categories.filter(c => c.id !== 'debt').map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors flex items-center gap-1 ${selectedCategories.includes(cat.id)
                                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                                    : 'opacity-50 border-transparent hover:opacity-100'
                                }`}
                            style={{ color: selectedCategories.includes(cat.id) ? cat.color : undefined }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {categories.map(cat => (
                                <linearGradient key={cat.id} id={`color-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={cat.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis
                            dataKey="displayDate"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickMargin={10}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickFormatter={(val) => `$${val / 1000}k`}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(value: any) => [formatCurrency(value), '']}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Legend />

                        {categories.map(cat => (
                            selectedCategories.includes(cat.id) && (
                                <Area
                                    key={cat.id}
                                    type="monotone"
                                    dataKey={cat.id}
                                    name={cat.label}
                                    stroke={cat.color}
                                    fillOpacity={1}
                                    fill={`url(#color-${cat.id})`}
                                    stackId="1"
                                />
                            )
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
