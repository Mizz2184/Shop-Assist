'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  isPriority?: boolean;
}

export default function ProductCard({ product, isPriority = false }: ProductCardProps) {
  const router = useRouter();
  const { language, currency, exchangeRate, translate } = useAppContext();
  const { user } = useAuth();
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<{
    name: string;
    description: string;
  }>({
    name: product.name,
    description: product.description || '',
  });

  // Translate product text when language changes
  useEffect(() => {
    const translateProduct = async () => {
      try {
        const [translatedName, translatedDescription] = await Promise.all([
          translate(product.name),
          translate(product.description || '')
        ]);

        setTranslatedText({
          name: translatedName || product.name,
          description: translatedDescription || product.description || ''
        });
      } catch (error) {
        console.error('Error translating product:', error);
        // Fallback to original text if translation fails
        setTranslatedText({
          name: product.name,
          description: product.description || ''
        });
      }
    };

    translateProduct();
  }, [language, product.name, product.description, translate]);

  const handleAddToList = async () => {
    if (!user) {
      router.push('/auth/redirect');
      return;
    }
    
    if (isAddingToList || isAdded) return;
    setIsAddingToList(true);
    setAddError(null);
    
    try {
      const response = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = 'Failed to add item to grocery list';
        try {
          const errorData = await response.json();
          console.error('API error details:', errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }
      
      // Show success state
      setIsAdded(true);
      console.log('Added to grocery list:', product.name);
    } catch (error) {
      console.error('Error adding to grocery list:', error);
      setAddError(
        language === 'es'
          ? 'Error al agregar el producto a la lista'
          : 'Error adding product to list'
      );
    } finally {
      setIsAddingToList(false);
    }
  };

  const formatPrice = () => {
    const price = product.price;
    if (currency === 'USD') {
      return `$${(price / exchangeRate).toFixed(2)}`;
    }
    return `₡${price.toLocaleString()}`;
  };

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-border-hover transition-colors h-[32rem] flex flex-col">
      <div className="relative h-48 w-full bg-background-secondary">
        <Image
          src={product.imageUrl || 'https://placehold.co/400x400?text=No+Image'}
          alt={translatedText.name}
          fill
          priority={isPriority}
          className="object-contain p-4"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onError={(e) => {
            console.log('Image failed to load:', product.imageUrl);
            // Fallback to placeholder image
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite error loop
            target.src = 'https://placehold.co/400x400?text=No+Image';
          }}
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-4 flex-grow">
          <h3 className="font-medium text-lg mb-2 line-clamp-2">
            {translatedText.name || 'Product Name Unavailable'}
            {product.translatedName && (
              <span className="block text-sm text-text-secondary mt-1">
                {product.translatedName}
              </span>
            )}
          </h3>
          {product.brand && (
            <p className="text-text-secondary text-sm mb-2">
              {product.brand}
            </p>
          )}
          {product.description && (
            <p className="text-sm text-text-secondary line-clamp-3">
              {translatedText.description}
            </p>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold">{formatPrice()}</p>
            <p className="text-sm text-text-secondary">{product.store}</p>
          </div>
          
          <button
            onClick={handleAddToList}
            disabled={isAddingToList || isAdded}
            className={`btn w-full flex items-center justify-center gap-2 ${
              isAdded 
                ? 'bg-success text-white hover:bg-success cursor-default'
                : 'bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100'
            }`}
          >
            {isAdded ? (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
                {language === 'es' ? 'Agregado' : 'Added'}
              </>
            ) : isAddingToList ? (
              <>
                <svg 
                  className="animate-spin h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {language === 'es' ? 'Agregando...' : 'Adding...'}
              </>
            ) : (
              language === 'es' ? 'Agregar a la Lista' : 'Add to List'
            )}
          </button>
          
          {addError && (
            <p className="text-error text-sm text-center mt-2">{addError}</p>
          )}
        </div>
      </div>
    </div>
  );
} 