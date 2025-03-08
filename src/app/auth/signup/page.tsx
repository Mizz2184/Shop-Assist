'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { language } = useAppContext();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError(language === 'es'
        ? 'Las contraseñas no coinciden'
        : 'Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      // Create user with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      // Check if user was created successfully
      if (data?.user) {
        // Redirect to home page or verification page
        router.push('/auth/verification');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(language === 'es'
        ? 'Error al crear la cuenta. Por favor, inténtelo de nuevo.'
        : 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      // The redirect is handled by Supabase OAuth
    } catch (error: any) {
      console.error('Google signup error:', error);
      setError(language === 'es'
        ? 'Error al registrarse con Google. Por favor, inténtelo de nuevo.'
        : 'Google signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          {language === 'es' ? 'Crear Cuenta' : 'Sign Up'}
        </h1>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Nombre' : 'Name'}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          
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
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn w-full bg-white text-black border border-black hover:bg-gray-100"
          >
            {isLoading
              ? language === 'es'
                ? 'Registrando...'
                : 'Signing up...'
              : language === 'es'
              ? 'Registrarse'
              : 'Sign Up'}
          </button>
        </form>
        
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="px-3 text-sm text-gray-400">
            {language === 'es' ? 'O' : 'OR'}
          </span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>
        
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="btn w-full bg-white text-black border border-black hover:bg-gray-100 flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="24px"
            height="24px"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
        </button>
        
        <p className="mt-4 text-center text-sm">
          {language === 'es' ? '¿Ya tienes una cuenta?' : 'Already have an account?'}{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            {language === 'es' ? 'Iniciar Sesión' : 'Login'}
          </Link>
        </p>
        
        <div className="mt-6 text-center text-sm space-y-2">
          <p>
            <Link href="/auth/signup-email-only" className="text-primary hover:underline">
              {language === 'es' ? 'Usar solo registro con correo' : 'Use email-only signup'}
            </Link>
          </p>
          <p>
            <Link href="/auth/fix-auth" className="text-primary hover:underline">
              {language === 'es' ? 'Solucionar problemas de autenticación' : 'Troubleshoot authentication issues'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 