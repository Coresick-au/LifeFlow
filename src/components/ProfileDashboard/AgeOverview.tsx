import React from 'react';

interface AgeOverviewProps {
    age: number;
    ageInMonths: number;
    ageInDays: number;
}

/**
 * AgeOverview Component
 * Displays age in years, months, and days.
 */
export const AgeOverview: React.FC<AgeOverviewProps> = ({ age, ageInMonths, ageInDays }) => {
    return (
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3">Age Overview</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-blue-600">{age}</div>
                    <div className="text-sm text-theme-tertiary">Years</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">{ageInMonths}</div>
                    <div className="text-sm text-theme-tertiary">Months</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">{ageInDays.toLocaleString()}</div>
                    <div className="text-sm text-theme-tertiary">Days</div>
                </div>
            </div>
        </div>
    );
};
