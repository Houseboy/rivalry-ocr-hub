import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
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
  }
);

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