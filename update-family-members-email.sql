-- Add email column to family_members table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' AND column_name = 'email'
    ) THEN
        ALTER TABLE family_members ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to family_members table';
    ELSE
        RAISE NOTICE 'Email column already exists in family_members table';
    END IF;
END
$$;

-- Update existing family_members records with emails from auth.users
UPDATE family_members fm
SET email = u.email
FROM auth.users u
WHERE fm.user_id = u.id
AND (fm.email IS NULL OR fm.email = '');

-- Make sure the email column is included in the family_members API response
COMMENT ON COLUMN family_members.email IS 'Email address of the family member'; 