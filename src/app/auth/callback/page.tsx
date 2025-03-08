'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        
        if (code) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Exchange the code for a session
          await supabase.auth.exchangeCodeForSession(code);
        }

        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } catch (err) {
        console.error('Error handling auth callback:', err);
        setError(
          language === 'es'
            ? 'Error al procesar la autenticación. Por favor, inténtelo de nuevo.'
            : 'Error processing authentication. Please try again.'
        );
      }
    };

    handleCallback();
  }, [router, searchParams, language]);

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'es' ? 'Procesando Autenticación' : 'Processing Authentication'}
        </h1>
        
        {error ? (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>
              {language === 'es' 
                ? 'Completando el proceso de inicio de sesión...' 
                : 'Completing the login process...'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 