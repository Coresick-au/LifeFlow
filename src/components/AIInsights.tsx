import React, { useMemo } from 'react';
import { Brain, TrendingUp, Calendar, Heart, Lightbulb, Users, MapPin, Tag, BarChart3, AlertCircle } from 'lucide-react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';

export const AIInsights: React.FC = () => {
  const { stories } = useTimelineStore();

  // Calculate mood correlations
  const moodInsights = useMemo(() => {
    if (stories.length === 0) return null;

    // Filter stories with moods
    const storiesWithMood = stories.filter(s => s.mood);
    if (storiesWithMood.length === 0) return null;

    // Calculate mood distribution
    const moodCounts = storiesWithMood.reduce((acc, story) => {
      acc[story.mood!] = (acc[story.mood!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalMoods = storiesWithMood.length;
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / totalMoods) * 100)
    }));

    // Find correlations with people
    const peopleMoodCorrelations: { person: string; mood: string; correlation: number }[] = [];
    const peopleGroups: Record<string, Story[]> = {};
    
    storiesWithMood.forEach(story => {
      story.people.forEach(person => {
        if (!peopleGroups[person]) peopleGroups[person] = [];
        peopleGroups[person].push(story);
      });
    });

    Object.entries(peopleGroups).forEach(([person, personStories]) => {
      if (personStories.length < 3) return; // Need at least 3 stories
      
      const personMoodCounts = personStories.reduce((acc, story) => {
        acc[story.mood!] = (acc[story.mood!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(personMoodCounts).forEach(([mood, count]) => {
        const baselinePercentage = (moodCounts[mood] || 0) / totalMoods;
        const personPercentage = count / personStories.length;
        const correlation = Math.round(((personPercentage - baselinePercentage) / baselinePercentage) * 100);
        
        if (Math.abs(correlation) > 20) { // Only show significant correlations
          peopleMoodCorrelations.push({ person, mood, correlation });
        }
      });
    });

    // Find correlations with locations
    const locationMoodCorrelations: { location: string; mood: string; correlation: number }[] = [];
    const locationGroups: Record<string, Story[]> = {};
    
    storiesWithMood.forEach(story => {
      if (story.location) {
        if (!locationGroups[story.location]) locationGroups[story.location] = [];
        locationGroups[story.location].push(story);
      }
    });

    Object.entries(locationGroups).forEach(([location, locationStories]) => {
      if (locationStories.length < 3) return;
      
      const locationMoodCounts = locationStories.reduce((acc, story) => {
        acc[story.mood!] = (acc[story.mood!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(locationMoodCounts).forEach(([mood, count]) => {
        const baselinePercentage = (moodCounts[mood] || 0) / totalMoods;
        const locationPercentage = count / locationStories.length;
        const correlation = Math.round(((locationPercentage - baselinePercentage) / baselinePercentage) * 100);
        
        if (Math.abs(correlation) > 20) {
          locationMoodCorrelations.push({ location, mood, correlation });
        }
      });
    });

    // Find correlations with tags
    const tagMoodCorrelations: { tag: string; mood: string; correlation: number }[] = [];
    const tagGroups: Record<string, Story[]> = {};
    
    storiesWithMood.forEach(story => {
      story.tags.forEach(tag => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(story);
      });
    });

    Object.entries(tagGroups).forEach(([tag, tagStories]) => {
      if (tagStories.length < 3) return;
      
      const tagMoodCounts = tagStories.reduce((acc, story) => {
        acc[story.mood!] = (acc[story.mood!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(tagMoodCounts).forEach(([mood, count]) => {
        const baselinePercentage = (moodCounts[mood] || 0) / totalMoods;
        const tagPercentage = count / tagStories.length;
        const correlation = Math.round(((tagPercentage - baselinePercentage) / baselinePercentage) * 100);
        
        if (Math.abs(correlation) > 20) {
          tagMoodCorrelations.push({ tag, mood, correlation });
        }
      });
    });

    return {
      moodDistribution,
      peopleMoodCorrelations: peopleMoodCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3),
      locationMoodCorrelations: locationMoodCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3),
      tagMoodCorrelations: tagMoodCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3)
    };
  }, [stories]);

  // Detect life chapters
  const lifeChapters = useMemo(() => {
    if (stories.length === 0) return [];

    // Sort stories by date
    const sortedStories = [...stories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const chapters: { name: string; startDate: Date; endDate: Date; stories: Story[]; theme?: string }[] = [];
    let currentChapter: typeof chapters[0] | null = null;

    sortedStories.forEach((story, index) => {
      const storyDate = new Date(story.date);
      
      // Check if we should start a new chapter
      if (!currentChapter) {
        currentChapter = {
          name: 'Chapter 1',
          startDate: storyDate,
          endDate: storyDate,
          stories: [story]
        };
      } else {
        const daysSinceLastStory = Math.abs(
          (storyDate.getTime() - currentChapter.endDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // New chapter if gap > 30 days or significant location change
        const locationChanged = story.location && 
          currentChapter.stories.some(s => s.location && s.location !== story.location);
        
        if (daysSinceLastStory > 30 || (locationChanged && currentChapter.stories.length > 5)) {
          chapters.push(currentChapter);
          currentChapter = {
            name: `Chapter ${chapters.length + 2}`,
            startDate: storyDate,
            endDate: storyDate,
            stories: [story]
          };
        } else {
          currentChapter.endDate = storyDate;
          currentChapter.stories.push(story);
        }
      }
    });

    if (currentChapter) {
      chapters.push(currentChapter);
    }

    // Name chapters based on dominant theme
    chapters.forEach(chapter => {
      const tagCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};
      
      chapter.stories.forEach(story => {
        story.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        if (story.location) {
          locationCounts[story.location] = (locationCounts[story.location] || 0) + 1;
        }
      });

      const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
      const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
      
      if (topLocation && topLocation[1] > chapter.stories.length * 0.5) {
        chapter.name = `The ${topLocation[0].split(',')[0]} Years`;
        chapter.theme = 'location';
      } else if (topTag && topTag[1] > chapter.stories.length * 0.3) {
        chapter.name = `The ${topTag[0]} Era`;
        chapter.theme = 'tag';
      }
    });

    return chapters;
  }, [stories]);

  // Detect gaps in story
  const gapsInStory = useMemo(() => {
    if (stories.length < 2) return [];

    const sortedStories = [...stories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const gaps: { startDate: Date; endDate: Date; days: number }[] = [];
    
    for (let i = 1; i < sortedStories.length; i++) {
      const prevDate = new Date(sortedStories[i - 1].date);
      const currDate = new Date(sortedStories[i].date);
      const daysGap = Math.abs((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysGap > 60) { // Gap of more than 2 months
        gaps.push({
          startDate: prevDate,
          endDate: currDate,
          days: Math.round(daysGap)
        });
      }
    }

    return gaps;
  }, [stories]);
  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Life Insights</h2>
        <Brain className="w-8 h-8 text-purple-600" />
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            No stories to analyze
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Add some stories to see insights about your life patterns
          </p>
        </div>
      ) : (
        <>
          {/* Mood Distribution */}
          {moodInsights && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-theme-primary">Mood Distribution</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {moodInsights.moodDistribution.map(({ mood, count, percentage }) => (
                  <div key={mood} className="text-center p-3 bg-theme-tertiary rounded-lg">
                    <div className="text-2xl mb-1">
                      {mood === 'happy' ? '😊' : 
                       mood === 'sad' ? '😢' :
                       mood === 'excited' ? '🎉' :
                       mood === 'proud' ? '🏆' :
                       mood === 'grateful' ? '🙏' : '😐'}
                    </div>
                    <div className="text-sm font-medium text-theme-primary capitalize">{mood}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correlations */}
          {moodInsights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* People Correlations */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-theme-primary">People & Mood</h4>
                </div>
                {moodInsights.peopleMoodCorrelations.length > 0 ? (
                  <div className="space-y-2">
                    {moodInsights.peopleMoodCorrelations.map(({ person, mood, correlation }) => (
                      <div key={`${person}-${mood}`} className="text-sm">
                        <span className="font-medium">{person}</span>
                        <span className="mx-1">→</span>
                        <span className={correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                          {mood} ({correlation > 0 ? '+' : ''}{correlation}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Need more stories to find patterns
                  </p>
                )}
              </div>

              {/* Location Correlations */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-theme-primary">Places & Mood</h4>
                </div>
                {moodInsights.locationMoodCorrelations.length > 0 ? (
                  <div className="space-y-2">
                    {moodInsights.locationMoodCorrelations.map(({ location, mood, correlation }) => (
                      <div key={`${location}-${mood}`} className="text-sm">
                        <span className="font-medium">{location.split(',')[0]}</span>
                        <span className="mx-1">→</span>
                        <span className={correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                          {mood} ({correlation > 0 ? '+' : ''}{correlation}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Need more location data
                  </p>
                )}
              </div>

              {/* Tag Correlations */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Tag className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-theme-primary">Activities & Mood</h4>
                </div>
                {moodInsights.tagMoodCorrelations.length > 0 ? (
                  <div className="space-y-2">
                    {moodInsights.tagMoodCorrelations.map(({ tag, mood, correlation }) => (
                      <div key={`${tag}-${mood}`} className="text-sm">
                        <span className="font-medium">#{tag}</span>
                        <span className="mx-1">→</span>
                        <span className={correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                          {mood} ({correlation > 0 ? '+' : ''}{correlation}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Need more tagged activities
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Life Chapters */}
          {lifeChapters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-theme-primary">Life Chapters</h3>
              </div>
              <div className="space-y-3">
                {lifeChapters.map((chapter, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-theme-tertiary rounded-lg">
                    <div>
                      <h4 className="font-medium text-theme-primary">{chapter.name}</h4>
                      <p className="text-sm text-theme-tertiary">
                        {chapter.stories.length} stories • 
                        {new Date(chapter.startDate).getFullYear()} - {new Date(chapter.endDate).getFullYear()}
                      </p>
                    </div>
                    {chapter.theme && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {chapter.theme}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps in Story */}
          {gapsInStory.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-theme-primary">Missing Pieces</h3>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-theme-secondary mb-3">
                  You might want to add stories from these periods:
                </p>
                <div className="space-y-2">
                  {gapsInStory.slice(0, 3).map((gap, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">
                        {new Date(gap.startDate).toLocaleDateString()} - {new Date(gap.endDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">({gap.days} days)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
