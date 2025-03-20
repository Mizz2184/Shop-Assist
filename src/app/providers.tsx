'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import ClientLayout from '@/components/ClientLayout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <FamilyProvider>
          <ClientLayout>{children}</ClientLayout>
        </FamilyProvider>
      </AppProvider>
    </AuthProvider>
  );
} 