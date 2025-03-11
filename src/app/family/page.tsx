'use client';

import { useState } from 'react';
import { useAppFamily } from '@/contexts/FamilyContext';
import { FamilyGroups } from '@/components/family/FamilyGroups';
import { FamilyMembers } from '@/components/family/FamilyMembers';
import { SharedLists } from '@/components/family/SharedLists';
import { Notifications } from '@/components/family/Notifications';
import { cn } from '@/lib/utils';

type Tab = 'groups' | 'members' | 'lists' | 'notifications';

interface TabItem {
  id: Tab;
  label: string;
  disabled?: boolean;
}

export default function FamilyPage() {
  const { currentFamily } = useAppFamily();
  const [activeTab, setActiveTab] = useState<Tab>('groups');

  const tabs: TabItem[] = [
    { id: 'groups', label: 'Family Groups' },
    { id: 'members', label: 'Members', disabled: !currentFamily },
    { id: 'lists', label: 'Shared Lists', disabled: !currentFamily },
    { id: 'notifications', label: 'Notifications' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Family Sharing</h1>
        {currentFamily && (
          <p className="mt-2 text-muted-foreground">
            Current Family: {currentFamily.name}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground',
                tab.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'groups' && <FamilyGroups />}
        {activeTab === 'members' && <FamilyMembers />}
        {activeTab === 'lists' && <SharedLists />}
        {activeTab === 'notifications' && <Notifications />}
      </div>
    </div>
  );
} 