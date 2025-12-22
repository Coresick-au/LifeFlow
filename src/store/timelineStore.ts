import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TimelineState, Story, UserProfile, TimelineView, Relationship, ManagedTag, Thought, TodoItem } from '../types';
import { Dexie } from 'dexie';
import { generateExtendedSampleData, seedProfile } from '../data/generateSampleData';
import { generateSampleRelationships } from '../data/generateSampleRelationships';
import type { StateCreator } from 'zustand';

interface Preference {
  id: string;
  item: string;
  category: string;
  type: 'like' | 'dislike';
  dateAdded: Date;
}

export interface WealthItem {
  id: string;
  category: 'savings' | 'investment' | 'business' | 'superannuation' | 'debt' | 'other';
  name: string;
  value: number; // Positive for assets, negative for debts
  isLiquid: boolean;
  lastUpdated: Date;
}

// Initialize IndexedDB
const db = new Dexie('LifeFlowDB');
db.version(3).stores({
  stories: '++id, title, content, type, date, endDate, fuzzyDate, tags, people, importance, mood, location, images, createdAt, updatedAt',
  thoughts: '++id, content, type, createdAt, tags, mood',
  todos: '++id, title, description, status, priority, createdAt, completedAt, archivedAt, tags, dueDate',
  userProfile: '++id, name, birthDate, location, bio',
  preferences: '++id, item, category, type, dateAdded',
  relationships: '++id, firstName, lastName, fullName, relationshipType, interactionCount, notes, createdAt, updatedAt',
  managedTags: '++id, name, category, color, createdAt',
  wealthItems: '++id, category, name, value, isLiquid, lastUpdated',
});

// Export the database instance for use in other modules
export { db };

// Export sample data generators
export { generateExtendedSampleData, generateSampleRelationships };

