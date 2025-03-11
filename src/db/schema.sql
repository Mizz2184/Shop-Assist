-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;
DROP POLICY IF EXISTS "Admins can update family groups" ON family_groups;
DROP POLICY IF EXISTS "Admins can delete family groups" ON family_groups;
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON family_members;
DROP POLICY IF EXISTS "Admins can manage family members" ON family_members;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their family's lists" ON shared_grocery_lists;
DROP POLICY IF EXISTS "Users can manage their family's lists" ON shared_grocery_lists;
DROP POLICY IF EXISTS "Users can view their family's list items" ON shared_list_items;
DROP POLICY IF EXISTS "Users can manage their family's list items" ON shared_list_items;
DROP POLICY IF EXISTS "Users can view their family's list activity" ON list_activity_log;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Drop existing tables in reverse order to avoid dependency issues
DROP TABLE IF EXISTS list_activity_log;
DROP TABLE IF EXISTS shared_list_items;
DROP TABLE IF EXISTS shared_grocery_lists;
DROP TABLE IF EXISTS family_invitations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS family_groups;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS profiles;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    price NUMERIC,
    image_url TEXT,
    store TEXT,
    url TEXT,
    ean TEXT,
    category TEXT,
    subcategory TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Family Groups table
CREATE TABLE IF NOT EXISTS family_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Members table (must be created before family_groups policies)
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(family_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Invitations table
CREATE TABLE IF NOT EXISTS family_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    UNIQUE(family_id, email)
);

-- Shared Grocery Lists table
CREATE TABLE IF NOT EXISTS shared_grocery_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Shared List Items table
CREATE TABLE IF NOT EXISTS shared_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES shared_grocery_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked BOOLEAN DEFAULT FALSE,
    checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- List Activity Log table
CREATE TABLE IF NOT EXISTS list_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES shared_grocery_lists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now enable RLS and create policies after all tables exist

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view any profile"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for products
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create products"
    ON products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own products"
    ON products FOR UPDATE
    USING (created_by = auth.uid());

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create simplified notification policies that avoid circular references
CREATE POLICY "Users can view notifications"
    ON notifications FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = notifications.family_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- Update family_groups policies to be more direct
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;
CREATE POLICY "Users can view their family groups"
    ON family_groups FOR SELECT
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_members
            WHERE family_id = id
            AND user_id = auth.uid()
            AND role IN ('admin', 'editor', 'viewer')
        )
    );

-- Drop existing family members policies to start fresh
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON family_members;
DROP POLICY IF EXISTS "Admins can manage family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert into family members" ON family_members;

-- Create completely simplified policies without circular references
CREATE POLICY "Users can view family members"
    ON family_members FOR SELECT
    USING (
        -- Users can see their own membership
        user_id = auth.uid()
        -- Or they're the creator of the family group
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_members.family_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert family members"
    ON family_members FOR INSERT
    WITH CHECK (
        -- Creator can add members
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
        -- Or self-join via invitation
        OR (
            user_id = auth.uid() 
            AND invited_by IS NOT NULL
        )
    );

CREATE POLICY "Users can update family members"
    ON family_members FOR UPDATE
    USING (
        -- Users can update their own membership status
        user_id = auth.uid()
        -- Or creators can update any membership in their groups
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete family members"
    ON family_members FOR DELETE
    USING (
        -- Users can remove themselves
        user_id = auth.uid()
        -- Or creators can remove anyone
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
    );

-- Create policies for family_groups with proper access control
CREATE POLICY "Users can create family groups"
    ON family_groups FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND created_by = auth.uid()
    );

CREATE POLICY "Admins can update family groups"
    ON family_groups FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_members
            WHERE family_id = id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete family groups"
    ON family_groups FOR DELETE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_members
            WHERE family_id = id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create policies for shared_grocery_lists
CREATE POLICY "Users can view their family's lists"
    ON shared_grocery_lists FOR SELECT
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = shared_grocery_lists.family_id
            AND created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM family_members
            WHERE family_id = shared_grocery_lists.family_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family's lists"
    ON shared_grocery_lists FOR ALL
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = shared_grocery_lists.family_id
            AND created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM family_members
            WHERE family_id = shared_grocery_lists.family_id
            AND user_id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Create policies for shared_list_items
CREATE POLICY "Users can view their family's list items"
    ON shared_list_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shared_grocery_lists sgl
            JOIN family_members fm ON fm.family_id = sgl.family_id
            WHERE sgl.id = shared_list_items.list_id
            AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their family's list items"
    ON shared_list_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM shared_grocery_lists sgl
            JOIN family_members fm ON fm.family_id = sgl.family_id
            WHERE sgl.id = shared_list_items.list_id
            AND fm.user_id = auth.uid()
            AND fm.role IN ('admin', 'editor')
        )
    );

