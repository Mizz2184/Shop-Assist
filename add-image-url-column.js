require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

async function addImageUrlColumn() {
  console.log('Attempting to add imageUrl column to grocery_list table...');
  
  // SQL to add the imageUrl column
  const sql = `
    ALTER TABLE grocery_list 
    ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
  `;
  
  // Create the query function if it doesn't exist
  const createFunctionSql = `
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
  
  try {
    // First, check if the query function exists
    const checkFunctionSql = `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'query'
      );
    `;
    
    // Try to execute the SQL directly using the REST API
    const response = await axios({
      method: 'POST',
      url: `${supabaseUrl}/rest/v1/rpc/query`,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      data: {
        query_text: checkFunctionSql
      }
    });
    
    console.log('Function check response:', response.data);
    
    // If the function doesn't exist, create it
    if (!response.data || !response.data[0] || !response.data[0].exists) {
      console.log('Creating query function...');
      
      const createFunctionResponse = await axios({
        method: 'POST',
        url: `${supabaseUrl}/rest/v1/rpc/query`,
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: {
          query_text: createFunctionSql
        }
      });
      
      console.log('Function creation response:', createFunctionResponse.data);
    }
    
    // Now execute the ALTER TABLE SQL
    console.log('Executing ALTER TABLE SQL...');
    
    const alterTableResponse = await axios({
      method: 'POST',
      url: `${supabaseUrl}/rest/v1/rpc/query`,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      data: {
        query_text: sql
      }
    });
    
    console.log('ALTER TABLE response:', alterTableResponse.data);
    console.log('✅ Successfully added imageUrl column to grocery_list table!');
    
    // Verify the column was added
    const verifySql = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'grocery_list' 
      AND column_name = 'imageUrl';
    `;
    
    const verifyResponse = await axios({
      method: 'POST',
      url: `${supabaseUrl}/rest/v1/rpc/query`,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      data: {
        query_text: verifySql
      }
    });
    
    console.log('Verification response:', verifyResponse.data);
    
    if (verifyResponse.data && verifyResponse.data.length > 0) {
      console.log(`Column verified: ${verifyResponse.data[0].column_name} (${verifyResponse.data[0].data_type})`);
    } else {
      console.log('⚠️ Column was not found after adding. This might indicate an issue with permissions.');
    }
    
  } catch (error) {
    console.error('Error adding imageUrl column:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('The query function does not exist. You need to create it in the Supabase dashboard.');
        console.log('\nRun this SQL in the Supabase dashboard:');
        console.log(createFunctionSql);
      } else if (error.response.status === 403) {
        console.error('Permission denied. Make sure your Supabase key has the necessary permissions.');
        console.log('\nAlternatively, run this SQL in the Supabase dashboard:');
        console.log(sql);
      }
    }
    
    console.log('\nIf you cannot execute this via the API, please run the following SQL in the Supabase dashboard:');
    console.log(sql);
  }
}

addImageUrlColumn(); 