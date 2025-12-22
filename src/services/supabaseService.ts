import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Story, Thought, TodoItem, Relationship, ManagedTag, Advice, UserProfile, Preference, WealthItem, WealthHistoryEntry } from '../types';

// Sync helper to get current user synchronously from session
export const getCurrentUserId = (): string | null => {
    if (!supabase) return null;
    // We can't easily get the session sync if not already handled
    return null;
};

// ==========================================
// PROFILES
// ==========================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        birthDate: new Date(data.birth_date),
        birthLocation: data.birth_location,
        location: data.location,
        bio: data.bio,
        avatar: data.avatar_url,
    };
}

export async function upsertProfile(profile: UserProfile): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: profile.id,
            name: profile.name,
            birth_date: profile.birthDate instanceof Date
                ? profile.birthDate.toISOString().split('T')[0]
                : profile.birthDate,
            birth_location: profile.birthLocation,
            location: profile.location,
            bio: profile.bio,
            avatar_url: profile.avatar,
        });

    return !error;
}

// ==========================================
// STORIES
// ==========================================

export async function getStories(userId: string): Promise<Story[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        type: s.type as 'short' | 'long',
        date: new Date(s.date),
        endDate: s.end_date ? new Date(s.end_date) : undefined,
        fuzzyDate: s.fuzzy_date,
        tags: s.tags || [],
        people: s.people || [],
        importance: s.importance as 'low' | 'medium' | 'high',
        mood: s.mood,
        location: s.location,
        images: s.images || [],
        metadata: s.metadata,
        lockedUntil: s.locked_until ? new Date(s.locked_until) : undefined,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
    }));
}

export async function addStory(userId: string, story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>): Promise<Story | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('stories')
        .insert({
            user_id: userId,
            title: story.title,
            content: story.content,
            type: story.type,
            date: story.date instanceof Date ? story.date.toISOString().split('T')[0] : story.date,
            end_date: story.endDate instanceof Date ? story.endDate.toISOString().split('T')[0] : story.endDate,
            fuzzy_date: story.fuzzyDate,
            tags: story.tags,
            people: story.people,
            importance: story.importance,
            mood: story.mood,
            location: story.location,
            images: story.images,
            metadata: story.metadata,
            locked_until: story.lockedUntil,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        content: data.content,
        type: data.type,
        date: new Date(data.date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        fuzzyDate: data.fuzzy_date,
        tags: data.tags || [],
        people: data.people || [],
        importance: data.importance,
        mood: data.mood,
        location: data.location,
        images: data.images || [],
        metadata: data.metadata,
        lockedUntil: data.locked_until ? new Date(data.locked_until) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

export async function updateStory(storyId: string, updates: Partial<Story>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.date !== undefined) updateData.date = updates.date instanceof Date ? updates.date.toISOString().split('T')[0] : updates.date;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate instanceof Date ? updates.endDate.toISOString().split('T')[0] : updates.endDate;
    if (updates.fuzzyDate !== undefined) updateData.fuzzy_date = updates.fuzzyDate;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.people !== undefined) updateData.people = updates.people;
    if (updates.importance !== undefined) updateData.importance = updates.importance;
    if (updates.mood !== undefined) updateData.mood = updates.mood;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId);

    return !error;
}

export async function deleteStory(storyId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

    return !error;
}

// ==========================================
// THOUGHTS
// ==========================================

export async function getThoughts(userId: string): Promise<Thought[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(t => ({
        id: t.id,
        content: t.content,
        type: t.type,
        createdAt: new Date(t.created_at),
        tags: t.tags,
        mood: t.mood,
    }));
}

export async function addThought(userId: string, thought: Omit<Thought, 'id'>): Promise<Thought | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('thoughts')
        .insert({
            user_id: userId,
            content: thought.content,
            type: thought.type,
            tags: thought.tags,
            mood: thought.mood,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        content: data.content,
        type: data.type,
        createdAt: new Date(data.created_at),
        tags: data.tags,
        mood: data.mood,
    };
}

export async function deleteThought(thoughtId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

    return !error;
}

// ==========================================
// TODOS
// ==========================================

export async function getTodos(userId: string): Promise<TodoItem[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: new Date(t.created_at),
        completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
        archivedAt: t.archived_at ? new Date(t.archived_at) : undefined,
        tags: t.tags,
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
    }));
}

export async function addTodo(userId: string, todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('todos')
        .insert({
            user_id: userId,
            title: todo.title,
            description: todo.description,
            status: todo.status,
            priority: todo.priority,
            tags: todo.tags,
            due_date: todo.dueDate,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdAt: new Date(data.created_at),
        tags: data.tags,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
    };
}

export async function updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.archivedAt !== undefined) updateData.archived_at = updates.archivedAt;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

    const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', todoId);

    return !error;
}

export async function deleteTodo(todoId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

    return !error;
}

// ==========================================
// WEALTH ITEMS
// ==========================================

export async function getWealthItems(userId: string): Promise<WealthItem[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('wealth_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(w => ({
        id: w.id,
        category: w.category,
        name: w.name,
        value: Number(w.value),
        isLiquid: w.is_liquid,
        lastUpdated: new Date(w.last_updated),
    }));
}

export async function addWealthItem(userId: string, item: Omit<WealthItem, 'id' | 'lastUpdated'>): Promise<WealthItem | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('wealth_items')
        .insert({
            user_id: userId,
            category: item.category,
            name: item.name,
            value: item.value,
            is_liquid: item.isLiquid,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        category: data.category,
        name: data.name,
        value: Number(data.value),
        isLiquid: data.is_liquid,
        lastUpdated: new Date(data.last_updated),
    };
}

