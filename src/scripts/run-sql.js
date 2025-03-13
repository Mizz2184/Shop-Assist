require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Don't require SSL for local development
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function runSQL() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    
    // Check if email column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'family_members' 
      AND column_name = 'email'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding email column to family_members table...');
      await client.query('ALTER TABLE family_members ADD COLUMN email TEXT');
      console.log('Email column added successfully');
    } else {
      console.log('Email column already exists');
    }
    
    // Update family_members with emails from auth.users
    console.log('Updating family_members with emails from auth.users...');
    const updateResult = await client.query(`
      UPDATE family_members fm
      SET email = u.email
      FROM auth.users u
      WHERE fm.user_id = u.id
      AND (fm.email IS NULL OR fm.email = '')
      RETURNING fm.id, fm.email
    `);
    
    console.log(`Updated ${updateResult.rowCount} family members with emails`);
    
    // List some updated members for verification
    if (updateResult.rows.length > 0) {
      console.log('Sample of updated members:');
      updateResult.rows.slice(0, 5).forEach(row => {
        console.log(`- ID: ${row.id}, Email: ${row.email}`);
      });
    }
    
    console.log('SQL operations completed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSQL()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err)); 