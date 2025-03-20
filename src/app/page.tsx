'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading animation while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingAnimation text="Preparing your shopping experience..." />
    </div>
  );
} 