import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  FamilyGroup,
  FamilyMember,
  FamilyInvitation,
  SharedGroceryList,
  Notification,
  FamilyRole
} from '@/types/family';
import { subscribeToFamilyUpdates, unsubscribeFromFamilyUpdates } from '@/lib/realtime';

export const useFamily = (initialFamilyId?: string) => {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [currentFamily, setCurrentFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedGroceryList[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch family groups
  const fetchFamilyGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/family', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch family groups');
      const data = await response.json();
      setFamilyGroups(data);
      return data;
    } catch (error) {
      console.error('Error fetching family groups:', error);
      setError('Failed to fetch family groups');
      return [];
    }
  }, [session]);

  // Create family group
  const createFamilyGroup = useCallback(async (name: string) => {
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Failed to create family group';
        console.error('Server error:', data);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      setFamilyGroups((prev) => [...prev, data]);
      toast.success('Family group created successfully');
      return data;
    } catch (error) {
      console.error('Error creating family group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create family group');
      return null;
    }
  }, [session]);

  // Update family group
  const updateFamilyGroup = useCallback(async (id: string, name: string) => {
    try {
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, name })
      });
      if (!response.ok) throw new Error('Failed to update family group');
      const data = await response.json();
      setFamilyGroups((prev) =>
        prev.map((group) => (group.id === id ? data : group))
      );
      if (currentFamily?.id === id) {
        setCurrentFamily(data);
      }
      toast.success('Family group updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating family group:', error);
      toast.error('Failed to update family group');
      return null;
    }
  }, [currentFamily, session]);

  // Delete family group
  const deleteFamilyGroup = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/family?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete family group');
      setFamilyGroups((prev) => prev.filter((group) => group.id !== id));
      if (currentFamily?.id === id) {
        setCurrentFamily(null);
        router.push('/family');
      }
      toast.success('Family group deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting family group:', error);
      toast.error('Failed to delete family group');
      return false;
    }
  }, [currentFamily, router, session]);

  // Fetch family members
  const fetchFamilyMembers = useCallback(async (familyId: string) => {
    try {
      const response = await fetch(`/api/family/members?familyId=${familyId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch family members');
      const data = await response.json();
      setMembers(data);
      return data;
    } catch (error) {
      console.error('Error fetching family members:', error);
      setError('Failed to fetch family members');
      return [];
    }
  }, [session]);

  // Update member role
  const updateMemberRole = useCallback(async (
    familyId: string,
    userId: string,
    role: FamilyRole
  ) => {
    try {
      const response = await fetch('/api/family/members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ familyId, userId, role })
      });
      if (!response.ok) throw new Error('Failed to update member role');
      const data = await response.json();
      setMembers((prev) =>
        prev.map((member) =>
          member.user_id === userId ? { ...member, role } : member
        )
      );
      toast.success('Member role updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
      return null;
    }
  }, [session]);

  // Remove member
  const removeMember = useCallback(async (familyId: string, userId: string) => {
    try {
      const response = await fetch(
        `/api/family/members?familyId=${familyId}&userId=${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to remove member');
      setMembers((prev) => prev.filter((member) => member.user_id !== userId));
      toast.success('Member removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
      return false;
    }
  }, [session]);

  // Create invitation
  const createInvitation = useCallback(async (
    familyId: string,
    email: string,
    role: FamilyRole
  ) => {
    try {
      const response = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ familyId, email, role })
      });
      if (!response.ok) throw new Error('Failed to create invitation');
      const data = await response.json();
      setInvitations((prev) => [...prev, data]);
      toast.success('Invitation sent successfully');
      return data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to send invitation');
      return null;
    }
  }, [session]);

  // Fetch invitations
  const fetchInvitations = useCallback(async (familyId: string) => {
    try {
      const response = await fetch(`/api/family/invitations?familyId=${familyId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const data = await response.json();
      setInvitations(data);
      return data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setError('Failed to fetch invitations');
      return [];
    }
  }, [session]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const response = await fetch(`/api/family/invitations?id=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to cancel invitation');
      setInvitations((prev) =>
        prev.filter((invitation) => invitation.id !== invitationId)
      );
      toast.success('Invitation cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
      return false;
    }
  }, [session]);

  // Create shared list
  const createSharedList = useCallback(async (
    familyId: string,
    name: string
  ) => {
    try {
      const response = await fetch('/api/family/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ familyId, name })
      });
      if (!response.ok) throw new Error('Failed to create shared list');
      const data = await response.json();
      setSharedLists((prev) => [...prev, data]);
      toast.success('Shared list created successfully');
      return data;
    } catch (error) {
      console.error('Error creating shared list:', error);
      toast.error('Failed to create shared list');
      return null;
    }
  }, [session]);

  // Fetch shared lists
  const fetchSharedLists = useCallback(async (familyId: string) => {
    try {
      const response = await fetch(`/api/family/lists?familyId=${familyId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch shared lists');
      const data = await response.json();
      setSharedLists(data);
      return data;
    } catch (error) {
      console.error('Error fetching shared lists:', error);
      setError('Failed to fetch shared lists');
      return [];
    }
  }, [session]);

  // Update shared list
  const updateSharedList = useCallback(async (
    listId: string,
    name: string
  ) => {
    try {
      const response = await fetch('/api/family/lists', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ listId, name })
      });
      if (!response.ok) throw new Error('Failed to update shared list');
      const data = await response.json();
      setSharedLists((prev) =>
        prev.map((list) => (list.id === listId ? data : list))
      );
      toast.success('Shared list updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating shared list:', error);
      toast.error('Failed to update shared list');
      return null;
    }
  }, [session]);

  // Delete shared list
  const deleteSharedList = useCallback(async (listId: string) => {
    try {
      const response = await fetch(`/api/family/lists?id=${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete shared list');
      setSharedLists((prev) =>
        prev.filter((list) => list.id !== listId)
      );
      toast.success('Shared list deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting shared list:', error);
      toast.error('Failed to delete shared list');
      return false;
    }
  }, [session]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) {
      console.log('No session available, skipping notifications fetch');
      return [];
    }

    try {
      console.log('Fetching notifications with token:', session.access_token.substring(0, 10) + '...');
      const response = await fetch('/api/family/notifications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Notifications API error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to fetch notifications: ${response.status} ${errorData ? JSON.stringify(errorData) : ''}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from notifications API');
      }

      setNotifications(data);
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
      return [];
    }
  }, [session]);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/family/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ notificationIds })
      });
      if (!response.ok) throw new Error('Failed to mark notifications as read');
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }, [session]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/family/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [session]);

  // Set current family and fetch its data
  const setFamily = useCallback(async (familyId: string | null) => {
    if (!familyId) {
      setCurrentFamily(null);
      setMembers([]);
      setInvitations([]);
      setSharedLists([]);
      return;
    }

    const family = familyGroups.find((group) => group.id === familyId);
    if (family) {
      setCurrentFamily(family);
      await Promise.all([
        fetchFamilyMembers(familyId),
        fetchInvitations(familyId),
        fetchSharedLists(familyId)
      ]);
    }
  }, [familyGroups, fetchFamilyMembers, fetchInvitations, fetchSharedLists]);

  // Initialize family groups and current family
  useEffect(() => {
    if (!session?.access_token) {
      console.log('No session available, skipping initial data fetch');
      setLoading(false);
      return;
    }

    const initializeFamily = async () => {
      try {
        const groups = await fetchFamilyGroups();
        if (initialFamilyId) {
          const family = groups.find((g: FamilyGroup) => g.id === initialFamilyId);
          if (family) {
            setFamily(family);
          }
        }
        await fetchNotifications();
      } catch (error) {
        console.error('Error initializing family:', error);
        setError('Failed to initialize family data');
      } finally {
        setLoading(false);
      }
    };

    initializeFamily();
  }, [fetchFamilyGroups, fetchNotifications, initialFamilyId, setFamily, session]);

  // Set up real-time updates when current family changes
  useEffect(() => {
    if (!currentFamily) return;

    const unsubscribe = subscribeToFamilyUpdates(currentFamily.id, {
      onListUpdate: () => {
        fetchSharedLists(currentFamily.id);
      },
      onMemberUpdate: () => {
        fetchFamilyMembers(currentFamily.id);
      },
      onNotification: () => {
        fetchNotifications();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromFamilyUpdates();
    };
  }, [currentFamily, fetchFamilyMembers, fetchNotifications, fetchSharedLists]);

  return {
    loading,
    error,
    familyGroups,
    currentFamily,
    members,
    invitations,
    sharedLists,
    notifications,
    setFamily,
    createFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    updateMemberRole,
    removeMember,
    createInvitation,
    cancelInvitation,
    createSharedList,
    updateSharedList,
    deleteSharedList,
    fetchNotifications,
    markNotificationsAsRead,
    deleteNotification
  };
}; 