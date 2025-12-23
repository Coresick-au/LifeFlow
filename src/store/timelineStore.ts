import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TimelineState, Story, UserProfile, TimelineView, Relationship,
  ManagedTag, Thought, TodoItem, Advice, Preference, WealthItem,
  WealthHistoryEntry
} from '../types';
import { Dexie } from 'dexie';
import * as supabaseService from '../services/supabaseService';
import { supabase } from '../lib/supabaseClient';

// Initialize IndexedDB
const db = new Dexie('LifeFlowDB');
db.version(6).stores({
  stories: '++id, title, content, type, date, endDate, fuzzyDate, tags, people, importance, location, images, createdAt, updatedAt',
  thoughts: '++id, content, type, createdAt, tags',
  todos: '++id, title, description, status, priority, createdAt, completedAt, archivedAt, tags, dueDate',
  userProfile: '++id, name, birthDate, location, bio',
  preferences: '++id, item, category, type, dateAdded',
  relationships: '++id, firstName, lastName, fullName, relationshipType, interactionCount, notes, createdAt, updatedAt',
  managedTags: '++id, name, category, color, createdAt',
  wealthItems: '++id, category, name, value, isLiquid, lastUpdated',
  advice: '++id, content, category, source, createdAt, tags',
  wealthHistory: '++id, wealthItemId, wealthItemName, previousValue, newValue, changeAmount, timestamp, note',
});

// Export the database instance for use in other modules
export { db };

