import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get the user from the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    console.log('Fetching notifications for user:', user.id);

    // First, get all notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notifications')
      .select(`
        id,
        user_id,
        family_id,
        sender_id,
        type,
        message,
        read,
        read_at,
        created_at,
        family:family_groups(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: fetchError.message },
        { status: 500 }
      );
    }

    // Then, get sender profiles for all notifications that have a sender_id
    const senderIds = notifications
      ?.filter(n => n.sender_id)
      .map(n => n.sender_id) || [];

    const { data: senderProfiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', senderIds);

    if (profilesError) {
      console.error('Error fetching sender profiles:', profilesError);
    }

    // Create a map of sender profiles for easy lookup
    const senderProfileMap = new Map(
      senderProfiles?.map(profile => [profile.id, profile]) || []
    );

    // Transform notifications to include sender information
    const transformedNotifications = notifications?.map(notification => ({
      ...notification,
      sender: notification.sender_id
        ? senderProfileMap.get(notification.sender_id) || { name: 'Unknown User', avatar_url: null }
        : { name: 'System', avatar_url: null }
    })) || [];

    return NextResponse.json(transformedNotifications);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Get the user from the token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get notification IDs from request body
    const { notificationIds } = await request.json();
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update notifications
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notificationIds)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Get the user from the token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get notification ID from URL
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    if (!notificationId) {
      return NextResponse.json(
        { error: 'No notification ID provided' },
        { status: 400 }
      );
    }

    // Delete notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 