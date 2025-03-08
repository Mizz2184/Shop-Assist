-- Create the query function if it doesn't exist
CREATE OR REPLACE FUNCTION query(query_text text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Fix the column case issue
DO $$
BEGIN
  -- Check if the column exists with lowercase name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
  ) THEN
    -- Rename the column to the correct case
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
  
  -- Make sure RLS is properly configured
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
END $$; 