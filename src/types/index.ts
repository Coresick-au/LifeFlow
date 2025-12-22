export interface Thought {
  id: string;
  content: string;
  type: 'idea' | 'observation' | 'pondering' | 'note';
  createdAt: Date;
  tags?: string[];
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'proud' | 'grateful';
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
  tags?: string[];
  dueDate?: Date;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  type: 'short' | 'long';
  date: Date;
  endDate?: Date;
  fuzzyDate?: boolean;
  tags: string[];
  people: string[];
  importance: 'low' | 'medium' | 'high';
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'proud' | 'grateful';
  location?: string;
  images?: string[];
  metadata?: Record<string, any>;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  birthDate: Date;
  location?: string;
  bio?: string;
  avatar?: string;
}

export type TimelineView =
  | { type: 'timeline' }
  | { type: 'bubble' }
  | { type: 'calendar' }
  | { type: 'add-story' }
  | { type: 'edit-story'; storyId: string }
  | { type: 'profile' }
  | { type: 'settings' }
  | { type: 'event-heatmap' }
  | { type: 'gantt-timeline' }
  | { type: 'on-this-day' }
  | { type: 'relationships' }
  | { type: 'location-map' }
  | { type: 'likes-dislikes' }
  | { type: 'life-dashboard' }
  | { type: 'job-tracker' }
  | { type: 'child-tracker' }
  | { type: 'home-tracker' }
  | { type: 'relationship-tracker' }
  | { type: 'thoughts' }
  | { type: 'add-thought' }
  | { type: 'edit-thought'; thoughtId: string }
  | { type: 'todos' }
  | { type: 'wealth-tracker' }
  | { type: 'experimental' };

export interface HistoricalQuestion {
  id: string;
  question: string;
  context: {
    decade: number;
    ageRange: [number, number];
    event?: string;
    category: 'music' | 'technology' | 'world-events' | 'culture' | 'personal';
  };
  triggerDate: Date;
}

export interface Relationship {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  relationshipType: string;
  interactionCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManagedTag {
  id: string;
  name: string;
  category: string;
  color: string;
  createdAt: Date;
}

export interface TimelineState {
  stories: Story[];
  thoughts: Thought[];
  todos: TodoItem[];
  userProfile: UserProfile | null;
  relationships: Relationship[];
  managedTags: ManagedTag[];
  currentView: TimelineView;
  isLoading: boolean;
  error: string | null;
}
