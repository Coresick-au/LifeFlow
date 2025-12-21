import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/timelineStore';
import { validateStory, validateThought, validateTodo, validateUserProfile } from '../schemas';

// Stories hooks
export const useStories = () => {
  const stories = useLiveQuery(
    () => db.table('stories').toArray(),
    [],
    []
  );

  // Validate and transform stories
  const validatedStories = stories?.map(story => {
    const result = validateStory(story);
    if (!result.success) {
      console.error('Invalid story data:', story, result.error);
      return null;
    }
    return result.data;
  }).filter(Boolean) || [];

  return validatedStories;
};

export const useStory = (id: string) => {
  return useLiveQuery(
    () => db.table('stories').get(id),
    [id],
    undefined
  );
};

// Thoughts hooks
export const useThoughts = () => {
  const thoughts = useLiveQuery(
    () => db.table('thoughts').toArray(),
    [],
    []
  );

  // Validate and transform thoughts
  const validatedThoughts = thoughts?.map(thought => {
    const result = validateThought(thought);
    if (!result.success) {
      console.error('Invalid thought data:', thought, result.error);
      return null;
    }
    return result.data;
  }).filter(Boolean) || [];

  return validatedThoughts;
};

export const useThought = (id: string) => {
  return useLiveQuery(
    () => db.table('thoughts').get(id),
    [id],
    undefined
  );
};

// Todos hooks
export const useTodos = () => {
  const todos = useLiveQuery(
    () => db.table('todos').toArray(),
    [],
    []
  );

  // Validate and transform todos
  const validatedTodos = todos?.map(todo => {
    const result = validateTodo(todo);
    if (!result.success) {
      console.error('Invalid todo data:', todo, result.error);
      return null;
    }
    return result.data;
  }).filter(Boolean) || [];

  return validatedTodos;
};

export const useTodo = (id: string) => {
  return useLiveQuery(
    () => db.table('todos').get(id),
    [id],
    undefined
  );
};

// User Profile hook
export const useUserProfile = () => {
  const profile = useLiveQuery(
    () => db.table('userProfile').toArray(),
    [],
    []
  );

  // Get first (and only) profile
  const rawProfile = profile?.[0];
  
  if (!rawProfile) {
    return null;
  }

  const result = validateUserProfile(rawProfile);
  if (!result.success) {
    console.error('Invalid user profile data:', rawProfile, result.error);
    return null;
  }

  return result.data;
};

// Relationships hooks
export const useRelationships = () => {
  return useLiveQuery(
    () => db.table('relationships').toArray(),
    [],
    []
  );
};

// Preferences hooks
export const usePreferences = () => {
  return useLiveQuery(
    () => db.table('preferences').toArray(),
    [],
    []
  );
};

// Managed Tags hooks
export const useManagedTags = () => {
  return useLiveQuery(
    () => db.table('managedTags').toArray(),
    [],
    []
  );
};

// Mutation hooks
export const useStoryMutations = () => {
  const addStory = async (storyData: any) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const story = {
      ...storyData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = validateStory(story);
    if (!result.success) {
      throw new Error(`Invalid story data: ${result.error.message}`);
    }
    
    await db.table('stories').add(result.data);
    return result.data;
  };

  const updateStory = async (id: string, updates: any) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const existing = await db.table('stories').get(id);
    if (!existing) {
      throw new Error('Story not found');
    }
    
    const result = validateStory({ ...existing, ...updatedData });
    if (!result.success) {
      throw new Error(`Invalid story data: ${result.error.message}`);
    }
    
    await db.table('stories').update(id, result.data);
    return result.data;
  };

  const deleteStory = async (id: string) => {
    await db.table('stories').delete(id);
  };

  return { addStory, updateStory, deleteStory };
};

export const useThoughtMutations = () => {
  const addThought = async (thoughtData: any) => {
    const id = crypto.randomUUID();
    const thought = {
      ...thoughtData,
      id,
      createdAt: new Date(),
    };
    
    const result = validateThought(thought);
    if (!result.success) {
      throw new Error(`Invalid thought data: ${result.error.message}`);
    }
    
    await db.table('thoughts').add(result.data);
    return result.data;
  };

  const updateThought = async (id: string, updates: any) => {
    const existing = await db.table('thoughts').get(id);
    if (!existing) {
      throw new Error('Thought not found');
    }
    
    const result = validateThought({ ...existing, ...updates });
    if (!result.success) {
      throw new Error(`Invalid thought data: ${result.error.message}`);
    }
    
    await db.table('thoughts').update(id, result.data);
    return result.data;
  };

  const deleteThought = async (id: string) => {
    await db.table('thoughts').delete(id);
  };

  return { addThought, updateThought, deleteThought };
};

export const useTodoMutations = () => {
  const addTodo = async (todoData: any) => {
    const id = crypto.randomUUID();
    const todo = {
      ...todoData,
      id,
      createdAt: new Date(),
    };
    
    const result = validateTodo(todo);
    if (!result.success) {
      throw new Error(`Invalid todo data: ${result.error.message}`);
    }
    
    await db.table('todos').add(result.data);
    return result.data;
  };

  const updateTodo = async (id: string, updates: any) => {
    const existing = await db.table('todos').get(id);
    if (!existing) {
      throw new Error('Todo not found');
    }
    
    const result = validateTodo({ ...existing, ...updates });
    if (!result.success) {
      throw new Error(`Invalid todo data: ${result.error.message}`);
    }
    
    await db.table('todos').update(id, result.data);
    return result.data;
  };

  const deleteTodo = async (id: string) => {
    await db.table('todos').delete(id);
  };

  const completeTodo = async (id: string) => {
    return updateTodo(id, { 
      status: 'completed', 
      completedAt: new Date() 
    });
  };

  const archiveTodo = async (id: string) => {
    return updateTodo(id, { 
      status: 'archived', 
      archivedAt: new Date() 
    });
  };

  return { addTodo, updateTodo, deleteTodo, completeTodo, archiveTodo };
};

export const useUserProfileMutations = () => {
  const saveProfile = async (profileData: any) => {
    // Clear existing profile
    await db.table('userProfile').clear();
    
    const profile = {
      ...profileData,
      id: crypto.randomUUID(),
    };
    
    const result = validateUserProfile(profile);
    if (!result.success) {
      throw new Error(`Invalid profile data: ${result.error.message}`);
    }
    
    await db.table('userProfile').add(result.data);
    return result.data;
  };

  return { saveProfile };
};
