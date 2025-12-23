import React, { useState, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format } from 'date-fns';
import { StoryViewer } from './StoryViewer';
import {
  Edit,
  Trash2,
  MapPin,
  Tag,
  Star,
  Calendar,
  Lock,
  Plane,
  Briefcase,
  Heart,
  GraduationCap,
  Music,
  Dumbbell,
  Home,
  Baby,
  Gift,
  Camera,
  Coffee,
  Sparkles,
  ChevronRight,
  Target,
  Eye,
  List
} from 'lucide-react';

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

const getImportanceStars = (importance: Story['importance']) => {
  const stars = {
    low: <Star className="w-4 h-4" style={{ color: 'var(--theme-text-tertiary)' }} />,
    medium: <Star className="w-4 h-4" style={{ color: '#eab308' }} />,
    high: <Star className="w-4 h-4" style={{ color: '#ef4444' }} />,
  };
  return stars[importance];
};

// Contextual icon based on story tags
const getCategoryIcon = (tags: string[]) => {
  const lowerTags = tags.map(t => t.toLowerCase());

  if (lowerTags.some(t => ['travel', 'vacation', 'trip', 'holiday'].includes(t))) {
    return <Plane className="w-5 h-5 text-blue-500" />;
  }
  if (lowerTags.some(t => ['career', 'work', 'job', 'professional'].includes(t))) {
    return <Briefcase className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
  }
  if (lowerTags.some(t => ['family', 'love', 'relationship', 'partner'].includes(t))) {
    return <Heart className="w-5 h-5 text-red-500" />;
  }
  if (lowerTags.some(t => ['education', 'school', 'university', 'learning', 'graduation'].includes(t))) {
    return <GraduationCap className="w-5 h-5 text-purple-500" />;
  }
  if (lowerTags.some(t => ['music', 'concert', 'festival'].includes(t))) {
    return <Music className="w-5 h-5 text-pink-500" />;
  }
  if (lowerTags.some(t => ['fitness', 'health', 'sport', 'exercise', 'gym'].includes(t))) {
    return <Dumbbell className="w-5 h-5 text-green-500" />;
  }
  if (lowerTags.some(t => ['home', 'house', 'property', 'moving'].includes(t))) {
    return <Home className="w-5 h-5 text-amber-600" />;
  }
  if (lowerTags.some(t => ['child', 'baby', 'kids', 'parenting'].includes(t))) {
    return <Baby className="w-5 h-5 text-pink-400" />;
  }
  if (lowerTags.some(t => ['birthday', 'celebration', 'party', 'anniversary'].includes(t))) {
    return <Gift className="w-5 h-5 text-rose-500" />;
  }
  if (lowerTags.some(t => ['photo', 'memory', 'moment'].includes(t))) {
    return <Camera className="w-5 h-5 text-indigo-500" />;
  }
  if (lowerTags.some(t => ['milestone', 'achievement', 'accomplishment'].includes(t))) {
    return <Sparkles className="w-5 h-5 text-yellow-500" />;
  }

  // Default icon
  return <Coffee className="w-5 h-5 text-theme-tertiary" />;
};

/**
 * Compact Timeline Card
 * Prevents "blow out" by enforcing fixed dimensions and truncation.
 * Designed for high-density scanning.
 */
