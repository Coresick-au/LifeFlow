import React from 'react';
import { Award } from 'lucide-react';

interface AchievementsProps {
    totalStories: number;
    timelineSpan: number;
    uniquePeople: number;
    uniqueLocations: number;
    importantStories: number;
    dayCoverage: number;
}

/**
 * Achievements Component
 * Displays earned badges based on life tracking milestones.
 */
export const Achievements: React.FC<AchievementsProps> = ({
    totalStories,
    timelineSpan,
    uniquePeople,
    uniqueLocations,
    importantStories,
    dayCoverage,
}) => {
    const achievements = [
        { condition: totalStories >= 10, emoji: '📝', label: 'Storyteller' },
        { condition: timelineSpan >= 365, emoji: '📅', label: 'Time Traveler' },
        { condition: uniquePeople >= 10, emoji: '👥', label: 'Connector' },
        { condition: uniqueLocations >= 5, emoji: '🌍', label: 'Explorer' },
        { condition: importantStories >= 5, emoji: '⭐', label: 'Highlight Reel' },
        { condition: dayCoverage >= 50, emoji: '📈', label: 'Consistent' },
    ];

    const earnedAchievements = achievements.filter(a => a.condition);

    if (earnedAchievements.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 rounded-lg p-4 border border-amber-800/30">
            <h4 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Achievements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {earnedAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-lg">{achievement.emoji}</span>
                        <span>{achievement.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