-- Create policies for list_activity_log
CREATE POLICY "Users can view their family's list activity"
    ON list_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shared_grocery_lists sgl
            JOIN family_members fm ON fm.family_id = sgl.family_id
            WHERE sgl.id = list_activity_log.list_id
            AND fm.user_id = auth.uid()
        )
    );

-- Create functions for real-time updates
CREATE OR REPLACE FUNCTION notify_list_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'list_updates',
        json_build_object(
            'list_id', NEW.list_id,
            'action', TG_OP,
            'user_id', auth.uid(),
            'timestamp', NOW()
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_groups_updated_at
    BEFORE UPDATE ON family_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER list_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shared_list_items
    FOR EACH ROW
    EXECUTE FUNCTION notify_list_update();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_family_id ON notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_shared_lists_family_id ON shared_grocery_lists(family_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_list_id ON shared_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON family_invitations(email);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Drop all existing family_groups policies
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;
DROP POLICY IF EXISTS "Admins can update family groups" ON family_groups;
DROP POLICY IF EXISTS "Admins can delete family groups" ON family_groups;

-- Create extremely simplified family_groups policies
CREATE POLICY "Anyone can view family groups"
    ON family_groups FOR SELECT
    USING (true);  -- Allow all users to view all family groups

CREATE POLICY "Users can create family groups" 
    ON family_groups FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update family groups"
    ON family_groups FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Creators can delete family groups"
    ON family_groups FOR DELETE
    USING (created_by = auth.uid());

-- Let's also simplify the notifications policies further
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;

-- Create very basic notifications policies
CREATE POLICY "Users can view their notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- Let's also check for any remaining family_members policies
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members" ON family_members;
DROP POLICY IF EXISTS "Users can update family members" ON family_members;
DROP POLICY IF EXISTS "Users can delete family members" ON family_members;

-- Create extremely simplified family_members policies
CREATE POLICY "Anyone can view family members"
    ON family_members FOR SELECT
    USING (true);  -- Allow all users to view all family members

CREATE POLICY "Creators can insert family members"
    ON family_members FOR INSERT
    WITH CHECK (
        -- Creator of family can add members
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
        -- Or self-join with invitation
        OR (user_id = auth.uid() AND invited_by IS NOT NULL)
    );

CREATE POLICY "Users manage their own membership"
    ON family_members FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
    ON family_members FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "Creators can manage members"
    ON family_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM family_groups
            WHERE id = family_id
            AND created_by = auth.uid()
        )
    );

function isValidEAN(ean) {
  // Basic format check (EAN-13, EAN-8, UPC-A, UPC-E)
  if (!/^(\d{8}|\d{12,14})$/.test(ean)) {
    return false;
  }
  
  // For EAN-13, verify the check digit
  if (ean.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(ean[12]) === checkDigit;
  }
  
  return true; // Other formats pass basic length check
}

// Use in your API:
if (!isValidEAN(ean)) {
  return NextResponse.json({ 
    error: 'Invalid barcode format or check digit' 
  }, { status: 400 });
} 