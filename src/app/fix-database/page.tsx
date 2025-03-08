'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FixDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tableStructure, setTableStructure] = useState<any[]>([]);

  const setupDatabase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/setup-db');
      const data = await response.json();
      
      setResult(data);
      if (data.tableStructure) {
        setTableStructure(data.tableStructure);
      }
      
      if (!response.ok) {
        setError(data.error || 'Failed to set up database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testGroceryListAPI = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test GET
      const getResponse = await fetch('/api/grocery-list');
      const getData = await getResponse.json();
      
      // Test POST with a test product
      const testProduct = {
        id: crypto.randomUUID(),
        name: 'Test Product',
        brand: 'Test Brand',
        description: 'Test Description',
        price: 999,
        imageUrl: 'https://via.placeholder.com/150',
        store: 'test-store',
        url: 'https://example.com/test'
      };
      
      const postResponse = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduct),
      });
      
      const postData = await postResponse.json();
      
      setResult({
        get: {
          status: getResponse.status,
          data: getData
        },
        post: {
          status: postResponse.status,
          data: postData
        }
      });
      
      if (!getResponse.ok || !postResponse.ok) {
        setError('One or more API tests failed. Check the results for details.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check table structure on initial load
    setupDatabase();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Diagnostics</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={setupDatabase}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? 'Working...' : 'Setup Database Functions'}
          </button>
          
          <button
            onClick={testGroceryListAPI}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Grocery List API'}
          </button>
          
          <Link href="/" className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100">
            Back to Home
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {tableStructure.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Table Structure</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Column Name</th>
                  <th className="px-4 py-2 border-b">Data Type</th>
                </tr>
              </thead>
              <tbody>
                {tableStructure.map((column, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2 border-b">{column.column_name}</td>
                    <td className="px-4 py-2 border-b">{column.data_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {result && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
        <h3 className="font-bold mb-2">Manual Fix Instructions</h3>
        <p className="mb-4">If you're still experiencing issues, you can try these SQL commands in the Supabase SQL Editor:</p>
        <pre className="p-4 bg-gray-800 text-white rounded overflow-x-auto text-sm">
{`-- Create the query function if it doesn't exist
CREATE OR REPLACE FUNCTION query(query_text text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Fix the column case issue
DO $$
BEGIN
  -- Check if the column exists with lowercase name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grocery_list' AND column_name = 'imageurl'
  ) THEN
    -- Rename the column to the correct case
    ALTER TABLE grocery_list RENAME COLUMN "imageurl" TO "imageUrl";
    RAISE NOTICE 'Column renamed from imageurl to imageUrl';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grocery_list' AND column_name = 'imageUrl'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE grocery_list ADD COLUMN "imageUrl" TEXT;
    RAISE NOTICE 'Column imageUrl added';
  ELSE
    RAISE NOTICE 'Column imageUrl already exists with the correct case';
  END IF;
  
  -- Make sure RLS is properly configured
  ALTER TABLE grocery_list ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Allow all operations for now" ON grocery_list;
  DROP POLICY IF EXISTS "Users can manage their own grocery list" ON grocery_list;
  DROP POLICY IF EXISTS "Users can manage their own grocery list items" ON grocery_list;
  DROP POLICY IF EXISTS "Allow all operations for testing" ON grocery_list;
  
  -- Create a permissive policy for testing
  CREATE POLICY "Allow all operations for testing"
    ON grocery_list
    FOR ALL
    USING (true)
    WITH CHECK (true);
  
  -- Grant access to the table
  GRANT ALL ON grocery_list TO anon, authenticated, service_role;
END $$;`}
        </pre>
      </div>
    </div>
  );
} 