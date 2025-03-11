-- Fix the family_members table structure
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        -- Make sure all required columns exist with the right types
        
        -- Check and add joined_at column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'joined_at') THEN
            ALTER TABLE family_members ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Check and add invited_by column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'invited_by') THEN
            ALTER TABLE family_members ADD COLUMN invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        -- Check and rename created_at to joined_at if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'created_at') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'joined_at') THEN
            ALTER TABLE family_members RENAME COLUMN created_at TO joined_at;
        END IF;
        
        -- Make sure the role column has the correct check constraint
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'role') THEN
            -- Drop existing constraint if it exists
            ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_role_check;
            
            -- Add the constraint
            ALTER TABLE family_members ADD CONSTRAINT family_members_role_check 
                CHECK (role IN ('admin', 'editor', 'viewer'));
        END IF;
        
        -- Make sure the unique constraint exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'family_members' AND constraint_type = 'UNIQUE'
        ) THEN
            ALTER TABLE family_members ADD CONSTRAINT family_members_family_id_user_id_key UNIQUE (family_id, user_id);
        END IF;
        
        RAISE NOTICE 'family_members table structure has been fixed';
    ELSE
        RAISE NOTICE 'family_members table does not exist';
    END IF;
END
$$;

-- Make sure the profiles table exists and has the right structure
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Make sure all required columns exist with the right types
        
        -- Check and add name column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
            ALTER TABLE profiles ADD COLUMN name TEXT;
        END IF;
        
        -- Check and add avatar_url column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
            ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        END IF;
        
        RAISE NOTICE 'profiles table structure has been fixed';
    ELSE
        -- Create the profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'profiles table has been created';
    END IF;
END
$$;

-- Make sure RLS is enabled and policies are set correctly
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view family members" ON family_members;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Create simple policies that allow all authenticated users to view data
CREATE POLICY "Anyone can view family members"
    ON family_members FOR SELECT
    USING (auth.uid() IS NOT NULL);
    
CREATE POLICY "Anyone can view profiles"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Create policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Create policy for users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON family_members TO authenticated;
GRANT ALL ON profiles TO authenticated; 