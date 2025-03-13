require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSql() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-invitation-acceptance-function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.query(sqlContent);
    console.log('Successfully created invitation acceptance function');
    
    // Test if the function exists
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'handle_invitation_acceptance'
      );
    `);
    
    if (rows[0].exists) {
      console.log('Function handle_invitation_acceptance exists in the database');
    } else {
      console.error('Function handle_invitation_acceptance does not exist in the database');
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSql().catch(console.error); 