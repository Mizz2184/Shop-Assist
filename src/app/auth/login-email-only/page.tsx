'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import AuthRedirect from '@/components/auth/AuthRedirect';

// Loading component to show while the main component is loading
function LoginLoading() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    </div>
  );
}

// Main login component
function LoginEmailOnlyContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitation, setPendingInvitation] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useAppContext();
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    // Check if there's a pending invitation in localStorage
    const storedInvitation = localStorage.getItem('pendingInvitation');
    if (storedInvitation) {
      setPendingInvitation(storedInvitation);
    }
  }, []);

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
      
      // Redirect will be handled by AuthRedirect component if there's a pending invitation
      // Otherwise, redirect to the specified path or home page
      if (!pendingInvitation) {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(language === 'es' 
        ? 'Error al iniciar sesión. Por favor, verifique su correo electrónico y contraseña.' 
        : 'Login failed. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      {/* Include the AuthRedirect component to handle pending invitations */}
      <AuthRedirect />
      
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          {language === 'es' ? 'Iniciar Sesión' : 'Login'} (Email Only)
        </h1>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {pendingInvitation && (
          <div className="bg-blue-100 border border-blue-400 text-blue-800 p-3 rounded mb-4">
            {language === 'es' 
              ? 'Tienes una invitación pendiente. Inicia sesión para continuar.' 
              : 'You have a pending invitation. Please log in to continue.'}
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Correo Electrónico' : 'Email'}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Contraseña' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full bg-white text-black border border-black hover:bg-gray-100"
          >
            {isLoading
              ? language === 'es'
                ? 'Iniciando sesión...'
                : 'Logging in...'
              : language === 'es'
              ? 'Iniciar Sesión'
              : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded">
          <p className="text-sm">
            {language === 'es' 
              ? 'Esta es una versión simplificada de la página de inicio de sesión que solo utiliza autenticación por correo electrónico.' 
              : 'This is a simplified version of the login page that only uses email authentication.'}
          </p>
        </div>
        
        <p className="mt-4 text-center text-sm">
          {language === 'es' ? '¿No tienes una cuenta?' : "Don't have an account?"}{' '}
          <Link href="/auth/signup-email-only" className="text-primary hover:underline">
            {language === 'es' ? 'Regístrate' : 'Sign up'}
          </Link>
        </p>
        
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/auth/login" className="text-gray-400 hover:underline">
            {language === 'es' ? 'Página de inicio de sesión completa' : 'Full login page'}
          </Link>
          <Link href="/auth/fix-auth" className="text-gray-400 hover:underline">
            {language === 'es' ? 'Solucionar problemas' : 'Troubleshoot'}
          </Link>
        </div>
      </div>
    </main>
  );
}

// Export the component wrapped in Suspense
export default function LoginEmailOnly() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginEmailOnlyContent />
    </Suspense>
  );
} 