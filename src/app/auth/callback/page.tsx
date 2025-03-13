'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthRedirect from '@/components/auth/AuthRedirect';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );

        if (error) {
          throw error;
        }

        // Check if there's a pending invitation
        const pendingInvitation = localStorage.getItem('pendingInvitation');
        
        if (pendingInvitation) {
          // The AuthRedirect component will handle the redirection
          return;
        }
        
        // If no pending invitation, redirect to home page
        router.push('/');
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
        
        // Redirect to login page after a short delay if there's an error
        setTimeout(() => {
          router.push('/auth/login-email-only');
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* Include the AuthRedirect component to handle pending invitations */}
      <AuthRedirect />
      
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