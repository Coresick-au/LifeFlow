import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Heart, Calendar, MessageCircle, Gift, Users, Edit2, ArrowRight } from 'lucide-react';

interface RelationshipEvent {
  id: string;
  person: string;
  title: string;
  date: Date;
  type: 'milestone' | 'memory' | 'note' | 'gift' | 'conversation' | 'start' | 'end';
  description: string;
  relationshipType: string;
}

export const RelationshipTracker: React.FC = () => {
  const { stories, relationships } = useTimelineStore(); // Import relationships
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter: ONLY show stories for people who exist in your Connections list
  const relationshipStories = useMemo(() => {
    if (!relationships || relationships.length === 0) return [];

    // Create a lookup set of normalized names from your Connections
    const connectionNames = new Set(relationships.map(r => r.fullName.toLowerCase()));

    return stories.filter(story =>
      // The story must involve at least one person from your Connections list
      story.people.some(person => connectionNames.has(person.toLowerCase()))
    );
  }, [stories, relationships]);

  // Process events from the filtered stories
  const relationshipEvents = useMemo(() => {
    const events: RelationshipEvent[] = [];

    relationshipStories.forEach(story => {
      // Find which person from connections is in this story
      const personName = story.people.find(p =>
        relationships.some(r => r.fullName.toLowerCase() === p.toLowerCase())
      );

      if (!personName) return; // Should not happen given filter above

      const connection = relationships.find(r => r.fullName.toLowerCase() === personName.toLowerCase());

      // Determine event type - check for start/end first
      let type: RelationshipEvent['type'] = 'memory';
      if (story.tags.some(t => t.toLowerCase() === 'start')) {
        type = 'start';
      } else if (story.tags.some(t => t.toLowerCase() === 'end')) {
        type = 'end';
      } else if (story.tags.some(t => ['milestone', 'anniversary', 'wedding', 'engaged'].includes(t.toLowerCase()))) {
        type = 'milestone';
      } else if (story.tags.some(t => ['gift', 'present'].includes(t.toLowerCase()))) {
        type = 'gift';
      } else if (story.tags.some(t => ['conversation', 'talk'].includes(t.toLowerCase()))) {
        type = 'conversation';
      } else if (story.tags.some(t => ['note', 'message'].includes(t.toLowerCase()))) {
        type = 'note';
      }

      events.push({
        id: story.id,
        person: personName,
        title: story.title,
        date: new Date(story.date),
        type,
        description: story.content,
        relationshipType: connection?.relationshipType || 'Friend',
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [relationshipStories, relationships]);

  // Calculate stats based on the Connections data + Stories
  const relationshipStats = useMemo(() => {
    return relationships.map(rel => {
      // Find stories for this specific person
      const personStories = relationshipStories.filter(s =>
        s.people.some(p => p.toLowerCase() === rel.fullName.toLowerCase())
      );

      // Find last contact date from stories
      let lastContact = rel.updatedAt ? new Date(rel.updatedAt) : new Date();
      if (personStories.length > 0) {
        const sorted = [...personStories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastContact = new Date(sorted[0].date);
      }

      return {
        ...rel,
        lastContact,
        totalMemories: personStories.length
      };
    });
  }, [relationships, relationshipStories]);

  // Filter displayed relationships based on tab selection
  const filteredStats = useMemo(() => {
    if (selectedType === 'all') return relationshipStats;
    // Simple mapping to group types (e.g. "Brother" -> "Family") if needed, 
    // or just match strictly if your types are consistent.
    return relationshipStats.filter(r => r.relationshipType.toLowerCase().includes(selectedType.toLowerCase()));
  }, [relationshipStats, selectedType]);

  const getEventIcon = (type: RelationshipEvent['type']) => {
    switch (type) {
      case 'start': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'end': return <Heart className="w-4 h-4 text-gray-400" style={{ opacity: 0.6 }} />;
      case 'milestone': return <Heart className="w-4 h-4 text-red-500" />;
      case 'gift': return <Gift className="w-4 h-4 text-purple-500" />;
      case 'conversation': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'note': return <MessageCircle className="w-4 h-4 text-green-500" />;
      default: return <Heart className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('family')) return 'bg-blue-100 text-blue-700';
    if (t.includes('friend')) return 'bg-green-100 text-green-700';
    if (t.includes('partner') || t.includes('spouse')) return 'bg-pink-100 text-pink-700';
    if (t.includes('work') || t.includes('colleague')) return 'bg-amber-100 text-amber-700';
    return 'bg-theme-tertiary text-theme-secondary';
  };

  if (relationships.length === 0) {
    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary mb-2">No Connections Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add people in the "Connections" tab to see insights here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
            Heart Stats
          </h2>
          <p className="text-sm text-theme-secondary">Visualizing memories with your connections</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'family', 'friend', 'partner', 'colleague'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize whitespace-nowrap ${selectedType === type
              ? 'bg-pink-500 text-white'
              : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary'
              }`}
          >
            {type === 'all' ? 'All' : type}s
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredStats.map(stat => (
          <div key={stat.id} className="bg-theme-tertiary rounded-xl p-4 border border-theme hover:border-pink-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-theme-primary text-lg">{stat.fullName}</h4>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRelationshipTypeColor(stat.relationshipType)}`}>
                  {stat.relationshipType}
                </span>
              </div>
              {stat.isCurrent ? (
                <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active Connection" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-gray-400" title="Past Connection" />
              )}
            </div>

            <div className="space-y-2 text-sm mt-4">
              <div className="flex justify-between items-center p-2 bg-theme-primary rounded-lg">
                <span className="text-theme-secondary flex items-center gap-2">
                  <Heart className="w-3 h-3" /> Memories
                </span>
                <span className="font-bold text-theme-primary">{stat.totalMemories}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-theme-primary rounded-lg">
                <span className="text-theme-secondary flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Last Memory
                </span>
                <span className="font-medium text-theme-primary">
                  {stat.totalMemories > 0 ? format(stat.lastContact, 'MMM d, yyyy') : 'None yet'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Timeline of Love/Connection */}
      <div>
        <h3 className="text-lg font-bold text-theme-primary mb-4 border-b border-theme pb-2">Recent Moments</h3>

        <div className="space-y-4">
          {relationshipEvents.length > 0 ? (
            relationshipEvents.slice(0, 10).map(event => (
              <div key={event.id} className="flex items-start gap-4 p-4 bg-theme-tertiary/50 rounded-xl border border-theme hover:bg-theme-tertiary transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm border border-theme">
                  {getEventIcon(event.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-theme-primary">{event.title}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {format(event.date, 'MMM d')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-pink-600 dark:text-pink-400 mb-2">
                    <span className="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-md">
                      <Users className="w-3 h-3" />
                      {event.person}
                    </span>
                  </div>

                  <p className="text-theme-secondary text-sm leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-theme-tertiary italic">
              No memories recorded for these connections yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
