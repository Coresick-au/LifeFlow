import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimelineStore } from '../store/timelineStore';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import * as supabaseService from '../services/supabaseService';

/**
 * Hook that syncs local Dexie data with Supabase when online.
 * - On login: Pulls data from Supabase to local
 * - On data changes: Pushes to Supabase (handled in store)
 * - On reconnect: Syncs any pending changes
 */
export function useSyncData() {
    const { user, isOfflineMode } = useAuth();
    const {
        loadStories,
        loadThoughts,
        loadTodos,
        loadWealthItems,
        loadWealthHistory,
        loadRelationships,
        loadAdvice,
    } = useTimelineStore();

    const hasSynced = useRef(false);

    // Initial sync when user logs in
    const syncFromCloud = useCallback(async () => {
        if (!user || isOfflineMode || !isSupabaseConfigured()) {
            console.log('Skipping cloud sync - offline mode or not configured');
            return;
        }

        if (hasSynced.current) {
            console.log('Already synced this session');
            return;
        }

        console.log('Syncing data from Supabase...');

        try {
            // Load all data from Supabase
            // The store methods will be updated to check Supabase first
            await Promise.all([
                loadStories(),
                loadThoughts(),
                loadTodos(),
                loadWealthItems(),
                loadWealthHistory(),
                loadRelationships(),
                loadAdvice(),
            ]);

            hasSynced.current = true;
            console.log('Cloud sync complete');
        } catch (error) {
            console.error('Cloud sync failed:', error);
        }
    }, [user, isOfflineMode, loadStories, loadThoughts, loadTodos, loadWealthItems, loadWealthHistory, loadRelationships, loadAdvice]);

    // Sync on login
    useEffect(() => {
        if (user && !isOfflineMode) {
            syncFromCloud();
        }
    }, [user, isOfflineMode, syncFromCloud]);

    // Sync on coming back online
    useEffect(() => {
        const handleOnline = () => {
            if (user && !isOfflineMode) {
                hasSynced.current = false; // Allow re-sync
                syncFromCloud();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [user, isOfflineMode, syncFromCloud]);

    return {
        syncFromCloud,
        isOnline: navigator.onLine && isSupabaseConfigured() && !isOfflineMode,
    };
}

/**
 * Get the current user ID for Supabase operations.
 * Returns null if in offline mode or not authenticated.
 */
export function useUserId(): string | null {
    const { user, isOfflineMode } = useAuth();

    if (isOfflineMode || !user) {
        return null;
    }

    return user.id;
}
