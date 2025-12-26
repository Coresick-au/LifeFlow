import React from 'react';
import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { CareerEvent } from './JobTracker';

interface CareerInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'opportunity';
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CareerInsightsProps {
  careerEvents: CareerEvent[];
}

export const CareerInsights: React.FC<CareerInsightsProps> = ({ careerEvents }) => {
  const insights = React.useMemo(() => {
    const insightsList: CareerInsight[] = [];

    // Group REAL position events by company (exclude synthesized "Left" events)
    const companyPositions = new Map<string, CareerEvent[]>();

    careerEvents.forEach(event => {
      // Only consider original position events, not synthesized "Left" events
      if (event.company && event.type === 'position' && !event.id.endsWith('-ended')) {
        if (!companyPositions.has(event.company)) {
          companyPositions.set(event.company, []);
        }
        companyPositions.get(event.company)?.push(event);
      }
    });

    // Analyze each company for loyalty penalty - ONLY for current/active jobs
    companyPositions.forEach((positions, company) => {
      // Sort positions by date (most recent last)
      positions.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Find the most recent position at this company
      const latestPosition = positions[positions.length - 1];

      if (latestPosition) {
        // CRITICAL: Skip if this position has an end date - means you left this job
        if (latestPosition.endDate) {
          return; // This job is in the past, no loyalty penalty applies
        }

        // This is a CURRENT/ACTIVE job (no end date)
        const tenureInYears = calculateTenure(latestPosition);

        // Check for loyalty penalty (>3 years without promotion)
        if (tenureInYears > 3) {
          const hasPromotionSinceStart = careerEvents.some(event =>
            event.company === company &&
            event.type === 'promotion' &&
            event.date >= latestPosition.date
          );

          if (!hasPromotionSinceStart) {
            insightsList.push({
              id: `loyalty-penalty-${company}`,
              type: 'warning',
              title: '⚠️ Loyalty Penalty Detected',
              description: `You've been at ${company} for ${tenureInYears.toFixed(1)} years without a promotion. Switching roles could yield a 15-20% salary increase.`,
              icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
            });
          }
        }
      }
    });

    // Analyze skills from non-career stories
    const skillTags = new Set<string>();
    const projectTags = new Set<string>();
    const achievementTags = new Set<string>();

    careerEvents.forEach(event => {
      if (event.type === 'skill') {
        skillTags.add(event.title);
      } else if (event.type === 'project') {
        projectTags.add(event.title);
      } else if (event.type === 'achievement') {
        achievementTags.add(event.title);
      }
    });

    // Suggest leadership opportunities
    if (projectTags.size > 2 || achievementTags.size > 3) {
      insightsList.push({
        id: 'leadership-opportunity',
        type: 'opportunity',
        title: '💡 Hidden Leadership Skills',
        description: `Your ${projectTags.size} projects and ${achievementTags.size} achievements suggest leadership potential. Consider Management or Team Lead roles.`,
        icon: <Lightbulb className="w-5 h-5 text-purple-600" />
      });
    }

    // Check for skill gaps
    const recentSkills = careerEvents
      .filter(e => e.type === 'skill')
      .filter(e => {
        const monthsSince = (new Date().getTime() - e.date.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSince <= 12;
      });

    if (recentSkills.length === 0 && careerEvents.length > 0) {
      insightsList.push({
        id: 'skill-gap',
        type: 'suggestion',
        title: '📚 Skill Development Opportunity',
        description: 'No new skills acquired in the past year. Consider certifications or courses to stay market-competitive.',
        icon: <TrendingUp className="w-5 h-5 text-blue-600" />
      });
    }

    return insightsList;
  }, [careerEvents]);

  // Helper function to calculate tenure in years
  function calculateTenure(event: CareerEvent): number {
    const end = event.endDate || new Date();
    const start = event.date;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    return diffYears;
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-semibold text-theme-primary dark:text-gray-100 mb-4">Career Insights</h3>
      {insights.map(insight => (
        <div
          key={insight.id}
          className={`p-4 rounded-lg border-l-4 ${insight.type === 'warning'
            ? 'bg-amber-500/20 dark:bg-amber-900/20 border-amber-400'
            : insight.type === 'opportunity'
              ? 'bg-purple-500/20 dark:bg-purple-900/20 border-purple-400'
              : 'bg-blue-500/20 dark:bg-blue-900/20 border-blue-400'
            }`}
        >
          <div className="flex items-start gap-3">
            {insight.icon}
            <div className="flex-1">
              <h4 className="font-semibold text-theme-primary mb-1">{insight.title}</h4>
              <p className="text-theme-secondary text-sm">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