type TimelineStore = TimelineState & {
  // Preferences state
  preferences: Preference[];
  // Wealth state
  wealthItems: WealthItem[];
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  // Actions
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStory: (id: string, updates: Partial<Story>) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  setCurrentView: (view: TimelineView) => void;
  loadStories: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  addPreference: (preference: Omit<Preference, 'id' | 'dateAdded'>) => Promise<void>;
  removePreference: (id: string) => Promise<void>;
  // Relationship methods
  loadRelationships: () => Promise<void>;
  addRelationship: (relationship: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt' | 'interactionCount'>) => Promise<void>;
  updateRelationship: (id: string, updates: Partial<Relationship>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;
  incrementRelationshipInteraction: (id: string) => Promise<void>;
  // Thought methods
  loadThoughts: () => Promise<void>;
  addThought: (thought: Omit<Thought, 'id'>) => Promise<void>;
  updateThought: (id: string, updates: Partial<Thought>) => Promise<void>;
  deleteThought: (id: string) => Promise<void>;
  // Todo methods
  loadTodos: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  completeTodo: (id: string) => Promise<void>;
  archiveTodo: (id: string) => Promise<void>;
  // Managed tags methods
  loadManagedTags: () => Promise<void>;
  addManagedTag: (tag: Omit<ManagedTag, 'id' | 'createdAt'>) => Promise<void>;
  updateManagedTag: (id: string, updates: Partial<ManagedTag>) => Promise<void>;
  deleteManagedTag: (id: string) => Promise<void>;
  // Wealth methods
  loadWealthItems: () => Promise<void>;
  addWealthItem: (item: Omit<WealthItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateWealthItem: (id: string, updates: Partial<WealthItem>) => Promise<void>;
  removeWealthItem: (id: string) => Promise<void>;
  // Computed wealth getters
  getTotalNetWorth: () => number;
  getLiquidAssets: () => number;
  getTotalDebt: () => number;
  getSuperannuation: () => number;
  // Seed data
  seedData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  // Backup/Restore
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
};

const initialView: TimelineView = {
  type: 'timeline',
};

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      stories: [],
      thoughts: [],
      todos: [],
      userProfile: null,
      preferences: [],
      relationships: [],
      managedTags: [],
      wealthItems: [],
      currentView: initialView,
      isLoading: false,
      isSaving: false,
      error: null,

      // Actions
      addStory: async (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newStory: Story = {
            ...storyData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.table('stories').add(newStory);

          set((state: TimelineStore) => ({
            stories: [...state.stories, newStory].sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to add story', isLoading: false });
        }
      },

      updateStory: async (id: string, updates: Partial<Story>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedStory = {
            ...updates,
            updatedAt: new Date(),
          };

          await db.table('stories').update(id, updatedStory);

          set((state: TimelineStore) => ({
            stories: state.stories.map((story: Story) =>
              story.id === id ? { ...story, ...updatedStory } : story
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to update story', isLoading: false });
        }
      },

      deleteStory: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.table('stories').delete(id);

          set((state: TimelineStore) => ({
            stories: state.stories.filter((story: Story) => story.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to delete story', isLoading: false });
        }
      },

      setUserProfile: async (profile: UserProfile) => {
        set({ isLoading: true, error: null });
        try {
          // Convert Date to string for localStorage serialization
          const serializableProfile = {
            ...profile,
            birthDate: profile.birthDate.toISOString(),
          };
          set({ userProfile: serializableProfile as unknown as UserProfile, isLoading: false });
          console.log('Profile saved to store:', serializableProfile);
        } catch (error) {
          set({ error: 'Failed to save profile', isLoading: false });
        }
      },

      setCurrentView: (view: TimelineView) => {
        set({ currentView: view });
      },

      loadStories: async () => {
        set({ isLoading: true, error: null });
        try {
          const stories = await db.table('stories').toArray();
          console.log('Raw stories from IndexedDB:', stories.length, stories);
          // Convert strings back to Date objects
          const hydratedStories = stories.map(s => ({
            ...s,
            date: new Date(s.date),
            endDate: s.endDate ? new Date(s.endDate) : undefined,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt)
          }));
          console.log('Hydrated stories:', hydratedStories.length);
          set({ stories: hydratedStories, isLoading: false });
        } catch (error) {
          console.error('Failed to load stories:', error);
          set({ error: 'Failed to load stories', isLoading: false });
        }
      },

      loadUserProfile: async () => {
        // Profile is now loaded from localStorage via persist middleware
        // This function is kept for compatibility but no longer needed
        console.log('Profile loading from localStorage via persist');
      },

      loadPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const preferences = await db.table('preferences').toArray();
          set({ preferences, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load preferences', isLoading: false });
        }
      },

      addPreference: async (preferenceData: Omit<Preference, 'id' | 'dateAdded'>) => {
        set({ isSaving: true, error: null });
        try {
          const newPreference: Preference = {
            ...preferenceData,
            id: crypto.randomUUID(),
            dateAdded: new Date(),
          };

          await db.table('preferences').add(newPreference);

          const currentPreferences = get().preferences;
          set({
            preferences: [...currentPreferences, newPreference],
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add preference', isSaving: false });
        }
      },

      removePreference: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('preferences').delete(id);

          const currentPreferences = get().preferences;
          set({
            preferences: currentPreferences.filter(p => p.id !== id),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to remove preference', isSaving: false });
        }
      },

      // Thought methods
      loadThoughts: async () => {
        set({ isLoading: true, error: null });
        try {
          const thoughts = await db.table('thoughts').toArray();
          // Convert strings back to Date objects
          const hydratedThoughts = thoughts.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt)
          }));
          set({ thoughts: hydratedThoughts, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load thoughts', isLoading: false });
        }
      },

      addThought: async (thoughtData: Omit<Thought, 'id'>) => {
        set({ isSaving: true, error: null });
        try {
          const newThought: Thought = {
            ...thoughtData,
            id: crypto.randomUUID(),
          };

          await db.table('thoughts').add(newThought);

          const currentThoughts = get().thoughts;
          set({
            thoughts: [newThought, ...currentThoughts].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add thought', isSaving: false });
        }
      },

      updateThought: async (id: string, updates: Partial<Thought>) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('thoughts').update(id, updates);

          const currentThoughts = get().thoughts;
          set({
            thoughts: currentThoughts.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to update thought', isSaving: false });
        }
      },

      deleteThought: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('thoughts').delete(id);

          const currentThoughts = get().thoughts;
          set({
            thoughts: currentThoughts.filter(t => t.id !== id),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to delete thought', isSaving: false });
        }
      },

      // Todo methods
      loadTodos: async () => {
        set({ isLoading: true, error: null });
        try {
          const todos = await db.table('todos').toArray();
          // Convert strings back to Date objects
          const hydratedTodos = todos.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            archivedAt: t.archivedAt ? new Date(t.archivedAt) : undefined,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined
          }));
          set({ todos: hydratedTodos, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load todos', isLoading: false });
        }
      },

      addTodo: async (todoData: Omit<TodoItem, 'id'>) => {
        set({ isSaving: true, error: null });
        try {
          const newTodo: TodoItem = {
            ...todoData,
            id: crypto.randomUUID(),
          };

          await db.table('todos').add(newTodo);

          const currentTodos = get().todos;
          set({
            todos: [newTodo, ...currentTodos].sort((a, b) => {
              // Sort by priority first, then by creation date
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add todo', isSaving: false });
        }
      },

      updateTodo: async (id: string, updates: Partial<TodoItem>) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('todos').update(id, updates);

          const currentTodos = get().todos;
          set({
            todos: currentTodos.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to update todo', isSaving: false });
        }
      },

      deleteTodo: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('todos').delete(id);

          const currentTodos = get().todos;
          set({
            todos: currentTodos.filter(t => t.id !== id),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to delete todo', isSaving: false });
        }
      },

      completeTodo: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('todos').update(id, {
            status: 'completed',
            completedAt: new Date()
          });

          const currentTodos = get().todos;
          set({
            todos: currentTodos.map(t =>
              t.id === id ? { ...t, status: 'completed' as const, completedAt: new Date() } : t
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to complete todo', isSaving: false });
        }
      },

      archiveTodo: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('todos').update(id, {
            status: 'archived',
            archivedAt: new Date()
          });

          const currentTodos = get().todos;
          set({
            todos: currentTodos.map(t =>
              t.id === id ? { ...t, status: 'archived' as const, archivedAt: new Date() } : t
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to archive todo', isSaving: false });
        }
      },

      seedData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Clear existing stories
          await db.table('stories').clear();
          await db.table('relationships').clear();

          // Add seed profile to localStorage via persist (convert Date to string)
          const serializableProfile = {
            ...seedProfile,
            birthDate: seedProfile.birthDate.toISOString(),
          };
          set({ userProfile: serializableProfile as unknown as UserProfile });

          // Generate extended sample data
          const generatedStories = generateExtendedSampleData();
          const generatedRelationships = generateSampleRelationships();

          await db.table('stories').bulkAdd(generatedStories);
          await db.table('relationships').bulkAdd(generatedRelationships);

          // Update store state
          set({
            stories: generatedStories,
            relationships: generatedRelationships,
            isLoading: false
          });
        } catch (error) {
          set({ error: 'Failed to seed data', isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setSaving: (saving: boolean) => set({ isSaving: saving }),

      // Export all data as JSON
      exportData: async () => {
        const stories = await db.table('stories').toArray();
        const userProfile = await db.table('userProfile').toArray();
        const relationships = await db.table('relationships').toArray();
        const managedTags = await db.table('managedTags').toArray();
        const preferences = await db.table('preferences').toArray();

        const exportData = {
          stories,
          userProfile,
          relationships,
          managedTags,
          preferences,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        return JSON.stringify(exportData, null, 2);
      },

      // Import data from JSON
      importData: async (jsonData: string) => {
        try {
          const importData = JSON.parse(jsonData);

          // Clear existing data
          await db.table('stories').clear();
          await db.table('userProfile').clear();
          await db.table('relationships').clear();
          await db.table('managedTags').clear();
          await db.table('preferences').clear();

          // Import new data
          if (importData.stories) {
            await db.table('stories').bulkAdd(importData.stories);
          }
          if (importData.userProfile) {
            await db.table('userProfile').bulkAdd(importData.userProfile);
          }
          if (importData.relationships) {
            await db.table('relationships').bulkAdd(importData.relationships);
          }
          if (importData.managedTags) {
            await db.table('managedTags').bulkAdd(importData.managedTags);
          }
          if (importData.preferences) {
            await db.table('preferences').bulkAdd(importData.preferences);
          }

          // Reload all data
          await get().loadStories();
          await get().loadUserProfile();
          await get().loadRelationships();
          await get().loadManagedTags();
          await get().loadPreferences();

        } catch (error) {
          throw new Error('Failed to import data: ' + (error as Error).message);
        }
      },

      // Relationship methods
      loadRelationships: async () => {
        set({ isLoading: true, error: null });
        try {
          const relationships = await db.table('relationships').toArray();
          set({ relationships, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load relationships', isLoading: false });
        }
      },

      addRelationship: async (relationshipData: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt' | 'interactionCount'>) => {
        set({ isSaving: true, error: null });
        try {
          const newRelationship: Relationship = {
            ...relationshipData,
            id: crypto.randomUUID(),
            interactionCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.table('relationships').add(newRelationship);

          const currentRelationships = get().relationships;
          set({
            relationships: [...currentRelationships, newRelationship],
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add relationship', isSaving: false });
        }
      },

      updateRelationship: async (id: string, updates: Partial<Relationship>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedRelationship = {
            ...updates,
            updatedAt: new Date(),
          };

          await db.table('relationships').update(id, updatedRelationship);

          set((state: TimelineStore) => ({
            relationships: state.relationships.map((relationship: Relationship) =>
              relationship.id === id ? { ...relationship, ...updatedRelationship } : relationship
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to update relationship', isLoading: false });
        }
      },

      deleteRelationship: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.table('relationships').delete(id);

          set((state: TimelineStore) => ({
            relationships: state.relationships.filter((relationship: Relationship) => relationship.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to delete relationship', isLoading: false });
        }
      },

      incrementRelationshipInteraction: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const relationship = await db.table('relationships').get(id);
          if (relationship) {
            const updatedRelationship = {
              ...relationship,
              interactionCount: relationship.interactionCount + 1,
              updatedAt: new Date(),
            };

            await db.table('relationships').update(id, updatedRelationship);

            set((state: TimelineStore) => ({
              relationships: state.relationships.map((r: Relationship) =>
                r.id === id ? updatedRelationship : r
              ),
              isLoading: false,
            }));
          }
        } catch (error) {
          set({ error: 'Failed to increment interaction', isLoading: false });
        }
      },

      // Managed tags methods
      loadManagedTags: async () => {
        set({ isLoading: true, error: null });
        try {
          const managedTags = await db.table('managedTags').toArray();
          set({ managedTags, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load managed tags', isLoading: false });
        }
      },

      addManagedTag: async (tagData: Omit<ManagedTag, 'id' | 'createdAt'>) => {
        set({ isSaving: true, error: null });
        try {
          const newTag: ManagedTag = {
            ...tagData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };

          await db.table('managedTags').add(newTag);

          const currentTags = get().managedTags;
          set({
            managedTags: [...currentTags, newTag],
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add managed tag', isSaving: false });
        }
      },

      updateManagedTag: async (id: string, updates: Partial<ManagedTag>) => {
        set({ isLoading: true, error: null });
        try {
          await db.table('managedTags').update(id, updates);

          set((state: TimelineStore) => ({
            managedTags: state.managedTags.map((tag: ManagedTag) =>
              tag.id === id ? { ...tag, ...updates } : tag
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to update managed tag', isLoading: false });
        }
      },

      deleteManagedTag: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.table('managedTags').delete(id);

          set((state: TimelineStore) => ({
            managedTags: state.managedTags.filter((tag: ManagedTag) => tag.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to delete managed tag', isLoading: false });
        }
      },

      // Wealth methods
      loadWealthItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const wealthItems = await db.table('wealthItems').toArray();
          // Convert strings back to Date objects
          const hydratedWealthItems = wealthItems.map(w => ({
            ...w,
            lastUpdated: new Date(w.lastUpdated)
          }));
          set({ wealthItems: hydratedWealthItems, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load wealth items', isLoading: false });
        }
      },

      addWealthItem: async (itemData: Omit<WealthItem, 'id' | 'lastUpdated'>) => {
        set({ isSaving: true, error: null });
        try {
          const newItem: WealthItem = {
            ...itemData,
            id: crypto.randomUUID(),
            lastUpdated: new Date(),
          };

          await db.table('wealthItems').add(newItem);

          const currentItems = get().wealthItems;
          set({
            wealthItems: [...currentItems, newItem],
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to add wealth item', isSaving: false });
        }
      },

      updateWealthItem: async (id: string, updates: Partial<WealthItem>) => {
        set({ isSaving: true, error: null });
        try {
          const updatedItem = {
            ...updates,
            lastUpdated: new Date(),
          };

          await db.table('wealthItems').update(id, updatedItem);

          const currentItems = get().wealthItems;
          set({
            wealthItems: currentItems.map(item =>
              item.id === id ? { ...item, ...updatedItem } : item
            ),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to update wealth item', isSaving: false });
        }
      },

      removeWealthItem: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          await db.table('wealthItems').delete(id);

          const currentItems = get().wealthItems;
          set({
            wealthItems: currentItems.filter(item => item.id !== id),
            isSaving: false
          });
        } catch (error) {
          set({ error: 'Failed to remove wealth item', isSaving: false });
        }
      },

      // Computed wealth getters
      getTotalNetWorth: () => {
        const items = get().wealthItems;
        return items.reduce((total, item) => {
          // Debt category items should be negative
          if (item.category === 'debt') {
            return total - Math.abs(item.value);
          }
          return total + item.value;
        }, 0);
      },

      getLiquidAssets: () => {
        const items = get().wealthItems;
        return items
          .filter(item => item.isLiquid && item.category !== 'debt')
          .reduce((total, item) => total + item.value, 0);
      },

      getTotalDebt: () => {
        const items = get().wealthItems;
        return items
          .filter(item => item.category === 'debt')
          .reduce((total, item) => total + Math.abs(item.value), 0);
      },

      getSuperannuation: () => {
        const items = get().wealthItems;
        return items
          .filter(item => item.category === 'superannuation')
          .reduce((total, item) => total + item.value, 0);
      },
    }),
    {
      name: 'lifeflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: TimelineStore) => ({
        currentView: state.currentView,
        userProfile: state.userProfile ? {
          ...state.userProfile,
          birthDate: state.userProfile.birthDate instanceof Date
            ? state.userProfile.birthDate.toISOString()
            : state.userProfile.birthDate,
        } : null,
        // Don't persist stories as they're in IndexedDB
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Persist rehydrating state');
        if (state) {
          if (state.userProfile?.birthDate) {
            // Convert string back to Date
            state.userProfile.birthDate = new Date(state.userProfile.birthDate);
          }
          // Don't process stories on rehydration - they come from IndexedDB
          state.stories = [];
          state.thoughts = [];
          state.todos = [];
        }
      },
    }
  )
);
