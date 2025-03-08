require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixColumnCase() {
  console.log('Fixing the column case issue in the grocery_list table...');
  
  // First, let's create the query function if it doesn't exist
  try {
    console.log('Step 1: Creating the query function if it doesn\'t exist...');
    
    const createQueryFunctionSQL = `
      CREATE OR REPLACE FUNCTION query(query_text text)
      RETURNS SETOF json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE query_text;
      END;
      $$;
    `;
    
    // We'll try to execute this via RPC, but it might fail if we don't have permissions
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: createQueryFunctionSQL });
    
    if (rpcError) {
      console.log('Could not create the query function via RPC. This is expected if you don\'t have admin privileges.');
      console.log('Please run the following SQL in the Supabase dashboard:');
      console.log(createQueryFunctionSQL);
    } else {
      console.log('Successfully created the query function!');
    }
  } catch (error) {
    console.error('Error creating query function:', error.message);
  }
  
  // Now let's check the current table structure
  try {
    console.log('\nStep 2: Checking current table structure...');
    
    const checkSQL = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'grocery_list'
      ORDER BY ordinal_position;
    `;
    
    const { data: columns, error } = await supabase.rpc('query', { query_text: checkSQL });
    
    if (error) {
      console.error('Error checking table structure:', error.message);
      console.log('Please run the following SQL in the Supabase dashboard to check the table structure:');
      console.log(checkSQL);
    } else {
      console.log('Current table structure:');
      console.log('---------------------');
      
      if (columns && columns.length > 0) {
        // Find the maximum length of column names for formatting
        const maxNameLength = Math.max(...columns.map(col => col.column_name.length));
        const maxTypeLength = Math.max(...columns.map(col => col.data_type.length));
        
        // Print header
        console.log(`${'COLUMN'.padEnd(maxNameLength)} | ${'TYPE'.padEnd(maxTypeLength)} | NULLABLE`);
        console.log('-'.repeat(maxNameLength + maxTypeLength + 13));
        
        // Print each column
        columns.forEach(col => {
          console.log(`${col.column_name.padEnd(maxNameLength)} | ${col.data_type.padEnd(maxTypeLength)} | ${col.is_nullable}`);
        });
        
        // Check for the imageurl column (lowercase)
        const imageUrlColumn = columns.find(col => col.column_name.toLowerCase() === 'imageurl');
        
        if (imageUrlColumn) {
          console.log(`\nFound column: ${imageUrlColumn.column_name}`);
          
          if (imageUrlColumn.column_name === 'imageUrl') {
            console.log('✅ The column already has the correct case (imageUrl).');
          } else {
            console.log(`❌ The column has the wrong case: ${imageUrlColumn.column_name}`);
            console.log('We need to rename it to imageUrl (camelCase).');
            
            // Generate SQL to fix the column case
            const fixSQL = `
              -- Rename the column to the correct case
              ALTER TABLE grocery_list RENAME COLUMN "${imageUrlColumn.column_name}" TO "imageUrl";
            `;
            
            console.log('\nStep 3: Fixing the column case...');
            console.log('Please run the following SQL in the Supabase dashboard:');
            console.log(fixSQL);
            
            // Save the SQL to a file for easy access
            fs.writeFileSync('fix-column-case.sql', fixSQL);
            console.log('\nThe SQL has been saved to fix-column-case.sql for your convenience.');
          }
        } else {
          console.log('\n❌ Could not find any column named imageurl or imageUrl.');
          console.log('Please run the recreate-grocery-list-table.sql script to create the table with the correct schema.');
        }
      } else {
        console.log('No columns found or the table does not exist.');
      }
    }
  } catch (error) {
    console.error('Error checking table structure:', error.message);
  }
  
  // Try to directly fix the column case using RPC
  try {
    console.log('\nStep 4: Attempting to fix the column case directly...');
    
    const fixSQL = `
      -- Check if the column exists with the wrong case
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
        ) THEN
          -- Rename the column to the correct case
          ALTER TABLE grocery_list RENAME COLUMN "imageurl" TO "imageUrl";
          RAISE NOTICE 'Column renamed from imageurl to imageUrl';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
        ) THEN
          -- Rename the column to the correct case (alternative case)
          ALTER TABLE grocery_list RENAME COLUMN "imageurl" TO "imageUrl";
          RAISE NOTICE 'Column renamed from imageurl to imageUrl';
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'grocery_list' AND column_name = 'imageUrl'
        ) THEN
          -- Add the column if it doesn't exist
          ALTER TABLE grocery_list ADD COLUMN "imageUrl" TEXT;
          RAISE NOTICE 'Column imageUrl added';
        ELSE
          RAISE NOTICE 'Column imageUrl already exists with the correct case';
        END IF;
      END $$;
    `;
    
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: fixSQL });
    
    if (rpcError) {
      console.log('Could not fix the column case via RPC. This is expected if you don\'t have admin privileges.');
      console.log('Please run the SQL in fix-column-case.sql in the Supabase dashboard.');
    } else {
      console.log('Successfully executed the SQL to fix the column case!');
      console.log('Please run the verify-fix.js script again to check if the issue is resolved.');
    }
  } catch (error) {
    console.error('Error fixing column case:', error.message);
  }
}

fixColumnCase(); 