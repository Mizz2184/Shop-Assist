'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAppContext } from '@/contexts/AppContext';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { language } = useAppContext();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback initiated');
        
        // Get the code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const error_description = params.get('error_description');

        // Handle OAuth error response
        if (errorParam) {
          console.error('OAuth error:', { error: errorParam, description: error_description });
          throw new Error(`${errorParam}: ${error_description}`);
        }

        // Check for code
        if (!code) {
          console.error('No code present in URL. Search params:', params.toString());
          throw new Error('No code present in URL');
        }
        
        console.log('Auth code received');

        // Get the code verifier from localStorage
        const codeVerifier = localStorage.getItem('codeVerifier');
        console.log('Code verifier retrieved:', codeVerifier ? 'Found' : 'Not found');
        
        if (!codeVerifier) {
          console.error('No code verifier found in localStorage');
          throw new Error('No code verifier found. Please try logging in again.');
        }

        // Exchange the code for a session
        console.log('Exchanging code for session...');
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Session exchange error:', exchangeError);
          throw exchangeError;
        }

        // Clear stored code verifier
        localStorage.removeItem('codeVerifier');
        console.log('Code verifier cleared');

        // Get the intended destination if any
        const redirectTo = localStorage.getItem('redirectTo') || '/dashboard';
        localStorage.removeItem('redirectTo');
        console.log('Redirecting to:', redirectTo);

        // Log success
        console.log('Successfully authenticated and exchanged code for session');

        // Redirect to the dashboard or stored redirect path
        router.push(redirectTo);
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
        
        // Clear any stored verifiers on error
        localStorage.removeItem('codeVerifier');
        localStorage.removeItem('redirectTo');
        
        // Redirect to login page after a short delay if there's an error
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [router, supabase.auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              {language === 'es' ? 'Error de Autenticación' : 'Authentication Error'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'es'
                ? 'Redirigiendo a la página de inicio de sesión...'
                : 'Redirecting you back to the login page...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'es' ? 'Completando el Inicio de Sesión' : 'Completing Sign In'}
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 