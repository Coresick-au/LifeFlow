import React, { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
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

export const LifeDashboard: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();

  // Career data
  const careerData = useMemo(() => {
    const careerStories = stories.filter(story =>
      story.tags.some(tag =>
        ['career', 'work', 'job', 'professional', 'business'].includes(tag.toLowerCase())
      )
    );

    const promotions = careerStories.filter(s =>
      s.tags.some(t => ['promotion', 'promoted'].includes(t.toLowerCase()))
    ).length;

    const achievements = careerStories.filter(s =>
      s.tags.some(t => ['achievement', 'award', 'certified'].includes(t.toLowerCase()))
    ).length;

    const totalYears = careerStories.length > 0
      ? Math.round(differenceInDays(new Date(), new Date(Math.min(...careerStories.map(s => new Date(s.date).getTime())))) / 365)
      : 0;

    return {
      totalEvents: careerStories.length,
      promotions,
      achievements,
      yearsExperience: totalYears,
      recentEvents: careerStories.slice(0, 3).map(s => ({
        title: s.title,
        date: new Date(s.date),
        subtitle: s.location || 'Current Position',
      })),
    };
  }, [stories]);

  // Child data
  const childData = useMemo(() => {
    const childStories = stories.filter(story =>
      story.tags.some(tag =>
        ['child', 'kid', 'son', 'daughter', 'baby'].includes(tag.toLowerCase())
      )
    );

    const milestones = childStories.filter(s =>
      s.tags.some(t => ['first', 'milestone', 'development'].includes(t.toLowerCase()))
    ).length;

    const achievements = childStories.filter(s =>
      s.tags.some(t => ['achievement', 'proud'].includes(t.toLowerCase()))
    ).length;

    return {
      totalMilestones: childStories.length,
      firstMilestones: milestones,
      achievements,
      recentEvents: childStories.slice(0, 3).map(s => ({
        title: s.title,
        date: new Date(s.date),
        subtitle: `${Math.round(differenceInDays(new Date(), new Date(s.date)) / 30)} months ago`,
      })),
    };
  }, [stories]);

  // Home data
  const homeData = useMemo(() => {
    const homeStories = stories.filter(story =>
      story.tags.some(tag =>
        ['home', 'house', 'renovation', 'maintenance', 'property'].includes(tag.toLowerCase())
      ) || story.location?.toLowerCase().includes('home')
    );

    const renovations = homeStories.filter(s =>
      s.tags.some(t => ['renovation', 'remodel'].includes(t.toLowerCase()))
    ).length;

    const maintenance = homeStories.filter(s =>
      s.tags.some(t => ['maintenance', 'repair'].includes(t.toLowerCase()))
    ).length;

    const yearsInHome = homeStories.length > 0
      ? Math.round(differenceInDays(new Date(), new Date(Math.min(...homeStories.map(s => new Date(s.date).getTime())))) / 365)
      : 0;

    return {
      totalEvents: homeStories.length,
      renovations,
      maintenance,
      yearsInHome,
      recentEvents: homeStories.slice(0, 3).map(s => ({
        title: s.title,
        date: new Date(s.date),
        subtitle: s.tags.find(t => ['renovation', 'maintenance'].includes(t.toLowerCase())) || 'Home Event',
      })),
    };
  }, [stories]);

  // Relationship data
  const relationshipData = useMemo(() => {
    const relationshipStories = stories.filter(story =>
      story.tags.some(tag =>
        ['relationship', 'friend', 'family', 'partner', 'love'].includes(tag.toLowerCase())
      ) || story.people.length > 0
    );

    const family = relationshipStories.filter(s =>
      s.tags.some(t => ['family', 'parent', 'sibling'].includes(t.toLowerCase())) ||
      s.people.some(p => ['mom', 'dad', 'mother', 'father', 'brother', 'sister'].includes(p.toLowerCase()))
    ).length;

    const friends = relationshipStories.filter(s =>
      s.tags.some(t => ['friend'].includes(t.toLowerCase()))
    ).length;

    // Find relationships that need attention (no contact in 30+ days)
    const peopleMap = new Map<string, Date>();
    relationshipStories.forEach(s => {
      s.people.forEach(person => {
        if (!peopleMap.has(person) || new Date(s.date) > peopleMap.get(person)!) {
          peopleMap.set(person, new Date(s.date));
        }
      });
    });

    const needAttention = Array.from(peopleMap.entries()).filter(([_, lastContact]) =>
      differenceInDays(new Date(), lastContact) > 30
    ).length;

    return {
      totalConnections: peopleMap.size,
      familyConnections: family,
      friendConnections: friends,
      needAttention,
      recentEvents: relationshipStories.slice(0, 3).map(s => ({
        title: s.title,
        date: new Date(s.date),
        subtitle: s.people[0] || 'Someone Special',
      })),
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

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Career',
      icon: <Briefcase className="w-6 h-6 text-blue-600" />,
      stats: [
        { label: 'Years Experience', value: careerData.yearsExperience },
        { label: 'Total Events', value: careerData.totalEvents },
        { label: 'Promotions', value: careerData.promotions, color: 'text-green-600' },
        { label: 'Achievements', value: careerData.achievements, color: 'text-purple-600' },
      ],
      recentItems: careerData.recentEvents,
      viewName: 'job-tracker',
    },
    {
      title: 'Family',
      icon: <Baby className="w-6 h-6 text-pink-600" />,
      stats: [
        { label: 'Total Milestones', value: childData.totalMilestones },
        { label: 'First Moments', value: childData.firstMilestones, color: 'text-yellow-600' },
        { label: 'Achievements', value: childData.achievements, color: 'text-purple-600' },
      ],
      recentItems: childData.recentEvents,
      viewName: 'child-tracker',
    },
    {
      title: 'Home',
      icon: <Home className="w-6 h-6 text-green-600" />,
      stats: [
        { label: 'Years in Home', value: homeData.yearsInHome },
        { label: 'Total Events', value: homeData.totalEvents },
        { label: 'Renovations', value: homeData.renovations, color: 'text-blue-600' },
        { label: 'Maintenance', value: homeData.maintenance, color: 'text-orange-600' },
      ],
      recentItems: homeData.recentEvents,
      viewName: 'house-tracker',
    },
    {
      title: 'Relationships',
      icon: <Heart className="w-6 h-6 text-red-600" />,
      stats: [
        { label: 'Connections', value: relationshipData.totalConnections },
        { label: 'Family', value: relationshipData.familyConnections, color: 'text-blue-600' },
        { label: 'Friends', value: relationshipData.friendConnections, color: 'text-green-600' },
        { label: 'Need Attention', value: relationshipData.needAttention, color: 'text-yellow-600' },
      ],
      recentItems: relationshipData.recentEvents,
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
          <h1 className="text-3xl font-bold text-theme-primary mb-2">Life Dashboard</h1>
          <p className="text-theme-tertiary">A complete overview of your life's journey across all areas</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                  {card.title === 'Relationships' && relationshipData.needAttention > 0 && (
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
                          <span className="text-slate-500 dark:text-slate-400">{format(item.date, 'MMM d')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-theme-primary rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-theme-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setCurrentView({ type: 'add-story' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Add Story
            </button>

            <button
              onClick={() => setCurrentView({ type: 'gantt' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <Target className="w-4 h-4" />
              Gantt Timeline
            </button>

            <button
              onClick={() => setCurrentView({ type: 'thoughts' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Thoughts
            </button>

            <button
              onClick={() => setCurrentView({ type: 'ai-insights' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              AI Insights
            </button>

            <button
              onClick={() => setCurrentView({ type: 'user-profile' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <Users className="w-4 h-4" />
              PDF Export
            </button>

            <button
              onClick={() => setCurrentView({ type: 'location-map' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Locations
            </button>

            <button
              onClick={() => setCurrentView({ type: 'bubble' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <Target className="w-4 h-4" />
              Bubble View
            </button>

            <button
              onClick={() => setCurrentView({ type: 'timeline' })}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
