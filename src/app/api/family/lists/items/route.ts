import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Add an item to a shared grocery list
export async function POST(request: NextRequest) {
  try {
    const { listId, productId, quantity = 1, notes = '' } = await request.json();

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the list and check permissions
    const { data: list, error: listError } = await supabase
      .from('shared_grocery_lists')
      .select('family_id')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: 'Invalid list' },
        { status: 404 }
      );
    }

    // Check if user is a member with appropriate permissions
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role === 'viewer') {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or admin access required' },
        { status: 403 }
      );
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Invalid product' },
        { status: 404 }
      );
    }

    // Add the item to the list
    const { data: item, error: itemError } = await supabase
      .from('shared_list_items')
      .insert({
        id: uuidv4(),
        list_id: listId,
        product_id: productId,
        quantity,
        notes,
        added_by: user.id
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error adding item to shared list:', itemError);
      return NextResponse.json(
        { error: 'Failed to add item to shared list' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase
      .from('list_activity_log')
      .insert({
        list_id: listId,
        user_id: user.id,
        action: 'added_item',
        details: `Added ${quantity}x "${product.name}" to the list`
      });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Get items from a shared grocery list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    if (!listId) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the list and check permissions
    const { data: list, error: listError } = await supabase
      .from('shared_grocery_lists')
      .select('family_id')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: 'Invalid list' },
        { status: 404 }
      );
    }

    // Check if user is a member of the family group
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Unauthorized - Family member access required' },
        { status: 403 }
      );
    }

    // Get all items in the list with product details
    const { data: items, error: itemsError } = await supabase
      .from('shared_list_items')
      .select(`
        *,
        product:products(*),
        added_by_user:profiles!added_by(name)
      `)
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching shared list items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch shared list items' },
        { status: 500 }
      );
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Update an item in a shared grocery list
export async function PUT(request: NextRequest) {
  try {
    const { itemId, quantity, notes = '' } = await request.json();

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the item and list details
    const { data: item, error: itemError } = await supabase
      .from('shared_list_items')
      .select(`
        *,
        list:shared_grocery_lists!inner(family_id),
        product:products!inner(name)
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Invalid item' },
        { status: 404 }
      );
    }

    // Check if user is a member with appropriate permissions
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', item.list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role === 'viewer') {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or admin access required' },
        { status: 403 }
      );
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('shared_list_items')
      .update({
        quantity,
        notes,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shared list item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shared list item' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase
      .from('list_activity_log')
      .insert({
        list_id: item.list_id,
        user_id: user.id,
        action: 'updated_item',
        details: `Updated "${item.product.name}" quantity to ${quantity}`
      });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Remove an item from a shared grocery list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the item and list details
    const { data: item, error: itemError } = await supabase
      .from('shared_list_items')
      .select(`
        *,
        list:shared_grocery_lists!inner(family_id),
        product:products!inner(name)
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Invalid item' },
        { status: 404 }
      );
    }

    // Check if user is a member with appropriate permissions
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', item.list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role === 'viewer') {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or admin access required' },
        { status: 403 }
      );
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('shared_list_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error removing shared list item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove shared list item' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase
      .from('list_activity_log')
      .insert({
        list_id: item.list_id,
        user_id: user.id,
        action: 'removed_item',
        details: `Removed "${item.product.name}" from the list`
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 