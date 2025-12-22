import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not configured. Running in offline-only mode. ' +
        'To enable cloud sync, add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env.local'
    );
}

// Create Supabase client (will be null if credentials not configured)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return supabase !== null;
};
