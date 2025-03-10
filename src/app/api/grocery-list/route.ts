import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Fixed user ID for demo purposes
const FIXED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Get all items in the grocery list
export async function GET(request: NextRequest) {
  try {
    // Fetch items from Supabase
    const { data, error } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('user_id', FIXED_USER_ID)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching grocery list:', error);
      return NextResponse.json([], { status: 500 });
    }
    
    return NextResponse.json(data || []);
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
    const body = await request.json();
    
    // Log the received product data
    console.log('Received product data:', JSON.stringify(body, null, 2));
    
    // Generate a unique ID
    const id = uuidv4();
    
    // Prepare the item for insertion
    const item = {
      id,
      user_id: FIXED_USER_ID,
      name: body.name || 'Unknown Product',
      brand: body.brand || '',
      description: body.description || '',
      price: typeof body.price === 'number' ? body.price : 0,
      imageUrl: body.imageUrl || '',
      store: body.store || '',
      url: body.url || ''
      // Removed category and ean fields as they might not exist in the table
    };
    
    // Insert into Supabase
    let { error } = await supabase
      .from('grocery_list')
      .insert(item);
    
    // If there's an error related to missing columns, try a more minimal insert
    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      console.log('Trying minimal insert due to schema mismatch');
      const minimalItem = {
        id,
        user_id: FIXED_USER_ID,
        name: body.name || 'Unknown Product',
        price: typeof body.price === 'number' ? body.price : 0,
        store: body.store || '',
        created_at: new Date().toISOString()
      };
      
      const { error: minimalError } = await supabase
        .from('grocery_list')
        .insert(minimalItem);
        
      error = minimalError;
    }
    
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