'use client';

import { Suspense } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function GroceryListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingAnimation text="Loading grocery list..." />}>
      {children}
    </Suspense>
  );
} 