export async function updateWealthItem(itemId: string, updates: Partial<WealthItem>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.isLiquid !== undefined) updateData.is_liquid = updates.isLiquid;

    const { error } = await supabase
        .from('wealth_items')
        .update(updateData)
        .eq('id', itemId);

    return !error;
}

export async function deleteWealthItem(itemId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('wealth_items')
        .delete()
        .eq('id', itemId);

    return !error;
}

// ==========================================
// WEALTH HISTORY
// ==========================================

export async function getWealthHistory(userId: string): Promise<WealthHistoryEntry[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('wealth_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

    if (error || !data) return [];

    return data.map(h => ({
        id: h.id,
        wealthItemId: h.wealth_item_id,
        wealthItemName: h.wealth_item_name,
        previousValue: Number(h.previous_value),
        newValue: Number(h.new_value),
        changeAmount: Number(h.change_amount),
        timestamp: new Date(h.timestamp),
        note: h.note,
    }));
}

export async function addWealthHistory(userId: string, entry: Omit<WealthHistoryEntry, 'id' | 'timestamp'>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('wealth_history')
        .insert({
            user_id: userId,
            wealth_item_id: entry.wealthItemId,
            wealth_item_name: entry.wealthItemName,
            previous_value: entry.previousValue,
            new_value: entry.newValue,
            change_amount: entry.changeAmount,
            note: entry.note,
        });

    return !error;
}

// ==========================================
// RELATIONSHIPS
// ==========================================

export async function getRelationships(userId: string): Promise<Relationship[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(r => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name || '',
        fullName: r.full_name,
        relationshipType: r.relationship_type,
        interactionCount: r.interaction_count,
        notes: r.notes,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    }));
}

export async function addRelationship(userId: string, rel: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt' | 'interactionCount'>): Promise<Relationship | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('relationships')
        .insert({
            user_id: userId,
            first_name: rel.firstName,
            last_name: rel.lastName,
            relationship_type: rel.relationshipType,
            notes: rel.notes,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name || '',
        fullName: data.full_name,
        relationshipType: data.relationship_type,
        interactionCount: data.interaction_count,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

export async function updateRelationship(relId: string, updates: Partial<Relationship>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.relationshipType !== undefined) updateData.relationship_type = updates.relationshipType;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.interactionCount !== undefined) updateData.interaction_count = updates.interactionCount;

    const { error } = await supabase
        .from('relationships')
        .update(updateData)
        .eq('id', relId);

    return !error;
}

export async function deleteRelationship(relId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relId);

    return !error;
}

// ==========================================
// ADVICE
// ==========================================

export async function getAdvice(userId: string): Promise<Advice[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('advice')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(a => ({
        id: a.id,
        content: a.content,
        category: a.category,
        source: a.source,
        createdAt: new Date(a.created_at),
        tags: a.tags,
    }));
}

export async function addAdvice(userId: string, advice: Omit<Advice, 'id'>): Promise<Advice | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('advice')
        .insert({
            user_id: userId,
            content: advice.content,
            category: advice.category,
            source: advice.source,
            tags: advice.tags,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        content: data.content,
        category: data.category,
        source: data.source,
        createdAt: new Date(data.created_at),
        tags: data.tags,
    };
}

export async function updateAdvice(adviceId: string, updates: Partial<Advice>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { error } = await supabase
        .from('advice')
        .update(updateData)
        .eq('id', adviceId);

    return !error;
}

export async function deleteAdvice(adviceId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('advice')
        .delete()
        .eq('id', adviceId);

    return !error;
}

// ==========================================
// MANAGED TAGS
// ==========================================

export async function getManagedTags(userId: string): Promise<ManagedTag[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('managed_tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

    if (error || !data) return [];

    return data.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        category: t.category,
        createdAt: new Date(t.created_at),
    }));
}

export async function addManagedTag(userId: string, tag: Omit<ManagedTag, 'id' | 'createdAt'>): Promise<ManagedTag | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('managed_tags')
        .insert({
            user_id: userId,
            name: tag.name,
            color: tag.color,
            category: tag.category,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        color: data.color,
        category: data.category,
        createdAt: new Date(data.created_at),
    };
}

export async function updateManagedTag(tagId: string, updates: Partial<ManagedTag>): Promise<boolean> {
    if (!supabase) return false;

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.category !== undefined) updateData.category = updates.category;

    const { error } = await supabase
        .from('managed_tags')
        .update(updateData)
        .eq('id', tagId);

    return !error;
}

export async function deleteManagedTag(tagId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('managed_tags')
        .delete()
        .eq('id', tagId);

    return !error;
}

// ==========================================
// PREFERENCES
// ==========================================

export async function getPreferences(userId: string): Promise<Preference[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .order('date_added', { ascending: false });

    if (error || !data) return [];

    return data.map(p => ({
        id: p.id,
        item: p.item,
        category: p.category,
        type: p.type as 'like' | 'dislike',
        dateAdded: new Date(p.date_added),
    }));
}

export async function addPreference(userId: string, pref: Omit<Preference, 'id' | 'dateAdded'>): Promise<Preference | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('preferences')
        .insert({
            user_id: userId,
            item: pref.item,
            category: pref.category,
            type: pref.type,
        })
        .select()
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        item: data.item,
        category: data.category,
        type: data.type as 'like' | 'dislike',
        dateAdded: new Date(data.date_added),
    };
}

export async function deletePreference(prefId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('preferences')
        .delete()
        .eq('id', prefId);

    return !error;
}

// ==========================================
// SYNC STATUS
// ==========================================

export function isOnline(): boolean {
    return navigator.onLine && isSupabaseConfigured();
}
