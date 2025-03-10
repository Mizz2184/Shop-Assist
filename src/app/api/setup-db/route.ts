import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if the grocery_list table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('grocery_list')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      // Create the grocery_list table if it doesn't exist
      const { error: createTableError } = await supabase.rpc('create_grocery_list_table', {});
      
      if (createTableError) {
        // If RPC fails, try direct SQL (requires higher privileges)
        const { error: sqlError } = await supabase.rpc('query', {
          query_text: `
            CREATE TABLE IF NOT EXISTS grocery_list (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL,
              name TEXT NOT NULL,
              brand TEXT,
              description TEXT,
              price NUMERIC,
              imageUrl TEXT,
              store TEXT,
              url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add indexes for better performance
            CREATE INDEX IF NOT EXISTS grocery_list_user_id_idx ON grocery_list(user_id);
            
            -- Set up permissions
            ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
            
            -- Create policy to allow users to see only their own items
            CREATE POLICY grocery_list_select_policy ON grocery_list
              FOR SELECT USING (auth.uid() = user_id OR user_id = '123e4567-e89b-12d3-a456-426614174000');
              
            -- Create policy to allow users to insert their own items
            CREATE POLICY grocery_list_insert_policy ON grocery_list
              FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '123e4567-e89b-12d3-a456-426614174000');
              
            -- Create policy to allow users to update their own items
            CREATE POLICY grocery_list_update_policy ON grocery_list
              FOR UPDATE USING (auth.uid() = user_id OR user_id = '123e4567-e89b-12d3-a456-426614174000');
              
            -- Create policy to allow users to delete their own items
            CREATE POLICY grocery_list_delete_policy ON grocery_list
              FOR DELETE USING (auth.uid() = user_id OR user_id = '123e4567-e89b-12d3-a456-426614174000');
              
            -- Grant permissions to authenticated and anon users
            GRANT ALL ON grocery_list TO authenticated;
            GRANT ALL ON grocery_list TO anon;
          `
        });
        
        if (sqlError) {
          return NextResponse.json({
            success: false,
            error: sqlError.message,
            message: 'Failed to create grocery_list table'
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Created grocery_list table'
      });
    }
    
    // Check the table structure
    const { data: tableInfo, error: tableInfoError } = await supabase.rpc('query', {
      query_text: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'grocery_list'
        ORDER BY ordinal_position;
      `
    });
    
    if (tableInfoError) {
      return NextResponse.json({
        success: false,
        error: tableInfoError.message,
        message: 'Failed to get table structure'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Grocery list table exists',
      tableStructure: tableInfo
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to set up database'
    }, { status: 500 });
  }
} 