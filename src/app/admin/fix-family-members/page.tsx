'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FixFamilyMembers() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runFix = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-family-members');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to run fix');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fix Family Members Email</CardTitle>
          <CardDescription>
            This tool will add the email column to the family_members table if it doesn't exist
            and populate it with emails from the auth.users table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Warning</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                This is an administrative tool that modifies the database. Only run this if you're
                experiencing issues with family member emails.
              </p>
            </div>

            <Button 
              onClick={runFix} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running Fix...' : 'Run Fix'}
            </Button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-800 dark:text-green-300">Success</h3>
                <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                  <p>{result.message}</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Email column added: {result.emailColumnAdded ? 'Yes' : 'No (already existed)'}</li>
                    <li>Members still without email: {result.membersWithoutEmail}</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              <p>After running the fix, please refresh your family page to see the changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 