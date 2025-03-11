const { createClient } = require('@supabase/supabase-js');

// Use fallback values from src/lib/supabase.ts
const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbXV6c3RjaXJidWxmdG5iY3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODMxMTUsImV4cCI6MjA1NjQ1OTExNX0.0pg6_Qfawu96RnUft9kEQdqPrLvJk5OQ414jKNF0_Kc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateNotificationsTable() {
  try {
    // Create notifications table using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable UUID extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Drop existing table if it exists
        DROP TABLE IF EXISTS notifications;

        -- Create new notifications table
        CREATE TABLE notifications (
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

        -- Add RLS policy for notifications
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own notifications"
          ON notifications FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notifications"
          ON notifications FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own notifications"
          ON notifications FOR DELETE
          USING (auth.uid() = user_id);

        -- Create index for better performance
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      `
    });

    if (createError) {
      console.error('Error creating notifications table:', createError);
      return;
    }

    console.log('Successfully created notifications table');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateNotificationsTable(); 