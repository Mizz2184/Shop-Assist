import { useState } from 'react';
import { useAppFamily } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { FamilyRole } from '@/types/family';

export const FamilyMembers = () => {
  const {
    loading,
    error,
    currentFamily,
    members,
    invitations,
    createInvitation,
    cancelInvitation,
    updateMemberRole,
    removeMember
  } = useAppFamily();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FamilyRole>('editor');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const handleInvite = async () => {
    if (!currentFamily || !email.trim()) return;
    const result = await createInvitation(currentFamily.id, email, role);
    if (result) {
      setEmail('');
      setRole('editor');
      setIsInviteOpen(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: FamilyRole) => {
    if (!currentFamily) return;
    await updateMemberRole(currentFamily.id, userId, newRole);
  };

  const handleRemove = async () => {
    if (!currentFamily || !selectedMember) return;
    const success = await removeMember(currentFamily.id, selectedMember);
    if (success) {
      setSelectedMember(null);
      setIsRemoveOpen(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation(invitationId);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentFamily) {
    return <div>Please select a family group first.</div>;
  }

  return (
    <div>
      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <PlusIcon className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as FamilyRole)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Members</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle>{member.profile?.name || member.email}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <select
                  value={member.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    handleUpdateRole(member.user_id, e.target.value as FamilyRole)
                  }
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  disabled={member.role === 'admin'}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                {member.role !== 'admin' && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setSelectedMember(member.user_id);
                      setIsRemoveOpen(true);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Pending Invitations</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <CardTitle>{invitation.email}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Role: {invitation.role}
                  </span>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to remove this member from the family group?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRemoveOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 