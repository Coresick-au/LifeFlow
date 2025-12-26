import React, { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { LifeDistributionChart } from './LifeDistributionChart';
import { LifeWeeksHeatmap } from './LifeWeeksHeatmap';
import { LIFE_CATEGORIES, FAMILY_PEOPLE_TAGS } from '../constants/categories';
import {
  Briefcase,
  Baby,
  Home,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
  Target,
  Users,
  AlertCircle
} from 'lucide-react';

interface DashboardCard {
  title: string;
  icon: React.ReactNode;
  stats: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  recentItems?: Array<{
    title: string;
    date: Date;
    subtitle?: string;
  }>;
  viewName: string;
}

/**
 * Buckets a story into categories based on its tags
 * Uses centralized category definitions from constants/categories.ts
 */
function categorizeStory(story: Story): Set<string> {
  const categories = new Set<string>();
  const lowerTags = story.tags.map(t => t.toLowerCase());

  for (const [categoryId, category] of Object.entries(LIFE_CATEGORIES)) {
    if (lowerTags.some(tag => category.tags.includes(tag))) {
      categories.add(categoryId);
    }
  }

  // Special case: relationships also includes stories with people
  if (story.people.length > 0) {
    categories.add('relationships');
  }

  // Special case: home location check
  if (story.location?.toLowerCase().includes('home')) {
    categories.add('home');
  }

  return categories;
}

export const LifeDashboard: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();

  /**
   * PERFORMANCE OPTIMIZATION: Single-pass story bucketing
   * Instead of calling stories.filter() 4+ times, we iterate once
   * and bucket stories into all applicable categories simultaneously.
   */
  const categoryData = useMemo(() => {
    // Initialize category buckets
    const buckets: Record<string, Story[]> = {
      career: [],
      family: [],
      home: [],
      relationships: [],
    };

    // People tracking for relationships
    const peopleMap = new Map<string, Date>();

    // Single pass through all stories
    stories.forEach(story => {
      const storyCategories = categorizeStory(story);

      storyCategories.forEach(category => {
        if (buckets[category]) {
          buckets[category].push(story);
        }
      });

      // Track people for relationship attention
      story.people.forEach(person => {
        const storyDate = new Date(story.date);
        if (!peopleMap.has(person) || storyDate > peopleMap.get(person)!) {
          peopleMap.set(person, storyDate);
        }
      });
    });

    // Calculate derived metrics from buckets
    const now = new Date();

    // Career metrics
    const careerStories = buckets.career;
    const promotions = careerStories.filter(s =>
      s.tags.some(t => ['promotion', 'promoted'].includes(t.toLowerCase()))
    ).length;
    const careerAchievements = careerStories.filter(s =>
      s.tags.some(t => ['achievement', 'award', 'certified'].includes(t.toLowerCase()))
    ).length;
    const yearsExperience = careerStories.length > 0
      ? Math.round(differenceInDays(now, new Date(Math.min(...careerStories.map(s => new Date(s.date).getTime())))) / 365)
      : 0;

    // Family metrics
    const familyStories = buckets.family;
    const firstMilestones = familyStories.filter(s =>
      s.tags.some(t => ['first', 'milestone', 'development'].includes(t.toLowerCase()))
    ).length;
    const familyAchievements = familyStories.filter(s =>
      s.tags.some(t => ['achievement', 'proud'].includes(t.toLowerCase()))
    ).length;

    // Home metrics
    const homeStories = buckets.home;
    const renovations = homeStories.filter(s =>
      s.tags.some(t => ['renovation', 'remodel'].includes(t.toLowerCase()))
    ).length;
    const maintenance = homeStories.filter(s =>
      s.tags.some(t => ['maintenance', 'repair'].includes(t.toLowerCase()))
    ).length;
    const yearsInHome = homeStories.length > 0
      ? Math.round(differenceInDays(now, new Date(Math.min(...homeStories.map(s => new Date(s.date).getTime())))) / 365)
      : 0;

    // Relationship metrics
    const relationshipStories = buckets.relationships;
    const familyConnections = relationshipStories.filter(s =>
      s.tags.some(t => ['family', 'parent', 'sibling'].includes(t.toLowerCase())) ||
      s.people.some(p => FAMILY_PEOPLE_TAGS.includes(p.toLowerCase()))
    ).length;
    const friendConnections = relationshipStories.filter(s =>
      s.tags.some(t => t.toLowerCase() === 'friend')
    ).length;
    const needAttention = Array.from(peopleMap.entries()).filter(([_, lastContact]) =>
      differenceInDays(now, lastContact) > 30
    ).length;

    return {
      career: {
        totalEvents: careerStories.length,
        promotions,
        achievements: careerAchievements,
        yearsExperience,
        recentEvents: careerStories.slice(0, 3).map(s => ({
          title: s.title,
          date: new Date(s.date),
          subtitle: s.location || 'Current Position',
        })),
      },
      family: {
        totalMilestones: familyStories.length,
        firstMilestones,
        achievements: familyAchievements,
        recentEvents: familyStories.slice(0, 3).map(s => ({
          title: s.title,
          date: new Date(s.date),
          subtitle: `${Math.round(differenceInDays(now, new Date(s.date)) / 30)} months ago`,
        })),
      },
      home: {
        totalEvents: homeStories.length,
        renovations,
        maintenance,
        yearsInHome,
        recentEvents: homeStories.slice(0, 3).map(s => ({
          title: s.title,
          date: new Date(s.date),
          subtitle: s.tags.find(t => ['renovation', 'maintenance'].includes(t.toLowerCase())) || 'Home Event',
        })),
      },
      relationships: {
        totalConnections: peopleMap.size,
        familyConnections,
        friendConnections,
        needAttention,
        recentEvents: relationshipStories.slice(0, 3).map(s => ({
          title: s.title,
          date: new Date(s.date),
          subtitle: s.people[0] || 'Someone Special',
        })),
      },
    };
  }, [stories]);

  // Overall stats
  const overallStats = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const thisYearStories = stories.filter(s => new Date(s.date).getFullYear() === thisYear);
    const locations = Array.from(new Set(stories.map(s => s.location).filter(Boolean)));
    const tags = Array.from(new Set(stories.flatMap(s => s.tags)));

    return {
      totalStories: stories.length,
      thisYear: thisYearStories.length,
      locations: locations.length,
      tags: tags.length,
    };
  }, [stories]);

  // Prepare data for the pie chart - uses centralized colors
  const distributionData = useMemo(() => [
    { name: 'Career', value: categoryData.career.totalEvents, color: LIFE_CATEGORIES.career.color.hex },
    { name: 'Family', value: categoryData.family.totalMilestones, color: LIFE_CATEGORIES.family.color.hex },
    { name: 'Home', value: categoryData.home.totalEvents, color: LIFE_CATEGORIES.home.color.hex },
    { name: 'Relationships', value: categoryData.relationships.totalConnections, color: LIFE_CATEGORIES.relationships.color.hex },
  ], [categoryData]);

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Career',
      icon: <Briefcase className={`w-6 h-6 ${LIFE_CATEGORIES.career.color.tailwind}`} />,
      stats: [
        { label: 'Years Experience', value: categoryData.career.yearsExperience },
        { label: 'Total Events', value: categoryData.career.totalEvents },
        { label: 'Promotions', value: categoryData.career.promotions, color: 'text-green-600' },
        { label: 'Achievements', value: categoryData.career.achievements, color: 'text-purple-600' },
      ],
      recentItems: categoryData.career.recentEvents,
      viewName: 'job-tracker',
    },
    {
      title: 'Family',
      icon: <Baby className={`w-6 h-6 ${LIFE_CATEGORIES.family.color.tailwind}`} />,
      stats: [
        { label: 'Total Milestones', value: categoryData.family.totalMilestones },
        { label: 'First Moments', value: categoryData.family.firstMilestones, color: 'text-yellow-600' },
        { label: 'Achievements', value: categoryData.family.achievements, color: 'text-purple-600' },
      ],
      recentItems: categoryData.family.recentEvents,
      viewName: 'child-tracker',
    },
    {
      title: 'Home',
      icon: <Home className={`w-6 h-6 ${LIFE_CATEGORIES.home.color.tailwind}`} />,
      stats: [
        { label: 'Years in Home', value: categoryData.home.yearsInHome },
        { label: 'Total Events', value: categoryData.home.totalEvents },
        { label: 'Renovations', value: categoryData.home.renovations, color: 'text-blue-600' },
        { label: 'Maintenance', value: categoryData.home.maintenance, color: 'text-orange-600' },
      ],
      recentItems: categoryData.home.recentEvents,
      viewName: 'home-tracker',
    },
    {
      title: 'Relationships',
      icon: <Heart className={`w-6 h-6 ${LIFE_CATEGORIES.relationships.color.tailwind}`} />,
      stats: [
        { label: 'Connections', value: categoryData.relationships.totalConnections },
        { label: 'Family', value: categoryData.relationships.familyConnections, color: 'text-blue-600' },
        { label: 'Friends', value: categoryData.relationships.friendConnections, color: 'text-green-600' },
        { label: 'Need Attention', value: categoryData.relationships.needAttention, color: 'text-yellow-600' },
      ],
      recentItems: categoryData.relationships.recentEvents,
      viewName: 'relationship-tracker',
    },
  ];

  const handleCardClick = (viewName: string) => {
    setCurrentView({ type: viewName as any });
  };

  return (
    <div className="min-h-screen bg-theme-tertiary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-primary mb-2">Flow Board</h1>
          <p className="text-theme-tertiary">A complete overview of your life's journey across all areas</p>
        </div>

        {/* Split Top Section: Stats Grid + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Overall Stats (Takes up 2/3 width on large screens) */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-theme-primary rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-theme-primary">{overallStats.totalStories}</span>
              </div>
              <p className="text-sm text-theme-tertiary">Total Stories</p>
            </div>

            <div className="bg-theme-primary rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-theme-primary">{overallStats.thisYear}</span>
              </div>
              <p className="text-sm text-theme-tertiary">This Year</p>
            </div>

            <div className="bg-theme-primary rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-theme-primary">{overallStats.locations}</span>
              </div>
              <p className="text-sm text-theme-tertiary">Places</p>
            </div>

            <div className="bg-theme-primary rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-bold text-theme-primary">{overallStats.tags}</span>
              </div>
              <p className="text-sm text-theme-tertiary">Tags</p>
            </div>
          </div>

          {/* Right Column: The Pie Chart (Takes up 1/3 width) */}
          <div className="lg:col-span-1 h-full">
            <LifeDistributionChart data={distributionData} />
          </div>
        </div>

        {/* Life Weeks Heatmap - Full Width */}
        <div className="mb-8">
          <LifeWeeksHeatmap />
        </div>

        {/* Tracker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {dashboardCards.map(card => (
            <div
              key={card.title}
              className="bg-theme-primary rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardClick(card.viewName)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <h2 className="text-xl font-bold text-theme-primary">{card.title}</h2>
                  </div>
                  {card.title === 'Relationships' && categoryData.relationships.needAttention > 0 && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {card.stats.map((stat, index) => (
                    <div key={index}>
                      <div className={`text-2xl font-bold text-theme-primary ${stat.color || ''}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-theme-tertiary">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {card.recentItems && card.recentItems.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-theme-secondary mb-2">Recent</h3>
                    <div className="space-y-2">
                      {card.recentItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-theme-primary truncate">{item.title}</span>
                          <span className="text-slate-500 dark:text-slate-400">{format(item.date, 'MMM d, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
