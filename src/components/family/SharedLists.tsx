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
import { PlusIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

export const SharedLists = () => {
  const {
    loading,
    error,
    currentFamily,
    sharedLists,
    createSharedList,
    updateSharedList,
    deleteSharedList
  } = useAppFamily();

  const [name, setName] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreate = async () => {
    if (!currentFamily || !name.trim()) return;
    const result = await createSharedList(currentFamily.id, name);
    if (result) {
      setName('');
      setIsCreateOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedList || !name.trim()) return;
    const result = await updateSharedList(selectedList, name);
    if (result) {
      setName('');
      setSelectedList(null);
      setIsEditOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedList) return;
    const success = await deleteSharedList(selectedList);
    if (success) {
      setSelectedList(null);
      setIsDeleteOpen(false);
    }
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
      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Shared List
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shared List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter list name"
              />
            </div>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sharedLists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedList(list.id);
                  setName(list.name);
                  setIsEditOpen(true);
                }}
              >
                <Pencil1Icon className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  setSelectedList(list.id);
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
            <DialogTitle>Edit Shared List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter list name"
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
            <DialogTitle>Delete Shared List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this shared list?</p>
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