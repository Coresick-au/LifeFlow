import React, { useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { LIFE_CATEGORIES, getCategoryForStory, DEFAULT_CATEGORY_COLOR } from '../constants/categories';
import { differenceInWeeks, addWeeks, isSameWeek, format, startOfWeek } from 'date-fns';

interface WeekData {
    weekStart: Date;
    age: number;
    weekOfYear: number;
    stories: Story[];
    dominantCategory: string | null;
    eventCount: number;
}

/**
 * Life Weeks Heatmap - GitHub-style contribution graph for your entire life
 * Each row = 1 year of life, each column = 1 week (52 cols)
 * Colored by dominant event category
 */
export const LifeWeeksHeatmap: React.FC = () => {
    const { stories, userProfile } = useTimelineStore();

    const { weeksData, ageYears, hasData } = useMemo(() => {
        if (!userProfile?.birthDate) {
            return { weeksData: [], ageYears: 0, hasData: false };
        }

        const birthDate = new Date(userProfile.birthDate);
        const now = new Date();
        const totalWeeks = differenceInWeeks(now, birthDate);
        const ageYears = Math.ceil(totalWeeks / 52);

        // Create a map of week -> stories for quick lookup
        const storyByWeek = new Map<string, Story[]>();

        stories.forEach(story => {
            const storyDate = new Date(story.date);
            const weekKey = format(startOfWeek(storyDate), 'yyyy-MM-dd');

            if (!storyByWeek.has(weekKey)) {
                storyByWeek.set(weekKey, []);
            }
            storyByWeek.get(weekKey)!.push(story);
        });

        // Build the weeks data grid
        const weeksData: WeekData[] = [];

        for (let weekIndex = 0; weekIndex <= totalWeeks; weekIndex++) {
            const weekStart = startOfWeek(addWeeks(birthDate, weekIndex));
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const weekStories = storyByWeek.get(weekKey) || [];

            // Count categories for this week
            const categoryCounts: Record<string, number> = {};
            weekStories.forEach(story => {
                const category = getCategoryForStory(story.tags) || 'uncategorized';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            // Find dominant category
            let dominantCategory: string | null = null;
            let maxCount = 0;
            Object.entries(categoryCounts).forEach(([cat, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    dominantCategory = cat;
                }
            });

            weeksData.push({
                weekStart,
                age: Math.floor(weekIndex / 52),
                weekOfYear: weekIndex % 52,
                stories: weekStories,
                dominantCategory,
                eventCount: weekStories.length,
            });
        }

        return { weeksData, ageYears, hasData: stories.length > 0 };
    }, [stories, userProfile]);

    const getCellColor = (week: WeekData): string => {
        if (week.eventCount === 0) return 'bg-slate-800/30';

        if (week.dominantCategory && LIFE_CATEGORIES[week.dominantCategory]) {
            const baseColor = LIFE_CATEGORIES[week.dominantCategory].color.hex;
            // Add opacity based on event count (more events = more opaque)
            const opacity = Math.min(0.4 + (week.eventCount * 0.2), 1);
            return '';
        }

        return 'bg-slate-500/50';
    };

    const getCellStyle = (week: WeekData): React.CSSProperties => {
        if (week.eventCount === 0) {
            return { backgroundColor: 'rgba(51, 65, 85, 0.3)' }; // slate-700/30
        }

        if (week.dominantCategory && LIFE_CATEGORIES[week.dominantCategory]) {
            const baseColor = LIFE_CATEGORIES[week.dominantCategory].color.hex;
            const opacity = Math.min(0.5 + (week.eventCount * 0.15), 1);
            return {
                backgroundColor: baseColor,
                opacity,
            };
        }

        return { backgroundColor: DEFAULT_CATEGORY_COLOR, opacity: 0.5 };
    };

    // Group weeks by age year
    const yearGroups = useMemo(() => {
        const groups: WeekData[][] = [];
        for (let year = 0; year < ageYears; year++) {
            groups.push(weeksData.filter(w => w.age === year));
        }
        return groups;
    }, [weeksData, ageYears]);

    if (!userProfile?.birthDate) {
        return (
            <div className="bg-theme-primary rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-theme-primary mb-2">Life Heatmap</h2>
                <p className="text-theme-tertiary text-sm">Set your birth date in your profile to see your life heatmap.</p>
            </div>
        );
    }

    return (
        <div className="bg-theme-primary rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-theme-primary">Life Heatmap</h2>
                <div className="flex gap-4 text-xs">
                    {Object.values(LIFE_CATEGORIES).map(cat => (
                        <div key={cat.id} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: cat.color.hex }}
                            />
                            <span className="text-theme-tertiary">{cat.name}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-slate-600" />
                        <span className="text-theme-tertiary">Empty</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Week numbers header */}
                    <div className="flex mb-1">
                        <div className="w-12 flex-shrink-0" /> {/* Age label spacer */}
                        <div className="flex gap-px flex-1">
                            {[0, 13, 26, 39].map(week => (
                                <div
                                    key={week}
                                    className="text-[10px] text-theme-tertiary"
                                    style={{ width: `${100 / 52 * 13}%` }}
                                >
                                    W{week + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Year rows */}
                    <div className="space-y-px">
                        {yearGroups.map((weeks, yearIndex) => (
                            <div key={yearIndex} className="flex items-center">
                                {/* Age label */}
                                <div className="w-12 flex-shrink-0 text-xs text-theme-tertiary pr-2 text-right">
                                    {yearIndex}
                                </div>

                                {/* Week cells */}
                                <div className="flex gap-px flex-1">
                                    {weeks.map((week, weekIndex) => (
                                        <div
                                            key={weekIndex}
                                            className="flex-1 aspect-square rounded-[2px] cursor-pointer hover:ring-1 hover:ring-white/50 transition-all"
                                            style={getCellStyle(week)}
                                            title={`Age ${week.age}, Week ${week.weekOfYear + 1}${week.eventCount > 0 ? `\n${week.eventCount} event${week.eventCount > 1 ? 's' : ''}` : ''}`}
                                        />
                                    ))}
                                    {/* Fill empty weeks if year isn't complete */}
                                    {Array.from({ length: 52 - weeks.length }).map((_, i) => (
                                        <div
                                            key={`empty-${i}`}
                                            className="flex-1 aspect-square rounded-[2px]"
                                            style={{ backgroundColor: 'rgba(51, 65, 85, 0.1)' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary footer */}
            <div className="mt-4 pt-4 border-t border-theme flex items-center justify-between text-sm">
                <span className="text-theme-tertiary">
                    {stories.length} stories across {ageYears} years of life
                </span>
                <span className="text-theme-tertiary">
                    Each cell = 1 week
                </span>
            </div>
        </div>
    );
};
