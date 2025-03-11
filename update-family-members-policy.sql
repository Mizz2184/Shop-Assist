-- Drop all existing policies for family_members
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Anyone can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members" ON family_members;
DROP POLICY IF EXISTS "Users can update family members" ON family_members;
DROP POLICY IF EXISTS "Users can delete family members" ON family_members;

-- Create a simple policy that allows all authenticated users to view all family members
-- This avoids any recursion issues
CREATE POLICY "Anyone can view family members"
    ON family_members FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Create policies for insert, update, and delete operations
CREATE POLICY "Users can insert family members"
    ON family_members FOR INSERT
    WITH CHECK (
        -- Only the creator of the family group can add members
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
        -- Or users can add themselves if they're joining via invitation
        OR (user_id = auth.uid())
    );

CREATE POLICY "Users can update family members"
    ON family_members FOR UPDATE
    USING (
        -- Only the creator of the family group can update members
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
        -- Or users can update their own membership
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can delete family members"
    ON family_members FOR DELETE
    USING (
        -- Only the creator of the family group can remove members
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
        -- Or users can remove themselves
        OR user_id = auth.uid()
    );

-- Make sure profiles table has proper RLS policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Allow all authenticated users to view all profiles
CREATE POLICY "Anyone can view profiles"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Make sure the email column exists in family_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' AND column_name = 'email'
    ) THEN
        ALTER TABLE family_members ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE family_members ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE family_members ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$; 