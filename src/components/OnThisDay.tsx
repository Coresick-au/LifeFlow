import React, { useMemo, useState } from 'react';
import { format, subYears, isSameDay, startOfDay, getDay } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Calendar, Clock, Heart, MapPin, Tag, Shuffle, ChevronDown, Edit3, X, Save } from 'lucide-react';

interface MemoryGroup {
  year: number;
  stories: Story[];
  age?: number;
}

interface Reflection {
  storyId: string;
  content: string;
  createdAt: Date;
}

const moodEmojis = {
  happy: '😊',
  excited: '🎉',
  proud: '🏆',
  grateful: '🙏',
  neutral: '😐',
  sad: '😢',
};

export const OnThisDay: React.FC = () => {
  const { stories, userProfile } = useTimelineStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [reflections, setReflections] = useState<Record<string, Reflection>>({});
  const [editingReflection, setEditingReflection] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const memories = useMemo(() => {
    const memoriesByYear: Record<number, Story[]> = {};
    
    stories.forEach(story => {
      const storyDate = new Date(story.date);
      
      // Check if same month and day
      if (
        storyDate.getMonth() === selectedDate.getMonth() &&
        storyDate.getDate() === selectedDate.getDate()
      ) {
        const year = storyDate.getFullYear();
        if (!memoriesByYear[year]) {
          memoriesByYear[year] = [];
        }
        memoriesByYear[year].push(story);
      }
    });

    // Convert to array and sort by year (most recent first)
    const memoryGroups: MemoryGroup[] = Object.entries(memoriesByYear)
      .map(([year, yearStories]) => {
        const yearNum = parseInt(year);
        const age = userProfile?.birthDate 
          ? yearNum - userProfile.birthDate.getFullYear()
          : undefined;
        
        return {
          year: yearNum,
          stories: yearStories.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
          age: age && age > 0 ? age : undefined,
        };
      })
      .sort((a, b) => b.year - a.year);

    return memoryGroups;
  }, [stories, selectedDate, userProfile]);

  const handleDateChange = (daysOffset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get all years that have stories
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    stories.forEach(story => {
      years.add(new Date(story.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [stories]);

  // Go to random anniversary
  const goToRandomAnniversary = () => {
    if (availableYears.length === 0) return;
    
    const randomYear = availableYears[Math.floor(Math.random() * availableYears.length)];
    const newDate = new Date(selectedDate);
    newDate.setFullYear(randomYear);
    setSelectedDate(newDate);
  };

  // Change year
  const changeYear = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setShowYearPicker(false);
  };

  // Load reflections from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('onthisday-reflections');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert string dates back to Date objects
      const converted: Record<string, Reflection> = {};
      Object.entries(parsed).forEach(([id, ref]: [string, any]) => {
        converted[id] = {
          ...ref,
          createdAt: new Date(ref.createdAt)
        };
      });
      setReflections(converted);
    }
  }, []);

  // Save reflection
  const saveReflection = (storyId: string) => {
    if (!reflectionText.trim()) return;
    
    const reflection: Reflection = {
      storyId,
      content: reflectionText.trim(),
      createdAt: new Date()
    };
    
    const updated = { ...reflections, [storyId]: reflection };
    setReflections(updated);
    localStorage.setItem('onthisday-reflections', JSON.stringify(updated));
    setEditingReflection(null);
    setReflectionText('');
  };

  // Delete reflection
  const deleteReflection = (storyId: string) => {
    const updated = { ...reflections };
    delete updated[storyId];
    setReflections(updated);
    localStorage.setItem('onthisday-reflections', JSON.stringify(updated));
  };

  // Start editing reflection
  const startReflection = (storyId: string) => {
    setEditingReflection(storyId);
    setReflectionText(reflections[storyId]?.content || '');
  };

  const totalMemories = memories.reduce((sum, group) => sum + group.stories.length, 0);
  const yearsWithMemories = memories.length;

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">On This Day</h2>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
            title="Previous day"
          >
            <Calendar className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="flex items-center gap-1 px-3 py-2 border border-theme rounded-md hover:bg-theme-tertiary transition-colors"
            >
              <span className="font-semibold text-theme-primary min-w-[120px] text-left">
                {format(selectedDate, 'MMMM d, yyyy')}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
            
            {/* Year Picker Dropdown */}
            {showYearPicker && availableYears.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-theme-primary border border-theme rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-2">Jump to year</div>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => changeYear(year)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-theme-tertiary rounded-md transition-colors"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
            title="Next day"
          >
            <Calendar className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToRandomAnniversary}
            disabled={availableYears.length === 0}
            className="p-2 hover:bg-theme-tertiary rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Random anniversary"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Memories by Year */}
      <div className="space-y-6">
        {memories.map((memoryGroup) => (
          <div key={memoryGroup.year} className="border-l-4 border-primary-500 pl-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-theme-primary">
                {memoryGroup.year}
              </h3>
              {memoryGroup.age && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Age {memoryGroup.age}
                </span>
              )}
              <span className="text-sm text-gray-400">
                {memoryGroup.stories.length} {memoryGroup.stories.length === 1 ? 'story' : 'stories'}
              </span>
            </div>

            <div className="space-y-3">
              {memoryGroup.stories.map((story) => {
                const reflection = reflections[story.id];
                const isEditing = editingReflection === story.id;
                
                return (
                  <div key={story.id} className="bg-theme-tertiary rounded-lg p-4 hover:bg-theme-tertiary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-theme-primary mb-1">
                          {story.title}
                        </h4>
                        
                        {story.content && (
                          <p className="text-sm text-theme-tertiary mb-2 line-clamp-2">
                            {story.content}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(story.date), 'MMM d, yyyy')}</span>
                          </div>
                          
                          {story.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{story.location}</span>
                            </div>
                          )}
                          
                          {story.mood && (
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{moodEmojis[story.mood]} {story.mood}</span>
                            </div>
                          )}
                          
                          {story.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{story.tags.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {story.images && story.images.length > 0 && (
                        <div className="ml-4">
                          <img
                            src={story.images[0]}
                            alt={story.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Reflection Section */}
                    <div className="mt-4 pt-4 border-t border-theme">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-theme-secondary">
                          Then vs Now Reflection
                        </h5>
                        {!isEditing && (
                          <button
                            onClick={() => startReflection(story.id)}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                          >
                            <Edit3 className="w-3 h-3" />
                            {reflection ? 'Edit' : 'Add'} Reflection
                          </button>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={reflectionText}
                            onChange={(e) => setReflectionText(e.target.value)}
                            placeholder="How do you feel about this memory now? What has changed?"
                            className="w-full px-3 py-2 border border-theme rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveReflection(story.id)}
                              disabled={!reflectionText.trim()}
                              className="flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingReflection(null);
                                setReflectionText('');
                              }}
                              className="px-3 py-1 text-sm text-theme-tertiary hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : reflection ? (
                        <div className="relative">
                          <p className="text-sm text-theme-tertiary italic">
                            "{reflection.content}"
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Reflected on {format(reflection.createdAt, 'MMM d, yyyy')}
                          </p>
                          <button
                            onClick={() => deleteReflection(story.id)}
                            className="absolute top-0 right-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No reflection yet. Click "Add Reflection" to share your current perspective on this memory.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {memories.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            No memories on this day
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Try navigating to a different date or check back when you have more stories
          </p>
        </div>
      )}

      {/* Stats Summary */}
      {memories.length > 0 && (
        <div className="mt-8 pt-6 border-t border-theme">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-primary">Memory Stats</h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {totalMemories} memories across {yearsWithMemories} years
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {memories.length}
              </div>
              <div className="text-sm text-theme-tertiary">Years with memories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {totalMemories}
              </div>
              <div className="text-sm text-theme-tertiary">Total stories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {memories.length > 0 ? Math.round(totalMemories / memories.length) : 0}
              </div>
              <div className="text-sm text-theme-tertiary">Average per year</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
