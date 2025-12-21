import React, { useState, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, startOfYear, endOfYear, eachMonthOfInterval, startOfQuarter, endOfQuarter } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Briefcase, Plane, Heart, Home, Book, Users, Music, User, Sparkles, Globe, TreePine, Target, Zap } from 'lucide-react';

// Category icon mapping
const categoryIcons: Record<string, React.ComponentType<any>> = {
  career: Briefcase,
  work: Briefcase,
  achievement: Target,
  travel: Plane,
  vacation: Plane,
  family: Home,
  friends: Users,
  social: Users,
  health: Heart,
  fitness: Heart,
  wellness: Heart,
  hobby: Music,
  music: Music,
  learning: Book,
  personal: User,
  growth: Sparkles,
  reflection: User,
  community: Globe,
  volunteer: Users,
  giving: Heart,
  tradition: TreePine,
  gratitude: Heart,
  nature: TreePine,
  home: Home,
  resolution: Zap,
  goals: Target,
  milestone: Target,
  celebration: Sparkles,
  relaxation: Heart,
  mindfulness: Heart,
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

type ViewMode = 'month' | 'quarter' | 'year';

export const CalendarView: React.FC = () => {
  const { stories, userProfile, setCurrentView, isLoading } = useTimelineStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter stories by search term
  const filteredStories = useMemo(() => {
    if (!searchTerm) return stories;
    return stories.filter((story: Story) =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stories, searchTerm]);

  // Group stories by date (filtered by search)
  const storiesByDate = useMemo(() => {
    const storiesToUse = searchTerm ? filteredStories : stories;
    return storiesToUse.reduce((acc: Record<string, Story[]>, story: Story) => {
      const dateKey = format(new Date(story.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(story);
      return acc;
    }, {} as Record<string, Story[]>);
  }, [stories, filteredStories, searchTerm]);

  // Get stories for a specific day
  const getStoriesForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return storiesByDate[dateKey] || [];
  };

  // Navigation functions
  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(prev =>
        direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
      );
    } else if (viewMode === 'quarter') {
      setCurrentDate(prev => {
        const quarter = Math.floor((prev.getMonth() + 3) / 3);
        const year = prev.getFullYear();
        const newQuarter = direction === 'prev' ? quarter - 1 : quarter + 1;
        if (newQuarter === 0) return new Date(year - 1, 0, 1);
        if (newQuarter === 5) return new Date(year + 1, 0, 1);
        return new Date(year, (newQuarter - 1) * 3, 1);
      });
    } else {
      setCurrentDate(prev =>
        new Date(prev.getFullYear() + (direction === 'prev' ? -1 : 1), 0, 1)
      );
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dayStories = getStoriesForDay(day);
    if (dayStories.length === 1) {
      setSelectedStory(dayStories[0]);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate Year in Review stats
  const currentYear = currentDate.getFullYear();
  const yearlyStories = stories.filter(story =>
    new Date(story.date).getFullYear() === currentYear
  );

  const uniqueLocations = new Set(yearlyStories.map(s => s.location).filter(Boolean));
  const uniquePeople = new Set(yearlyStories.flatMap(s => s.people));

  const moodCounts = yearlyStories.reduce((acc, story) => {
    if (story.mood) {
      acc[story.mood] = (acc[story.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const monthCounts = yearlyStories.reduce((acc, story) => {
    const month = format(new Date(story.date), 'MMMM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const locationCounts = yearlyStories.reduce((acc, story) => {
    if (story.location) {
      acc[story.location] = (acc[story.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('prev')}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-semibold text-theme-primary">
            {format(currentDate, 'MMMM yyyy')}
          </h3>

          <button
            onClick={() => navigate('next')}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: getDay(monthStart) }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {monthDays.map(day => {
            const dayStories = getStoriesForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all duration-200 transform hover:scale-105
                  ${isSelected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-theme'}
                  ${isToday ? 'border-2 border-primary-500 ring-2 ring-primary-200' : ''}
                  ${dayStories.length > 0 ? 'hover:border-primary-400 hover:shadow-lg' : 'hover:bg-theme-tertiary'}
                `}
              >
                <div className="h-full flex flex-col">
                  <span className="text-sm font-medium text-theme-primary">
                    {format(day, 'd')}
                  </span>

                  {/* Story indicators with icons */}
                  <div className="flex-1 flex items-center justify-center">
                    {dayStories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dayStories.slice(0, 3).map((story: Story, index: number) => {
                          const Icon = categoryIcons[story.tags[0]] || CalendarIcon;
                          return (
                            <Icon
                              key={index}
                              className="w-3 h-3 text-theme-tertiary"
                              title={story.title}
                            />
                          );
                        })}
                        {dayStories.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">+{dayStories.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render quarter view
  const renderQuarterView = () => {
    const quarterStart = startOfQuarter(currentDate);
    const quarterEnd = endOfQuarter(currentDate);
    const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd });

    return (
      <div className="space-y-6">
        <div className="bg-theme-primary rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold text-theme-primary">
              Q{Math.floor((currentDate.getMonth() + 3) / 3)} {currentDate.getFullYear()}
            </h3>

            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {months.map(month => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

              return (
                <div key={month.toISOString()} className="border border-theme rounded-lg p-4">
                  <h4 className="text-center font-medium text-theme-primary mb-3">
                    {format(month, 'MMMM')}
                  </h4>

                  {/* Mini calendar */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-slate-500 dark:text-slate-400 font-medium py-1">
                        {day.charAt(0)}
                      </div>
                    ))}

                    {/* Empty cells */}
                    {Array.from({ length: getDay(monthStart) }).map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square" />
                    ))}

                    {/* Days */}
                    {monthDays.map(day => {
                      const dayStories = getStoriesForDay(day);
                      const hasEvents = dayStories.length > 0;

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDayClick(day)}
                          className={`
                            aspect-square p-1 rounded text-xs
                            ${hasEvents ? 'bg-primary-100 hover:bg-primary-200 font-medium' : 'hover:bg-theme-tertiary'}
                            ${isSameDay(day, new Date()) ? 'ring-2 ring-primary-500' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render year view
  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // Calculate category breakdown for each month
    const getMonthCategoryBreakdown = (month: Date) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const monthStories: Story[] = [];

      monthDays.forEach(day => {
        const dayStories = getStoriesForDay(day);
        monthStories.push(...dayStories);
      });

      const categoryCounts: Record<string, number> = {};
      monthStories.forEach(story => {
        const category = story.tags[0] || 'other';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      return { total: monthStories.length, categories: categoryCounts };
    };

    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('prev')}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-semibold text-theme-primary">
            {currentDate.getFullYear()}
          </h3>

          <button
            onClick={() => navigate('next')}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {months.map(month => {
            const { total, categories } = getMonthCategoryBreakdown(month);

            return (
              <button
                key={month.toISOString()}
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
                className="border border-theme rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-all hover:shadow-md transform hover:scale-105"
              >
                <h4 className="font-medium text-theme-primary mb-2">
                  {format(month, 'MMMM')}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  {total} event{total !== 1 ? 's' : ''}
                </p>

                {/* Category breakdown */}
                {total > 0 && (
                  <div className="space-y-1">
                    {Object.entries(categories).slice(0, 3).map(([category, count]) => {
                      const Icon = categoryIcons[category] || CalendarIcon;
                      return (
                        <div key={category} className="flex items-center gap-1 text-xs text-theme-tertiary">
                          <Icon className="w-3 h-3" />
                          <span>{category}: {count}</span>
                        </div>
                      );
                    })}
                    {Object.keys(categories).length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{Object.keys(categories).length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-theme-tertiary">Loading your stories...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-theme-primary mb-2">Calendar View</h2>

        {/* View Mode Selector */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
              }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('quarter')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'quarter'
                ? 'bg-primary-600 text-white'
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
              }`}
          >
            Quarter
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'year'
                ? 'bg-primary-600 text-white'
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
              }`}
          >
            Year
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-theme-secondary">Year:</label>
          <select
            value={currentDate.getFullYear()}
            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), 0, 1))}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-theme-primary text-theme-primary border-theme"
          >
            {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-theme-primary text-theme-primary border-theme placeholder:text-theme-tertiary"
          />
        </div>
      </div>

      {/* Year in Review */}
      <div className="bg-theme-tertiary rounded-lg p-6 mb-6 border border-theme">
        <h3 className="text-lg font-semibold text-theme-primary mb-4">
          {currentYear} Year in Review
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
              {yearlyStories.length}
            </div>
            <div className="text-sm text-theme-tertiary">Stories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
              {uniqueLocations.size}
            </div>
            <div className="text-sm text-theme-tertiary">Places</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
              {uniquePeople.size}
            </div>
            <div className="text-sm text-theme-tertiary">People</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
              {topMood}
            </div>
            <div className="text-sm text-theme-tertiary">Top Mood</div>
          </div>
        </div>

        {/* Year Highlights */}
        <div className="mt-4 pt-4 border-t border-theme">
          <h4 className="text-sm font-medium text-theme-secondary mb-2">Highlights</h4>
          <div className="space-y-1">
            <p className="text-sm text-theme-tertiary">
              Most active month: <span className="font-medium">{mostActiveMonth}</span>
            </p>
            <p className="text-sm text-theme-tertiary">
              Favorite location: <span className="font-medium">{topLocation}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'quarter' && renderQuarterView()}
          {viewMode === 'year' && renderYearView()}
        </div>

        {/* Stories List */}
        <div className="lg:col-span-1">
          <div className="bg-theme-primary rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-theme-primary mb-4">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>

            {selectedDate && getStoriesForDay(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getStoriesForDay(selectedDate).map((story: Story) => (
                  <div
                    key={story.id}
                    className="p-3 rounded-lg border border-theme hover:bg-theme-tertiary transition-colors cursor-pointer"
                    onClick={() => setSelectedStory(story)}
                  >
                    <h4 className="font-medium text-theme-primary mb-1">{story.title}</h4>
                    <p className="text-sm text-theme-tertiary line-clamp-2">{story.content}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{getMoodEmoji(story.mood)}</span>
                      {story.location && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {story.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No stories on this date
                </p>
                <button
                  onClick={() => setCurrentView({ type: 'add-story' })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span className="text-lg">+</span>
                  Record a memory for {format(selectedDate, 'MMM d, yyyy')}
                </button>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                Click on a date to see stories
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-theme-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-theme-primary">{selectedStory.title}</h3>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-gray-400 hover:text-theme-tertiary"
              >
                ×
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {format(new Date(selectedStory.date), 'MMMM d, yyyy')}
              </span>
              {selectedStory.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedStory.location}
                </span>
              )}
              <span>{getMoodEmoji(selectedStory.mood)}</span>
            </div>

            <p className="text-theme-secondary mb-4">{selectedStory.content}</p>

            {selectedStory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStory.tags.map((tag: string) => (
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

      {/* Empty State */}
      {stories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-theme-primary mb-2">
            No stories in your calendar
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
            Your calendar will show your stories here. Start by adding your first story to see it appear on the calendar!
          </p>
          <button
            onClick={() => setCurrentView({ type: 'add-story' })}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Your First Story
          </button>
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
