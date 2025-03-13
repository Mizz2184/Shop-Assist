-- Check the structure of the grocery_list table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grocery_list'
ORDER BY ordinal_position;

-- Check if the imageUrl column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'grocery_list' AND column_name = 'imageUrl'
) AS "imageUrl_exists";

-- Check if the imageurl column exists (lowercase)
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
) AS "imageurl_exists";

-- Check the data in the grocery_list table
SELECT id, name, imageUrl, store, price
FROM grocery_list
LIMIT 10; 