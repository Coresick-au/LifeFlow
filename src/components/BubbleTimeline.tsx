import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { getYear, format } from 'date-fns';
import { createPieSlice } from '../utils/pieChart';
import { MapPin, Calendar, Play, Pause, RotateCcw } from 'lucide-react';

// Color mapping for moods
const getMoodColor = (mood: Story['mood']) => {
  const moodColors: Record<NonNullable<Story['mood']>, string> = {
    happy: 'bg-yellow-400',
    sad: 'bg-blue-500/200',
    neutral: 'bg-gray-400',
    excited: 'bg-orange-500',
    proud: 'bg-purple-500/200',
    grateful: 'bg-green-500/200',
  };
  return moodColors[mood || 'neutral'] || 'bg-gray-400';
};

// Color mapping for event categories based on tags - returns hex colors for SVG
const getCategoryColor = (tags: string[]): string => {
  const categoryColors: Record<string, string> = {
    career: '#3b82f6',      // blue
    work: '#3b82f6',
    achievement: '#a855f7', // purple
    fitness: '#22c55e',     // green
    health: '#22c55e',
    wellness: '#22c55e',
    travel: '#eab308',      // yellow
    vacation: '#eab308',
    family: '#ec4899',      // pink
    friends: '#ec4899',
    social: '#ec4899',
    hobby: '#6366f1',       // indigo
    music: '#6366f1',
    learning: '#6366f1',
    personal: '#f97316',    // orange
    growth: '#f97316',
    reflection: '#f97316',
    community: '#14b8a6',   // teal
    volunteer: '#14b8a6',
    giving: '#14b8a6',
    tradition: '#ef4444',   // red
    gratitude: '#ef4444',
    nature: '#10b981',      // emerald
    home: '#10b981',
    resolution: '#06b6d4',  // cyan
    goals: '#06b6d4',
    milestone: '#8b5cf6',   // violet
    celebration: '#8b5cf6',
    relaxation: '#84cc16',  // lime
    mindfulness: '#84cc16',
  };

  // Use the first tag that has a color, or default
  for (const tag of tags) {
    if (categoryColors[tag.toLowerCase()]) {
      return categoryColors[tag.toLowerCase()];
    }
  }
  return '#9ca3af'; // gray default
};

const getImportanceSize = (importance: Story['importance']) => {
  const sizes = {
    low: 20,
    medium: 35,
    high: 50,
  };
  return sizes[importance];
};

