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
      const { error: createTableError } = await supabase.rpc('query', {
        query_text: `
          CREATE TABLE IF NOT EXISTS grocery_list (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            brand TEXT,
            description TEXT,
            price NUMERIC,
            "imageUrl" TEXT,
            store TEXT,
            url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createTableError) {
        return NextResponse.json({ 
          error: 'Failed to create grocery_list table', 
          details: createTableError 
        }, { status: 500 });
      }
    }

    // Get the table structure
    let { data: tableStructure, error: structureError } = await supabase.rpc('query', {
      query_text: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'grocery_list'
        ORDER BY ordinal_position;
      `
    });

    if (structureError) {
      // Try to create the query function if it doesn't exist
      await supabase.rpc('query', {
        query_text: `
          CREATE OR REPLACE FUNCTION query(query_text text)
          RETURNS SETOF json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY EXECUTE query_text;
          END;
          $$;
        `
      });

      // Try again after creating the function
      const { data: retryStructure, error: retryError } = await supabase.rpc('query', {
        query_text: `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'grocery_list'
          ORDER BY ordinal_position;
        `
      });

      if (retryError) {
        return NextResponse.json({ 
          error: 'Failed to get table structure', 
          details: retryError 
        }, { status: 500 });
      }

      if (retryStructure) {
        tableStructure = retryStructure;
      }
    }

    // Check if the imageUrl column exists with the correct case
    const hasImageUrlColumn = tableStructure?.some(
      (col: any) => col.column_name === 'imageUrl'
    );

    const hasLowercaseImageUrl = tableStructure?.some(
      (col: any) => col.column_name === 'imageurl'
    );

    // Fix column case issue if needed
    if (!hasImageUrlColumn) {
      if (hasLowercaseImageUrl) {
        // Rename the column to the correct case
        await supabase.rpc('query', {
          query_text: `ALTER TABLE grocery_list RENAME COLUMN "imageurl" TO "imageUrl";`
        });
      } else {
        // Add the column if it doesn't exist
        await supabase.rpc('query', {
          query_text: `ALTER TABLE grocery_list ADD COLUMN "imageUrl" TEXT;`
        });
      }

      // Get updated table structure
      const { data: updatedStructure } = await supabase.rpc('query', {
        query_text: `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'grocery_list'
          ORDER BY ordinal_position;
        `
      });

      if (updatedStructure) {
        tableStructure = updatedStructure;
      }
    }

    // Create the insert_grocery_item function
    const { error: functionError } = await supabase.rpc('query', {
      query_text: `
        CREATE OR REPLACE FUNCTION insert_grocery_item(
          p_id UUID,
          p_user_id UUID,
          p_name TEXT,
          p_brand TEXT,
          p_description TEXT,
          p_price NUMERIC,
          p_image_url TEXT,
          p_store TEXT,
          p_url TEXT
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          inserted_item JSONB;
          has_image_url BOOLEAN;
        BEGIN
          -- Check if imageUrl column exists
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'grocery_list' AND column_name = 'imageUrl'
          ) INTO has_image_url;
          
          -- Insert the item based on column existence
          IF has_image_url THEN
            INSERT INTO grocery_list (
              id, user_id, name, brand, description, price, "imageUrl", store, url
            )
            VALUES (
              p_id, p_user_id, p_name, p_brand, p_description, p_price, p_image_url, p_store, p_url
            )
            RETURNING to_jsonb(grocery_list.*) INTO inserted_item;
          ELSE
            INSERT INTO grocery_list (
              id, user_id, name, brand, description, price, store, url
            )
            VALUES (
              p_id, p_user_id, p_name, p_brand, p_description, p_price, p_store, p_url
            )
            RETURNING to_jsonb(grocery_list.*) INTO inserted_item;
          END IF;
          
          RETURN inserted_item;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Error inserting grocery item: %', SQLERRM;
        END;
        $$;
      `
    });

    if (functionError) {
      return NextResponse.json({ 
        error: 'Failed to create insert_grocery_item function', 
        details: functionError,
        tableStructure 
      }, { status: 500 });
    }

    // Set up RLS policies
    await supabase.rpc('query', {
      query_text: `
        -- Enable RLS
        ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow all operations for now" ON grocery_list;
        DROP POLICY IF EXISTS "Users can manage their own grocery list" ON grocery_list;
        DROP POLICY IF EXISTS "Users can manage their own grocery list items" ON grocery_list;
        DROP POLICY IF EXISTS "Allow all operations for testing" ON grocery_list;
        
        -- Create a permissive policy for testing
        CREATE POLICY "Allow all operations for testing"
          ON grocery_list
          FOR ALL
          USING (true)
          WITH CHECK (true);
        
        -- Grant access to the table
        GRANT ALL ON grocery_list TO anon, authenticated, service_role;
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      tableStructure
    });
  } catch (error) {
    console.error('Setup DB error:', error);
    return NextResponse.json({ 
      error: 'Failed to set up database', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 