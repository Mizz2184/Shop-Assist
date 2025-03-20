'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language } = useAppContext();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirectTo') || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successful login will trigger the useEffect above to redirect
    } catch (error: any) {
      console.error('Email login error:', error);
      setError(language === 'es'
        ? 'Error al iniciar sesión. Por favor, verifique sus credenciales.'
        : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate a code verifier for PKCE
      const generateRandomString = (length: number): string => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values)
          .map(x => possible[x % possible.length])
          .join('');
      };
      
      // Generate and store code verifier
      const codeVerifier = generateRandomString(64);
      localStorage.setItem('codeVerifier', codeVerifier);
      console.log('Code verifier stored:', codeVerifier);
      
      // Store redirect path if provided
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo) {
        localStorage.setItem('redirectTo', redirectTo);
      }

      // Initiate OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });
      
      if (error) throw error;
      
      // The redirect will be handled by Supabase
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(language === 'es'
        ? 'Error al iniciar sesión con Google. Por favor, inténtelo de nuevo.'
        : 'Google login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {language === 'es' ? 'Correo electrónico' : 'Email address'}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                placeholder={language === 'es' ? 'Correo electrónico' : 'Email address'}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {language === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800"
                placeholder={language === 'es' ? 'Contraseña' : 'Password'}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                {language === 'es' ? 'O continuar con' : 'Or continue with'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.447,1.722-1.502,3.178-2.945,4.182c-1.445,1.004-3.214,1.511-5.046,1.511c-2.372,0-4.658-0.944-6.34-2.626c-1.682-1.682-2.626-3.968-2.626-6.34c0-2.372,0.944-4.658,2.626-6.34c1.682-1.682,3.968-2.626,6.34-2.626c2.372,0,4.658,0.944,6.34,2.626l-2.484,2.484c-0.947-0.947-2.234-1.479-3.575-1.479c-1.342,0-2.628,0.532-3.575,1.479c-0.947,0.947-1.479,2.234-1.479,3.575c0,1.342,0.532,2.628,1.479,3.575c0.947,0.947,2.234,1.479,3.575,1.479c1.342,0,2.628-0.532,3.575-1.479L12.545,12.151z"
                />
              </svg>
              {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            {language === 'es'
              ? '¿No tienes una cuenta? Regístrate'
              : "Don't have an account? Sign up"}
          </Link>
        </div>
      </div>
    </div>
  );
} 