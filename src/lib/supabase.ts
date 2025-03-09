import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Make sure we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize with a default value
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.');
  
  // Provide fallback values for development only
  const fallbackUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbXV6c3RjaXJidWxmdG5iY3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODMxMTUsImV4cCI6MjA1NjQ1OTExNX0.0pg6_Qfawu96RnUft9kEQdqPrLvJk5OQ414jKNF0_Kc';
  
  // Use fallback values
  supabase = createClient(fallbackUrl, fallbackKey);
} else {
  // Use environment variables
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase }; 