-- Fix the grocery_list table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'grocery_list'
  ) THEN
    -- Drop the existing table
    DROP TABLE grocery_list;
    RAISE NOTICE 'Dropped existing grocery_list table';
  END IF;

  -- Create the grocery_list table with the correct schema
  CREATE TABLE grocery_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    price NUMERIC,
    imageUrl TEXT,
    store TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  RAISE NOTICE 'Created grocery_list table with correct schema';
  
  -- Enable Row Level Security
  ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
  
  -- Drop any existing policies
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
  
  RAISE NOTICE 'Set up RLS policies and granted permissions';
END $$; 