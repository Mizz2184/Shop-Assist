-- Fix the imageUrl field in the grocery_list table
DO $$
BEGIN
  -- Check if the imageUrl column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grocery_list' AND column_name = 'imageUrl'
  ) THEN
    RAISE NOTICE 'imageUrl column already exists';
  ELSE
    -- Check if the imageurl column exists (lowercase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
    ) THEN
      -- Rename the column to the correct case
      ALTER TABLE grocery_list RENAME COLUMN imageurl TO "imageUrl";
      RAISE NOTICE 'Renamed imageurl column to imageUrl';
    ELSE
      -- Add the imageUrl column if it doesn't exist
      ALTER TABLE grocery_list ADD COLUMN "imageUrl" TEXT;
      RAISE NOTICE 'Added imageUrl column';
    END IF;
  END IF;
  
  -- Update any null imageUrl values to an empty string
  UPDATE grocery_list SET "imageUrl" = '' WHERE "imageUrl" IS NULL;
  RAISE NOTICE 'Updated null imageUrl values to empty string';
END $$; 