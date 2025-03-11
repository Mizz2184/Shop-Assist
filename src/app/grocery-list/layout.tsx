'use client';

import { FamilyProvider } from '@/contexts/FamilyContext';

export default function GroceryListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FamilyProvider>{children}</FamilyProvider>;
} 