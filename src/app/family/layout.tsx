'use client';

import { Suspense } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingAnimation text="Loading family data..." />}>
      {children}
    </Suspense>
  );
} 