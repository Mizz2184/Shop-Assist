'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';

export default function SignupEmailOnly() {
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

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          {language === 'es' ? 'Crear Cuenta' : 'Sign Up'} (Email Only)
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
        
        <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded">
          <p className="text-sm">
            {language === 'es' 
              ? 'Esta es una versión simplificada de la página de registro que solo utiliza autenticación por correo electrónico.' 
              : 'This is a simplified version of the signup page that only uses email authentication.'}
          </p>
        </div>
        
        <p className="mt-4 text-center text-sm">
          {language === 'es' ? '¿Ya tienes una cuenta?' : 'Already have an account?'}{' '}
          <Link href="/auth/login-email-only" className="text-primary hover:underline">
            {language === 'es' ? 'Iniciar Sesión' : 'Login'}
          </Link>
        </p>
        
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/auth/signup" className="text-gray-400 hover:underline">
            {language === 'es' ? 'Página de registro completa' : 'Full signup page'}
          </Link>
          <Link href="/auth/fix-auth" className="text-gray-400 hover:underline">
            {language === 'es' ? 'Solucionar problemas' : 'Troubleshoot'}
          </Link>
        </div>
      </div>
    </main>
  );
} 