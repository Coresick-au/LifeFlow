import React, { useMemo, useState } from 'react';
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Baby, Calendar, MapPin, Users, Heart, Plus, Camera, Trophy, School } from 'lucide-react';
import { ChildTrackerForm } from './ChildTrackerForm';

interface Milestone {
  id: string;
  person: string;
  title: string;
  date: Date;
  type: 'first' | 'development' | 'achievement' | 'health' | 'school' | 'memory';
  description: string;
  relationshipType: string;
  birthDate?: Date;
  birthLocation?: string;
  babyPhoto?: string;
  parents?: string[];
  age?: string;
}

interface ChildProfile {
  name: string;
  birthDate: Date;
  age: {
    years: number;
    months: number;
    days: number;
  };
  birthLocation?: string;
  babyPhoto?: string;
  parents?: string[];
}

export const ChildTracker: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filter child-related stories and extract child profiles
  const childData = useMemo(() => {
    const childStories = stories.filter(story => 
      story.tags.some(tag => 
        ['child', 'kid', 'son', 'daughter', 'baby'].includes(tag.toLowerCase())
      )
    );

    // Extract child profiles from stories or use default
    const childrenMap = new Map<string, ChildProfile>();
    
    // Try to extract child info from stories
    childStories.forEach(story => {
      const childName = story.people.find(p => 
        ['son', 'daughter', 'child'].some(t => p.toLowerCase().includes(t))
      );
      
      if (childName && !childrenMap.has(childName)) {
        // Look for birth date in story content or use a default
        const birthDateMatch = story.content.match(/born on (\d{1,2}\/\d{1,2}\/\d{4})/);
        const birthDate = story.metadata?.birthDate ? new Date(story.metadata.birthDate) : birthDateMatch ? new Date(birthDateMatch[1]) : new Date('2020-01-01');
        const birthLocation = story.metadata?.birthLocation;
        const babyPhoto = story.metadata?.babyPhoto || story.images?.[0];
        const parents = story.metadata?.parents || story.people.filter(p => 
          ['mom', 'dad', 'mother', 'father', 'parent'].some(t => p.toLowerCase().includes(t))
        );
        
        childrenMap.set(childName, {
          name: childName,
          birthDate,
          age: calculateAge(birthDate),
          birthLocation,
          babyPhoto,
          parents,
        });
      }
    });

    // If no children found, create a default profile
    if (childrenMap.size === 0) {
      childrenMap.set('My Child', {
        name: 'My Child',
        birthDate: new Date('2020-01-01'),
        age: calculateAge(new Date('2020-01-01')),
      });
    }

    return { children: Array.from(childrenMap.values()), stories: childStories };
  }, [stories]);

  // Calculate age from birth date
  function calculateAge(birthDate: Date) {
    const now = new Date();
    const years = differenceInYears(now, birthDate);
    const months = differenceInMonths(now, birthDate) % 12;
    const days = differenceInDays(now, birthDate) % 30;
    return { years, months, days };
  }

  // Process milestones for selected child
  const milestones = useMemo(() => {
    const milestones: Milestone[] = [];
    
    childData.stories.forEach(story => {
      // Determine milestone type
      let type: Milestone['type'] = 'memory';
      
      if (story.tags.some(t => ['first'].includes(t.toLowerCase()))) {
        type = 'first';
      } else if (story.tags.some(t => ['development', 'milestone'].includes(t.toLowerCase()))) {
        type = 'development';
      } else if (story.tags.some(t => ['achievement', 'proud'].includes(t.toLowerCase()))) {
        type = 'achievement';
      } else if (story.tags.some(t => ['health', 'doctor'].includes(t.toLowerCase()))) {
        type = 'health';
      } else if (story.tags.some(t => ['school', 'education'].includes(t.toLowerCase()))) {
        type = 'school';
      }

      // Calculate age at milestone
      const child = childData.children[0]; // For now, use first child
      if (child) {
        const ageAtMilestone = calculateAgeAt(child.birthDate, new Date(story.date));
        const person = story.people.find(p => 
          ['son', 'daughter', 'child'].some(t => p.toLowerCase().includes(t))
        );
        const relationshipType = story.people.find(p => 
          ['mom', 'dad', 'mother', 'father', 'parent'].some(t => p.toLowerCase().includes(t))
        );

        milestones.push({
          id: story.id,
          person: person || 'Child',
          title: story.title,
          date: new Date(story.date),
          type,
          description: story.content,
          relationshipType: relationshipType || 'Family',
          birthDate: child.birthDate,
          birthLocation: child.birthLocation,
          babyPhoto: child.babyPhoto,
          parents: child.parents,
          age: formatAge(ageAtMilestone),
        });
      }
    });

    return milestones.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [childData]);

  // Calculate age at specific date
  function calculateAgeAt(birthDate: Date, atDate: Date) {
    const years = differenceInYears(atDate, birthDate);
    const months = differenceInMonths(atDate, birthDate) % 12;
    const days = differenceInDays(atDate, birthDate) % 30;
    return { years, months, days };
  }

  // Format age for display
  function formatAge(age: { years: number; months: number; days: number }) {
    if (age.years > 0) {
      return `${age.years}y ${age.months}m`;
    } else if (age.months > 0) {
      return `${age.months}m ${age.days}d`;
    } else {
      return `${age.days} days`;
    }
  }

  // Get milestone icon
  const getMilestoneIcon = (type: Milestone['type']) => {
    switch (type) {
      case 'first': return <Camera className="w-4 h-4 text-pink-500" />;
      case 'development': return <Baby className="w-4 h-4 text-blue-500" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'health': return <Heart className="w-4 h-4 text-red-500" />;
      case 'school': return <School className="w-4 h-4 text-green-500" />;
      default: return <Heart className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const currentChild = selectedChild 
    ? childData.children.find(c => c.name === selectedChild) 
    : childData.children[0];

  if (!currentChild) {
    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary mb-2">No child data yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Add stories with #child or #baby tags to track milestones</p>
            <button
              onClick={() => setCurrentView({ type: 'add-story' })}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Add Milestone
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Child Tracker</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add Child Event
        </button>
      </div>

      {/* Child Selector */}
      {childData.children.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-theme-secondary mb-2">Select Child:</label>
          <select
            value={currentChild.name}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {childData.children.map(child => (
              <option key={child.name} value={child.name}>{child.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-gradient-to-r from-pink-900/20 to-blue-900/20 rounded-lg p-6 mb-8 border border-pink-800/30">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-theme-primary mb-2">{currentChild.name}</h3>
            <div className="text-3xl font-bold text-theme-secondary">
              {currentChild.age.years > 0 && `${currentChild.age.years} years `}
              {currentChild.age.months > 0 && `${currentChild.age.months} months `}
              {currentChild.age.years === 0 && currentChild.age.days > 0 && `${currentChild.age.days} days`}
            </div>
            <p className="text-sm text-theme-tertiary mt-1">
              Born {format(currentChild.birthDate, 'MMMM d, yyyy')}
            </p>
            {currentChild.birthLocation && (
              <p className="text-sm text-theme-tertiary mt-1">
                Birth Location: {currentChild.birthLocation}
              </p>
            )}
            {currentChild.parents && currentChild.parents.length > 0 && (
              <div className="mt-2">
                <span className="text-sm font-medium text-theme-secondary">Parents: </span>
                <span className="text-sm text-theme-tertiary">
                  {currentChild.parents.join(', ')}
                </span>
              </div>
            )}
          </div>
          {currentChild.babyPhoto ? (
            <img
              src={currentChild.babyPhoto}
              alt={`${currentChild.name}'s baby photo`}
              className="w-24 h-24 object-cover rounded-lg shadow-md"
            />
          ) : (
            <Baby className="w-16 h-16 text-pink-300" />
          )}
        </div>
      </div>

      {/* Milestone Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{milestones.length}</div>
          <div className="text-sm text-theme-tertiary">Total Milestones</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {milestones.filter(m => m.type === 'first').length}
          </div>
          <div className="text-sm text-theme-tertiary">Firsts</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {milestones.filter(m => m.type === 'achievement').length}
          </div>
          <div className="text-sm text-theme-tertiary">Achievements</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {milestones.filter(m => m.type === 'development').length}
          </div>
          <div className="text-sm text-theme-tertiary">Development</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {milestones.filter(m => m.type === 'school').length}
          </div>
          <div className="text-sm text-theme-tertiary">School</div>
        </div>
      </div>

      {/* Recent Milestones */}
      <div>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Recent Milestones</h3>
        
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No milestones recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.slice(0, 10).map(milestone => (
              <div key={milestone.id} className="flex items-start gap-4 p-4 bg-theme-tertiary rounded-lg hover:bg-theme-tertiary transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center shadow-sm">
                  {getMilestoneIcon(milestone.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-theme-primary">{milestone.title}</h4>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {milestone.age} • {format(milestone.date, 'MMM yyyy')}
                    </div>
                  </div>
                  <p className="text-sm text-theme-tertiary">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Child Tracker Form */}
      {showForm && (
        <ChildTrackerForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
