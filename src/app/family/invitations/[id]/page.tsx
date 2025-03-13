'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const invitationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected' | 'expired' | 'not-found'>('pending');

  useEffect(() => {
    async function fetchInvitation() {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch invitation details from our API
        const response = await fetch(`/api/family/invitations/${invitationId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 404) {
            setStatus('not-found');
          } else if (response.status === 410) {
            setStatus('expired');
          } else {
            setError(errorData.error || 'Failed to fetch invitation');
          }
          return;
        }
        
        const invitationData = await response.json();
        setInvitation(invitationData);
        setStatus(invitationData.status);
        
        // If user is not logged in and invitation is for a specific email
        if (!session && invitationData.email) {
          // Store the invitation ID in localStorage to redirect back after login
          localStorage.setItem('pendingInvitation', invitationId);
        }
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError('Failed to fetch invitation details');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [invitationId, supabase]);

  const handleAccept = async () => {
    try {
      setProcessing(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store the invitation ID and action in localStorage
        localStorage.setItem('pendingInvitation', invitationId);
        localStorage.setItem('pendingInvitationAction', 'accept');
        
        // Redirect to login page
        router.push(`/auth/login-email-only?redirect=/family/invitations/${invitationId}`);
        return;
      }
      
      // Send request to accept invitation
      const response = await fetch(`/api/family/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }
      
      const data = await response.json();
      setStatus('accepted');
      
      // Redirect to family page after a short delay
      setTimeout(() => {
        router.push(`/family/${data.familyId}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store the invitation ID and action in localStorage
        localStorage.setItem('pendingInvitation', invitationId);
        localStorage.setItem('pendingInvitationAction', 'reject');
        
        // Redirect to login page
        router.push(`/auth/login-email-only?redirect=/family/invitations/${invitationId}`);
        return;
      }
      
      // Send request to reject invitation
      const response = await fetch(`/api/family/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject invitation');
      }
      
      setStatus('rejected');
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      setError(error.message || 'Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invitation Not Found</AlertTitle>
          <AlertDescription>
            The invitation you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invitation Expired</AlertTitle>
          <AlertDescription>
            This invitation has expired. Please ask the family admin to send a new invitation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Invitation Accepted</AlertTitle>
          <AlertDescription>
            You have successfully joined the family group. Redirecting to the family page...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertTitle>Invitation Rejected</AlertTitle>
          <AlertDescription>
            You have declined this invitation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Family Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a family group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Family:</p>
                <p className="text-lg">{invitation.familyName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Invited by:</p>
                <p className="text-lg">{invitation.inviterName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role:</p>
                <p className="text-lg capitalize">{invitation.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Expires:</p>
                <p className="text-lg">{new Date(invitation.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={processing}
          >
            {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
            Decline
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={processing}
          >
            {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 