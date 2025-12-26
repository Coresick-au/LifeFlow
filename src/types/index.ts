export interface Thought {
  id: string;
  content: string;
  type: 'idea' | 'observation' | 'pondering' | 'note';
  createdAt: Date;
  tags?: string[];
  relatedStoryId?: string; // Link to a Story for context
  isPrivate?: boolean; // For PDF export filtering
}

export interface Advice {
  id: string;
  content: string;
  category: 'life' | 'career' | 'financial' | 'relationships' | 'health';
  source?: string;
  createdAt: Date;
  tags?: string[];
  isActioned?: boolean; // Track if advice has been applied
  appliedDate?: Date; // When advice was applied
  difficulty?: 'easy' | 'medium' | 'hard'; // Help prioritize implementation
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
  location?: string;
  images?: string[];
  metadata?: Record<string, any>;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  role: 'parent' | 'sibling' | 'partner' | 'child';
  name: string;
  birthDate?: Date;
  isLiving: boolean;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  birthDate: Date;
  birthLocation?: string;
  location?: string;
  hometown?: string;
  bio?: string;
  avatar?: string;
  birthPhoto?: string; // Baby photo for the "I Was Born" timeline card
  family?: FamilyMember[];
  bloodType?: string;
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
  | { type: 'experimental' }
  | { type: 'advice' };

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
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  interactionCount: number;
  notes?: string;
  metDate?: Date;         // When you first met
  metDateFuzzy?: boolean; // Is the met date approximate?
  yearsKnown?: number;    // Alternative: estimate how long you've known them
  trackNurturing?: boolean; // Whether to track this relationship for nurture reminders (default: true)
  needsDetails?: boolean; // Quick-added person that needs more info
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

export interface Preference {
  id: string;
  item: string;
  category: string;
  type: 'like' | 'dislike';
  dateAdded: Date;
}

export interface WealthItem {
  id: string;
  category: 'savings' | 'investment' | 'business' | 'superannuation' | 'debt' | 'real-estate' | 'other';
  name: string;
  value: number; // For real estate, this is the current market value
  isLiquid: boolean;
  lastUpdated: Date;
  // Advanced fields for detailed tracking
  loanAmount?: number;     // The debt associated with this specific asset (e.g., mortgage)
  interestRate?: number;   // Annual interest rate as percentage (e.g., 5.5)
  repaymentAmount?: number; // Regular repayment amount
  repaymentFrequency?: 'weekly' | 'fortnightly' | 'monthly';
  estimatedGrowth?: number; // Expected annual appreciation % (e.g., 3.5)
  isPrimaryResidence?: boolean; // Tax-free if primary residence
  purchasePrice?: number;  // Original purchase price
  purchaseDate?: Date;     // When the asset was purchased
  propertyType?: 'primary' | 'investment' | 'commercial'; // For real estate categorization
  // Debt classification for accurate D/V ratios
  debtType?: 'productive' | 'destructive' | 'neutral'; // productive = mortgages/business loans, destructive = credit cards/personal loans
}

export interface WealthHistoryEntry {
  id: string;
  wealthItemId: string;
  wealthItemName: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  timestamp: Date;
  note?: string;
}

export interface YearlyIncome {
  id: string;
  year: number; // Financial year ending (e.g., 2024 for 2023-24)
  employer: string;
  baseSalary: number;    // Contracted rate
  totalEarnings: number; // Actual with OT/Bonuses
  role: string;
  isVerifiedByTaxReturn: boolean;
  superAmount?: number;  // Reportable super
}

export interface TimelineState {
  stories: Story[];
  thoughts: Thought[];
  todos: TodoItem[];
  userProfile: UserProfile | null;
  relationships: Relationship[];
  managedTags: ManagedTag[];
  yearlyIncomes: YearlyIncome[];
  wealthItems: WealthItem[];
  wealthHistory: WealthHistoryEntry[];
  advice: Advice[];
  currentView: TimelineView;
  activeStoryId: string | null; // Modal pattern: story being viewed
  isLoading: boolean;
  error: string | null;
  isSaving: boolean; // Add saving state for UI feedback
}