export const BubbleTimeline: React.FC = () => {
  const { stories, userProfile, setCurrentView } = useTimelineStore();
  const [selectedBubble, setSelectedBubble] = useState<Story | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackYear, setPlaybackYear] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Group stories by year
  const storiesByYear = useMemo(() => {
    const grouped: Record<number, Story[]> = {};
    stories.forEach((story: Story) => {
      const year = getYear(new Date(story.date));
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(story);
    });

    // Sort stories within each year by date
    Object.keys(grouped).forEach((year: string) => {
      grouped[parseInt(year)].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return grouped;
  }, [stories]);

  // Calculate category distribution for a year
  const getCategoryData = useMemo(() => {
    return (yearStories: Story[]) => {
      const categoryCounts: Record<string, number> = {};
      yearStories.forEach(story => {
        const category = story.tags[0]; // Use first tag as category
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      return categoryCounts;
    };
  }, []);

  const toggleYearExpansion = useCallback((year: number) => {
    setExpandedYears((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  }, []);

  const handleBubbleClick = useCallback((story: Story) => {
    setSelectedBubble(story);
  }, []);

  // Memory Playback Effect
  useEffect(() => {
    if (isPlaying) {
      const sortedYears = Object.keys(storiesByYear)
        .map(y => parseInt(y))
        .sort((a, b) => a - b);

      if (sortedYears.length === 0) return;

      const startYear = playbackYear || sortedYears[0];
      const currentIndex = sortedYears.indexOf(startYear);

      playbackIntervalRef.current = setInterval(() => {
        setPlaybackYear(currentYear => {
          const nextIndex = currentYear ?
            sortedYears.indexOf(currentYear) + 1 :
            currentIndex + 1;

          if (nextIndex >= sortedYears.length) {
            setIsPlaying(false);
            return null;
          }

          const year = sortedYears[nextIndex];
          setExpandedYears(prev => new Set(prev).add(year));

          // Auto-scroll to year
          const element = document.getElementById(`year-${year}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          return year;
        });
      }, playbackSpeed);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, storiesByYear, playbackYear, playbackSpeed]);

  const startPlayback = () => {
    const sortedYears = Object.keys(storiesByYear)
      .map(y => parseInt(y))
      .sort((a, b) => a - b);

    if (sortedYears.length > 0) {
      setPlaybackYear(sortedYears[0]);
      setExpandedYears(new Set());
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setPlaybackYear(null);
  };

  const resetPlayback = () => {
    stopPlayback();
    setExpandedYears(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMoodEmoji = (mood: Story['mood']) => {
    const moods: Record<NonNullable<Story['mood']>, string> = {
      happy: '😊',
      sad: '😢',
      neutral: '😐',
      excited: '🎉',
      proud: '🏆',
      grateful: '🙏',
    };
    return moods[mood || 'neutral'] || '😐';
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="w-full h-full min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-theme-primary mb-2">Bubble Timeline</h2>
        <p className="text-theme-tertiary">
          Your life's journey visualized by year - size shows importance, color shows mood
        </p>
      </div>

      {/* Playback Controls */}
      <div className="mb-6 bg-theme-primary rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={isPlaying ? stopPlayback : startPlayback}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'} Timeline
            </button>

            <button
              onClick={resetPlayback}
              className="flex items-center gap-2 px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-md hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-tertiary">Speed:</label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 border border-theme rounded text-sm bg-theme-primary text-theme-primary"
              >
                <option value={2000}>Slow</option>
                <option value={1000}>Normal</option>
                <option value={500}>Fast</option>
              </select>
            </div>
          </div>

          {playbackYear && (
            <div className="text-sm text-theme-tertiary">
              Now viewing: <span className="font-semibold">{playbackYear}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative bg-theme-primary rounded-lg shadow-lg p-8">
        <div className="space-y-12">
          {(Object.entries(storiesByYear) as Array<[string, Story[]]>)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([year, yearStories]: [string, Story[]]) => {
              const yearNum = parseInt(year);
              const isExpanded = expandedYears.has(yearNum);
              const categoryData = getCategoryData(yearStories);
              const totalEvents = yearStories.length;

              return (
                <div key={year} className="relative" id={`year-${yearNum}`}>
                  {/* Year Header with Pie Chart */}
                  <div className="flex items-center gap-6 mb-6">
                    {/* Pie Chart */}
                    <div
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => toggleYearExpansion(yearNum)}
                    >
                      <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-md">
                        {/* Pie slices */}
                        {Object.entries(categoryData).map(([category, count], index) => {
                          const percentage = (count / totalEvents) * 100;
                          const offset = Object.entries(categoryData)
                            .slice(0, index)
                            .reduce((sum, [_, c]) => sum + (c / totalEvents) * 100, 0);

                          return (
                            <g key={category}>
                              <path
                                d={createPieSlice(percentage, offset)}
                                style={{ fill: getCategoryColor([category]), opacity: 0.8 }}
                                className="hover:opacity-100 transition-opacity cursor-pointer"
                              />
                              <title>{`${category}: ${count} events`}</title>
                            </g>
                          );
                        })}
                        {/* Center circle for donut effect */}
                        <circle cx="50" cy="50" r="20" style={{ fill: 'var(--theme-bg-primary)' }} />
                        {/* Year text in center */}
                        <text
                          x="50"
                          y="50"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-sm font-bold pointer-events-none"
                          style={{ fill: 'var(--theme-text-primary)' }}
                        >
                          {year}
                        </text>
                      </svg>
                    </div>

                    {/* Year Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-theme-primary">{year}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {totalEvents} events • Click pie chart to {isExpanded ? 'collapse' : 'expand'}
                      </p>

                      {/* Category legend for this year */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(categoryData).map(([category, count]) => (
                          <div key={category} className="flex items-center gap-1 text-xs">
                            <div style={{ backgroundColor: getCategoryColor([category]) }} className="w-2 h-2 rounded-full"></div>
                            <span className="text-theme-tertiary">{category}: {count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bubbles for this year - Expandable */}
                  {isExpanded && (
                    <div className="flex flex-wrap gap-4 items-start pl-24 border-l-2 border-theme ml-12">
                      {yearStories.map((story: Story, index: number) => {
                        const size = getImportanceSize(story.importance);
                        const color = getMoodColor(story.mood);
                        const isHighlighted = playbackYear === yearNum;

                        return (
                          <div
                            key={story.id}
                            className={`relative group cursor-pointer transition-all duration-200 hover:scale-110 ${isHighlighted ? 'animate-pulse ring-4 ring-primary-300 ring-opacity-50' : ''
                              }`}
                            onClick={() => handleBubbleClick(story)}
                            onMouseEnter={() => setHoveredBubble(story.id)}
                            onMouseLeave={() => setHoveredBubble(null)}
                          >
                            <div
                              className={`${color} opacity-70 hover:opacity-90 rounded-full shadow-md flex items-center justify-center text-white text-xs font-medium`}
                              style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                minWidth: `${size}px`,
                                minHeight: `${size}px`,
                              }}
                              title={`${story.title} - ${story.mood}`}
                            >
                              {getMoodEmoji(story.mood)}
                            </div>

                            {hoveredBubble === story.id && (
                              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-10">
                                <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap">
                                  <div className="font-semibold">{story.title}</div>
                                  <div className="text-gray-300">
                                    {format(new Date(story.date), 'MMM d')}
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-theme-primary rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-theme-secondary mb-3">Moods</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Happy 😊</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/200"></div>
            <span>Sad 😢</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Neutral 😐</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Excited 🎉</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500/200"></div>
            <span>Proud 🏆</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500/200"></div>
            <span>Grateful 🙏</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-theme">
          <h3 className="text-sm font-semibold text-theme-secondary mb-2">Importance</h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-gray-400"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Detail Modal */}
      {selectedBubble && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedBubble(null)}
        >
          <div
            className="bg-theme-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-theme-primary">{selectedBubble.title}</h3>
              <button
                onClick={() => setSelectedBubble(null)}
                className="text-gray-400 hover:text-theme-tertiary"
              >
                ×
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(selectedBubble.date), 'MMMM d, yyyy')}
              </span>
              {selectedBubble.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedBubble.location}
                </span>
              )}
              <span>{getMoodEmoji(selectedBubble.mood)}</span>
            </div>

            <p className="text-theme-secondary mb-4">{selectedBubble.content}</p>

            {selectedBubble.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedBubble.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setCurrentView({ type: 'add-story' })}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
      >
        <span className="text-2xl">+</span>
      </button>
    </div>
  );
};
