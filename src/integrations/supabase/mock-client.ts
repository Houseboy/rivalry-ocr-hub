// Mock Supabase client for testing when Supabase is unavailable
import type { Database } from './types';

interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const mockUser: MockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

const mockSession: MockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000, // 1 hour from now
};

export const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Mock authentication - always succeeds for demo
      if (email && password) {
        return { 
          data: { 
            user: mockUser, 
            session: mockSession 
          }, 
          error: null 
        };
      }
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Invalid credentials' } 
      };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      if (email && password) {
        return { 
          data: { 
            user: mockUser, 
            session: mockSession 
          }, 
          error: null 
        };
      }
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Signup failed' } 
      };
    },
    signOut: async () => {
      return { error: null };
    },
    getSession: async () => {
      // Check if there's a mock session in localStorage
      const storedSession = localStorage.getItem('mock-session');
      if (storedSession) {
        return { 
          data: { 
            session: JSON.parse(storedSession) 
          }, 
          error: null 
        };
      }
      return { 
        data: { session: null }, 
        error: null 
      };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock auth state change listener
      const storedSession = localStorage.getItem('mock-session');
      if (storedSession) {
        callback('SIGNED_IN', JSON.parse(storedSession));
      }
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },
  from: (table: string) => ({
    select: () => ({
      limit: () => ({
        then: (resolve: any) => resolve({ data: [], error: null })
      })
    })
  })
};

// Use mock client when Supabase is unavailable
export const supabase = mockSupabase;
