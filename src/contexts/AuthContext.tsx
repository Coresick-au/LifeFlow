import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isOfflineMode: boolean;
    signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        // If Supabase isn't configured, default to offline mode
        if (!isSupabaseConfigured() || !supabase) {
            setIsLoading(false);
            setIsOfflineMode(true);
            return;
        }

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);

                // Create profile on signup
                if (event === 'SIGNED_IN' && session?.user) {
                    // Profile creation handled separately
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = useCallback(async (email: string, password: string, name: string) => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (!error && data.user) {
            // Create profile in profiles table
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                name,
                birth_date: new Date().toISOString().split('T')[0], // Default, user can update later
            });

            if (profileError) {
                console.error('Failed to create profile:', profileError);
            }
        }

        return { error };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    }, []);

    const signOut = useCallback(async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setSession(null);
        setIsOfflineMode(false);
    }, []);

    const continueAsGuest = useCallback(() => {
        setIsOfflineMode(true);
        setIsLoading(false);
    }, []);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user || isOfflineMode,
        isOfflineMode,
        signUp,
        signIn,
        signOut,
        continueAsGuest,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
