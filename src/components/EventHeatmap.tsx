import React, { useMemo } from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, subYears } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';

interface EventData {
  date: Date;
  count: number;
  importance: Story['importance'];
  stories: Story[];
}

interface HeatmapDay {
  date: Date;
  count: number;
  intensity: number;
  stories: Story[];
  hasHighImportance: boolean;
}

const eventColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export const EventHeatmap: React.FC = () => {
  const { stories } = useTimelineStore();

  const heatmapData = useMemo(() => {
    // Get the last year of data
    const endDate = new Date();
    const startDate = subYears(endDate, 1);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group stories by date and calculate event density
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
        return { date, count: 0, intensity: 0, stories: [], hasHighImportance: false };
      }

      // Calculate intensity based on number of events
      const intensity = Math.min(dayStories.length / 5, 1); // Normalize to 0-1, max at 5 events
      const hasHighImportance = dayStories.some(s => s.importance === 'high');

      return {
        date,
        count: dayStories.length,
        intensity,
        stories: dayStories,
        hasHighImportance
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

  const getIntensityClass = (day: HeatmapDay) => {
    if (day.count === 0) return 'bg-theme-tertiary';
    
    // Use different colors based on importance
    if (day.hasHighImportance) {
      if (day.intensity < 0.33) return 'bg-red-300';
      if (day.intensity < 0.66) return 'bg-red-500';
      return 'bg-red-700';
    }
    
    // Default blue gradient for regular events
    if (day.intensity < 0.33) return 'bg-blue-300';
    if (day.intensity < 0.66) return 'bg-blue-500';
    return 'bg-blue-700';
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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEvents = stories.length;
    const activeDays = heatmapData.filter(d => d.count > 0).length;
    const highImportanceEvents = stories.filter(s => s.importance === 'high').length;
    const avgEventsPerActiveDay = activeDays > 0 ? Math.round(totalEvents / activeDays * 10) / 10 : 0;
    
    return { totalEvents, activeDays, highImportanceEvents, avgEventsPerActiveDay };
  }, [stories, heatmapData]);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-theme-primary mb-6">Event Heatmap - Last Year</h2>
      
      {/* Event Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="text-sm text-theme-tertiary">Events:</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 border border-theme rounded-sm"></div>
          <span className="text-sm text-theme-tertiary">Low Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border border-theme rounded-sm"></div>
          <span className="text-sm text-theme-tertiary">Medium Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700 border border-theme rounded-sm"></div>
          <span className="text-sm text-theme-tertiary">High Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border border-theme rounded-sm"></div>
          <span className="text-sm text-theme-tertiary">Important Event</span>
        </div>
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
                        className={`w-3 h-3 rounded-sm border border-theme cursor-pointer transition-all hover:border-gray-400 hover:scale-110 ${getIntensityClass(day)}`}
                        title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} event${day.count !== 1 ? 's' : ''}${day.hasHighImportance ? ' (includes important)' : ''}`}
                      >
                        {day.count > 0 && (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {day.count}
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
              {stats.totalEvents}
            </div>
            <div className="text-sm text-theme-tertiary">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {stats.activeDays}
            </div>
            <div className="text-sm text-theme-tertiary">Active Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {stats.highImportanceEvents}
            </div>
            <div className="text-sm text-theme-tertiary">Important Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-primary">
              {stats.avgEventsPerActiveDay}
            </div>
            <div className="text-sm text-theme-tertiary">Avg Events/Day</div>
          </div>
        </div>
      </div>
    </div>
  );
};
