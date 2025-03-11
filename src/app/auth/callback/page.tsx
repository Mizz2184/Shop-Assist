'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session) {
          // If we have a valid session, redirect to dashboard
          router.push('/dashboard');
          return;
        }

        // If no session, try to get auth code from URL
        const hash = window.location.hash;
        let code = null;
        
        if (hash) {
          // Parse hash parameters
          const hashParams = new URLSearchParams(hash.substring(1));
          code = hashParams.get('access_token') || hashParams.get('code');
        }
        
        if (!code) {
          // Check query parameters
          const queryParams = new URLSearchParams(window.location.search);
          code = queryParams.get('code');
        }
        
        if (!code) {
          // No code found in URL, check if we're in an error state
          const errorParam = new URLSearchParams(window.location.search).get('error');
          if (errorParam) {
            throw new Error(errorParam);
          }
          
          // If no error parameter and no code, throw generic error
          throw new Error('No authentication code found in URL');
        }

        // Exchange the code for a session
        const { error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }

        // Redirect to dashboard on successful authentication
        router.push('/dashboard');
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
        
        // Redirect to login page after a short delay if there's an error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {error ? 'Authentication Error' : 'Completing Authentication...'}
        </h1>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Redirecting you back to the login page...
          </p>
        )}
      </div>
    </div>
  );
} 