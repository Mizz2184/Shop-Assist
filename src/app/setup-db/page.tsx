'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SetupDB() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const setupDatabase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/setup-db');
      const data = await response.json();
      
      setResult(data);
      if (!data.success) {
        setError(data.message || 'Failed to set up database');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Database Setup</h1>
      
      <div className="mb-6">
        <button
          onClick={setupDatabase}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? 'Setting up...' : 'Setup Database'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Result</p>
          <p>{result.message}</p>
          
          {result.tableStructure && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Table Structure</h3>
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Column Name
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Data Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.tableStructure.map((column: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{column.column_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">{column.data_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <Link href="/" className="text-purple-600 hover:text-purple-800">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 