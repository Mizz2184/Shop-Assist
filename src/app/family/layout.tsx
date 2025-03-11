'use client';

import { FamilyProvider } from '@/contexts/FamilyContext';

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FamilyProvider>{children}</FamilyProvider>;
} 