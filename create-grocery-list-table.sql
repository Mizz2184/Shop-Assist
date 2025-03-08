-- Create the grocery_list table
CREATE TABLE IF NOT EXISTS public.grocery_list (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  imageUrl TEXT,
  store TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In a production app, you would want to restrict this to authenticated users
CREATE POLICY "Allow all operations for now" 
  ON public.grocery_list 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON public.grocery_list TO anon;
GRANT ALL ON public.grocery_list TO authenticated;
GRANT ALL ON public.grocery_list TO service_role; 