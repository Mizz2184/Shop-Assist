'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FamilyRole } from '@/types/family';

export default function TestInvitation() {
  const { user, session } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FamilyRole>(FamilyRole.VIEWER);
  const [familyId, setFamilyId] = useState('');
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    // Get auth info
    setAuthInfo({
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      accessTokenPrefix: session?.access_token ? session.access_token.substring(0, 10) + '...' : null
    });

    // Fetch families
    if (user) {
      fetchFamilies();
    }
  }, [user, session]);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/family', {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch families: ${response.status}`);
      }

      const data = await response.json();
      setFamilies(data);
      
      // Set the first family as default if available
      if (data.length > 0) {
        setFamilyId(data[0].id);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Validate inputs
      if (!email) {
        setError('Email is required');
        return;
      }

      if (!familyId) {
        setError('Family ID is required');
        return;
      }

      // Send invitation
      const response = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ familyId, email, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to send invitation: ${response.status}`);
      }

      setResult(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Family Invitation</CardTitle>
          <CardDescription>Use this page to test the family invitation functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Authentication Info</h3>
            <pre className="text-xs overflow-auto p-2 bg-gray-200 dark:bg-gray-900 rounded">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <Label htmlFor="family">Family Group</Label>
            <Select value={familyId} onValueChange={setFamilyId}>
              <SelectTrigger id="family">
                <SelectValue placeholder="Select a family group" />
              </SelectTrigger>
              <SelectContent>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as FamilyRole)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FamilyRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={FamilyRole.EDITOR}>Editor</SelectItem>
                <SelectItem value={FamilyRole.VIEWER}>Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-bold">Success</p>
              <pre className="text-xs overflow-auto p-2 bg-green-50 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSendInvitation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 