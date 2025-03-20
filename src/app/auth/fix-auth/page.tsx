'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

export default function FixAuth() {
  const router = useRouter();
  const { user, session, signOut } = useAuth();
  const { language } = useAppContext();
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get auth-related information from localStorage
    const cv = localStorage.getItem('codeVerifier');
    const rt = localStorage.getItem('redirectTo');
    setCodeVerifier(cv);
    setRedirectTo(rt);

    // Get session information
    setAuthInfo({
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id || 'none',
      email: user?.email || 'none',
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'none',
    });
  }, [user, session]);

  const handleClearStorage = () => {
    localStorage.removeItem('codeVerifier');
    localStorage.removeItem('redirectTo');
    setCodeVerifier(null);
    setRedirectTo(null);
    setMessage(language === 'es' ? 'Almacenamiento local limpiado' : 'Local storage cleared');
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage(language === 'es' ? 'Sesión cerrada' : 'Signed out');
    router.push('/auth/login');
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'es' ? 'Solucionar problemas de autenticación' : 'Fix Authentication Issues'}
        </h1>

        {message && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {message}
          </div>
        )}

        <div className="bg-card-dark rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'es' ? 'Estado de autenticación' : 'Authentication Status'}
          </h2>
          
          {authInfo && (
            <div className="space-y-2">
              <p>
                <span className="font-medium">{language === 'es' ? 'Usuario autenticado:' : 'User authenticated:'}</span>{' '}
                {authInfo.hasUser ? '✅' : '❌'}
              </p>
              <p>
                <span className="font-medium">{language === 'es' ? 'Sesión activa:' : 'Active session:'}</span>{' '}
                {authInfo.hasSession ? '✅' : '❌'}
              </p>
              <p>
                <span className="font-medium">{language === 'es' ? 'ID de usuario:' : 'User ID:'}</span>{' '}
                {authInfo.userId}
              </p>
              <p>
                <span className="font-medium">{language === 'es' ? 'Correo electrónico:' : 'Email:'}</span>{' '}
                {authInfo.email}
              </p>
              <p>
                <span className="font-medium">{language === 'es' ? 'Expiración de sesión:' : 'Session expiry:'}</span>{' '}
                {authInfo.sessionExpiry}
              </p>
            </div>
          )}
        </div>

        <div className="bg-card-dark rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'es' ? 'Datos de autenticación almacenados' : 'Stored Authentication Data'}
          </h2>
          
          <div className="space-y-2">
            <p>
              <span className="font-medium">{language === 'es' ? 'Verificador de código:' : 'Code verifier:'}</span>{' '}
              {codeVerifier ? '✅ ' + codeVerifier.substring(0, 10) + '...' : '❌ ' + (language === 'es' ? 'No encontrado' : 'Not found')}
            </p>
            <p>
              <span className="font-medium">{language === 'es' ? 'Redirigir a:' : 'Redirect to:'}</span>{' '}
              {redirectTo || (language === 'es' ? 'No establecido' : 'Not set')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleClearStorage}
            className="btn bg-yellow-600 hover:bg-yellow-700"
          >
            {language === 'es' ? 'Limpiar almacenamiento local' : 'Clear local storage'}
          </button>
          
          <button
            onClick={handleSignOut}
            className="btn bg-red-600 hover:bg-red-700"
          >
            {language === 'es' ? 'Cerrar sesión' : 'Sign out'}
          </button>
          
          <button
            onClick={() => router.push('/auth/login')}
            className="btn bg-blue-600 hover:bg-blue-700"
          >
            {language === 'es' ? 'Ir a iniciar sesión' : 'Go to login'}
          </button>
        </div>
      </div>
    </main>
  );
} 