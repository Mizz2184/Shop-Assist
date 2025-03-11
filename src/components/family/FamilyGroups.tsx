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
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

export const FamilyGroups = () => {
  const {
    loading,
    error,
    familyGroups,
    createFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup
  } = useAppFamily();

  const [name, setName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createFamilyGroup(name);
    if (result) {
      setName('');
      setIsCreateOpen(false);
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
      setSelectedGroup(null);
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {/* Create Dialog */}
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

      {/* Family Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {familyGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
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
        ))}
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