import React, { useMemo } from 'react';
import { differenceInWeeks, addWeeks, startOfWeek, isWithinInterval, isBefore, format } from 'date-fns';

interface LifeCalendarProps {
    birthDate: Date;
    expectedLifespan?: number; // Default 90 years
}

/**
 * LifeCalendar Component
 * Visualises life as a grid of weeks (90 years × 52 weeks = 4,680 squares).
 * Filled squares represent weeks already lived.
 * Especially useful for users with aphantasia - provides concrete, spatial life map.
 */
export const LifeCalendar: React.FC<LifeCalendarProps> = ({
    birthDate,
    expectedLifespan = 90
}) => {
    const weeksPerYear = 52;
    const totalWeeks = expectedLifespan * weeksPerYear;

    const { weeksLived, percentageLived, yearsLived } = useMemo(() => {
        const now = new Date();
        const weeks = differenceInWeeks(now, birthDate);
        const percentage = Math.round((weeks / totalWeeks) * 100);
        const years = Math.floor(weeks / weeksPerYear);
        return { weeksLived: weeks, percentageLived: percentage, yearsLived: years };
    }, [birthDate, totalWeeks]);

    // Generate a simplified visualization (show decade markers, not all 4680 squares)
    const decadeMarkers = useMemo(() => {
        const decades = [];
        for (let decade = 0; decade <= expectedLifespan; decade += 10) {
            const weeksAtDecade = decade * weeksPerYear;
            const isLived = weeksAtDecade <= weeksLived;
            decades.push({
                age: decade,
                weeksAtDecade,
                isLived,
                isCurrent: decade === Math.floor(yearsLived / 10) * 10,
            });
        }
        return decades;
    }, [expectedLifespan, weeksLived, yearsLived]);

    // Calculate life statistics
    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const summersSoFar = yearsLived;
    const summersRemaining = Math.max(0, expectedLifespan - yearsLived);

    return (
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3">Life in Perspective</h4>

            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-blue-600">{weeksLived.toLocaleString()}</div>
                    <div className="text-xs text-theme-tertiary">Weeks Lived</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">{percentageLived}%</div>
                    <div className="text-xs text-theme-tertiary">Of {expectedLifespan} Years</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">{weeksRemaining.toLocaleString()}</div>
                    <div className="text-xs text-theme-tertiary">Weeks Remaining</div>
                </div>
            </div>

            {/* Visual Life Progress Bar */}
            <div className="mb-4">
                <div className="h-4 bg-theme-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(percentageLived, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-xs text-theme-tertiary">
                    <span>Birth</span>
                    <span>Now ({yearsLived}y)</span>
                    <span>{expectedLifespan}y</span>
                </div>
            </div>

            {/* Decade Grid */}
            <div className="flex justify-between mb-2">
                {decadeMarkers.map((decade) => (
                    <div
                        key={decade.age}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium transition-colors ${decade.isCurrent
                            ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                            : decade.isLived
                                ? 'bg-green-500/30 text-green-600'
                                : 'bg-theme-tertiary text-theme-tertiary'
                            }`}
                        title={`Age ${decade.age}`}
                    >
                        {decade.age}
                    </div>
                ))}
            </div>

            {/* Perspective Stats */}
            <div className="mt-4 pt-4 border-t border-theme grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                    <div className="text-lg font-bold text-amber-500">☀️ {summersSoFar}</div>
                    <div className="text-xs text-theme-tertiary">Summers So Far</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-cyan-500">☀️ {summersRemaining}</div>
                    <div className="text-xs text-theme-tertiary">Summers Remaining</div>
                </div>
            </div>

            <p className="text-xs text-center text-theme-tertiary mt-3">
                Based on {expectedLifespan}-year lifespan • {totalWeeks.toLocaleString()} total weeks
            </p>
        </div>
    );
};
