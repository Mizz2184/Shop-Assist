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
        // Get the auth code from the URL
        const hash = window.location.hash;
        
        if (!hash) {
          // If there's no hash, check for code in query params (for some OAuth providers)
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          
          if (!code) {
            throw new Error('No authentication code found in URL');
          }
        }
        
        // The supabase client will automatically handle the exchange of the code for a session
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
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