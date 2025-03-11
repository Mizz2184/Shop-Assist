import { useState, useEffect } from 'react';
import { useAppFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { PlusIcon, Pencil1Icon, TrashIcon, CheckIcon } from '@radix-ui/react-icons';

export const FamilyGroups = () => {
  const {
    loading,
    error,
    familyGroups,
    currentFamily,
    createFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    setFamily
  } = useAppFamily();

  const { session, isLoading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Add debug effect
  useEffect(() => {
    const debug = {
      hasSession: !!session,
      sessionToken: session?.access_token ? 'Present' : 'Missing',
      loading,
      error,
      familyGroupsCount: familyGroups?.length || 0,
      currentFamilyId: currentFamily?.id
    };
    setDebugInfo(JSON.stringify(debug, null, 2));
  }, [session, loading, error, familyGroups, currentFamily]);

  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    try {
      const result = await createFamilyGroup(name);
      if (result) {
        // Automatically select the newly created family
        await setFamily(result.id);
        setName('');
        setIsCreateOpen(false);
      }
    } catch (error) {
      console.error('Error in handleCreate:', error);
      // Error is already handled by createFamilyGroup
    }
  };

  const handleEdit = async () => {
    if (!selectedGroup || !name.trim()) return;
    const result = await updateFamilyGroup(selectedGroup, name);
    if (result) {
      setName('');
      setSelectedGroup(null);
      setIsEditOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    const success = await deleteFamilyGroup(selectedGroup);
    if (success) {
      if (currentFamily?.id === selectedGroup) {
        await setFamily(null);
      }
      setSelectedGroup(null);
      setIsDeleteOpen(false);
    }
  };

  const handleSelectFamily = async (familyId: string) => {
    await setFamily(familyId);
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
          <span>Checking authentication...</span>
        </div>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">{debugInfo}</pre>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">
          Please log in to access family groups.
        </div>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">{debugInfo}</pre>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
          <span>Loading family groups...</span>
        </div>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">{debugInfo}</pre>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded">
          Error: {error}
        </div>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">{debugInfo}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Family Groups</h2>
          <p className="text-muted-foreground">Create or select a family group to start inviting members</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon /> Create Family Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Create Family Group</DialogTitle>
            <DialogDescription>
              Enter a name for your new family group. This will allow you to share grocery lists with family members.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter family group name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Family Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {familyGroups.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <p className="mb-4 text-muted-foreground">You haven't created any family groups yet.</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="mr-2" /> Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          familyGroups.map((group) => (
            <Card 
              key={group.id}
              className={`cursor-pointer transition-colors ${currentFamily?.id === group.id ? 'border-primary' : ''}`}
              onClick={() => handleSelectFamily(group.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {group.name}
                  {currentFamily?.id === group.id && (
                    <CheckIcon className="h-5 w-5 text-primary" />
                  )}
                </CardTitle>
                <CardDescription>
                  {currentFamily?.id === group.id ? 'Currently selected' : 'Click to select'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedGroup(group.id);
                    setName(group.name);
                    setIsEditOpen(true);
                  }}
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedGroup(group.id);
                    setIsDeleteOpen(true);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter family group name"
              />
            </div>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Family Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this family group?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 