type TimelineStore = TimelineState & {
  // Preferences state
  preferences: Preference[];
  // Wealth state
  wealthItems: WealthItem[];
  wealthHistory: WealthHistoryEntry[];
  // Advice state
  advice: Advice[];
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  // Actions
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStory: (id: string, updates: Partial<Story>) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  setCurrentView: (view: TimelineView) => void;
  setActiveStory: (storyId: string | null) => void; // Modal pattern for story viewer
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
  updateWealthItem: (id: string, updates: Partial<WealthItem>, note?: string) => Promise<void>;
  removeWealthItem: (id: string) => Promise<void>;
  // Wealth history methods
  loadWealthHistory: () => Promise<void>;
  getWealthItemHistory: (wealthItemId: string) => WealthHistoryEntry[];
  // Computed wealth getters
  getTotalNetWorth: () => number;
  getLiquidAssets: () => number;
  getTotalDebt: () => number;
  getSuperannuation: () => number;
  // Seed data
  clearAllData: () => Promise<void>;
  // Advice methods
  loadAdvice: () => Promise<void>;
  addAdvice: (advice: Omit<Advice, 'id'>) => Promise<void>;
  updateAdvice: (id: string, updates: Partial<Advice>) => Promise<void>;
  deleteAdvice: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  // Backup/Restore
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
  syncLocalToCloud: () => Promise<{ success: boolean; message: string }>;
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
      wealthHistory: [],
      advice: [],
      currentView: initialView,
      activeStoryId: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // Actions
      addStory: async (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newStory: Story;

          if (user && navigator.onLine) {
            const cloudStory = await supabaseService.addStory(user.id, storyData);
            if (cloudStory) {
              newStory = cloudStory;
            } else {
              throw new Error('Failed to add story to cloud');
            }
          } else {
            newStory = {
              ...storyData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          // Always add to local Dexie for offline support
          await db.table('stories').put(newStory);

          set((state: TimelineStore) => ({
            stories: [...state.stories, newStory].sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to add story:', error);
          set({ error: 'Failed to add story', isSaving: false });
        }
      },

      updateStory: async (id: string, updates: Partial<Story>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateStory(id, updates);
          }

          const updatedStory = {
            ...updates,
            updatedAt: new Date(),
          };

          await db.table('stories').update(id, updatedStory);

          set((state: TimelineStore) => ({
            stories: state.stories.map((story: Story) =>
              story.id === id ? { ...story, ...updatedStory } : story
            ),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to update story:', error);
          set({ error: 'Failed to update story', isSaving: false });
        }
      },

      deleteStory: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteStory(id);
          }

          await db.table('stories').delete(id);

          set((state: TimelineStore) => ({
            stories: state.stories.filter((story: Story) => story.id !== id),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to delete story:', error);
          set({ error: 'Failed to delete story', isSaving: false });
        }
      },

      setUserProfile: async (profile: UserProfile) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            // CRITICAL: Use the authenticated user's ID for Supabase profile
            // The profile table uses the auth user ID as the primary key
            const cloudProfile = { ...profile, id: user.id };
            await supabaseService.upsertProfile(cloudProfile);
            console.log('[Sync] Profile saved to cloud with user ID:', user.id);
          }

          // Always save to local Dexie for offline support and reliability
          // We use a fixed ID of '1' for the primary user profile in Dexie
          await db.table('userProfile').put({ ...profile, id: '1' });

          // Convert Date to string for localStorage serialization
          const serializableProfile = {
            ...profile,
            birthDate: profile.birthDate instanceof Date ? profile.birthDate.toISOString() : profile.birthDate,
          };
          set({ userProfile: serializableProfile as unknown as UserProfile, isSaving: false });
          console.log('Profile saved to store and DB:', serializableProfile);
        } catch (error) {
          console.error('Failed to save profile:', error);
          set({ error: 'Failed to save profile', isSaving: false });
        }
      },

      setCurrentView: (view: TimelineView) => {
        set({ currentView: view });
      },

      setActiveStory: (storyId: string | null) => {
        set({ activeStoryId: storyId });
      },

      loadStories: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudStories = await supabaseService.getStories(user.id);
            if (cloudStories) {
              // Safety Patch: If cloud is empty but local has data, DO NOT wipe local.
              const localCount = await db.table('stories').count();
              if (cloudStories.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud stories empty, but local has data. Preserving local data.');
                // Do not overwrite local with empty cloud
                // We fall through to load from local
              } else {
                // Trust cloud (it has data, or local is also empty)
                await db.table('stories').clear();
                if (cloudStories.length > 0) {
                  await db.table('stories').bulkPut(cloudStories);
                }
                set({ stories: cloudStories, isLoading: false });
                return;
              }
            }
          }

          const stories = await db.table('stories').toArray();
          // Convert strings back to Date objects
          const hydratedStories = stories.map(s => ({
            ...s,
            date: new Date(s.date),
            endDate: s.endDate ? new Date(s.endDate) : undefined,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt)
          })).sort((a, b) => b.date.getTime() - a.date.getTime());

          set({ stories: hydratedStories, isLoading: false });
        } catch (error) {
          console.error('Failed to load stories:', error);
          set({ error: 'Failed to load stories', isLoading: false });
        }
      },

      loadUserProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudProfile = await supabaseService.getProfile(user.id);
            if (cloudProfile) {
              // Sync to local Dexie
              await db.table('userProfile').put({ ...cloudProfile, id: '1' });
              set({ userProfile: cloudProfile, isLoading: false });
              return;
            } else {
              // Cloud returned null/empty for profile. Check local.
              const localCount = await db.table('userProfile').count();
              if (localCount > 0) {
                console.warn('[Sync Protection] Cloud profile empty, but local has data. Preserving local data.');
                // Fall through to load from local
              }
            }
          }

          // Fallback to Dexie
          const profiles = await db.table('userProfile').toArray();
          if (profiles.length > 0) {
            const profile = profiles[0];
            const hydratedProfile = {
              ...profile,
              birthDate: new Date(profile.birthDate)
            };
            set({ userProfile: hydratedProfile as UserProfile, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ error: 'Failed to load profile', isLoading: false });
        }
      },

      loadPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudPrefs = await supabaseService.getPreferences(user.id);
            if (cloudPrefs) {
              // Safety Patch
              const localCount = await db.table('preferences').count();
              if (cloudPrefs.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud prefs empty, but local has data. Preserving local data.');
              } else {
                await db.table('preferences').clear();
                if (cloudPrefs.length > 0) {
                  await db.table('preferences').bulkPut(cloudPrefs);
                }
                set({ preferences: cloudPrefs, isLoading: false });
                return;
              }
            }
          }

          const preferences = await db.table('preferences').toArray();
          set({ preferences, isLoading: false });
        } catch (error) {
          console.error('Failed to load preferences:', error);
          set({ error: 'Failed to load preferences', isLoading: false });
        }
      },

      addPreference: async (preferenceData: Omit<Preference, 'id' | 'dateAdded'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newPreference: Preference;

          if (user && navigator.onLine) {
            const cloudPref = await supabaseService.addPreference(user.id, preferenceData);
            if (cloudPref) {
              newPreference = cloudPref;
            } else {
              throw new Error('Failed to add preference to cloud');
            }
          } else {
            newPreference = {
              ...preferenceData,
              id: crypto.randomUUID(),
              dateAdded: new Date(),
            };
          }

          await db.table('preferences').put(newPreference);

          set((state: TimelineStore) => ({
            preferences: [...state.preferences, newPreference],
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add preference:', error);
          set({ error: 'Failed to add preference', isSaving: false });
        }
      },

      removePreference: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deletePreference(id);
          }

          await db.table('preferences').delete(id);

          set((state: TimelineStore) => ({
            preferences: state.preferences.filter(p => p.id !== id),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to remove preference:', error);
          set({ error: 'Failed to remove preference', isSaving: false });
        }
      },

      // Thought methods
      loadThoughts: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudThoughts = await supabaseService.getThoughts(user.id);
            if (cloudThoughts) {
              // Safety Patch
              const localCount = await db.table('thoughts').count();
              if (cloudThoughts.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud thoughts empty, but local has data. Preserving local data.');
              } else {
                await db.table('thoughts').clear();
                if (cloudThoughts.length > 0) {
                  await db.table('thoughts').bulkPut(cloudThoughts);
                }
                set({ thoughts: cloudThoughts, isLoading: false });
                return;
              }
            }
          }

          const thoughts = await db.table('thoughts').toArray();
          const hydratedThoughts = thoughts.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt)
          })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          set({ thoughts: hydratedThoughts, isLoading: false });
        } catch (error) {
          console.error('Failed to load thoughts:', error);
          set({ error: 'Failed to load thoughts', isLoading: false });
        }
      },

      addThought: async (thoughtData: Omit<Thought, 'id'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newThought: Thought;

          if (user && navigator.onLine) {
            const cloudThought = await supabaseService.addThought(user.id, thoughtData);
            if (cloudThought) {
              newThought = cloudThought;
            } else {
              throw new Error('Failed to add thought to cloud');
            }
          } else {
            newThought = {
              ...thoughtData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            };
          }

          await db.table('thoughts').put(newThought);

          set((state: TimelineStore) => ({
            thoughts: [newThought, ...state.thoughts].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add thought:', error);
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
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteThought(id);
          }

          await db.table('thoughts').delete(id);

          set((state: TimelineStore) => ({
            thoughts: state.thoughts.filter(t => t.id !== id),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to delete thought:', error);
          set({ error: 'Failed to delete thought', isSaving: false });
        }
      },

      // Todo methods
      loadTodos: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudTodos = await supabaseService.getTodos(user.id);
            if (cloudTodos) {
              // Safety Patch
              const localCount = await db.table('todos').count();
              if (cloudTodos.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud todos empty, but local has data. Preserving local data.');
              } else {
                await db.table('todos').clear();
                if (cloudTodos.length > 0) {
                  await db.table('todos').bulkPut(cloudTodos);
                }
                set({ todos: cloudTodos, isLoading: false });
                return;
              }
            }
          }

          const todos = await db.table('todos').toArray();
          const hydratedTodos = todos.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            archivedAt: t.archivedAt ? new Date(t.archivedAt) : undefined,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          set({ todos: hydratedTodos, isLoading: false });
        } catch (error) {
          console.error('Failed to load todos:', error);
          set({ error: 'Failed to load todos', isLoading: false });
        }
      },

      addTodo: async (todoData: Omit<TodoItem, 'id'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newTodo: TodoItem;

          if (user && navigator.onLine) {
            const cloudTodo = await supabaseService.addTodo(user.id, todoData);
            if (cloudTodo) {
              newTodo = cloudTodo;
            } else {
              throw new Error('Failed to add todo to cloud');
            }
          } else {
            newTodo = {
              ...todoData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            };
          }

          await db.table('todos').put(newTodo);

          set((state: TimelineStore) => ({
            todos: [newTodo, ...state.todos].sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add todo:', error);
          set({ error: 'Failed to add todo', isSaving: false });
        }
      },

      updateTodo: async (id: string, updates: Partial<TodoItem>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateTodo(id, updates);
          }

          await db.table('todos').update(id, updates);

          set((state: TimelineStore) => ({
            todos: state.todos.map(t => t.id === id ? { ...t, ...updates } : t),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to update todo:', error);
          set({ error: 'Failed to update todo', isSaving: false });
        }
      },

      deleteTodo: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteTodo(id);
          }

          await db.table('todos').delete(id);

          set((state: TimelineStore) => ({
            todos: state.todos.filter(t => t.id !== id),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to delete todo:', error);
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



      clearAllData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Clear indexedDB tables
          await Promise.all(db.tables.map(table => table.clear()));

          // Reset store state
          set({
            stories: [],
            thoughts: [],
            todos: [],
            userProfile: null,
            preferences: [],
            relationships: [],
            managedTags: [],
            wealthItems: [],
            advice: [],
            isLoading: false
          });

          // Redirect to timeline
          get().setCurrentView({ type: 'timeline' });
        } catch (error) {
          console.error('Failed to clear data:', error);
          set({ error: 'Failed to clear data', isLoading: false });
        }
      },

      // Advice CRUD methods
      loadAdvice: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudAdvice = await supabaseService.getAdvice(user.id);
            if (cloudAdvice) {
              // Safety Patch
              const localCount = await db.table('advice').count();
              if (cloudAdvice.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud advice empty, but local has data. Preserving local data.');
              } else {
                await db.table('advice').clear();
                if (cloudAdvice.length > 0) {
                  await db.table('advice').bulkPut(cloudAdvice);
                }
                set({ advice: cloudAdvice, isLoading: false });
                return;
              }
            }
          }

          const adviceItems = await db.table('advice').toArray();
          set({ advice: adviceItems, isLoading: false });
        } catch (error) {
          console.error('Failed to load advice:', error);
          set({ error: 'Failed to load advice', isLoading: false });
        }
      },

      addAdvice: async (adviceData: Omit<Advice, 'id'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newAdvice: Advice;

          if (user && navigator.onLine) {
            const cloudAdvice = await supabaseService.addAdvice(user.id, adviceData);
            if (cloudAdvice) {
              newAdvice = cloudAdvice;
            } else {
              throw new Error('Failed to add advice to cloud');
            }
          } else {
            newAdvice = {
              ...adviceData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            };
          }

          await db.table('advice').put(newAdvice);

          set((state: TimelineStore) => ({
            advice: [...state.advice, newAdvice],
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add advice:', error);
          set({ error: 'Failed to add advice', isSaving: false });
        }
      },

      deleteAdvice: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteAdvice(id);
          }

          await db.table('advice').delete(id);

          set((state: TimelineStore) => ({
            advice: state.advice.filter((a) => a.id !== id),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to delete advice:', error);
          set({ error: 'Failed to delete advice', isSaving: false });
        }
      },

      updateAdvice: async (id: string, updates: Partial<Advice>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateAdvice(id, updates);
          }

          await db.table('advice').update(id, updates);

          set((state: TimelineStore) => ({
            advice: state.advice.map((a) => a.id === id ? { ...a, ...updates } : a),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to update advice:', error);
          set({ error: 'Failed to update advice', isSaving: false });
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

        return JSON.stringify({
          stories, userProfile: userProfile[0], relationships, managedTags, preferences
        }, null, 2);
      },

      syncLocalToCloud: async () => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          if (!user || !navigator.onLine) {
            throw new Error('Must be online and logged in to sync.');
          }

          console.log('Starting Force Sync...');

          // 1. Profile - CRITICAL: Use user.id for cloud profile
          const localProfiles = await db.table('userProfile').toArray();
          console.log('[Force Sync] Local profiles found:', localProfiles.length);
          if (localProfiles.length > 0) {
            console.log('[Force Sync] Local profile data:', localProfiles[0]);
            const cloudProfile = { ...localProfiles[0], id: user.id };
            console.log('[Force Sync] Cloud profile to upsert:', cloudProfile);
            const result = await supabaseService.upsertProfile(cloudProfile);
            console.log('[Force Sync] Profile upsert result:', result);
            console.log('[Force Sync] Profile synced with user ID:', user.id);
          } else {
            console.warn('[Force Sync] No local profile found to sync!');
          }

          // 2. Stories - Use upsertStory to prevent duplicates
          const localStories = await db.table('stories').toArray();
          let storiesSynced = 0;
          for (const story of localStories) {
            // upsertStory checks if story with same title+date exists and updates it
            // Otherwise it creates a new one. This prevents duplicates on multiple syncs.
            await supabaseService.upsertStory(user.id, story);
            storiesSynced++;
          }

          // 3. Thoughts
          const localThoughts = await db.table('thoughts').toArray();
          for (const t of localThoughts) {
            await supabaseService.addThought(user.id, t);
          }

          // 4. Todos
          const localTodos = await db.table('todos').toArray();
          for (const t of localTodos) {
            await supabaseService.addTodo(user.id, t);
          }

          // 5. Relationships
          const localRel = await db.table('relationships').toArray();
          for (const r of localRel) {
            await supabaseService.addRelationship(user.id, r);
          }

          // 6. Advice
          const localAdvice = await db.table('advice').toArray();
          for (const a of localAdvice) {
            await supabaseService.addAdvice(user.id, a);
          }

          // 7. Managed Tags
          const localTags = await db.table('managedTags').toArray();
          for (const t of localTags) {
            await supabaseService.addManagedTag(user.id, t);
          }

          // 8. Weath Items
          const localWealth = await db.table('wealthItems').toArray();
          for (const w of localWealth) {
            await supabaseService.addWealthItem(user.id, w);
          }

          console.log('Force Sync Complete.');
          set({ isSaving: false });
          return { success: true, message: `Synced ${storiesSynced} stories and other data to cloud.` };
        } catch (error: any) {
          console.error('Sync failed:', error);
          set({ error: error.message || 'Sync failed', isSaving: false });
          return { success: false, message: error.message };
        }
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
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudRelationships = await supabaseService.getRelationships(user.id);
            if (cloudRelationships) {
              // Safety Patch
              const localCount = await db.table('relationships').count();
              if (cloudRelationships.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud relationships empty, but local has data. Preserving local data.');
              } else {
                await db.table('relationships').clear();
                if (cloudRelationships.length > 0) {
                  await db.table('relationships').bulkPut(cloudRelationships);
                }
                set({ relationships: cloudRelationships, isLoading: false });
                return;
              }
            }
          }

          const relationships = await db.table('relationships').toArray();
          set({ relationships, isLoading: false });
        } catch (error) {
          console.error('Failed to load relationships:', error);
          set({ error: 'Failed to load relationships', isLoading: false });
        }
      },

      addRelationship: async (relationshipData: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt' | 'interactionCount'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newRelationship: Relationship;

          if (user && navigator.onLine) {
            const cloudRelationship = await supabaseService.addRelationship(user.id, relationshipData);
            if (cloudRelationship) {
              newRelationship = cloudRelationship;
            } else {
              throw new Error('Failed to add relationship to cloud');
            }
          } else {
            newRelationship = {
              ...relationshipData,
              id: crypto.randomUUID(),
              interactionCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          await db.table('relationships').put(newRelationship);

          set((state: TimelineStore) => ({
            relationships: [...state.relationships, newRelationship],
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add relationship:', error);
          set({ error: 'Failed to add relationship', isSaving: false });
        }
      },

      updateRelationship: async (id: string, updates: Partial<Relationship>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateRelationship(id, updates);
          }

          const updatedRelationship = {
            ...updates,
            updatedAt: new Date(),
          };

          await db.table('relationships').update(id, updatedRelationship);

          set((state: TimelineStore) => ({
            relationships: state.relationships.map((relationship: Relationship) =>
              relationship.id === id ? { ...relationship, ...updatedRelationship } : relationship
            ),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to update relationship:', error);
          set({ error: 'Failed to update relationship', isSaving: false });
        }
      },

      deleteRelationship: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteRelationship(id);
          }

          await db.table('relationships').delete(id);

          set((state: TimelineStore) => ({
            relationships: state.relationships.filter((relationship: Relationship) => relationship.id !== id),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to delete relationship:', error);
          set({ error: 'Failed to delete relationship', isSaving: false });
        }
      },

      incrementRelationshipInteraction: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const relationship = await db.table('relationships').get(id);
          if (relationship) {
            const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

            const updatedRelationship = {
              ...relationship,
              interactionCount: (relationship.interactionCount || 0) + 1,
              updatedAt: new Date(),
            };

            if (user && navigator.onLine) {
              await supabaseService.updateRelationship(id, {
                interactionCount: updatedRelationship.interactionCount,
                updatedAt: updatedRelationship.updatedAt
              });
            }

            await db.table('relationships').update(id, updatedRelationship);

            set((state: TimelineStore) => ({
              relationships: state.relationships.map((r: Relationship) =>
                r.id === id ? { ...r, ...updatedRelationship } : r
              ),
              isSaving: false,
            }));
          }
        } catch (error) {
          console.error('Failed to increment interaction:', error);
          set({ error: 'Failed to increment interaction', isSaving: false });
        }
      },

      // Managed tags methods
      loadManagedTags: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudTags = await supabaseService.getManagedTags(user.id);
            if (cloudTags) {
              // Safety Patch
              const localCount = await db.table('managedTags').count();
              if (cloudTags.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud managedTags empty, but local has data. Preserving local data.');
              } else {
                await db.table('managedTags').clear();
                if (cloudTags.length > 0) {
                  await db.table('managedTags').bulkPut(cloudTags);
                }
                set({ managedTags: cloudTags, isLoading: false });
                return;
              }
            }
          }

          const managedTags = await db.table('managedTags').toArray();
          set({ managedTags, isLoading: false });
        } catch (error) {
          console.error('Failed to load managed tags:', error);
          set({ error: 'Failed to load managed tags', isLoading: false });
        }
      },

      addManagedTag: async (tagData: Omit<ManagedTag, 'id' | 'createdAt'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newTag: ManagedTag;

          if (user && navigator.onLine) {
            const cloudTag = await supabaseService.addManagedTag(user.id, tagData);
            if (cloudTag) {
              newTag = cloudTag;
            } else {
              throw new Error('Failed to add managed tag to cloud');
            }
          } else {
            newTag = {
              ...tagData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            };
          }

          await db.table('managedTags').put(newTag);

          set((state: TimelineStore) => ({
            managedTags: [...state.managedTags, newTag],
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add managed tag:', error);
          set({ error: 'Failed to add managed tag', isSaving: false });
        }
      },

      updateManagedTag: async (id: string, updates: Partial<ManagedTag>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateManagedTag(id, updates);
          }

          await db.table('managedTags').update(id, updates);

          set((state: TimelineStore) => ({
            managedTags: state.managedTags.map((tag: ManagedTag) =>
              tag.id === id ? { ...tag, ...updates } : tag
            ),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to update managed tag:', error);
          set({ error: 'Failed to update managed tag', isSaving: false });
        }
      },

      deleteManagedTag: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteManagedTag(id);
          }

          await db.table('managedTags').delete(id);

          set((state: TimelineStore) => ({
            managedTags: state.managedTags.filter((tag: ManagedTag) => tag.id !== id),
            isSaving: false,
          }));
        } catch (error) {
          console.error('Failed to delete managed tag:', error);
          set({ error: 'Failed to delete managed tag', isSaving: false });
        }
      },

      // Wealth methods
      loadWealthItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudItems = await supabaseService.getWealthItems(user.id);
            if (cloudItems) {
              // Safety Patch
              const localCount = await db.table('wealthItems').count();
              if (cloudItems.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud wealthItems empty, but local has data. Preserving local data.');
              } else {
                await db.table('wealthItems').clear();
                if (cloudItems.length > 0) {
                  await db.table('wealthItems').bulkPut(cloudItems);
                }
                set({ wealthItems: cloudItems, isLoading: false });
                return;
              }
            }
          }

          const wealthItems = await db.table('wealthItems').toArray();
          const hydratedWealthItems = wealthItems.map(w => ({
            ...w,
            lastUpdated: new Date(w.lastUpdated)
          }));
          set({ wealthItems: hydratedWealthItems, isLoading: false });
        } catch (error) {
          console.error('Failed to load wealth items:', error);
          set({ error: 'Failed to load wealth items', isLoading: false });
        }
      },

      addWealthItem: async (itemData: Omit<WealthItem, 'id' | 'lastUpdated'>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
          let newItem: WealthItem;

          if (user && navigator.onLine) {
            const cloudItem = await supabaseService.addWealthItem(user.id, itemData);
            if (cloudItem) {
              newItem = cloudItem;
            } else {
              throw new Error('Failed to add wealth item to cloud');
            }
          } else {
            newItem = {
              ...itemData,
              id: crypto.randomUUID(),
              lastUpdated: new Date(),
            };
          }

          await db.table('wealthItems').put(newItem);

          set((state: TimelineStore) => ({
            wealthItems: [...state.wealthItems, newItem],
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to add wealth item:', error);
          set({ error: 'Failed to add wealth item', isSaving: false });
        }
      },

      updateWealthItem: async (id: string, updates: Partial<WealthItem>, note?: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.updateWealthItem(id, updates);
          }

          // Get the current item to compare values for history
          const currentItem = get().wealthItems.find(item => item.id === id);

          const updatedItem = {
            ...updates,
            lastUpdated: new Date(),
          };

          await db.table('wealthItems').update(id, updatedItem);

          // Log history if value changed
          if (currentItem && updates.value !== undefined && updates.value !== currentItem.value) {
            const historyEntry: WealthHistoryEntry = {
              id: crypto.randomUUID(),
              wealthItemId: id,
              wealthItemName: currentItem.name,
              previousValue: currentItem.value,
              newValue: updates.value,
              changeAmount: updates.value - currentItem.value,
              timestamp: new Date(),
              note,
            };

            if (user && navigator.onLine) {
              await supabaseService.addWealthHistory(user.id, historyEntry);
            }

            await db.table('wealthHistory').add(historyEntry);

            const currentHistory = get().wealthHistory;
            set({
              wealthHistory: [historyEntry, ...currentHistory].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ),
            });
          }

          set((state: TimelineStore) => ({
            wealthItems: state.wealthItems.map(item =>
              item.id === id ? { ...item, ...updatedItem } : item
            ),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to update wealth item:', error);
          set({ error: 'Failed to update wealth item', isSaving: false });
        }
      },

      removeWealthItem: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            await supabaseService.deleteWealthItem(id);
          }

          await db.table('wealthItems').delete(id);

          set((state: TimelineStore) => ({
            wealthItems: state.wealthItems.filter(item => item.id !== id),
            isSaving: false
          }));
        } catch (error) {
          console.error('Failed to remove wealth item:', error);
          set({ error: 'Failed to remove wealth item', isSaving: false });
        }
      },

      // Wealth history methods
      loadWealthHistory: async () => {
        try {
          const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

          if (user && navigator.onLine) {
            const cloudHistory = await supabaseService.getWealthHistory(user.id);
            if (cloudHistory) {
              // Safety Patch
              const localCount = await db.table('wealthHistory').count();
              if (cloudHistory.length === 0 && localCount > 0) {
                console.warn('[Sync Protection] Cloud wealthHistory empty, but local has data. Preserving local data.');
              } else {
                await db.table('wealthHistory').clear();
                if (cloudHistory.length > 0) {
                  await db.table('wealthHistory').bulkPut(cloudHistory);
                }
                set({ wealthHistory: cloudHistory });
                return;
              }
            }
          }

          const history = await db.table('wealthHistory').toArray();
          const hydratedHistory = history.map(h => ({
            ...h,
            timestamp: new Date(h.timestamp)
          })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          set({ wealthHistory: hydratedHistory });
        } catch (error) {
          console.error('Failed to load wealth history:', error);
        }
      },

      getWealthItemHistory: (wealthItemId: string) => {
        return get().wealthHistory.filter(h => h.wealthItemId === wealthItemId);
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
