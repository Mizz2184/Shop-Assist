'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthRedirect() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handlePendingInvitation = async () => {
      try {
        // Check if there's a pending invitation in localStorage
        const pendingInvitationId = localStorage.getItem('pendingInvitation');
        const pendingAction = localStorage.getItem('pendingInvitationAction');
        
        if (!pendingInvitationId) return;
        
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // If there's a pending invitation and the user is logged in, handle it
        if (pendingAction === 'accept' || pendingAction === 'reject') {
          // Send request to accept/reject invitation
          const response = await fetch(`/api/family/invitations/${pendingInvitationId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: pendingAction }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Clear the pending invitation
            localStorage.removeItem('pendingInvitation');
            localStorage.removeItem('pendingInvitationAction');
            
            // Redirect to the appropriate page
            if (pendingAction === 'accept' && data.familyId) {
              router.push(`/family/${data.familyId}`);
            } else {
              router.push('/');
            }
          } else {
            // If there was an error, redirect to the invitation page
            router.push(`/family/invitations/${pendingInvitationId}`);
          }
        } else {
          // If there's no specific action, just redirect to the invitation page
          router.push(`/family/invitations/${pendingInvitationId}`);
        }
      } catch (error) {
        console.error('Error handling pending invitation:', error);
      }
    };

    handlePendingInvitation();
  }, [router, supabase]);

  return null;
} 