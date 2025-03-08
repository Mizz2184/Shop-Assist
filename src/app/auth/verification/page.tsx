'use client';

import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';

export default function Verification() {
  const { language } = useAppContext();

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-card-dark rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'es' ? 'Verificación de Correo' : 'Email Verification'}
        </h1>
        
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p className="text-lg mb-4">
            {language === 'es' 
              ? 'Hemos enviado un correo de verificación a tu dirección de correo electrónico.' 
              : 'We have sent a verification email to your email address.'}
          </p>
          
          <p className="text-gray-400 mb-6">
            {language === 'es'
              ? 'Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.'
              : 'Please check your inbox and click the verification link to activate your account.'}
          </p>
          
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-300">
              {language === 'es'
                ? 'Si no recibes el correo en unos minutos, revisa tu carpeta de spam o solicita un nuevo correo de verificación.'
                : 'If you don\'t receive the email in a few minutes, check your spam folder or request a new verification email.'}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/auth/login" 
            className="btn w-full bg-white text-black border border-black hover:bg-gray-100 block text-center"
          >
            {language === 'es' ? 'Ir a Iniciar Sesión' : 'Go to Login'}
          </Link>
          <Link 
            href="/" 
            className="btn w-full bg-white text-black border border-black hover:bg-gray-100 block mt-4 text-center"
          >
            {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </main>
  );
} 