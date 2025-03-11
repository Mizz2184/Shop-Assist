'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { Share2 } from 'lucide-react';

interface ShareListProps {
  listId: string;
}

export default function ShareList({ listId }: ShareListProps) {
  const { language } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [shareableLink, setShareableLink] = useState('');

  // Check if the Web Share API is available and set up the shareable link
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    setShareableLink(`${window.location.origin}/shared-list/${listId}`);
  }, [listId]);

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
          title: language === 'es' ? 'Lista de Compras Compartida' : 'Shared Grocery List',
          text: language === 'es' 
            ? '¡Echa un vistazo a esta lista de compras!' 
            : 'Check out this grocery list!',
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
            {language === 'es' ? 'Compartir Lista' : 'Share List'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
              ? 'Cualquier persona con este enlace podrá ver esta lista de compras.'
              : 'Anyone with this link can view this grocery list.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 