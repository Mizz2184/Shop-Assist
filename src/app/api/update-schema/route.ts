import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    console.log('Updating database schema...');
    
    // Check if the table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('grocery_list')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking table:', checkError);
      return NextResponse.json({ 
        success: false, 
        message: 'The grocery_list table does not exist or is not accessible.',
        error: checkError.message
      }, { status: 500 });
    }
    
    console.log('The grocery_list table exists. Attempting to update schema...');
    
    // Try to insert a record with all required fields to test the schema
    const testProduct = {
      id: uuidv4(),
      name: 'Test Product',
      brand: 'Test Brand',
      description: 'Test Description',
      price: 9.99,
      imageUrl: 'https://example.com/image.jpg',
      store: 'Test Store',
      url: 'https://example.com/product',
      created_at: new Date().toISOString()
    };
    
    const { data, error: insertError } = await supabase
      .from('grocery_list')
      .insert([testProduct])
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
      
      // If the error is about missing columns, we need to recreate the table
      if (insertError.message.includes("Could not find the 'imageUrl' column") || 
          insertError.code === 'PGRST204') {
        
        // We can't directly execute SQL with the JS client, so we'll return instructions
        return NextResponse.json({
          success: false,
          message: 'The table schema needs to be updated.',
          error: insertError.message,
          instructions: [
            'Please go to the Supabase dashboard (https://app.supabase.com) and:',
            '1. Navigate to your project',
            '2. Go to the SQL Editor',
            '3. Run the following SQL:',
            `
            -- Add the missing imageUrl column to the grocery_list table
            ALTER TABLE public.grocery_list 
            ADD COLUMN IF NOT EXISTS imageUrl TEXT;
            
            -- Ensure all other required columns exist
            ALTER TABLE public.grocery_list 
            ADD COLUMN IF NOT EXISTS brand TEXT,
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS url TEXT;
            
            -- Make sure RLS is enabled
            ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;
            
            -- Ensure the policy exists
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'grocery_list' 
                    AND policyname = 'Allow all operations for now'
                ) THEN
                    EXECUTE 'CREATE POLICY "Allow all operations for now" ON public.grocery_list FOR ALL USING (true) WITH CHECK (true)';
                END IF;
            END
            $$;
            
            -- Ensure proper permissions
            GRANT ALL ON public.grocery_list TO anon;
            GRANT ALL ON public.grocery_list TO authenticated;
            GRANT ALL ON public.grocery_list TO service_role;
            `
          ]
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to insert test record.',
        error: insertError.message
      }, { status: 500 });
    }
    
    // If we get here, the insert was successful, so the schema is correct
    console.log('Successfully inserted test record. Schema is correct.');
    
    // Clean up the test record
    const { error: deleteError } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', testProduct.id);
    
    if (deleteError) {
      console.warn('Warning: Could not delete test record:', deleteError);
    } else {
      console.log('Test record deleted successfully.');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'The table schema is correct and ready to use.'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred.',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 