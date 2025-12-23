import React, { useMemo, useState } from 'react';
import { format, differenceInMonths, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, startOfYear, endOfYear, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface TimelineBar {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  category: string;
  color: string;
}

interface Lane {
  id: string;
  name: string;
  color: string;
  bars: TimelineBar[];
}

const categoryColors: Record<string, string> = {
  career: 'bg-blue-500',
  health: 'bg-green-500',
  travel: 'bg-purple-500',
  family: 'bg-pink-500',
  education: 'bg-yellow-500',
  personal: 'bg-teal-500',
  relationship: 'bg-rose-500', // Added specific color for relationships
  other: 'bg-orange-500',
  job: 'bg-blue-600',
  home: 'bg-green-600',
};

export const GanttTimeline: React.FC = () => {
  const { stories } = useTimelineStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Added 'relationship' to default visible categories
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(['career', 'travel', 'family', 'home', 'job', 'relationship'])
  );

  const toggleCategory = (category: string) => {
    const newVisible = new Set(visibleCategories);
    if (newVisible.has(category)) {
      newVisible.delete(category);
    } else {
      newVisible.add(category);
    }
    setVisibleCategories(newVisible);
  };

  // Group stories into lanes by category
  const lanes = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

    // Filter stories for the selected year
    const yearStories = stories.filter(story => {
      const storyDate = new Date(story.date);
      // For active stories or those missing end dates, assume they end at the story date or today if implied active
      // But for the year overlap check, we just need to see if the range touches the year
      const storyEnd = story.endDate ? new Date(story.endDate) : storyDate;
      return storyDate <= yearEnd && storyEnd >= yearStart;
    });

    // Group by category
    const categories: Record<string, Lane> = {};

    // 1. Process Duration Stories (Ranges)
    // CRITICAL FIX: Added 'relationship', 'partner', 'dating' to the filter
    const durationStories = yearStories.filter(story =>
      story.tags.some(t => ['career', 'work', 'job', 'home', 'house', 'relationship', 'partner', 'dating'].includes(t.toLowerCase())) &&
      story.endDate
    );

    durationStories.forEach(story => {
      // Determine category based on tags
      let category = 'other';
      if (story.tags.some(t => ['career', 'work', 'job'].includes(t.toLowerCase()))) category = 'job';
      else if (story.tags.some(t => ['home', 'house'].includes(t.toLowerCase()))) category = 'home';
      else if (story.tags.some(t => ['relationship', 'partner', 'dating'].includes(t.toLowerCase()))) category = 'relationship';

      if (!categories[category]) {
        categories[category] = {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          color: categoryColors[category] || categoryColors.other,
          bars: []
        };
      }

      const startDate = new Date(story.date);
      const endDate = new Date(story.endDate!);

      categories[category].bars.push({
        id: story.id,
        title: story.title,
        startDate,
        endDate,
        category,
        color: categoryColors[category] || categoryColors.other,
      });
    });

    // 2. Process Regular Stories (Points / Events without End Date)
    // We exclude stories we already processed as duration stories
    const durationIds = new Set(durationStories.map(s => s.id));
    const regularStories = yearStories.filter(story => !durationIds.has(story.id));

    regularStories.forEach(story => {
      // Default categorization for points
      const category = story.tags[0] || 'other';
      // Map common tags to our keys
      let mappedCategory = category.toLowerCase();
      if (['partner', 'dating', 'love'].includes(mappedCategory)) mappedCategory = 'relationship';

      const startDate = new Date(story.date);
      const endDate = story.endDate ? new Date(story.endDate) : startDate;

      const color = categoryColors[mappedCategory] || categoryColors.other;

      if (!categories[mappedCategory]) {
        categories[mappedCategory] = {
          id: mappedCategory,
          name: mappedCategory.charAt(0).toUpperCase() + mappedCategory.slice(1),
          color: color,
          bars: [],
        };
      }

      categories[mappedCategory].bars.push({
        id: story.id,
        title: story.title,
        startDate,
        endDate,
        category: mappedCategory,
        color: color,
      });
    });

    // Sort bars within each lane by start date
    Object.values(categories).forEach(lane => {
      lane.bars.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });

    return Object.values(categories).filter(lane =>
      visibleCategories.has(lane.id)
    );
  }, [stories, selectedYear, visibleCategories]);

  // Generate months for the timeline header
  const months = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(addMonths(yearStart, i));
    }
    return months;
  }, [selectedYear]);

  // Calculate bar position and width
  const getBarStyle = (bar: TimelineBar) => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const yearDays = differenceInDays(yearEnd, yearStart) + 1;

    // Clamp dates to year boundaries
    const clampedStart = bar.startDate < yearStart ? yearStart : bar.startDate;
    const clampedEnd = bar.endDate > yearEnd ? yearEnd : bar.endDate;

    const startOffset = differenceInDays(clampedStart, yearStart);
    // Ensure at least 1 day width for visibility
    const duration = Math.max(1, differenceInDays(clampedEnd, clampedStart));

    const left = (startOffset / yearDays) * 100;
    const width = (duration / yearDays) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
      minWidth: '4px', // Increased minimum width for visibility
    };
  };

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Gantt Timeline</h2>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-theme-secondary w-16 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 p-4 bg-theme-tertiary rounded-lg">
        <div className="text-sm font-medium text-theme-secondary mb-3">Filter Categories:</div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(categoryColors).map(([category, color]) => (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-theme-primary rounded-md hover:opacity-80 transition-opacity"
            >
              <input
                type="checkbox"
                checked={visibleCategories.has(category)}
                onChange={() => toggleCategory(category)}
                className="w-4 h-4 text-primary-600 border-theme rounded focus:ring-2 focus:ring-primary-500"
              />
              <div className={`w-3 h-3 rounded ${color}`}></div>
              <span className="text-sm text-theme-primary capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b-2 border-theme pb-2 mb-4">
            <div className="w-32 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {months.map(month => (
                <div
                  key={month.toISOString()}
                  className="flex-1 text-center text-sm font-medium text-theme-secondary border-l border-theme first:border-l-0"
                >
                  {format(month, 'MMM')}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {lanes.map(lane => (
              <div key={lane.id} className="flex items-center group">
                <div className="w-32 flex-shrink-0 pr-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${lane.color}`}></div>
                    <span className="text-sm font-medium text-theme-secondary">{lane.name}</span>
                  </div>
                </div>

                <div className="flex-1 relative h-8 bg-theme-tertiary/50 rounded hover:bg-theme-tertiary transition-colors">
                  {lane.bars.map(bar => {
                    const style = getBarStyle(bar);
                    return (
                      <div
                        key={bar.id}
                        className={`absolute top-1 h-6 ${bar.color} rounded shadow-sm cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all flex items-center px-2 z-10`}
                        style={style}
                        title={`${bar.title}\n${format(bar.startDate, 'MMM d, yyyy')} - ${format(bar.endDate, 'MMM d, yyyy')}`}
                      >
                        <span className="text-white text-xs font-medium truncate drop-shadow-md">
                          {bar.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {lanes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No events found for {selectedYear}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
