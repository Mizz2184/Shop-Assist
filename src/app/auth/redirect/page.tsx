'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

export default function AuthRedirect() {
  const router = useRouter();
  const { language } = useAppContext();
  const [message, setMessage] = useState(
    language === 'es' 
      ? 'Comprobando opciones de autenticación...' 
      : 'Checking authentication options...'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthOptions = async () => {
      try {
        // Try to check if Google OAuth is available
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        // If there's no error or the error is not about the provider being disabled,
        // we can use the regular login page
        if (!error || !error.message.includes('provider is not enabled')) {
          router.push('/auth/login');
          return;
        }

        // If we get here, Google OAuth is not available
        setMessage(
          language === 'es'
            ? 'Google OAuth no está disponible. Redirigiendo a la página de inicio de sesión solo con correo electrónico...'
            : 'Google OAuth is not available. Redirecting to email-only login page...'
        );
        
        // Wait a moment to show the message
        setTimeout(() => {
          router.push('/auth/login-email-only');
        }, 2000);
      } catch (err) {
        console.error('Error checking auth options:', err);
        setError(
          language === 'es'
            ? 'Error al comprobar las opciones de autenticación. Por favor, inténtelo de nuevo.'
            : 'Error checking authentication options. Please try again.'
        );
        
        // Default to email-only login on error
        setTimeout(() => {
          router.push('/auth/login-email-only');
        }, 3000);
      }
    };

    checkAuthOptions();
  }, [router, language]);

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'es' ? 'Redirigiendo...' : 'Redirecting...'}
        </h1>
        
        {error ? (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>{message}</p>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={() => router.push('/auth/fix-auth')}
            className="text-primary hover:underline"
          >
            {language === 'es' ? 'Solucionar problemas de autenticación' : 'Troubleshoot authentication issues'}
          </button>
        </div>
      </div>
    </main>
  );
} 