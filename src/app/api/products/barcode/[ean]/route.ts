import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Product } from '@/types/product';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { ean: string } }
): Promise<NextResponse> {
  try {
    const { ean } = params;

    // Search for product by EAN in Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('ean', ean)
      .single();

    if (error) {
      console.error('Error searching for product by EAN:', error);
      return NextResponse.json(
        { error: 'Failed to search for product' },
        { status: 500 }
      );
    }

    if (!products) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in barcode search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 