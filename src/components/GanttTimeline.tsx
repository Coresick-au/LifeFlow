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
  mood: Story['mood'];
  color: string;
}

interface Lane {
  id: string;
  name: string;
  color: string;
  bars: TimelineBar[];
}

const categoryColors = {
  career: 'bg-blue-500/200',
  health: 'bg-green-500/200',
  travel: 'bg-purple-500/200',
  family: 'bg-pink-500/200',
  education: 'bg-yellow-500',
  personal: 'bg-theme-tertiary0',
  other: 'bg-orange-500',
  job: 'bg-blue-600',
  home: 'bg-green-600',
};

export const GanttTimeline: React.FC = () => {
  const { stories } = useTimelineStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(['career', 'travel', 'family', 'home', 'job'])
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
      const storyEnd = story.endDate ? new Date(story.endDate) : storyDate;
      // Include if story overlaps with the selected year
      return storyDate <= yearEnd && storyEnd >= yearStart;
    });

    // Group by category
    const categories: Record<string, Lane> = {};

    // Process stories with date ranges (jobs, homes)
    const durationStories = yearStories.filter(story =>
      story.tags.some(t => ['career', 'work', 'job', 'home', 'house'].includes(t.toLowerCase())) &&
      story.endDate
    );

    durationStories.forEach(story => {
      const category = story.tags.find(t => ['career', 'work', 'job'].includes(t.toLowerCase())) ? 'job' :
        story.tags.find(t => ['home', 'house'].includes(t.toLowerCase())) ? 'home' : 'other';

      if (!categories[category]) {
        categories[category] = {
          id: category,
          name: category === 'job' ? 'Career' : category === 'home' ? 'Homes' : 'Other',
          color: categoryColors[category as keyof typeof categoryColors],
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
        mood: story.mood,
        color: categoryColors[category as keyof typeof categoryColors],
      });
    });

    // Process regular stories (without end dates)
    const regularStories = yearStories.filter(story => !story.endDate);

    regularStories.forEach(story => {
      const category = story.tags[0] || 'other';
      const startDate = new Date(story.date);
      const endDate = story.endDate ? new Date(story.endDate) : startDate;

      if (!categories[category]) {
        categories[category] = {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          color: categoryColors[category as keyof typeof categoryColors] || categoryColors.other,
          bars: [],
        };
      }

      categories[category].bars.push({
        id: story.id,
        title: story.title,
        startDate,
        endDate,
        category,
        mood: story.mood,
        color: categoryColors[category as keyof typeof categoryColors] || categoryColors.other,
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
    const duration = differenceInDays(clampedEnd, clampedStart) || 1;

    const left = (startOffset / yearDays) * 100;
    const width = (duration / yearDays) * 100;

    return {
      left: `${left}% `,
      width: `${width}% `,
      minWidth: '2px',
    };
  };

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Gantt Timeline</h2>

        <div className="flex items-center gap-4">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-md transition-colors"
              title="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-theme-secondary w-16 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 bg-theme-tertiary hover:bg-theme-secondary text-theme-primary rounded-md transition-colors"
              title="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year Selector */}
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

      {/* Category Filters */}
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
              <div className={`w - 3 h - 3 rounded ${color} `}></div>
              <span className="text-sm text-theme-primary capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timeline Header */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month Headers */}
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

          {/* Timeline Lanes */}
          <div className="space-y-2">
            {lanes.map(lane => (
              <div key={lane.id} className="flex items-center">
                {/* Lane Label */}
                <div className="w-32 flex-shrink-0 pr-4">
                  <div className="flex items-center gap-2">
                    <div className={`w - 3 h - 3 rounded - full ${lane.color} `}></div>
                    <span className="text-sm font-medium text-theme-secondary">{lane.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({lane.bars.length})</span>
                  </div>
                </div>

                {/* Timeline Bars */}
                <div className="flex-1 relative h-8 bg-theme-tertiary rounded">
                  {lane.bars.map(bar => {
                    const style = getBarStyle(bar);
                    return (
                      <div
                        key={bar.id}
                        className={`absolute top - 1 h - 6 ${bar.color} rounded cursor - pointer hover: opacity - 80 transition - opacity flex items - center px - 2`}
                        style={style}
                        title={`${bar.title} \n${format(bar.startDate, 'MMM d')} - ${format(bar.endDate, 'MMM d')} `}
                      >
                        <span className="text-white text-xs truncate">
                          {bar.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {lanes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No stories found for {selectedYear}</p>
              <p className="text-sm text-gray-400 mt-2">Try selecting a different year or add some stories</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-theme">
        <div className="text-sm text-theme-tertiary mb-2">Categories:</div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div className={`w - 3 h - 3 rounded ${color} `}></div>
              <span className="text-sm text-theme-tertiary capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xl font-bold text-theme-primary">{lanes.reduce((sum, lane) => sum + lane.bars.length, 0)}</div>
          <div className="text-sm text-theme-tertiary">Total Events</div>
        </div>
        <div>
          <div className="text-xl font-bold text-theme-primary">{lanes.length}</div>
          <div className="text-sm text-theme-tertiary">Active Categories</div>
        </div>
        <div>
          <div className="text-xl font-bold text-theme-primary">
            {Math.round(lanes.reduce((sum, lane) => sum + lane.bars.reduce((s, b) => s + (differenceInDays(b.endDate, b.startDate) || 1), 0), 0) / 365 * 100)}%
          </div>
          <div className="text-sm text-theme-tertiary">Year Coverage</div>
        </div>
      </div>
    </div>
  );
};
