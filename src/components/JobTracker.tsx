import React, { useMemo, useState } from 'react';
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Briefcase, Calendar, MapPin, TrendingUp, Plus, Award, Target, Info } from 'lucide-react';
import { JobTrackerForm } from './JobTrackerForm';
import { CareerInsights } from './CareerInsights';
import { CareerExport } from './CareerExport';
import { reseedWithCareerData } from '../utils/reseedData';

export interface CareerEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: 'position' | 'promotion' | 'achievement' | 'skill' | 'project';
  description: string;
  company?: string;
}

export const JobTracker: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();
  const [showForm, setShowForm] = useState(false);
  const [showWiki, setShowWiki] = useState(false);

  // Filter career-related stories
  const careerStories = useMemo(() => {
    return stories.filter(story =>
      story.tags.some(tag =>
        ['career', 'work', 'job', 'professional', 'business'].includes(tag.toLowerCase())
      )
    );
  }, [stories]);

  // Process career events
  const careerEvents = useMemo(() => {
    const events: CareerEvent[] = [];

    careerStories.forEach(story => {
      // Determine event type based on tags and content
      let type: CareerEvent['type'] = 'position';

      if (story.tags.some(t => ['promotion', 'promoted'].includes(t.toLowerCase()))) {
        type = 'promotion';
      } else if (story.tags.some(t => ['achievement', 'award', 'certified'].includes(t.toLowerCase()))) {
        type = 'achievement';
      } else if (story.tags.some(t => ['skill', 'learning', 'course'].includes(t.toLowerCase()))) {
        type = 'skill';
      } else if (story.tags.some(t => ['project'].includes(t.toLowerCase()))) {
        type = 'project';
      }

      // Extract company from location or content
      const company = story.location ||
        (story.content.match(/at ([A-Z][a-zA-Z\s&]+)/)?.[1] || undefined);

      events.push({
        id: story.id,
        title: story.title,
        date: new Date(story.date),
        endDate: story.endDate ? new Date(story.endDate) : undefined,
        type,
        description: story.content,
        company,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [careerStories]);

  // Calculate career stats
  const careerStats = useMemo(() => {
    const totalExperience = careerEvents.reduce((total, event) => {
      if (event.endDate) {
        return total + differenceInMonths(event.endDate, event.date);
      }
      return total + differenceInMonths(new Date(), event.date);
    }, 0);

    const promotions = careerEvents.filter(e => e.type === 'promotion').length;
    const achievements = careerEvents.filter(e => e.type === 'achievement').length;
    const skills = careerEvents.filter(e => e.type === 'skill').length;

    const companiesSet = new Set<string>();
    careerEvents.forEach(event => {
      if (event.company) {
        companiesSet.add(event.company);
      }
    });
    const companies = Array.from(companiesSet).filter(Boolean);

    return {
      yearsOfExperience: Math.round(totalExperience / 12 * 10) / 10,
      promotions,
      achievements,
      skills,
      companiesCount: companies.length,
      companies,
    };
  }, [careerEvents]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, CareerEvent[]> = {};

    careerEvents.forEach(event => {
      const year = event.date.getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(event);
    });

    return Object.entries(grouped)
      .map(([year, events]) => ({ year: parseInt(year), events }))
      .sort((a, b) => b.year - a.year);
  }, [careerEvents]);

  const getEventIcon = (type: CareerEvent['type']) => {
    switch (type) {
      case 'promotion': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'achievement': return <Award className="w-4 h-4 text-purple-600" />;
      case 'skill': return <Target className="w-4 h-4 text-blue-600" />;
      default: return <Briefcase className="w-4 h-4 text-theme-tertiary" />;
    }
  };

  const getEventTypeLabel = (type: CareerEvent['type']) => {
    switch (type) {
      case 'position': return 'Position';
      case 'promotion': return 'Promotion';
      case 'achievement': return 'Achievement';
      case 'skill': return 'Skill Development';
      case 'project': return 'Project';
      default: return 'Event';
    }
  };

  if (careerStories.length === 0) {
    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary mb-2">No career events yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Add stories with #career or #work tags to track your professional journey</p>
            <button
              onClick={() => setCurrentView({ type: 'add-story' })}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Add Career Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Career Tracker</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const success = await reseedWithCareerData();
              if (success) {
                window.location.reload();
              }
            }}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Load Test Data
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Add Career Event
          </button>
        </div>
      </div>

      {/* Career Export Tools */}
      <CareerExport careerEvents={careerEvents} />

      {/* Career Insights */}
      <CareerInsights careerEvents={careerEvents} />

      {/* Career Growth Wiki */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Career Growth Pro-Tips</h3>
          <button
            onClick={() => setShowWiki(!showWiki)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {showWiki ? 'Hide' : 'Show'} Tips
          </button>
        </div>

        {showWiki && (
          <div className="bg-blue-500/20 dark:bg-blue-900 rounded-lg p-6 space-y-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <div>
                  <strong>💰 Track Salary Information:</strong> Adding salary data to your career events helps identify market value gaps and negotiate better compensation. Market rate increases 15-20% every 3 years - staying too long means leaving money on the table.
                </div>
                <div>
                  <strong>📝 Document Specific Projects:</strong> Quantify achievements with metrics (e.g., "Increased revenue by 23%", "Managed team of 5", "Reduced costs by $50K"). AI resume builders need concrete data to create compelling narratives.
                </div>
                <div>
                  <strong>🏷️ Use Strategic Tags:</strong> Tag projects with #leadership, #technical, #client-facing, or #innovation to help AI identify your core strengths and suggest relevant pivot opportunities.
                </div>
                <div>
                  <strong>🔄 Update Regularly:</strong> Career leverage compounds. Monthly updates ensure you capture achievements while fresh and maintain accurate trajectory analysis.
                </div>
                <div>
                  <strong>🤖 AI-Ready Data:</strong> The "AI Pivot Pack" formats your career history for LLM analysis. Include skills from non-work activities - volunteering, hobbies, and personal projects often translate to valuable professional competencies.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Career Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="text-center p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{careerStats.yearsOfExperience}</div>
          <div className="text-sm text-theme-tertiary">Years Experience</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{careerStats.promotions}</div>
          <div className="text-sm text-theme-tertiary">Promotions</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{careerStats.achievements}</div>
          <div className="text-sm text-theme-tertiary">Achievements</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{careerStats.skills}</div>
          <div className="text-sm text-theme-tertiary">Skills Learned</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{careerStats.companiesCount}</div>
          <div className="text-sm text-theme-tertiary">Companies</div>
        </div>
      </div>

      {/* Companies Worked */}
      {careerStats.companies.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">Companies</h3>
          <div className="flex flex-wrap gap-2">
            {careerStats.companies.map((company: string) => (
              <span key={company} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Career Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Career Timeline</h3>

        {eventsByYear.map(({ year, events }) => (
          <div key={year} className="border-l-2 border-theme pl-6 relative">
            <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
            <h4 className="font-bold text-theme-primary mb-3">{year}</h4>

            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-theme-tertiary dark:bg-slate-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <h5 className="font-medium text-theme-primary">{event.title}</h5>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {format(event.date, 'MMM yyyy')}
                      {event.endDate && ` - ${format(event.endDate, 'MMM yyyy')}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-theme-tertiary dark:text-slate-400 mb-2">
                    <span className="capitalize text-theme-tertiary">{getEventTypeLabel(event.type)}</span>
                    {event.company && (
                      <span>at {event.company}</span>
                    )}
                  </div>

                  <p className="text-theme-secondary text-sm">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Job Tracker Form */}
      {showForm && (
        <JobTrackerForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
