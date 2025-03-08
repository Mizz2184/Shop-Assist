-- Drop the existing table if it exists
DROP TABLE IF EXISTS grocery_list;

-- Create the grocery_list table with the correct schema
CREATE TABLE grocery_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
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

-- Enable Row Level Security
ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Users can manage their own grocery list items"
  ON grocery_list
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant access to various roles
GRANT ALL ON grocery_list TO anon, authenticated, service_role; 