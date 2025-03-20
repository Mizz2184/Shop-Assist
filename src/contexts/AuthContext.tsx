'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshSession: () => Promise<boolean>;
}

const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  signInWithGoogle: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => {},
  getAccessToken: async () => null,
  refreshSession: async () => false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh the session token
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in refreshSession:', error);
      return false;
    }
  };

  useEffect(() => {
    // Get the initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        // If session exists but is close to expiry, refresh it
        if (session) {
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          // If token expires in less than 10 minutes (600 seconds), refresh it
          if (expiresAt && expiresAt - now < 600) {
            console.log('Session close to expiry, refreshing...');
            await refreshSession();
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
        
        // If token refresh event, update the session
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );
    
    // Set up a timer to refresh the token periodically
    const refreshTimer = setInterval(async () => {
      if (session) {
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        // If token expires in less than 10 minutes, refresh it
        if (expiresAt && expiresAt - now < 600) {
          console.log('Session close to expiry, refreshing...');
          await refreshSession();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Clean up the subscription and timer
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshTimer);
    };
  }, [session]);

  // Function to get a fresh access token
  const getAccessToken = async (): Promise<string | null> => {
    try {
      // If no session or token is expired, try to refresh
      if (!session || !session.access_token || isTokenExpired(session)) {
        const refreshed = await refreshSession();
        if (!refreshed || !session) {
          return null;
        }
      }
      return session.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };
  
  // Helper to check if token is expired or close to expiry
  const isTokenExpired = (session: Session): boolean => {
    if (!session.expires_at) return false;
    const now = Math.floor(Date.now() / 1000);
    // Consider token expired if it expires in less than 5 minutes
    return session.expires_at - now < 300;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Generate a code verifier for PKCE
      const generateRandomString = (length: number): string => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values)
          .map(x => possible[x % possible.length])
          .join('');
      };
      
      const codeVerifier = generateRandomString(64);
      localStorage.setItem('codeVerifier', codeVerifier);
      console.log('Code verifier stored in AuthContext:', codeVerifier ? 'Yes' : 'No');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        getAccessToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 