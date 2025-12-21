import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format } from 'date-fns';
import { Edit, Trash2, MapPin, Tag, Star, Calendar, Lock } from 'lucide-react';

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

export const Timeline: React.FC<{ searchResults?: Story[] | null; onAddStory?: () => void }> = ({ searchResults, onAddStory }) => {
  const { stories, userProfile, deleteStory, setCurrentView, seedData } = useTimelineStore();
  const [filterTags, setFilterTags] = useState<string[]>([]);

  console.log('Timeline render - stories:', stories.length, 'userProfile:', userProfile ? 'exists' : 'null');

  // Use search results if provided, otherwise use all stories
  const baseStories = searchResults != null ? searchResults : stories;
  
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-theme-primary">Timeline</h2>
        <p className="text-theme-secondary">Your life's journey, moment by moment</p>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearFilters}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors rounded-theme ${
                filterTags.length === 0
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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors rounded-theme ${
                  filterTags.includes(tag)
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
                {filterTags.length === 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm('This will add sample stories to your timeline. Continue?')) {
                        await seedData();
                      }
                    }}
                    className="px-6 py-3 text-white rounded-md transition-colors font-medium btn-primary rounded-theme"
                  >
                    Load Sample Data
                  </button>
                )}
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
              {/* Stories for this month */}
              {stories.map((story: Story, index: number) => {
                const isLocked = isTimeCapsuleLocked(story);
                
                return (
                  <div
                    key={story.id}
                    className="relative mb-8 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Timeline dot */}
                    <div className="timeline-dot" />
                    
                    {/* Story card */}
                    <div className={`story-card ${isLocked ? 'relative' : ''}`}>
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
                          <div className="flex items-center space-x-4 text-sm text-theme-secondary">
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

                      {/* Content - always show full content */}
                      <p className={`${isLocked ? 'opacity-30' : ''} text-theme-primary`}>
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

                      {/* Actions - hide for locked stories */}
                      {!isLocked && (
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
              })}
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
    </div>
  );
};
