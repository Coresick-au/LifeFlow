import React, { useMemo } from 'react';
import { Brain, TrendingUp, Calendar, Users, MapPin, Tag, BarChart3, AlertCircle } from 'lucide-react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';

export const AIInsights: React.FC = () => {
  const { stories } = useTimelineStore();

  // Calculate story stats (without mood)
  const storyStats = useMemo(() => {
    if (stories.length === 0) return null;

    // Calculate top locations
    const locationCounts: Record<string, number> = {};
    stories.forEach(story => {
      if (story.location) {
        locationCounts[story.location] = (locationCounts[story.location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count, percentage: Math.round((count / stories.length) * 100) }));

    // Calculate top tags
    const tagCounts: Record<string, number> = {};
    stories.forEach(story => {
      story.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count, percentage: Math.round((count / stories.length) * 100) }));

    // Calculate people frequency
    const peopleCounts: Record<string, number> = {};
    stories.forEach(story => {
      story.people.forEach(person => {
        peopleCounts[person] = (peopleCounts[person] || 0) + 1;
      });
    });

    const topPeople = Object.entries(peopleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([person, count]) => ({ person, count }));

    return {
      topLocations,
      topTags,
      topPeople,
      totalStories: stories.length,
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
          {/* Story Stats */}
          {storyStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Top Tags */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Tag className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-theme-primary">Top Categories</h4>
                </div>
                {storyStats.topTags.length > 0 ? (
                  <div className="space-y-2">
                    {storyStats.topTags.map(({ tag, count, percentage }) => (
                      <div key={tag} className="flex justify-between text-sm">
                        <span className="font-medium">#{tag}</span>
                        <span className="text-theme-tertiary">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No tags yet
                  </p>
                )}
              </div>

              {/* Top Locations */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-theme-primary">Top Places</h4>
                </div>
                {storyStats.topLocations.length > 0 ? (
                  <div className="space-y-2">
                    {storyStats.topLocations.map(({ location, count, percentage }) => (
                      <div key={location} className="flex justify-between text-sm">
                        <span className="font-medium truncate">{location.split(',')[0]}</span>
                        <span className="text-theme-tertiary">{count} stories</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No locations yet
                  </p>
                )}
              </div>

              {/* Top People */}
              <div className="border border-theme rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-theme-primary">Key People</h4>
                </div>
                {storyStats.topPeople.length > 0 ? (
                  <div className="space-y-2">
                    {storyStats.topPeople.map(({ person, count }) => (
                      <div key={person} className="flex justify-between text-sm">
                        <span className="font-medium">{person}</span>
                        <span className="text-theme-tertiary">{count} stories</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No people tagged yet
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
              <div className="bg-theme-tertiary border border-theme rounded-lg p-4">
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
