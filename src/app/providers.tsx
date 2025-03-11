'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import ClientLayout from '@/components/ClientLayout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <ClientLayout>{children}</ClientLayout>
      </AppProvider>
    </AuthProvider>
  );
} 