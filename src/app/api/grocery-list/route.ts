import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Fixed user ID for demo purposes
const FIXED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Get all items in the grocery list
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('user_id', FIXED_USER_ID);

    if (error) {
      console.error('Error fetching grocery list:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to ensure consistent field names
    const transformedData = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      brand: item.brand,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl || item.imageurl, // Handle both cases
      store: item.store,
      url: item.url,
      createdAt: item.created_at
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in GET /api/grocery-list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grocery list' },
      { status: 500 }
    );
  }
}

// Add a new item to the grocery list
export async function POST(request: NextRequest) {
  try {
    // Parse the product data from the request
    const product = await request.json();
    
    // Log the received product for debugging
    console.log('Received product data:', JSON.stringify(product, null, 2));
    
    // Generate a proper UUID for the product
    // If the product ID is not in UUID format, generate a new one
    let productId = product.id;
    if (!isValidUUID(productId)) {
      console.log(`Converting non-UUID product ID "${productId}" to UUID format`);
      // Use the original ID as a seed for the UUID if possible
      productId = uuidv4();
    }
    
    // Create a clean product object with default values for all fields
    const cleanProduct = {
      id: productId,
      user_id: FIXED_USER_ID,
      name: product.name || 'Unknown Product',
      brand: product.brand || '',
      description: product.description || '',
      price: typeof product.price === 'number' ? product.price : 0,
      imageUrl: product.imageUrl || '',
      store: product.store || '',
      url: product.url || ''
    };
    
    console.log('Cleaned product data:', JSON.stringify(cleanProduct, null, 2));
    
    // First attempt: Direct insert with all fields
    try {
      console.log('Attempting direct insert with all fields...');
      const { data, error } = await supabase
        .from('grocery_list')
        .insert(cleanProduct)
        .select()
        .single();
      
      if (!error) {
        console.log('Successfully added product with direct insert:', data);
        return NextResponse.json({ success: true, item: data });
      }
      
      console.error('Error with direct insert:', error);
      
      // If there's an error with imageUrl field, try with lowercase
      if (error.message.includes('imageUrl')) {
        console.log('Trying with lowercase imageurl...');
        
        const lowercaseProduct = {
          ...cleanProduct,
          imageurl: cleanProduct.imageUrl // Use lowercase field name
        };
        
        // Remove the camelCase version
        delete lowercaseProduct.imageUrl;
        
        const { data: lowercaseData, error: lowercaseError } = await supabase
          .from('grocery_list')
          .insert(lowercaseProduct)
          .select()
          .single();
        
        if (!lowercaseError) {
          console.log('Successfully added product with lowercase imageurl:', lowercaseData);
          return NextResponse.json({ success: true, item: lowercaseData });
        }
        
        console.error('Error with lowercase imageurl:', lowercaseError);
      }
      
      // Try with minimal fields but include imageUrl
      console.log('Trying with minimal fields including imageUrl...');
      const minimalProduct = {
        id: cleanProduct.id,
        user_id: cleanProduct.user_id,
        name: cleanProduct.name,
        price: cleanProduct.price,
        imageUrl: cleanProduct.imageUrl,
        store: cleanProduct.store
      };
      
      const { data: minimalData, error: minimalError } = await supabase
        .from('grocery_list')
        .insert(minimalProduct)
        .select()
        .single();
      
      if (!minimalError) {
        console.log('Successfully added product with minimal fields:', minimalData);
        return NextResponse.json({ success: true, item: minimalData });
      }
      
      console.error('Error with minimal fields:', minimalError);
      
      // Try with even more minimal fields as a last resort
      console.log('Trying with absolute minimal fields...');
      const absoluteMinimalProduct = {
        id: cleanProduct.id,
        user_id: cleanProduct.user_id,
        name: cleanProduct.name,
        price: cleanProduct.price
      };
      
      const { data: absoluteMinimalData, error: absoluteMinimalError } = await supabase
        .from('grocery_list')
        .insert(absoluteMinimalProduct)
        .select()
        .single();
      
      if (!absoluteMinimalError) {
        console.log('Successfully added product with absolute minimal fields:', absoluteMinimalData);
        
        // Try to update the record to add the image URL
        const { error: updateError } = await supabase
          .from('grocery_list')
          .update({ 
            imageUrl: cleanProduct.imageUrl,
            store: cleanProduct.store,
            brand: cleanProduct.brand,
            description: cleanProduct.description,
            url: cleanProduct.url
          })
          .eq('id', cleanProduct.id);
          
        if (updateError) {
          console.error('Error updating product with additional fields:', updateError);
        } else {
          console.log('Successfully updated product with additional fields');
        }
        
        return NextResponse.json({ success: true, item: absoluteMinimalData });
      }
      
      console.error('Error with absolute minimal fields:', absoluteMinimalError);
      
      // If all attempts fail, return a detailed error
      return NextResponse.json({
        error: 'Failed to add product to grocery list after multiple attempts',
        details: {
          directError: error,
          minimalError: minimalError,
          absoluteMinimalError: absoluteMinimalError
        }
      }, { status: 500 });
      
    } catch (insertError) {
      console.error('Unexpected error during insert attempts:', insertError);
      return NextResponse.json({
        error: 'Unexpected error during database operations',
        details: insertError instanceof Error ? insertError.message : String(insertError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  if (!str) return false;
  
  // UUID regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// Delete an item from the grocery list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', id)
      .eq('user_id', FIXED_USER_ID);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/grocery-list:', error);
    return NextResponse.json(
      { error: 'Failed to delete product from grocery list' },
      { status: 500 }
    );
  }
} 