import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory cache for grocery list data
// This will help reduce database queries
const cache = new Map<string, { data: any; timestamp: number }>();
const cacheTTL = 30 * 1000; // 30 seconds cache TTL

// Rate limiting
const rateLimit = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 10000; // 10 seconds

// Get all items in the grocery list
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const userId = user.id;
    const now = Date.now();
    const userRequests = rateLimit.get(userId) || [];
    
    // Remove requests outside the current window
    const recentRequests = userRequests.filter((timestamp: number) => now - timestamp < WINDOW_MS);
    
    // Check if user has exceeded rate limit
    if (recentRequests.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later' },
        { status: 429 }
      );
    }
    
    // Update rate limit tracking
    recentRequests.push(now);
    rateLimit.set(userId, recentRequests);

    // Check cache first
    const cacheKey = `grocery_list_${userId}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && cachedData.timestamp > now - cacheTTL) {
      return NextResponse.json({ data: cachedData.data || [] });
    }

    // Fetch items from Supabase for the authenticated user
    // Limit the number of items to reduce memory usage
    const { data, error } = await supabaseClient
      .from('grocery_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to 100 items to prevent excessive memory usage
    
    if (error) {
      console.error('Error fetching grocery list:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grocery list' },
        { status: 500 }
      );
    }
    
    // Update cache
    cache.set(cacheKey, {
      data,
      timestamp: now
    });
    
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Grocery list API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Add an item to the grocery list
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Log the received product data
    console.log('Received product data:', JSON.stringify(body, null, 2));
    
    // Generate a unique ID
    const id = uuidv4();
    
    // Prepare the item for insertion
    const item = {
      id,
      user_id: user.id,
      name: body.name || 'Unknown Product',
      brand: body.brand || '',
      description: body.description || '',
      price: typeof body.price === 'number' ? body.price : 0,
      imageUrl: body.imageUrl || '',
      store: body.store || '',
      url: body.url || '',
      created_at: new Date().toISOString()
    };
    
    // Insert into Supabase
    const { error } = await supabaseClient
      .from('grocery_list')
      .insert(item);
    
    if (error) {
      console.error('Error adding item to grocery list:', error);
      return NextResponse.json(
        { error: 'Failed to add item to grocery list', details: error },
        { status: 500 }
      );
    }
    
    // Return success response with the item ID
    return NextResponse.json({ 
      id,
      success: true 
    });
  } catch (error) {
    console.error('Error adding to grocery list:', error);
    return NextResponse.json(
      { error: 'Failed to add item to grocery list' },
      { status: 500 }
    );
  }
}

// Remove an item from the grocery list
export async function DELETE(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Create a new Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
    
    // Get the item ID from the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    // Delete from Supabase
    const { error } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error removing item from grocery list:', error);
      return NextResponse.json(
        { error: 'Failed to remove item from grocery list' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from grocery list:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from grocery list' },
      { status: 500 }
    );
  }
}