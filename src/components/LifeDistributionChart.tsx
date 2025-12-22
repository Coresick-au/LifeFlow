import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Interface for the chart data structure.
 * Decoupled from specific Story types to allow reusability.
 */
interface DistributionData {
    name: string;
    value: number;
    color: string;
}

interface LifeDistributionChartProps {
    data: DistributionData[];
}

/**
 * LifeDistributionChart
 * A specialized visualization component for the Life Dashboard.
 * Renders a responsive pie chart showing the balance between different life areas.
 * 
 * Architecture Note:
 * Extracted from LifeDashboard to maintain Single Responsibility Principle (SRP).
 */
export const LifeDistributionChart: React.FC<LifeDistributionChartProps> = ({ data }) => {
    // Filter out zero values to avoid rendering empty chart segments or cluttering the legend
    const activeData = data.filter(item => item.value > 0);

    if (activeData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-theme-tertiary bg-theme-tertiary rounded-lg border border-dashed border-theme">
                <span className="text-sm">No data available for distribution</span>
            </div>
        );
    }

    return (
        <div className="bg-theme-primary rounded-lg shadow p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-theme-primary mb-4">
                Life Balance Distribution
            </h3>
            <div className="flex-grow min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData as any}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {activeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--theme-bg-primary)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-primary)',
                                borderRadius: '6px'
                            }}
                            itemStyle={{ color: 'var(--theme-text-primary)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ color: 'var(--theme-text-secondary)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-theme-tertiary mt-2">
                Breakdown of recorded events by category
            </p>
        </div>
    );
};
