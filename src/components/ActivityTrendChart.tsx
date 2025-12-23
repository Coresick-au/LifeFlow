import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Story } from '../types';

interface ActivityTrendChartProps {
    stories: Story[];
    months?: number; // Number of months to display (default: 6)
}

interface MonthData {
    month: string;
    count: number;
}

/**
 * ActivityTrendChart
 * Shows a bar chart of story activity over the last N months.
 * Answers: "Am I actually recording my life, or did I stop?"
 */
export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
    stories,
    months = 6
}) => {
    const chartData = useMemo(() => {
        const data: MonthData[] = [];
        const now = new Date();

        // Generate data for each of the last N months
        for (let i = months - 1; i >= 0; i--) {
            const monthDate = subMonths(now, i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);

            const storiesInMonth = stories.filter(story => {
                const storyDate = new Date(story.date);
                return isWithinInterval(storyDate, { start: monthStart, end: monthEnd });
            });

            data.push({
                month: format(monthDate, 'MMM'),
                count: storiesInMonth.length,
            });
        }

        return data;
    }, [stories, months]);

    const totalRecent = chartData.reduce((sum, d) => sum + d.count, 0);
    const avgPerMonth = totalRecent > 0 ? Math.round(totalRecent / months * 10) / 10 : 0;

    if (stories.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-theme-tertiary bg-theme-tertiary rounded-lg border border-dashed border-theme">
                <span className="text-sm">No activity data available</span>
            </div>
        );
    }

    return (
        <div className="bg-theme-primary rounded-lg shadow p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-theme-primary">
                    Activity Trend
                </h3>
                <span className="text-sm text-theme-tertiary">
                    Avg: {avgPerMonth}/month
                </span>
            </div>
            <div className="flex-grow min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border, #e2e8f0)" opacity={0.5} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'var(--theme-text-secondary, #64748b)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--theme-border, #e2e8f0)' }}
                        />
                        <YAxis
                            tick={{ fill: 'var(--theme-text-secondary, #64748b)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--theme-border, #e2e8f0)' }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--theme-bg-primary)',
                                borderColor: 'var(--theme-border)',
                                borderRadius: '6px',
                            }}
                            labelStyle={{ color: 'var(--theme-text-primary)' }}
                            itemStyle={{ color: 'var(--theme-text-primary)' }}
                            formatter={(value: any) => [`${value} stories`, 'Count']}
                        />
                        <Bar
                            dataKey="count"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-theme-tertiary mt-2">
                Stories recorded in the last {months} months
            </p>
        </div>
    );
};
