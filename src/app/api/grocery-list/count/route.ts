import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fixed user ID for demo purposes
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Count items in the grocery list for this user
    const { count, error } = await supabase
      .from('grocery_list')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error counting grocery list items:', error);
      return NextResponse.json(
        { error: 'Failed to count grocery list items' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Unexpected error counting grocery list items:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 