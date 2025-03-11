'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ShareListProps {
  listId: string;
  listName: string;
  items: any[];
}

export default function ShareList({ listId, listName, items }: ShareListProps) {
  const { language } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [sharedListId, setSharedListId] = useState<string | null>(null);

  // Create or get shared list and generate link
  const createOrGetSharedList = async () => {
    try {
      setIsCreatingShare(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a family group for sharing if doesn't exist
      const { data: familyGroup, error: familyError } = await supabase
        .from('family_groups')
        .insert([
          { name: listName, created_by: user.id }
        ])
        .select()
        .single();

      if (familyError) throw familyError;

      // Add user as family member with admin role
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([
          { 
            family_id: familyGroup.id,
            user_id: user.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      // Create shared grocery list
      const { data: sharedList, error: listError } = await supabase
        .from('shared_grocery_lists')
        .insert([
          { 
            family_id: familyGroup.id,
            name: listName,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (listError) throw listError;

      // First, insert all products that don't exist yet
      if (items.length > 0) {
        // Insert products first
        const productsToInsert = items.map(item => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          description: item.description,
          price: item.price,
          image_url: item.imageUrl,
          store: item.store,
          url: item.url,
          created_by: user.id
        }));

        const { error: productsError } = await supabase
          .from('products')
          .upsert(productsToInsert, {
            onConflict: 'id',
            ignoreDuplicates: true
          });

        if (productsError) throw productsError;

        // Now add items to shared list
        const sharedItems = items.map(item => ({
          list_id: sharedList.id,
          product_id: item.id,
          quantity: item.quantity || 1,
          added_by: user.id,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('shared_list_items')
          .insert(sharedItems);

        if (itemsError) throw itemsError;
      }

      setSharedListId(sharedList.id);
      setShareableLink(`${window.location.origin}/shared-list/${sharedList.id}`);
    } catch (error) {
      console.error('Error creating shared list:', error);
      alert(language === 'es' 
        ? 'Error al crear la lista compartida' 
        : 'Error creating shared list');
    } finally {
      setIsCreatingShare(false);
    }
  };

  // Check if Web Share API is available
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Create shared list when dialog opens
  useEffect(() => {
    if (open && !sharedListId) {
      createOrGetSharedList();
    }
  }, [open, sharedListId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: language === 'es' 
            ? `Lista de Compras: ${listName}` 
            : `Grocery List: ${listName}`,
          text: language === 'es' 
            ? `¡Echa un vistazo a esta lista de compras: ${listName}!` 
            : `Check out this grocery list: ${listName}!`,
          url: shareableLink,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          handleCopy(); // Fallback to copying the link
        }
      }
    } else {
      handleCopy(); // Fallback for browsers that don't support sharing
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === 'es' 
              ? `Compartir Lista: ${listName}` 
              : `Share List: ${listName}`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {language === 'es'
              ? 'Comparte tu lista de compras con otros usuarios'
              : 'Share your grocery list with others'}
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {isCreatingShare ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={shareableLink}
                  className="flex-1"
                />
                <Button onClick={handleCopy}>
                  {copied 
                    ? (language === 'es' ? '¡Copiado!' : 'Copied!') 
                    : (language === 'es' ? 'Copiar' : 'Copy')}
                </Button>
              </div>
              {canShare && (
                <Button className="w-full" onClick={handleShare}>
                  {language === 'es' ? 'Compartir' : 'Share'}
                </Button>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'es'
                  ? `Cualquier persona con este enlace podrá ver la lista "${listName}".`
                  : `Anyone with this link can view the "${listName}" list.`}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 