const CompactTimelineCard = ({ story, onClick, isLocked }: { story: Story; onClick: () => void; isLocked: boolean }) => {
  return (
    <div className="relative">
      {/* Timeline Dot - positioned on the left border */}
      <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-theme-primary" />

      <div
        onClick={() => !isLocked && onClick()}
        className={`group flex items-center gap-4 p-2 h-14 bg-theme-primary border border-theme hover:border-primary-500 rounded-lg cursor-pointer transition-all overflow-hidden ${isLocked ? 'opacity-50' : ''}`}
      >
        {/* Date Anchor - Fixed Width */}
        <div className="flex-shrink-0 w-12 text-center border-r border-theme pr-3">
          <span className="text-[10px] font-bold text-theme-tertiary uppercase">
            {format(new Date(story.date), 'MMM')}
          </span>
          <div className="text-sm font-bold text-theme-primary leading-none">
            {format(new Date(story.date), 'dd')}
          </div>
        </div>

        {/* Category Icon */}
        <div className="flex-shrink-0">
          {getCategoryIcon(story.tags)}
        </div>

        {/* Content - Flex Grow with Truncation */}
        <div className="flex-grow min-w-0">
          <h4 className="text-sm font-semibold text-theme-primary truncate group-hover:text-primary-500 transition-colors">
            {isLocked && <Lock className="inline w-3 h-3 mr-1 text-yellow-500" />}
            {story.title}
          </h4>
          <p className="text-xs text-theme-tertiary truncate">
            {story.content.replace(/[\n\r]+/g, ' ')}
          </p>
        </div>

        {/* Metadata - Icons on hover */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm">{getMoodEmoji(story.mood)}</span>
          {story.importance === 'high' && <Target className="w-3.5 h-3.5 text-orange-500" />}
          <ChevronRight className="w-4 h-4 text-theme-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
};

export const Timeline: React.FC<{ searchResults?: Story[] | null; onAddStory?: () => void }> = ({ searchResults, onAddStory }) => {
  const { stories, userProfile, deleteStory, setCurrentView, activeStoryId, setActiveStory } = useTimelineStore();
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');

  // Get the active story for the viewer
  const activeStory = useMemo(() => {
    if (!activeStoryId) return null;
    return stories.find(s => s.id === activeStoryId) || null;
  }, [activeStoryId, stories]);

  console.log('Timeline render - stories:', stories.length, 'userProfile:', userProfile ? 'exists' : 'null');

  // Create a synthetic birth story if user has a birth date
  const birthStory: Story | null = userProfile?.birthDate ? {
    id: 'birth-event-synthetic',
    title: 'I Was Born! 🎉',
    content: userProfile.birthLocation
      ? `The beginning of my life story, born in ${userProfile.birthLocation}.`
      : 'The beginning of my life story.',
    type: 'short',
    date: new Date(userProfile.birthDate),
    fuzzyDate: false,
    tags: ['birth', 'milestone', 'beginning'],
    people: [],
    importance: 'high',
    mood: 'happy',
    location: userProfile.birthLocation || '',
    images: [],
    createdAt: new Date(userProfile.birthDate),
    updatedAt: new Date(userProfile.birthDate),
  } : null;

  // Use search results if provided, otherwise use all stories (including birth story)
  const baseStories = searchResults != null
    ? searchResults
    : birthStory
      ? [...stories, birthStory]
      : stories;

  // Sort stories by date (newest first)
  const sortedStories = [...baseStories].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  console.log('Sorted stories:', sortedStories.length);

  // Filter stories by tags if selected
  const filteredStories = filterTags.length > 0
    ? sortedStories.filter(story =>
      filterTags.some(tag => story.tags.includes(tag))
    )
    : sortedStories;

  console.log('Filtered stories:', filteredStories.length, 'Filter tags:', filterTags);

  // Get all unique tags from all stories (not just search results)
  const allTags = Array.from(new Set(stories.flatMap(story => story.tags)));

  // Timeline Snapshot Stats
  const snapshotStats = useMemo(() => {
    const milestones = filteredStories.filter(s => s.importance === 'high').length;
    const moodCounts = filteredStories.reduce((acc, s) => {
      const mood = s.mood || 'neutral';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const locationCounts = filteredStories.reduce((acc, s) => {
      if (s.location) {
        acc[s.location] = (acc[s.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
    return { milestones, topMood, topLocation };
  }, [filteredStories]);

  // Group stories by month
  const groupedStories = filteredStories.reduce((groups, story) => {
    const monthKey = format(new Date(story.date), 'MMMM yyyy');
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(story);
    return groups;
  }, {} as Record<string, Story[]>);

  // Check if story is a locked time capsule
  const isTimeCapsuleLocked = (story: Story) => {
    if (!story.lockedUntil) return false;
    return new Date() < new Date(story.lockedUntil);
  };

  const handleEditStory = (story: Story) => {
    setCurrentView({ type: 'edit-story', storyId: story.id });
  };

  const handleDeleteStory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStory(id);
    }
  };

  const handleTagClick = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setFilterTags([]);
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-2 text-theme-primary">Welcome to LifeFlow!</h2>
        <p className="mb-6 text-theme-secondary">Let's start by creating your profile</p>
        <button
          onClick={() => setCurrentView({ type: 'profile' })}
          className="px-6 py-2 text-white rounded-md btn-primary rounded-theme"
        >
          Create Profile
        </button>
      </div>
    );
  }

  if (filteredStories.length === 0) {
    const hasFilters = filterTags.length > 0 || searchResults != null;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-2 text-theme-primary">
          {hasFilters ? 'No stories found' : 'No stories yet'}
        </h2>
        <p className="mb-6 text-theme-secondary">
          {hasFilters
            ? 'Try adjusting your filters or search terms'
            : 'Start adding your memories to build your timeline'
          }
        </p>
        {hasFilters ? (
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 border rounded-md border-theme text-theme-primary hover:bg-theme-tertiary rounded-theme"
          >
            Clear Filters
          </button>
        ) : (
          <button
            onClick={onAddStory}
            className="px-6 py-2 text-white rounded-md btn-primary rounded-theme"
          >
            Add Your First Story
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Timeline Snapshot Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-800/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-theme-primary">Timeline</h2>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-theme-tertiary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('compact')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'compact'
                  ? 'bg-theme-primary text-theme-primary shadow-sm'
                  : 'text-theme-tertiary hover:text-theme-secondary'
                  }`}
              >
                <List className="w-3 h-3" />
                Compact
              </button>
              <button
                onClick={() => setViewMode('expanded')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === 'expanded'
                  ? 'bg-theme-primary text-theme-primary shadow-sm'
                  : 'text-theme-tertiary hover:text-theme-secondary'
                  }`}
              >
                <Eye className="w-3 h-3" />
                Expanded
              </button>
            </div>
            <span className="text-sm text-theme-tertiary">{filteredStories.length} stories</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-yellow-500">⭐ {snapshotStats.milestones}</div>
            <div className="text-theme-tertiary">Milestones</div>
          </div>
          <div>
            {snapshotStats.topMood && (
              <>
                <div className="text-lg font-bold text-theme-primary">
                  {snapshotStats.topMood[0] === 'happy' ? '😊' :
                    snapshotStats.topMood[0] === 'proud' ? '🏆' :
                      snapshotStats.topMood[0] === 'excited' ? '🎉' :
                        snapshotStats.topMood[0] === 'grateful' ? '🙏' :
                          snapshotStats.topMood[0] === 'sad' ? '😢' : '😐'}
                </div>
                <div className="text-theme-tertiary capitalize">Top Mood</div>
              </>
            )}
          </div>
          <div>
            {snapshotStats.topLocation && (
              <>
                <div className="text-lg font-bold text-theme-primary truncate" title={snapshotStats.topLocation[0]}>
                  📍 {snapshotStats.topLocation[0].split(',')[0]}
                </div>
                <div className="text-theme-tertiary">Main Era</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearFilters}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors rounded-theme ${filterTags.length === 0
                ? 'bg-theme-accent text-white'
                : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                }`}
            >
              All Stories {filterTags.length > 0 && `(${filterTags.length})`}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors rounded-theme ${filterTags.includes(tag)
                  ? 'bg-theme-accent text-white'
                  : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                  }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="timeline-line" />

        {/* Stories */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-theme-tertiary">
                <Calendar className="w-12 h-12 text-theme-tertiary" style={{ color: 'var(--theme-text-secondary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-theme-primary">
                {filterTags.length > 0
                  ? `No stories tagged with ${filterTags.map(t => `"#${t}"`).join(' or ')}`
                  : 'Your timeline is empty'
                }
              </h3>
              <p className="mb-6 text-theme-secondary">
                {filterTags.length > 0
                  ? 'Try clearing filters or add stories with these tags'
                  : 'Start building your life story by adding your first memories'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onAddStory}
                  className="px-6 py-3 border rounded-md transition-colors font-medium bg-theme-primary border-theme text-theme-primary hover:bg-theme-tertiary rounded-theme"
                >
                  {filterTags.length === 0 ? 'Add Your First Story' : 'Add Story'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          Object.entries(groupedStories).map(([month, stories]) => (
            <div key={month}>
              {/* Sticky month header */}
              <h3 className="sticky top-0 py-3 px-4 text-lg font-semibold border-b z-10 bg-theme-secondary text-theme-primary border-theme">
                {month}
              </h3>

              {/* Compact View - Left-anchored timeline */}
              {viewMode === 'compact' ? (
                <div className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-6 pl-4 space-y-2 py-4">
                  {stories.map((story: Story) => {
                    const isLocked = isTimeCapsuleLocked(story);
                    return (
                      <CompactTimelineCard
                        key={story.id}
                        story={story}
                        isLocked={isLocked}
                        onClick={() => setActiveStory(story.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Expanded View - Original Cards */
                stories.map((story: Story, index: number) => {
                  const isLocked = isTimeCapsuleLocked(story);
                  const isEven = index % 2 === 0;

                  return (
                    <div
                      key={story.id}
                      className={`relative mb-8 animate-slide-up flex items-start md:justify-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Spacer for desktop alternating layout */}
                      <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />

                      {/* Timeline dot with contextual icon */}
                      <div className="timeline-dot">
                        {getCategoryIcon(story.tags)}
                      </div>

                      {/* Story card - clickable to open viewer */}
                      <div
                        className={`story-card cursor-pointer hover:shadow-lg transition-shadow ${isEven ? 'md:story-card-right' : 'md:story-card-left'} ${isLocked ? 'relative' : ''}`}
                        onClick={() => !isLocked && setActiveStory(story.id)}
                      >
                        {/* Time capsule overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 backdrop-blur-sm rounded-lg z-10 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                            <Lock className="w-8 h-8 mb-2" style={{ color: '#fbbf24' }} />
                            <p className="font-semibold" style={{ color: '#fbbf24' }}>Time Capsule</p>
                            <p className="text-sm mt-1 text-theme-secondary">
                              Opens on {format(new Date(story.lockedUntil!), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs mt-2 text-theme-tertiary">
                              {Math.ceil((new Date(story.lockedUntil!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                            </p>
                          </div>
                        )}

                        <div className={`flex items-start justify-between mb-2 ${isLocked ? 'opacity-30' : ''}`}>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1 text-theme-primary">
                              {story.title}
                              {isLocked && <Lock className="inline w-4 h-4 ml-2" style={{ color: '#f59e0b' }} />}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-theme-secondary">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(story.date), 'MMM d, yyyy')}
                              </span>
                              {story.location && (
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {story.location}
                                </span>
                              )}
                              <span>{getMoodEmoji(story.mood)}</span>
                              {getImportanceStars(story.importance)}
                            </div>
                          </div>
                        </div>

                        {/* Image Gallery */}
                        {story.images && story.images.length > 0 && !isLocked && (
                          <div className={`grid gap-2 mb-3 mt-2 ${story.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {story.images.slice(0, 4).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Memory ${i + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-theme hover:opacity-90 transition-opacity cursor-pointer"
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                            {story.images.length > 4 && (
                              <div className="w-full h-32 flex items-center justify-center bg-theme-tertiary rounded-lg border border-theme text-theme-secondary">
                                +{story.images.length - 4} more
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <p className={`${isLocked ? 'opacity-30' : ''} text-theme-primary leading-relaxed`}>
                          {story.content}
                        </p>

                        {/* Tags */}
                        {story.tags.length > 0 && (
                          <div className={`flex flex-wrap gap-2 mt-3 ${isLocked ? 'opacity-30' : ''}`}>
                            {story.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-primary"
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions - hide for locked stories and synthetic birth story */}
                        {!isLocked && story.id !== 'birth-event-synthetic' && (
                          <div className="flex space-x-2 mt-4 pt-4 border-t border-theme">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStory(story);
                              }}
                              className="text-theme-secondary hover:text-theme-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStory(story.id);
                              }}
                              className="text-theme-secondary hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setCurrentView({ type: 'add-story' })}
        className="fixed bottom-8 right-8 w-14 h-14 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center btn-primary rounded-theme shadow-theme-lg"
      >
        <span className="text-2xl">+</span>
      </button>

      {/* Story Viewer Modal */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          onClose={() => setActiveStory(null)}
          onEdit={(id) => {
            setActiveStory(null);
            setCurrentView({ type: 'edit-story', storyId: id });
          }}
        />
      )}
    </div>
  );
};
