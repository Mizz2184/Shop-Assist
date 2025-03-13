import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

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

    // Fetch items from Supabase for the authenticated user
    const { data, error } = await supabaseClient
      .from('grocery_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching grocery list:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grocery list' },
        { status: 500 }
      );
    }
    
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
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
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
      .eq('user_id', FIXED_USER_ID);
    
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