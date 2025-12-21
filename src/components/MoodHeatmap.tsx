import React, { useMemo, useState } from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, subYears, getDay, getMonth, getDayOfYear } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, Target } from 'lucide-react';

interface MoodData {
  date: Date;
  mood: Story['mood'];
  intensity: number;
}

interface HeatmapDay {
  date: Date;
  mood: Story['mood'] | null;
  intensity: number;
  stories: Story[];
}

const moodScores: Record<NonNullable<Story['mood']>, number> = {
  happy: 5,
  grateful: 4.5,
  proud: 4,
  excited: 4,
  neutral: 3,
  sad: 2,
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const moodColors = {
  happy: 'bg-green-500',
  excited: 'bg-yellow-500',
  proud: 'bg-purple-500',
  grateful: 'bg-pink-500',
  neutral: 'bg-gray-400',
  sad: 'bg-blue-500',
};

const moodEmojis = {
  happy: '😊',
  excited: '🎉',
  proud: '🏆',
  grateful: '🙏',
  neutral: '😐',
  sad: '😢',
};

export const MoodHeatmap: React.FC = () => {
  const { stories } = useTimelineStore();
  const [viewMode, setViewMode] = useState<'heatmap' | 'correlations'>('heatmap');

  // Process mood data for correlations
  const moodData = useMemo(() => {
    return stories
      .filter(story => story.mood)
      .map(story => ({
        date: new Date(story.date),
        mood: story.mood,
        score: moodScores[story.mood!] || 3,
        story,
      }));
  }, [stories]);

  // Calculate day of week patterns
  const dayOfWeekPatterns = useMemo(() => {
    const patterns: Record<string, typeof moodData> = {};
    
    daysOfWeek.forEach(day => {
      patterns[day] = [];
    });

    moodData.forEach(data => {
      const dayName = daysOfWeek[getDay(data.date)];
      patterns[dayName].push(data);
    });

    return daysOfWeek.map((day: string) => ({
      day,
      averageScore: patterns[day].length > 0 
        ? patterns[day].reduce((sum, d) => sum + d.score, 0) / patterns[day].length 
        : 0,
      count: patterns[day].length,
      stories: patterns[day],
    })).sort((a: any, b: any) => b.averageScore - a.averageScore);
  }, [moodData]);

  // Calculate monthly patterns
  const monthlyPatterns = useMemo(() => {
    const patterns: Record<number, typeof moodData> = {};
    
    for (let i = 0; i < 12; i++) {
      patterns[i] = [];
    }

    moodData.forEach(data => {
      const month = getMonth(data.date);
      patterns[month].push(data);
    });

    return Array.from({ length: 12 }, (_, i) => ({
      month: monthsOfYear[i],
      averageScore: patterns[i].length > 0 
        ? patterns[i].reduce((sum, d) => sum + d.score, 0) / patterns[i].length 
        : 0,
      count: patterns[i].length,
      stories: patterns[i],
    })).sort((a: any, b: any) => b.averageScore - a.averageScore);
  }, [moodData]);

  // Detect outlier days
  const outliers = useMemo(() => {
    const outliers: Array<{ story: Story; score: number; surroundingAverage: number; deviation: number }> = [];
    
    moodData.forEach(data => {
      // Calculate average of stories within 7 days before and after
      const nearbyStories = moodData.filter(d => {
        const dayDiff = Math.abs(getDayOfYear(d.date) - getDayOfYear(data.date));
        return dayDiff > 0 && dayDiff <= 7 && isSameDay(d.date, data.date) === false;
      });

      if (nearbyStories.length >= 3) {
        const surroundingAverage = nearbyStories.reduce((sum, d) => sum + d.score, 0) / nearbyStories.length;
        const deviation = Math.abs(data.score - surroundingAverage);
        
        // Mark as outlier if deviation is significant (> 1.5 points)
        if (deviation > 1.5) {
          outliers.push({
            story: data.story,
            score: data.score,
            surroundingAverage,
            deviation,
          });
        }
      }
    });

    return outliers.sort((a, b) => b.deviation - a.deviation).slice(0, 10);
  }, [moodData]);

  const heatmapData = useMemo(() => {
    // Get the last year of data
    const endDate = new Date();
    const startDate = subYears(endDate, 1);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group stories by date and calculate mood
    const storiesByDate = stories.reduce((acc: Record<string, Story[]>, story) => {
      const dateKey = format(story.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(story);
      return acc;
    }, {});

    // Create heatmap data
    const heatmap: HeatmapDay[] = days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayStories = storiesByDate[dateKey] || [];
      
      if (dayStories.length === 0) {
        return { date, mood: null, intensity: 0, stories: [] };
      }

      // Calculate dominant mood and intensity
      const moodCounts: Record<string, number> = {};
      dayStories.forEach(story => {
        const mood = story.mood || 'neutral';
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });

      const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
        moodCounts[a[0]] > moodCounts[b[0]] ? a : b
      )[0] as Story['mood'];

      const intensity = Math.min(dayStories.length / 3, 1); // Normalize to 0-1

      return {
        date,
        mood: dominantMood,
        intensity,
        stories: dayStories
      };
    });

    return heatmap;
  }, [stories]);

  // Group by weeks for display
  const weeks = useMemo(() => {
    const weeksArray: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Start new week on Sunday
      if (day.date.getDay() === 6 || index === heatmapData.length - 1) {
        weeksArray.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeksArray;
  }, [heatmapData]);

  const getIntensityClass = (intensity: number, mood: Story['mood'] | null) => {
    if (!mood) return 'bg-theme-tertiary';
    const baseColor = moodColors[mood];
    
    if (intensity < 0.33) return `${baseColor} opacity-30`;
    if (intensity < 0.66) return `${baseColor} opacity-60`;
    return `${baseColor} opacity-100`;
  };

  const monthLabels = useMemo(() => {
    const labels: string[] = [];
    const currentMonth = heatmapData[0]?.date;
    
    if (currentMonth) {
      for (let i = 0; i < 12; i++) {
        const month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
        labels.push(format(month, 'MMM'));
      }
    }
    
    return labels;
  }, [heatmapData]);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Mood Heatmap</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'heatmap' 
                ? 'bg-primary-600 text-white' 
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('correlations')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'correlations' 
                ? 'bg-primary-600 text-white' 
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
            }`}
          >
            Correlations
          </button>
        </div>
      </div>

      {viewMode === 'heatmap' ? (
        <div>
      {/* Mood Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="text-sm text-theme-tertiary">Moods:</div>
        {Object.entries(moodEmojis).map(([mood, emoji]) => (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <span className="text-sm text-theme-tertiary capitalize">{mood}</span>
          </div>
        ))}
      </div>

      {/* Intensity Legend */}
      <div className="mb-6 flex items-center gap-4">
        <div className="text-sm text-theme-tertiary">Intensity:</div>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-theme-tertiary border border-theme rounded-sm"></div>
          <div className="w-4 h-4 bg-green-500 opacity-30 border border-theme rounded-sm"></div>
          <div className="w-4 h-4 bg-green-500 opacity-60 border border-theme rounded-sm"></div>
          <div className="w-4 h-4 bg-green-500 opacity-100 border border-theme rounded-sm"></div>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Less → More</div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-1 mb-2 ml-12">
            {monthLabels.map((month, index) => (
              <div key={index} className="text-xs text-slate-500 dark:text-slate-400" style={{ width: '12px * 4' }}>
                {index % 3 === 0 ? month : ''}
              </div>
            ))}
          </div>

          {/* Day labels and heatmap */}
          <div className="flex gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col gap-1 mr-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div key={index} className="text-xs text-slate-500 dark:text-slate-400 h-3 w-3 flex items-center justify-center">
                  {index > 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Heatmap weeks */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = week[dayIndex];
                    if (!day) {
                      return <div key={dayIndex} className="w-3 h-3"></div>;
                    }

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm border border-theme cursor-pointer transition-all hover:border-gray-400 hover:scale-110 ${getIntensityClass(day.intensity, day.mood)}`}
                        title={`${format(day.date, 'MMM d, yyyy')}: ${day.mood || 'No entries'} (${day.stories.length} stories)`}
                      >
                        {day.stories.length > 0 && (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            {day.mood && moodEmojis[day.mood]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-theme">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {stories.filter(s => s.mood === 'happy').length}
            </div>
            <div className="text-sm text-theme-tertiary">Happy Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {stories.filter(s => s.mood === 'sad').length}
            </div>
            <div className="text-sm text-theme-tertiary">Sad Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {Math.round(stories.length / 52)}
            </div>
            <div className="text-sm text-theme-tertiary">Stories/Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {heatmapData.filter(d => d.stories.length > 0).length}
            </div>
            <div className="text-sm text-theme-tertiary">Active Days</div>
          </div>
        </div>
      </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Best & Worst Days of Week */}
          <div className="bg-theme-tertiary rounded-lg p-4">
            <h3 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Best & Worst Days
            </h3>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-600 font-medium">Best mood:</span>
                  <span>{dayOfWeekPatterns[0]?.day || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-medium">Worst mood:</span>
                  <span>{dayOfWeekPatterns[dayOfWeekPatterns.length - 1]?.day || 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-theme">
                {dayOfWeekPatterns.slice(0, 3).map((pattern: any, index: number) => (
                  <div key={pattern.day} className="flex items-center justify-between text-xs mb-1">
                    <span className="text-theme-tertiary">{pattern.day}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{pattern.averageScore.toFixed(1)}</span>
                      {index === 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {index === dayOfWeekPatterns.length - 1 && <TrendingDown className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best & Worst Months */}
          <div className="bg-theme-tertiary rounded-lg p-4">
            <h3 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Seasonal Patterns
            </h3>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-600 font-medium">Best month:</span>
                  <span>{monthlyPatterns[0]?.month || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-medium">Worst month:</span>
                  <span>{monthlyPatterns[monthlyPatterns.length - 1]?.month || 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-theme">
                {monthlyPatterns.slice(0, 3).map((pattern, index) => (
                  <div key={pattern.month} className="flex items-center justify-between text-xs mb-1">
                    <span className="text-theme-tertiary">{pattern.month}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{pattern.averageScore.toFixed(1)}</span>
                      {index === 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Outlier Days */}
          <div className="bg-theme-tertiary rounded-lg p-4">
            <h3 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Notable Days
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {outliers.length > 0 ? (
                outliers.map(outlier => (
                  <div key={outlier.story.id} className="text-xs">
                    <div className="font-medium text-theme-primary">
                      {format(new Date(outlier.story.date), 'MMM d')}
                    </div>
                    <div className="text-theme-tertiary">
                      {outlier.story.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{moodEmojis[outlier.story.mood || 'neutral']}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {outlier.deviation.toFixed(1)} from average
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No significant outliers detected</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
