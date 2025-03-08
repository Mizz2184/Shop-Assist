'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FixAuth() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  const testAuth = async () => {
    setIsLoading(true);
    try {
      // Test email/password auth
      const emailResult = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      // Test Google OAuth
      let googleResult;
      try {
        googleResult = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      } catch (error) {
        googleResult = { error };
      }

      // Get available providers
      const { data } = await supabase.auth.getSession();
      
      setTestResult({
        emailAuth: {
          success: !emailResult.error,
          error: emailResult.error,
        },
        googleAuth: {
          success: !googleResult.error,
          error: googleResult.error,
        },
        session: data,
      });

      // Determine which providers are enabled
      const enabledProviders = [];
      if (!emailResult.error || emailResult.error.message.includes('Invalid login credentials')) {
        enabledProviders.push('email');
      }
      if (!googleResult.error) {
        enabledProviders.push('google');
      }
      setProviders(enabledProviders);
    } catch (error) {
      console.error('Auth test error:', error);
      setTestResult({ error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Troubleshooter</h1>
        
        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="mb-2">
            You're seeing the error: <code className="bg-yellow-200 px-2 py-1 rounded">"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"</code>
          </p>
          <p>
            This means that the authentication provider you're trying to use (Google) is not enabled in your Supabase project.
          </p>
        </div>
        
        <div className="mb-8">
          <button
            onClick={testAuth}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Authentication'}
          </button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Test Results:</h3>
              <div className="mb-2">
                <span className="font-semibold">Email/Password Auth:</span>{' '}
                {testResult.emailAuth.success ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-red-600">
                    Error: {testResult.emailAuth.error?.message || 'Unknown error'}
                  </span>
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Google OAuth:</span>{' '}
                {testResult.googleAuth.success ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-red-600">
                    Error: {testResult.googleAuth.error?.message || 'Unknown error'}
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold">Enabled Providers:</span>{' '}
                {providers.length > 0 ? providers.join(', ') : 'None detected'}
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Fix</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <p className="font-semibold">Go to your Supabase Dashboard</p>
              <p>Visit <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://app.supabase.com</a> and select your project.</p>
            </li>
            <li>
              <p className="font-semibold">Navigate to Authentication Settings</p>
              <p>In the left sidebar, click on <strong>Authentication</strong>, then select <strong>Providers</strong>.</p>
            </li>
            <li>
              <p className="font-semibold">Enable Google Provider</p>
              <p>Find the Google provider in the list and toggle it to enable it.</p>
              <p>You'll need to provide:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Client ID</strong> - From your Google Cloud Console</li>
                <li><strong>Client Secret</strong> - From your Google Cloud Console</li>
              </ul>
            </li>
            <li>
              <p className="font-semibold">Set up Google OAuth Credentials</p>
              <p>If you don't have Google OAuth credentials yet:</p>
              <ol className="list-decimal pl-6 mt-2">
                <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Navigate to "APIs & Services" {'>'} "Credentials"</li>
                <li>Click "Create Credentials" {'>'} "OAuth client ID"</li>
                <li>Set the application type to "Web application"</li>
                <li>Add your Supabase redirect URI: <code className="bg-gray-200 px-2 py-1 rounded">{`https://rcmuzstcirbulftnbcth.supabase.co/auth/v1/callback`}</code></li>
                <li>Create the credentials and copy the Client ID and Client Secret</li>
              </ol>
            </li>
            <li>
              <p className="font-semibold">Save Changes</p>
              <p>After entering your Google OAuth credentials in Supabase, save the changes.</p>
            </li>
            <li>
              <p className="font-semibold">Test Authentication</p>
              <p>Return to your application and try logging in with Google again.</p>
            </li>
          </ol>
        </div>
        
        <div className="mb-8 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded">
          <h3 className="font-bold mb-2">Alternative: Use Email Authentication Only</h3>
          <p className="mb-2">
            If you don't want to set up Google OAuth, you can modify your application to only use email/password authentication:
          </p>
          <ol className="list-decimal pl-6">
            <li>Remove or hide the "Continue with Google" buttons from your login and signup pages</li>
            <li>Focus on improving the email/password authentication experience</li>
          </ol>
        </div>
        
        <div className="flex space-x-4">
          <Link href="/auth/login" className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100">
            Back to Login
          </Link>
          <Link href="/" className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
} 