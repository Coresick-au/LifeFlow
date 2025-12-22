import React, { useMemo, useState } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Heart, Calendar, MessageCircle, Gift, Users, AlertCircle } from 'lucide-react';

interface RelationshipEvent {
  id: string;
  person: string;
  title: string;
  date: Date;
  type: 'milestone' | 'memory' | 'note' | 'gift' | 'conversation';
  description: string;
  relationshipType: string;
}

interface Relationship {
  name: string;
  type: 'family' | 'friend' | 'partner' | 'colleague';
  lastContact: Date;
  contactFrequency: number; // days between contacts
  totalMemories: number;
  nextReminder?: Date;
}

export const RelationshipTracker: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter relationship-related stories
  const relationshipStories = useMemo(() => {
    return stories.filter(story =>
      story.tags.some(tag =>
        ['relationship', 'friend', 'family', 'partner', 'love'].includes(tag.toLowerCase())
      ) || story.people.length > 0
    );
  }, [stories]);

  // Process relationship events
  const relationshipEvents = useMemo(() => {
    const events: RelationshipEvent[] = [];

    relationshipStories.forEach(story => {
      // Determine event type
      let type: RelationshipEvent['type'] = 'memory';

      if (story.tags.some(t => ['milestone', 'anniversary'].includes(t.toLowerCase()))) {
        type = 'milestone';
      } else if (story.tags.some(t => ['gift', 'present'].includes(t.toLowerCase()))) {
        type = 'gift';
      } else if (story.tags.some(t => ['conversation', 'talk'].includes(t.toLowerCase()))) {
        type = 'conversation';
      } else if (story.tags.some(t => ['note', 'message'].includes(t.toLowerCase()))) {
        type = 'note';
      }

      // Determine relationship type from tags
      let relationshipType = 'friend';
      if (story.tags.some(t => ['family', 'parent', 'sibling'].includes(t.toLowerCase()))) {
        relationshipType = 'family';
      } else if (story.tags.some(t => ['partner', 'spouse', 'boyfriend', 'girlfriend'].includes(t.toLowerCase()))) {
        relationshipType = 'partner';
      } else if (story.tags.some(t => ['colleague', 'coworker'].includes(t.toLowerCase()))) {
        relationshipType = 'colleague';
      }

      // Use first person if available
      const person = story.people[0] || 'Someone Special';

      events.push({
        id: story.id,
        person,
        title: story.title,
        date: new Date(story.date),
        type,
        description: story.content,
        relationshipType,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [relationshipStories]);

  // Calculate relationship stats
  const relationships = useMemo(() => {
    const relationshipsMap = new Map<string, Relationship>();

    relationshipEvents.forEach(event => {
      if (!relationshipsMap.has(event.person)) {
        relationshipsMap.set(event.person, {
          name: event.person,
          type: event.relationshipType as Relationship['type'],
          lastContact: event.date,
          contactFrequency: 30, // Default monthly
          totalMemories: 0,
        });
      }

      const rel = relationshipsMap.get(event.person)!;
      rel.totalMemories++;
      if (event.date > rel.lastContact) {
        rel.lastContact = event.date;
      }
    });

    // Calculate next reminders
    relationshipsMap.forEach(rel => {
      const daysSinceContact = differenceInDays(new Date(), rel.lastContact);
      if (daysSinceContact >= rel.contactFrequency) {
        rel.nextReminder = addDays(new Date(), 7); // Remind in a week
      }
    });

    return Array.from(relationshipsMap.values());
  }, [relationshipEvents]);

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    if (selectedType === 'all') return relationships;
    return relationships.filter(rel => rel.type === selectedType);
  }, [relationships, selectedType]);

  // Get events for a specific person
  const getPersonEvents = (personName: string) => {
    return relationshipEvents.filter(event => event.person === personName);
  };

  // Get event icon
  const getEventIcon = (type: RelationshipEvent['type']) => {
    switch (type) {
      case 'milestone': return <Heart className="w-4 h-4 text-red-500" />;
      case 'gift': return <Gift className="w-4 h-4 text-purple-500" />;
      case 'conversation': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'note': return <MessageCircle className="w-4 h-4 text-green-500" />;
      default: return <Heart className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  // Get relationship type color
  const getRelationshipTypeColor = (type: Relationship['type']) => {
    switch (type) {
      case 'family': return 'bg-blue-100 text-blue-700';
      case 'friend': return 'bg-green-100 text-green-700';
      case 'partner': return 'bg-pink-100 text-pink-700';
      case 'colleague': return 'bg-theme-tertiary text-theme-secondary';
      default: return 'bg-theme-tertiary text-theme-secondary';
    }
  };

  if (relationshipStories.length === 0) {
    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary mb-2">No relationships tracked yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Add stories with people or #relationship tags to nurture your connections</p>
            <button
              onClick={() => setCurrentView({ type: 'add-story' })}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Add Relationship Memory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Relationship Tracker</h2>
        <button
          onClick={() => setCurrentView({ type: 'add-story' })}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add Memory
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'family', 'friend', 'partner', 'colleague'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-md transition-colors capitalize ${selectedType === type
                ? 'bg-primary-600 text-white'
                : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary'
              }`}
          >
            {type === 'all' ? 'All' : type}s ({type === 'all' ? relationships.length : relationships.filter(r => r.type === type).length})
          </button>
        ))}
      </div>

      {/* Nurture Reminders */}
      {relationships.some(r => r.nextReminder) && (
        <div className="mb-6 p-4 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Nurture Reminders</h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {relationships.filter(r => r.nextReminder).length} relationship(s) need attention
          </p>
        </div>
      )}

      {/* Relationship Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredRelationships.map(relationship => (
          <div key={relationship.name} className="bg-theme-tertiary rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-theme-primary">{relationship.name}</h4>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRelationshipTypeColor(relationship.type)}`}>
                  {relationship.type}
                </span>
              </div>
              {relationship.nextReminder && (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-tertiary">Memories:</span>
                <span className="font-medium">{relationship.totalMemories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-tertiary">Last contact:</span>
                <span className="font-medium">{format(relationship.lastContact, 'MMM d')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-tertiary">Days since:</span>
                <span className={`font-medium ${differenceInDays(new Date(), relationship.lastContact) > 30 ? 'text-red-600' : 'text-theme-primary'}`}>
                  {differenceInDays(new Date(), relationship.lastContact)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Relationship Events */}
      <div>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Recent Memories</h3>

        <div className="space-y-4">
          {relationshipEvents.slice(0, 10).map(event => (
            <div key={event.id} className="flex items-start gap-4 p-4 bg-theme-tertiary rounded-lg hover:bg-theme-secondary transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center shadow-sm">
                {getEventIcon(event.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-theme-primary">{event.title}</h4>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {format(event.date, 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-theme-tertiary mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.person}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getRelationshipTypeColor(event.relationshipType as Relationship['type'])}`}>
                    {event.relationshipType}
                  </span>
                </div>

                <p className="text-theme-secondary text-sm">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
