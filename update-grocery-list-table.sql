-- Add the missing imageUrl column to the grocery_list table
ALTER TABLE public.grocery_list 
ADD COLUMN IF NOT EXISTS imageUrl TEXT;

-- Ensure all other required columns exist
ALTER TABLE public.grocery_list 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Make sure RLS is enabled
ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;

-- Ensure the policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'grocery_list' 
        AND policyname = 'Allow all operations for now'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow all operations for now" ON public.grocery_list FOR ALL USING (true) WITH CHECK (true)';
    END IF;
END
$$;

-- Ensure proper permissions
GRANT ALL ON public.grocery_list TO anon;
GRANT ALL ON public.grocery_list TO authenticated;
GRANT ALL ON public.grocery_list TO service_role; 