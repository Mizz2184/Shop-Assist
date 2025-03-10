'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Wrapper component that provides context
export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </AppProvider>
    </AuthProvider>
  );
}

// Inner component that can use the context
function ClientLayoutContent({ children }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  // For login and register pages, render without navigation
  const isAuthPage = typeof window !== 'undefined' && 
    (window.location.pathname === '/login' || 
     window.location.pathname === '/register' || 
     window.location.pathname === '/forgot-password');

  // If user is not authenticated or we're on an auth page, render without navigation
  if (!user || isAuthPage) {
    return (
      <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
        {children}
      </div>
    );
  }

  // For authenticated users on non-auth pages, render with navigation
  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-40 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        {/* Mobile Sidebar Toggle */}
        <button 
          className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-white dark:bg-black transition-colors duration-200">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
} 