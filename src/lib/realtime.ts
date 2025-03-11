import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionCallbacks {
  onListUpdate?: (payload: any) => void;
  onMemberUpdate?: (payload: any) => void;
  onNotification?: (payload: any) => void;
}

let familyChannel: RealtimeChannel | null = null;

export const subscribeToFamilyUpdates = (
  familyId: string,
  callbacks: SubscriptionCallbacks
) => {
  // Unsubscribe from any existing subscription
  if (familyChannel) {
    familyChannel.unsubscribe();
  }

  // Create a new channel for the family group
  familyChannel = supabase.channel(`family:${familyId}`);

  // Subscribe to shared list changes
  if (callbacks.onListUpdate) {
    familyChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_grocery_lists',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => callbacks.onListUpdate?.(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_list_items',
          filter: `list_id=in.(select id from shared_grocery_lists where family_id='${familyId}')`
        },
        (payload) => callbacks.onListUpdate?.(payload)
      );
  }

  // Subscribe to member changes
  if (callbacks.onMemberUpdate) {
    familyChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'family_members',
        filter: `family_id=eq.${familyId}`
      },
      (payload) => callbacks.onMemberUpdate?.(payload)
    );
  }

  // Subscribe to notifications
  if (callbacks.onNotification) {
    familyChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => callbacks.onNotification?.(payload)
    );
  }

  // Subscribe to the channel
  familyChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`Subscribed to family updates for family ${familyId}`);
    } else if (status === 'CLOSED') {
      console.log(`Subscription closed for family ${familyId}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`Error in family subscription for family ${familyId}`);
    }
  });

  return () => {
    if (familyChannel) {
      familyChannel.unsubscribe();
      familyChannel = null;
    }
  };
};

export const unsubscribeFromFamilyUpdates = () => {
  if (familyChannel) {
    familyChannel.unsubscribe();
    familyChannel = null;
  }
};

// Helper function to create a notification
export const createNotification = async (
  userId: string,
  familyId: string,
  type: string,
  message: string,
  senderId: string
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        family_id: familyId,
        type,
        message,
        sender_id: senderId
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to notify all family members
export const notifyFamilyMembers = async (
  familyId: string,
  type: string,
  message: string,
  senderId: string,
  excludeUserId?: string
) => {
  try {
    // Get all family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId)
      .neq('user_id', excludeUserId || '');

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      return;
    }

    // Create notifications for all members
    const notifications = members.map((member) => ({
      user_id: member.user_id,
      family_id: familyId,
      type,
      message,
      sender_id: senderId
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating notifications:', error);
    }
  } catch (error) {
    console.error('Error notifying family members:', error);
  }
}; 