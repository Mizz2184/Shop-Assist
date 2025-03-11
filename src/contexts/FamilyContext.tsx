import { createContext, useContext, ReactNode } from 'react';
import { useFamily } from '@/hooks/useFamily';
import {
  FamilyGroup,
  FamilyMember,
  FamilyInvitation,
  SharedGroceryList,
  Notification,
  FamilyRole
} from '@/types/family';

interface FamilyContextType {
  loading: boolean;
  error: string | null;
  familyGroups: FamilyGroup[];
  currentFamily: FamilyGroup | null;
  members: FamilyMember[];
  invitations: FamilyInvitation[];
  sharedLists: SharedGroceryList[];
  notifications: Notification[];
  setFamily: (familyId: string | null) => Promise<void>;
  createFamilyGroup: (name: string) => Promise<FamilyGroup | null>;
  updateFamilyGroup: (id: string, name: string) => Promise<FamilyGroup | null>;
  deleteFamilyGroup: (id: string) => Promise<boolean>;
  updateMemberRole: (familyId: string, userId: string, role: FamilyRole) => Promise<FamilyMember | null>;
  removeMember: (familyId: string, userId: string) => Promise<boolean>;
  createInvitation: (familyId: string, email: string, role: FamilyRole) => Promise<FamilyInvitation | null>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  createSharedList: (familyId: string, name: string) => Promise<SharedGroceryList | null>;
  updateSharedList: (listId: string, name: string) => Promise<SharedGroceryList | null>;
  deleteSharedList: (listId: string) => Promise<boolean>;
  markNotificationsAsRead: (notificationIds: string[]) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

interface FamilyProviderProps {
  children: ReactNode;
  initialFamilyId?: string;
}

export const FamilyProvider = ({ children, initialFamilyId }: FamilyProviderProps) => {
  const familyState = useFamily(initialFamilyId);

  return (
    <FamilyContext.Provider value={familyState}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useAppFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useAppFamily must be used within a FamilyProvider');
  }
  return context;
}; 