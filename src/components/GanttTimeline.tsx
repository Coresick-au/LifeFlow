import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  format, addMonths, startOfYear, endOfYear,
  addYears, getYear, min, max,
  startOfMonth, isWithinInterval
} from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import {
  ChevronLeft, ChevronRight, Maximize, Filter,
  Briefcase, Heart, Home, GraduationCap, Plane,
  Folder, Check, X, Search
} from 'lucide-react';

// --- Types ---

interface TimelineItem {
  id: string;
  title: string;
  date: Date;
  type: 'span' | 'point';
  endDate?: Date;
  color: string;
  metadata?: any;
}

type LaneType = 'relationship' | 'career' | 'home' | 'education' | 'travel' | 'project' | 'other';

interface Lane {
  id: string;
  title: string;
  subtitle?: string;
  type: LaneType;
  items: TimelineItem[];
  startDate?: Date; // For sorting
}

type ViewMode = '1y' | '5y' | '10y' | 'all';

// --- Configuration ---

const LANE_CONFIG: Record<LaneType, { label: string, icon: React.FC<any>, colors: any }> = {
  relationship: {
    label: 'Relationships',
    icon: Heart,
    colors: {
      span: 'bg-rose-200 dark:bg-rose-900/40 border-rose-300 dark:border-rose-800',
      point: 'bg-rose-500 border-rose-600',
    }
  },
  career: {
    label: 'Career',
    icon: Briefcase,
    colors: {
      span: 'bg-blue-200 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800',
      point: 'bg-blue-600 border-blue-700',
    }
  },
  home: {
    label: 'Homes',
    icon: Home,
    colors: {
      span: 'bg-emerald-200 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800',
      point: 'bg-emerald-500 border-emerald-600',
    }
  },
  education: {
    label: 'Education',
    icon: GraduationCap,
    colors: {
      span: 'bg-amber-200 dark:bg-amber-900/40 border-amber-300 dark:border-amber-800',
      point: 'bg-amber-500 border-amber-600',
    }
  },
  travel: {
    label: 'Travel',
    icon: Plane,
    colors: {
      span: 'bg-violet-200 dark:bg-violet-900/40 border-violet-300 dark:border-violet-800',
      point: 'bg-violet-500 border-violet-600',
    }
  },
  project: {
    label: 'Projects',
    icon: Folder,
    colors: {
      span: 'bg-cyan-200 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-800',
      point: 'bg-cyan-500 border-cyan-600',
    }
  },
  other: {
    label: 'Other',
    icon: Filter,
    colors: {
      span: 'bg-slate-200 dark:bg-slate-800 border-slate-300',
      point: 'bg-slate-500',
    }
  }
};

