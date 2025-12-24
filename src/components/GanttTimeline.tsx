import React, { useMemo, useState } from 'react';
import { format, addMonths, startOfYear, endOfYear, differenceInDays, addYears, getYear, min, max, startOfMonth } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import {
  ChevronLeft,
  ChevronRight,
  Maximize
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

// Color palette matching your app theme
const categoryColors: Record<string, string> = {
  career: 'bg-blue-500',
  health: 'bg-green-500',
  travel: 'bg-purple-500',
  family: 'bg-pink-500',
  education: 'bg-yellow-500',
  personal: 'bg-teal-500',
  relationship: 'bg-rose-500',
  other: 'bg-orange-500',
  job: 'bg-blue-600',
  home: 'bg-green-600',
};

type ViewMode = '1y' | '5y' | '10y' | 'all';

export const GanttTimeline: React.FC = () => {
  const { stories } = useTimelineStore();

  // State for time navigation
  const [viewMode, setViewMode] = useState<ViewMode>('1y');
  const [baseDate, setBaseDate] = useState(new Date()); // The starting point of the view

  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(['career', 'travel', 'family', 'home', 'job', 'relationship'])
  );

  // 1. Calculate View Range (Start/End) based on mode
  const { viewStart, viewEnd, tickType } = useMemo(() => {
    let start = startOfYear(baseDate);
    let end = endOfYear(baseDate);
    let tick = 'month';

    if (viewMode === '1y') {
      start = startOfYear(baseDate);
      end = endOfYear(baseDate);
      tick = 'month';
    } else if (viewMode === '5y') {
      start = startOfYear(baseDate);
      end = endOfYear(addYears(baseDate, 4)); // 5 years total
      tick = 'year';
    } else if (viewMode === '10y') {
      start = startOfYear(baseDate);
      end = endOfYear(addYears(baseDate, 9)); // 10 years total
      tick = 'year';
    } else if (viewMode === 'all') {
      // Find min/max of ALL stories
      if (stories.length > 0) {
        const dates = stories.map(s => new Date(s.date));
        const endDates = stories.filter(s => s.endDate).map(s => new Date(s.endDate!));
        start = startOfYear(min(dates));
        end = endOfYear(max([...dates, ...endDates, new Date()])); // Include today/future
      }
      tick = 'year';
    }

    return { viewStart: start, viewEnd: end, tickType: tick };
  }, [viewMode, baseDate, stories]);

  // 2. Generate Ticks (Columns)
  const ticks = useMemo(() => {
    const t: Date[] = [];
    if (tickType === 'month') {
      let current = startOfMonth(viewStart);
      while (current <= viewEnd) {
        t.push(current);
        current = addMonths(current, 1);
      }
    } else {
      // Years
      let current = startOfYear(viewStart);
      while (current <= viewEnd) {
        t.push(current);
        current = addYears(current, 1);
      }
    }
    return t;
  }, [viewStart, viewEnd, tickType]);

  // 3. Process Stories into Lanes
  const lanes = useMemo(() => {
    // Filter stories that overlap with the current View Window
    const visibleStories = stories.filter(story => {
      const sDate = new Date(story.date);
      const eDate = story.endDate ? new Date(story.endDate) : sDate;
      // Check overlap
      return sDate <= viewEnd && eDate >= viewStart;
    });

    const categories: Record<string, Lane> = {};

    // Helper to add bar
    const addBar = (story: typeof stories[0], category: string) => {
      // Map Tags to standard categories if needed
      if (!categories[category]) {
        categories[category] = {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          color: categoryColors[category] || categoryColors.other,
          bars: []
        };
      }

      const s = new Date(story.date);
      const e = story.endDate ? new Date(story.endDate) : s;

      categories[category].bars.push({
        id: story.id,
        title: story.title,
        startDate: s,
        endDate: e,
        category,
        color: categoryColors[category] || categoryColors.other,
      });
    };

    visibleStories.forEach(story => {
      // Determine Category
      let category = 'other';
      const tags = story.tags.map((t: string) => t.toLowerCase());

      if (tags.some((t: string) => ['career', 'work', 'job'].includes(t))) category = 'job';
      else if (tags.some((t: string) => ['home', 'house'].includes(t))) category = 'home';
      else if (tags.some((t: string) => ['relationship', 'partner', 'dating', 'love'].includes(t))) category = 'relationship';
      else if (story.tags.length > 0) category = story.tags[0]; // Fallback to first tag

      // Filter by user selection
      if (visibleCategories.has(category)) {
        addBar(story, category);
      }
    });

    // Sort bars by date
    Object.values(categories).forEach(lane => {
      lane.bars.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });

    return Object.values(categories);
  }, [stories, viewStart, viewEnd, visibleCategories]);

  // 4. Calculate Positioning (Percentage CSS)
  const getBarStyle = (bar: TimelineBar) => {
    const totalDuration = differenceInDays(viewEnd, viewStart);
    if (totalDuration === 0) return { left: '0%', width: '0%' };

    // Clamp dates to view window for rendering
    const visibleStart = bar.startDate < viewStart ? viewStart : bar.startDate;
    const visibleEnd = bar.endDate > viewEnd ? viewEnd : bar.endDate;

    // Calc offset and width
    const startOffset = differenceInDays(visibleStart, viewStart);
    const duration = differenceInDays(visibleEnd, visibleStart);

    // Guard against negative widths or off-screen
    const left = Math.max(0, (startOffset / totalDuration) * 100);
    const width = Math.max(0.5, (duration / totalDuration) * 100); // Min width 0.5%

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const handlePrev = () => {
    if (viewMode === '1y') setBaseDate(addYears(baseDate, -1));
    if (viewMode === '5y') setBaseDate(addYears(baseDate, -5));
    if (viewMode === '10y') setBaseDate(addYears(baseDate, -10));
  };

  const handleNext = () => {
    if (viewMode === '1y') setBaseDate(addYears(baseDate, 1));
    if (viewMode === '5y') setBaseDate(addYears(baseDate, 5));
    if (viewMode === '10y') setBaseDate(addYears(baseDate, 10));
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(visibleCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setVisibleCategories(next);
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6 flex flex-col h-full border border-theme">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
          <Maximize className="w-6 h-6" />
          Gantt Timeline
        </h2>

        <div className="flex items-center gap-2 bg-theme-tertiary p-1 rounded-lg">
          <button onClick={() => setViewMode('1y')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === '1y' ? 'bg-theme-primary shadow text-theme-accent' : 'text-theme-secondary hover:text-theme-primary'}`}>1 Year</button>
          <button onClick={() => setViewMode('5y')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === '5y' ? 'bg-theme-primary shadow text-theme-accent' : 'text-theme-secondary hover:text-theme-primary'}`}>5 Years</button>
          <button onClick={() => setViewMode('10y')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === '10y' ? 'bg-theme-primary shadow text-theme-accent' : 'text-theme-secondary hover:text-theme-primary'}`}>10 Years</button>
          <button onClick={() => setViewMode('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'all' ? 'bg-theme-primary shadow text-theme-accent' : 'text-theme-secondary hover:text-theme-primary'}`}>All Time</button>
        </div>

        {viewMode !== 'all' && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-mono font-medium text-lg min-w-[100px] text-center">
              {getYear(viewStart)}
              {viewMode !== '1y' && ` - ${getYear(viewEnd)}`}
            </span>
            <button onClick={handleNext} className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-theme-tertiary/30 rounded-lg border border-theme/50">
        <span className="text-xs font-bold uppercase tracking-wider text-theme-secondary flex items-center mr-2">Filters:</span>
        {Object.entries(categoryColors).map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all border ${visibleCategories.has(cat)
                ? 'bg-theme-primary border-theme shadow-sm opacity-100'
                : 'bg-transparent border-transparent opacity-50 grayscale hover:grayscale-0'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-x-auto custom-scrollbar relative">
        <div className="min-w-[800px] relative">

          {/* Ticks / Columns */}
          <div className="flex border-b border-theme sticky top-0 bg-theme-primary z-20">
            <div className="w-32 flex-shrink-0 bg-theme-primary border-r border-theme z-30">
              {/* Lane Headers Column */}
            </div>
            <div className="flex-1 flex relative">
              {ticks.map((tick, i) => (
                <div key={i} className="flex-1 border-r border-theme/30 px-1 py-2 text-center">
                  <span className="text-xs font-medium text-theme-secondary block truncate">
                    {tickType === 'month' ? format(tick, 'MMM') : format(tick, 'yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Background Lines (Optional visual aid) */}
          <div className="absolute inset-0 top-[33px] left-32 flex pointer-events-none z-0">
            {ticks.map((_, i) => (
              <div key={i} className="flex-1 border-r border-theme/10 h-full" />
            ))}
          </div>

          {/* Lanes & Bars */}
          <div className="divide-y divide-theme/30 relative z-10">
            {lanes.map(lane => (
              <div key={lane.id} className="flex group hover:bg-theme-tertiary/20 transition-colors">
                {/* Lane Label */}
                <div className="w-32 flex-shrink-0 p-3 border-r border-theme flex items-center gap-2 bg-theme-primary sticky left-0 z-20">
                  <div className={`w-3 h-3 rounded-full ${lane.color}`} />
                  <span className="text-sm font-medium text-theme-primary truncate" title={lane.name}>{lane.name}</span>
                </div>

                {/* Bar Track */}
                <div className="flex-1 relative h-12">
                  {lane.bars.map(bar => {
                    const style = getBarStyle(bar);
                    // Don't render if completely off screen (width 0)
                    if (style.width === '0%') return null;

                    return (
                      <div
                        key={bar.id}
                        className={`absolute top-3 h-6 rounded shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110 flex items-center px-2 ${bar.color} overflow-hidden whitespace-nowrap`}
                        style={style}
                        title={`${bar.title} (${format(bar.startDate, 'MMM yyyy')} - ${format(bar.endDate, 'MMM yyyy')})`}
                      >
                        <span className="text-[10px] md:text-xs font-bold text-white drop-shadow-sm truncate">
                          {bar.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {lanes.length === 0 && (
              <div className="py-12 text-center text-theme-secondary italic">
                No events found in this time range. Try switching to "All Time" or adjusting filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
