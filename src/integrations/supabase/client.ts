import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

// Debug logging
console.log('Supabase Config:', {
  URL: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  APP_URL
});

// Check if Supabase is available, otherwise use mock
let supabase: any;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables:', {
    URL: !!SUPABASE_URL,
    Key: !!SUPABASE_PUBLISHABLE_KEY
  });
  // Use mock client for development
  const { mockSupabase } = await import('./mock-client');
  supabase = mockSupabase;
} else {
  // Try to create real Supabase client
  try {
    supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
        global: {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
        db: {
          schema: 'public',
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase client, falling back to mock:', error);
    const { mockSupabase } = await import('./mock-client');
    supabase = mockSupabase;
  }
}

export { supabase };

// Export auth functions for easier access
export const signInWithPassword = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback`,
    },
  });
};


export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/reset-password`,
  });
};

export const updatePassword = async (newPassword: string) => {
  return await supabase.auth.updateUser({
    password: newPassword,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    console.log('Supabase connection test result:', { data, error });
    return { success: !error, error };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return { success: false, error: err };
  }
};