export const GanttTimeline: React.FC = () => {
  const { stories, relationships } = useTimelineStore();
  const [viewMode, setViewMode] = useState<ViewMode>('5y');
  const [baseDate, setBaseDate] = useState(new Date());

  // Filtering State
  const [hiddenLaneIds, setHiddenLaneIds] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Close filter on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mouse wheel zoom handler
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl/Cmd is held, otherwise allow normal scroll
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      const viewModes: ViewMode[] = ['1y', '5y', '10y', 'all'];
      const currentIndex = viewModes.indexOf(viewMode);

      if (e.deltaY < 0) {
        // Scroll up = zoom in (less years)
        if (currentIndex > 0) {
          setViewMode(viewModes[currentIndex - 1]);
        }
      } else {
        // Scroll down = zoom out (more years)
        if (currentIndex < viewModes.length - 1) {
          setViewMode(viewModes[currentIndex + 1]);
        }
      }
    };

    chart.addEventListener('wheel', handleWheel, { passive: false });
    return () => chart.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  // --- 1. Viewport Calculation ---

  const { viewStart, viewEnd, tickType } = useMemo(() => {
    let start = startOfYear(baseDate);
    let end = endOfYear(baseDate);
    let tick = 'month';

    if (viewMode === '5y') {
      start = startOfYear(addYears(baseDate, -2));
      end = endOfYear(addYears(baseDate, 2));
      tick = 'year';
    } else if (viewMode === '10y') {
      start = startOfYear(addYears(baseDate, -5));
      end = endOfYear(addYears(baseDate, 5));
      tick = 'year';
    } else if (viewMode === 'all') {
      const allDates = stories.map(s => new Date(s.date));
      if (relationships) allDates.push(...relationships.map(r => new Date(r.startDate)));

      start = startOfYear(min(allDates.length ? allDates : [new Date()]));
      end = endOfYear(new Date());
      tick = 'year';
    }

    return { viewStart: start, viewEnd: end, tickType: tick };
  }, [viewMode, baseDate, stories, relationships]);

  // --- 2. Tick Generation ---

  const ticks = useMemo(() => {
    const t: Date[] = [];
    let current = tickType === 'month' ? startOfMonth(viewStart) : startOfYear(viewStart);
    const addFn = tickType === 'month' ? addMonths : addYears;

    while (current <= viewEnd) {
      t.push(current);
      current = addFn(current, 1);
    }
    return t;
  }, [viewStart, viewEnd, tickType]);

  // --- 3. Data Processing ---

  const allLanes = useMemo(() => {
    const computedLanes: Lane[] = [];

    // --- A. Relationship Lanes ---
    relationships.forEach(rel => {
      const startDate = new Date(rel.startDate);
      const endDate = rel.endDate ? new Date(rel.endDate) : new Date();

      const spanItem: TimelineItem = {
        id: `span-${rel.id}`,
        title: rel.relationshipType,
        date: startDate,
        endDate: endDate,
        type: 'span',
        color: LANE_CONFIG.relationship.colors.span
      };

      const personName = rel.fullName.toLowerCase();
      const relatedStories = stories.filter(s =>
        s.people.some(p => p.toLowerCase() === personName)
      ).map(s => ({
        id: s.id,
        title: s.title,
        date: new Date(s.date),
        type: 'point' as const,
        color: LANE_CONFIG.relationship.colors.point,
      }));

      computedLanes.push({
        id: `rel-${rel.id}`,
        title: rel.fullName,
        subtitle: rel.relationshipType,
        type: 'relationship',
        items: [spanItem, ...relatedStories],
        startDate
      });
    });

    // --- B. Generic Entity Extractor ---
    // Helper to group stories by a key (Company, School, City, etc.)
    const processEntityGroup = (
      tags: string[],
      type: LaneType,
      getKey: (s: any) => string | undefined,
      labelStr: string
    ) => {
      const groups = new Map<string, TimelineItem[]>();
      const spans = new Map<string, { start: Date, end: Date, hasExplicitEnd: boolean }>();

      stories.filter(s => s.tags.some(t => tags.includes(t.toLowerCase()))).forEach(story => {
        const key = getKey(story);
        if (!key) return;

        if (!groups.has(key)) {
          groups.set(key, []);
          spans.set(key, { start: new Date(story.date), end: new Date(story.date), hasExplicitEnd: false });
        }

        const items = groups.get(key)!;
        const currentSpan = spans.get(key)!;
        const sDate = new Date(story.date);
        const eDate = story.endDate ? new Date(story.endDate) : sDate;

        // Expand Span start
        if (sDate < currentSpan.start) currentSpan.start = sDate;

        // Track if this entity has been explicitly ended
        // For careers: "Left X", has endDate, or title indicates departure
        // For homes: "Sold", "Moved out", has endDate
        const lowerTitle = story.title.toLowerCase();
        const isEndingEvent =
          story.endDate ||
          lowerTitle.startsWith('left ') ||
          lowerTitle.includes('ended') ||
          lowerTitle.includes('quit') ||
          lowerTitle.includes('sold') ||
          lowerTitle.includes('moved out');

        if (isEndingEvent) {
          currentSpan.hasExplicitEnd = true;
          // Use the endDate or the story date as the end
          const endTime = story.endDate ? new Date(story.endDate) : sDate;
          if (endTime > currentSpan.end) {
            currentSpan.end = endTime;
          }
        } else if (eDate > currentSpan.end) {
          currentSpan.end = eDate;
        }

        // Add Point
        items.push({
          id: story.id,
          title: story.title,
          date: sDate,
          type: 'point',
          color: LANE_CONFIG[type].colors.point
        });
      });

      // Now determine final spans
      const isOngoingType = tags.includes('career') || tags.includes('home') || tags.includes('job') || tags.includes('house');

      groups.forEach((items, key) => {
        const span = spans.get(key)!;

        // Only extend to today if:
        // 1. It's an ongoing type (career/home)
        // 2. There's no explicit end event
        if (isOngoingType && !span.hasExplicitEnd) {
          span.end = new Date();
        }

        const isDuration = span.end.getTime() > span.start.getTime();

        const spanItem: TimelineItem = {
          id: `span-${key}`,
          title: 'Duration',
          date: span.start,
          endDate: span.end,
          type: 'span',
          color: LANE_CONFIG[type].colors.span
        };

        computedLanes.push({
          id: `${type}-${key}`,
          title: key,
          subtitle: labelStr,
          type: type,
          items: isDuration ? [spanItem, ...items] : items,
          startDate: span.start
        });
      });
    };

    // 1. Careers
    processEntityGroup(
      ['career', 'work', 'job'],
      'career',
      (s) => s.metadata?.company || (s.title.includes(' at ') ? s.title.split(' at ')[1] : undefined),
      'Career'
    );

    // 2. Homes
    processEntityGroup(
      ['home', 'house', 'living'],
      'home',
      (s) => s.metadata?.location || s.metadata?.address || s.location, // Group by city/address
      'Home'
    );

    // 3. Education
    processEntityGroup(
      ['education', 'school', 'university', 'college'],
      'education',
      (s) => s.metadata?.institution || s.metadata?.school,
      'Education'
    );

    // 4. Travel
    processEntityGroup(
      ['travel', 'trip', 'holiday'],
      'travel',
      (s) => {
        // Try to group by "Trip Name" if available, else just title
        // Heuristic: If multiple stories share a location in a short time, they are one trip.
        // For simplicity, we'll use the 'tripName' metadata or just specific major events
        return s.metadata?.tripName || (s.tags.includes('trip') ? s.title : undefined);
      },
      'Travel'
    );

    // 5. Projects
    processEntityGroup(
      ['project', 'building', 'creation'],
      'project',
      (s) => s.metadata?.projectName || (s.title.startsWith('Project ') ? s.title : undefined),
      'Project'
    );

    // Sort: Type Priority then Date
    return computedLanes.sort((a, b) => {
      const typeOrder = ['relationship', 'career', 'home', 'education', 'travel', 'project', 'other'];
      const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      if (typeDiff !== 0) return typeDiff;
      return (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0);
    });

  }, [stories, relationships]);

  // Apply Filter
  const visibleLanes = useMemo(() => {
    return allLanes.filter(l => !hiddenLaneIds.has(l.id));
  }, [allLanes, hiddenLaneIds]);

  // --- 4. Render Helpers ---

  const getStyle = (date: Date, endDate?: Date) => {
    const totalMs = viewEnd.getTime() - viewStart.getTime();
    const startMs = Math.max(date.getTime(), viewStart.getTime());
    const endMs = endDate ? Math.min(endDate.getTime(), viewEnd.getTime()) : startMs;

    if (endDate && (endDate < viewStart || date > viewEnd)) return null;
    if (!endDate && (date < viewStart || date > viewEnd)) return null;

    const left = ((startMs - viewStart.getTime()) / totalMs) * 100;
    const width = endDate ? ((endMs - startMs) / totalMs) * 100 : 0;

    return { left: `${left}%`, width: `${Math.max(width, 0)}%` };
  };

  const handleNav = (dir: 'prev' | 'next') => {
    const amount = dir === 'next' ? 1 : -1;
    if (viewMode === '1y') setBaseDate(addYears(baseDate, amount));
    if (viewMode === '5y') setBaseDate(addYears(baseDate, amount * 2));
    if (viewMode === '10y') setBaseDate(addYears(baseDate, amount * 5));
  };

  const toggleLane = (id: string) => {
    const next = new Set(hiddenLaneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenLaneIds(next);
  };

  const toggleAllByType = (type: string, shouldHide: boolean) => {
    const next = new Set(hiddenLaneIds);
    allLanes.filter(l => l.type === type).forEach(l => {
      if (shouldHide) next.add(l.id);
      else next.delete(l.id);
    });
    setHiddenLaneIds(next);
  };

  // Group lanes for the filter dropdown
  const lanesByType = useMemo(() => {
    const groups: Record<string, Lane[]> = {};
    allLanes.forEach(l => {
      if (!groups[l.type]) groups[l.type] = [];
      groups[l.type].push(l);
    });
    return groups;
  }, [allLanes]);

  return (
    <div className="bg-theme-primary rounded-xl shadow-lg border border-theme h-full flex flex-col overflow-hidden">

      {/* Header Toolbar */}
      <div className="p-4 border-b border-theme flex flex-col md:flex-row gap-4 justify-between items-center bg-theme-tertiary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme-accent/10 rounded-lg">
            <Maximize className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-primary leading-tight">Entity Timeline</h2>
            <p className="text-xs text-theme-secondary">Compare duration & density across life events</p>
          </div>
        </div>

        <div className="flex items-center gap-4">

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${isFilterOpen || hiddenLaneIds.size > 0
                ? 'bg-theme-primary border-theme-accent text-theme-accent shadow-sm'
                : 'bg-theme-tertiary border-transparent text-theme-secondary hover:text-theme-primary'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {hiddenLaneIds.size > 0 && (
                <span className="bg-theme-accent text-white text-[10px] px-1.5 rounded-full ml-1">
                  {allLanes.length - hiddenLaneIds.size}/{allLanes.length}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-theme-primary border border-theme rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                <div className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2 px-2 pt-2">
                  Visible Entities
                </div>

                {Object.entries(lanesByType).map(([type, groupLanes]) => (
                  <div key={type} className="mb-4">
                    <div className="flex items-center justify-between px-2 mb-1 group">
                      <div className="flex items-center gap-2 text-sm font-semibold text-theme-primary capitalize">
                        {React.createElement(LANE_CONFIG[type as LaneType]?.icon || Filter, { className: "w-3 h-3" })}
                        {LANE_CONFIG[type as LaneType]?.label || type}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleAllByType(type, false)}
                          className="text-[10px] text-green-600 hover:bg-green-100 px-1 rounded"
                        >All</button>
                        <button
                          onClick={() => toggleAllByType(type, true)}
                          className="text-[10px] text-red-600 hover:bg-red-100 px-1 rounded"
                        >None</button>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {groupLanes.map(lane => (
                        <label key={lane.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-theme-tertiary rounded cursor-pointer select-none">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!hiddenLaneIds.has(lane.id)
                            ? 'bg-theme-accent border-theme-accent'
                            : 'border-theme-secondary'
                            }`}>
                            {!hiddenLaneIds.has(lane.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={!hiddenLaneIds.has(lane.id)}
                            onChange={() => toggleLane(lane.id)}
                          />
                          <span className={`text-sm truncate ${hiddenLaneIds.has(lane.id) ? 'text-theme-secondary line-through opacity-70' : 'text-theme-primary'}`}>
                            {lane.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {allLanes.length === 0 && (
                  <div className="p-4 text-center text-xs text-theme-secondary">
                    No entities found to filter.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Controls */}
          <div className="flex bg-theme-tertiary p-1 rounded-lg">
            {(['1y', '5y', '10y', 'all'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${viewMode === m
                  ? 'bg-white dark:bg-slate-700 shadow text-theme-primary'
                  : 'text-theme-secondary hover:text-theme-primary'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-theme-tertiary rounded-lg p-0.5">
            <button onClick={() => handleNav('prev')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-24 text-center text-xs font-mono font-medium">
              {getYear(viewStart)} - {getYear(viewEnd)}
            </span>
            <button onClick={() => handleNav('next')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div
        ref={chartRef}
        className="flex-1 overflow-auto custom-scrollbar relative bg-slate-50 dark:bg-slate-900/50"
        title="Ctrl + Scroll to zoom"
      >
        <div className="min-w-[800px] pb-8">

          {/* Time Axis */}
          <div className="sticky top-0 z-30 flex h-8 bg-white dark:bg-slate-800 border-b border-theme shadow-sm">
            <div className="w-48 flex-shrink-0 border-r border-theme bg-slate-50 dark:bg-slate-900" />
            <div className="flex-1 relative">
              {ticks.map((t, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 text-[10px] text-theme-secondary border-l border-theme/20 pl-1 pb-1 truncate"
                  style={{ left: `${((t.getTime() - viewStart.getTime()) / (viewEnd.getTime() - viewStart.getTime())) * 100}%` }}
                >
                  {tickType === 'month' ? format(t, 'MMM') : format(t, 'yyyy')}
                </div>
              ))}
            </div>
          </div>

          {/* Lanes */}
          <div className="relative z-10 min-h-[200px]">
            {/* Grid Background */}
            <div className="absolute inset-0 left-48 pointer-events-none z-0">
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-dashed border-theme/10"
                  style={{ left: `${((t.getTime() - viewStart.getTime()) / (viewEnd.getTime() - viewStart.getTime())) * 100}%` }} />
              ))}
            </div>

            {visibleLanes.map(lane => (
              <div key={lane.id} className="flex group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors border-b border-theme/40 min-h-[60px]">

                {/* Lane Label */}
                <div className="w-48 flex-shrink-0 p-3 border-r border-theme flex flex-col justify-center bg-white/50 dark:bg-slate-900/50 sticky left-0 z-20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-theme-primary truncate">
                    {React.createElement(LANE_CONFIG[lane.type]?.icon || Filter, { className: "w-3 h-3 opacity-70" })}
                    <span className="truncate" title={lane.title}>{lane.title}</span>
                  </div>
                  {lane.subtitle && (
                    <div className="text-[10px] text-theme-secondary pl-5 truncate opacity-70">
                      {lane.subtitle}
                    </div>
                  )}
                </div>

                {/* Timeline Track */}
                <div className="flex-1 relative my-auto h-full">
                  {/* Spans */}
                  {lane.items.filter(i => i.type === 'span').map(item => {
                    const style = getStyle(item.date, item.endDate);
                    if (!style) return null;
                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md border ${item.color} transition-all opacity-80 hover:opacity-100`}
                        style={style}
                      />
                    );
                  })}

                  {/* Points */}
                  {lane.items.filter(i => i.type === 'point').map(item => {
                    const style = getStyle(item.date);
                    if (!style) return null;
                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 -ml-1.5 rounded-full border-2 shadow-sm z-10 hover:z-20 transform hover:scale-150 transition-all cursor-pointer ${item.color}`}
                        style={style}
                        title={`${format(item.date, 'MMM yyyy')}: ${item.title}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {visibleLanes.length === 0 && (
              <div className="p-12 text-center text-theme-secondary flex flex-col items-center gap-4">
                <Search className="w-8 h-8 opacity-50" />
                <p>No entities found matching the current filters/dates.</p>
                {hiddenLaneIds.size > 0 && (
                  <button onClick={() => setHiddenLaneIds(new Set())} className="text-sm text-theme-accent hover:underline">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
