import { useState } from 'react';
import { useAppFamily } from '@/contexts/FamilyContext';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusIcon, Cross2Icon } from '@radix-ui/react-icons';
import { FamilyRole } from '@/types/family';

const roleDescriptions: Record<FamilyRole, string> = {
  [FamilyRole.ADMIN]: 'Can manage family group, invite members, and manage grocery lists',
  [FamilyRole.EDITOR]: 'Can create and edit grocery lists',
  [FamilyRole.VIEWER]: 'Can only view grocery lists'
};

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const FamilyMembers = () => {
  const { language } = useAppContext();
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
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FamilyRole>(FamilyRole.VIEWER);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!currentFamily) return;
    
    if (!validateEmail(email)) {
      toast({
        title: language === 'es' ? 'Correo electrónico inválido' : 'Invalid email',
        description: language === 'es' 
          ? 'Por favor ingrese un correo electrónico válido' 
          : 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    const existingMember = members.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existingMember) {
      toast({
        title: language === 'es' ? 'Miembro existente' : 'Existing member',
        description: language === 'es'
          ? 'Esta persona ya es miembro del grupo familiar'
          : 'This person is already a member of the family group',
        variant: 'destructive'
      });
      return;
    }

    const existingInvitation = invitations.find(i => i.email.toLowerCase() === email.toLowerCase());
    if (existingInvitation) {
      toast({
        title: language === 'es' ? 'Invitación pendiente' : 'Pending invitation',
        description: language === 'es'
          ? 'Ya existe una invitación pendiente para este correo'
          : 'There is already a pending invitation for this email',
        variant: 'destructive'
      });
      return;
    }

    const result = await createInvitation(currentFamily.id, email, role);
    if (result) {
      toast({
        title: language === 'es' ? 'Invitación enviada' : 'Invitation sent',
        description: language === 'es'
          ? 'Se ha enviado la invitación exitosamente'
          : 'The invitation has been sent successfully'
      });
      setEmail('');
      setRole(FamilyRole.VIEWER);
      setIsInviteOpen(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentFamily) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <p className="mb-4 text-muted-foreground">
            {language === 'es'
              ? 'Seleccione un grupo familiar para administrar miembros'
              : 'Select a family group to manage members'}
          </p>
          <Button variant="outline" disabled>
            {language === 'es' ? 'Invitar miembros' : 'Invite members'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === 'es' ? 'Miembros de la familia' : 'Family Members'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'es'
              ? `Administre los miembros de ${currentFamily.name}`
              : `Manage members of ${currentFamily.name}`}
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2" />
              {language === 'es' ? 'Invitar miembro' : 'Invite Member'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Invitar nuevo miembro' : 'Invite New Member'}
              </DialogTitle>
              <DialogDescription>
                {language === 'es'
                  ? 'Ingrese el correo electrónico y seleccione el rol del nuevo miembro'
                  : 'Enter the email and select the role for the new member'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">
                  {language === 'es' ? 'Correo electrónico' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'es' ? 'correo@ejemplo.com' : 'email@example.com'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">
                  {language === 'es' ? 'Rol' : 'Role'}
                </Label>
                <Select value={role} onValueChange={(value: FamilyRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FamilyRole).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {language === 'es'
                    ? roleDescriptions[role].replace('Can', 'Puede')
                    : roleDescriptions[role]}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInvite} disabled={!email.trim()}>
                {language === 'es' ? 'Enviar invitación' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Members */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {language === 'es' ? 'Miembros actuales' : 'Current Members'}
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle>{member.profile?.name || member.email}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                <Select
                  value={member.role}
                  onValueChange={(value: FamilyRole) => updateMemberRole(currentFamily.id, member.user_id, value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FamilyRole).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSelectedMemberId(member.user_id);
                    setIsRemoveOpen(true);
                  }}
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {language === 'es' ? 'Invitaciones pendientes' : 'Pending Invitations'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <CardTitle>{invitation.email}</CardTitle>
                  <CardDescription>
                    {language === 'es' ? 'Rol propuesto: ' : 'Proposed role: '}
                    {invitation.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => cancelInvitation(invitation.id)}
                  >
                    {language === 'es' ? 'Cancelar invitación' : 'Cancel Invitation'}
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
            <DialogTitle>
              {language === 'es' ? 'Eliminar miembro' : 'Remove Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {language === 'es'
                ? '¿Está seguro que desea eliminar este miembro?'
                : 'Are you sure you want to remove this member?'}
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRemoveOpen(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (selectedMemberId && currentFamily) {
                    await removeMember(currentFamily.id, selectedMemberId);
                    setIsRemoveOpen(false);
                  }
                }}
              >
                {language === 'es' ? 'Eliminar' : 'Remove'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 