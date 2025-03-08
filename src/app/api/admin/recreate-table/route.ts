import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'recreate-grocery-list-table.sql');
    let sql = '';
    
    try {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } catch (error) {
      // If the file doesn't exist, provide the SQL inline
      sql = `
-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.grocery_list;

-- Create the grocery_list table with the correct schema
CREATE TABLE public.grocery_list (
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
CREATE POLICY "Allow all operations for now" 
  ON public.grocery_list 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON public.grocery_list TO anon;
GRANT ALL ON public.grocery_list TO authenticated;
GRANT ALL ON public.grocery_list TO service_role;
      `;
    }
    
    // Return an HTML page with instructions and the SQL
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Recreate Grocery List Table</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #121212;
      color: #f3f4f6;
    }
    h1, h2 {
      color: #3B82F6;
    }
    pre {
      background-color: #1E1E1E;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .button {
      display: inline-block;
      background-color: #3B82F6;
      color: white;
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .button:hover {
      background-color: #2563EB;
    }
    .steps {
      background-color: #1E1E1E;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .steps ol {
      margin-left: 20px;
    }
  </style>
</head>
<body>
  <h1>Recreate Grocery List Table</h1>
  
  <p>The grocery_list table needs to be recreated with the correct schema to include the imageUrl column.</p>
  
  <div class="steps">
    <h2>Steps to Fix the Issue:</h2>
    <ol>
      <li>Go to the <a href="https://app.supabase.com" target="_blank" style="color: #3B82F6;">Supabase Dashboard</a></li>
      <li>Navigate to your project</li>
      <li>Go to the SQL Editor</li>
      <li>Copy the SQL below</li>
      <li>Paste it into the SQL Editor</li>
      <li>Run the SQL</li>
      <li>Return to the application and try adding a product to your grocery list</li>
    </ol>
  </div>
  
  <h2>SQL to Run:</h2>
  <pre>${sql}</pre>
  
  <a href="/" class="button">Return to Home</a>
</body>
</html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 