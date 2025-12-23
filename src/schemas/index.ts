import { z } from 'zod';
import type { Story, Thought, TodoItem, UserProfile } from '../types';

// Story schema
export const storySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.string().regex(/^(short|long)$/),
  date: z.date(),
  endDate: z.date().optional(),
  fuzzyDate: z.boolean().optional(),
  tags: z.array(z.string()),
  people: z.array(z.string()),
  importance: z.string().regex(/^(low|medium|high)$/),
  location: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  lockedUntil: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Thought schema
export const thoughtSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  type: z.string().regex(/^(idea|observation|pondering|note)$/),
  createdAt: z.date(),
  tags: z.array(z.string()).optional(),
});

// TodoItem schema
export const todoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().regex(/^(active|completed|archived)$/),
  priority: z.string().regex(/^(low|medium|high)$/),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  archivedAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
});

// UserProfile schema
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  birthDate: z.date(),
  location: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

// Validation functions
export const validateStory = (data: unknown) => storySchema.safeParse(data);
export const validateThought = (data: unknown) => thoughtSchema.safeParse(data);
export const validateTodo = (data: unknown) => todoSchema.safeParse(data);
export const validateUserProfile = (data: unknown) => userProfileSchema.safeParse(data);
