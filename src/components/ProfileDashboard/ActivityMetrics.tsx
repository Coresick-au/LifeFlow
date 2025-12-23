import React from 'react';

interface ActivityMetricsProps {
    storiesPerYear: number;
    storiesPerMonth: number;
    dayCoverage: number;
}

/**
 * ActivityMetrics Component
 * Displays story activity statistics.
 */
export const ActivityMetrics: React.FC<ActivityMetricsProps> = ({
    storiesPerYear,
    storiesPerMonth,
    dayCoverage,
}) => {
    return (
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3">Activity Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <div className="text-lg font-bold text-theme-primary">{storiesPerYear}</div>
                    <div className="text-sm text-theme-tertiary">Stories per year</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-theme-primary">{storiesPerMonth}</div>
                    <div className="text-sm text-theme-tertiary">Stories per month</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-theme-primary">{dayCoverage}%</div>
                    <div className="text-sm text-theme-tertiary">Day coverage</div>
                </div>
            </div>
        </div>
    );
};
