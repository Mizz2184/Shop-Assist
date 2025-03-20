import { useState, useEffect, useCallback, useRef } from 'react';
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

// Increase throttle delay to reduce server load
const THROTTLE_DELAY = 2000; // 2 seconds
const INITIALIZATION_DELAY = 500; // 0.5 seconds
const lastRequestTime = new Map<string, number>();

// Helper function to check if we should throttle a request
const shouldThrottle = (key: string): boolean => {
  const now = Date.now();
  const last = lastRequestTime.get(key);
  if (!last) {
    lastRequestTime.set(key, now);
    return false;
  }
  if (now - last < THROTTLE_DELAY) {
    return true;
  }
  lastRequestTime.set(key, now);
  return false;
};

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useFamily = (initialFamilyId?: string) => {
  const router = useRouter();
  const { session, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [currentFamily, setCurrentFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedGroceryList[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasInitializedRef = useRef(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch family groups with retry logic and throttling
  const fetchFamilyGroups = useCallback(async () => {
    try {
      // Get a fresh access token
      const token = await getAccessToken();
      if (!token) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }

      // Check if we should throttle this request
      if (shouldThrottle('fetchFamilyGroups')) {
        await wait(THROTTLE_DELAY);
      }

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/family', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Family groups API error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        throw new Error(`Failed to fetch family groups: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      console.log('Family groups fetched:', data.length, 'groups');
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Family groups fetch was aborted');
        return [];
      }

      console.error('Error fetching family groups:', error);
      if (error.message.includes('session has expired')) {
        router.push('/login');
      }
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [getAccessToken, router]);

  // Create family group
  const createFamilyGroup = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        const error = 'No session available';
        console.error(error);
        toast.error(error);
        return null;
      }

      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
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

      // Update the family groups state with the new group
      setFamilyGroups((prev) => [...prev, data]);
      toast.success('Family group created successfully');
      return data;
    } catch (error) {
      console.error('Error creating family group:', error);
      setError(error instanceof Error ? error.message : 'Failed to create family group');
      toast.error(error instanceof Error ? error.message : 'Failed to create family group');
      return null;
    } finally {
      setLoading(false);
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
      if (!session) {
        throw new Error('You must be logged in to create invitations');
      }

      console.log('Creating invitation with session:', {
        hasAccessToken: !!session.access_token,
        email,
        role
      });

      const response = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ familyId, email, role })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create invitation:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to send invitations in this family group.');
        } else if (response.status === 400 && errorData.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error(`Failed to create invitation: ${errorData.error || response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('Invitation created successfully:', data);
      
      setInvitations((prev) => [...prev, data.invitation]);
      toast.success('Invitation sent successfully');
      return data.invitation;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
      return null;
    }
  }, [session, toast]);

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
      if (!session) {
        throw new Error('You must be logged in to cancel invitations');
      }

      const response = await fetch(`/api/family/invitations?id=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('Cancel invitation error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to cancel this invitation.');
        } else if (response.status === 404) {
          throw new Error('Invitation not found.');
        } else {
          throw new Error(errorData.error || 'Failed to cancel invitation');
        }
      }

      setInvitations((prev) =>
        prev.filter((invitation) => invitation.id !== invitationId)
      );
      toast.success('Invitation cancelled successfully');
      return true;
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error(error.message || 'Failed to cancel invitation');
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
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        console.log('No session available, skipping family data fetch');
        setCurrentFamily(null);
        setMembers([]);
        setInvitations([]);
        setSharedLists([]);
        return;
      }

      if (!familyId) {
        setCurrentFamily(null);
        setMembers([]);
        setInvitations([]);
        setSharedLists([]);
        return;
      }

      const family = familyGroups.find((group) => group.id === familyId);
      if (!family) {
        console.error('Family not found:', familyId);
        setError('Family not found');
        return;
      }

      setCurrentFamily(family);
      
      // Fetch each data type independently to avoid one failure affecting others
      const fetchPromises = [];

      try {
        const membersPromise = fetchFamilyMembers(familyId)
          .then(result => {
            if (result) setMembers(result);
          })
          .catch(error => {
            console.error('Error fetching family members:', error);
          });
        fetchPromises.push(membersPromise);

        const invitationsPromise = fetchInvitations(familyId)
          .then(result => {
            if (result) setInvitations(result);
          })
          .catch(error => {
            console.error('Error fetching invitations:', error);
          });
        fetchPromises.push(invitationsPromise);

        const listsPromise = fetchSharedLists(familyId)
          .then(result => {
            if (result) setSharedLists(result);
          })
          .catch(error => {
            console.error('Error fetching shared lists:', error);
          });
        fetchPromises.push(listsPromise);

        // Wait for all fetches to complete
        await Promise.all(fetchPromises);
      } catch (error) {
        console.error('Error fetching family data:', error);
        setError('Failed to fetch family data');
      }
    } finally {
      setLoading(false);
    }
  }, [familyGroups, fetchFamilyMembers, fetchInvitations, fetchSharedLists, session]);

  // Initialize family groups and current family
  useEffect(() => {
    let isMounted = true;

    const initializeFamily = async () => {
      // If already initialized or no session, don't proceed
      if (hasInitializedRef.current || !session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add a small delay before initialization to prevent race conditions
        await wait(INITIALIZATION_DELAY);

        // Only proceed if still mounted and not initialized
        if (!isMounted || hasInitializedRef.current) return;

        const groups = await fetchFamilyGroups();
        
        // Only proceed if still mounted
        if (!isMounted) return;

        if (Array.isArray(groups)) {
          setFamilyGroups(groups);
          hasInitializedRef.current = true;

          // If we have an initial family ID, set it
          if (initialFamilyId) {
            const family = groups.find((g) => g.id === initialFamilyId);
            if (family) {
              setCurrentFamily(family);
            }
          }
        }

        // Fetch notifications after a delay
        if (isMounted) {
          initializationTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              fetchNotifications().catch(console.error);
            }
          }, THROTTLE_DELAY);
        }
      } catch (error: any) {
        if (isMounted && error.name !== 'AbortError') {
          console.error('Error initializing family:', error);
          setError(error.message || 'Failed to initialize family data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeFamily();

    return () => {
      isMounted = false;
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      lastRequestTime.clear();
    };
  }, [fetchFamilyGroups, fetchNotifications, initialFamilyId, session?.access_token]);

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

  // Clean up function
  useEffect(() => {
    return () => {
      // Abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear request timestamps
      lastRequestTime.clear();
    };
  }, []);

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