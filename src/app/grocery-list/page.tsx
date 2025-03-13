'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { useAppContext } from '@/contexts/AppContext';
import Link from 'next/link';
import ShareList from '@/components/ShareList';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';

export default function GroceryList() {
  const [groceryList, setGroceryList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedItems, setTranslatedItems] = useState<Record<string, any>>({});
  const [isRemoving, setIsRemoving] = useState(false);
  const [listId] = useState(() => uuidv4());
  
  const router = useRouter();
  const { language, currency, exchangeRate, translate, setGroceryListCount } = useAppContext();
  const { user, session } = useAuth();

  // Fetch grocery list
  useEffect(() => {
    const fetchGroceryList = async () => {
      if (!session?.access_token) {
        console.error('No access token available');
        setError(language === 'es'
          ? 'Por favor inicie sesión para ver su lista de compras.'
          : 'Please log in to view your grocery list.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/grocery-list', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch grocery list');
        }
        
        const { data } = await response.json();
        setGroceryList(data || []);
        setGroceryListCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching grocery list:', error);
        setError(language === 'es' 
          ? 'No se pudo cargar su lista de compras. Por favor, inténtelo de nuevo más tarde.' 
          : 'Failed to load your grocery list. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroceryList();
  }, [language, setGroceryListCount, session]);

  // Translate items when language changes
  useEffect(() => {
    const translateItems = async () => {
      const translations: Record<string, any> = {};
      
      for (const product of groceryList) {
        try {
          translations[product.id] = {
            name: await translate(product.name || ''),
            brand: await translate(product.brand || ''),
            description: await translate(product.description || ''),
          };
        } catch (error) {
          console.error('Error translating product:', product.id, error);
          // Use original values if translation fails
          translations[product.id] = {
            name: product.name || '',
            brand: product.brand || '',
            description: product.description || '',
          };
        }
      }
      
      setTranslatedItems(translations);
    };
    
    if (groceryList.length > 0) {
      translateItems();
    }
  }, [groceryList, language, translate]);

  const handleRemoveItem = async (productId: string) => {
    if (!session?.access_token) {
      setError(language === 'es'
        ? 'Por favor inicie sesión para eliminar artículos.'
        : 'Please log in to remove items.');
      return;
    }

    try {
      setIsRemoving(true);
      const response = await fetch(`/api/grocery-list?id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const updatedList = groceryList.filter(item => item.id !== productId);
      setGroceryList(updatedList);
      setGroceryListCount(updatedList.length);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(language === 'es' 
        ? 'Error al eliminar el artículo. Por favor, inténtelo de nuevo.' 
        : 'Failed to remove item. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  // Format price based on currency
  const formatPrice = (price: number) => {
    if (currency === 'USD') {
      const usdPrice = price / exchangeRate;
      return `$${usdPrice.toFixed(2)}`;
    } else {
      return `₡${price.toLocaleString()}`;
    }
  };

  // Get translated text for a product
  const getTranslatedText = (product: Product, field: 'name' | 'brand' | 'description') => {
    if (!translatedItems[product.id]) {
      return product[field];
    }
    return translatedItems[product.id][field] || product[field];
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'es' ? 'Lista de Compras' : 'Grocery List'}
        </h1>
        <ShareList 
          listId={listId} 
          listName={language === 'es' ? 'Lista de Compras' : 'Grocery List'} 
          items={groceryList}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      ) : groceryList.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            {language === 'es'
              ? 'Su lista de compras está vacía. Agregue productos desde la página de búsqueda.'
              : 'Your grocery list is empty. Add products from the search page.'}
          </p>
          <Link
            href="/"
            className="btn mt-12 bg-white text-black border border-black hover:bg-gray-100 inline-block"
          >
            {language === 'es' ? 'Buscar Productos' : 'Search Products'}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groceryList.map((product) => (
              <div key={product.id} className="card h-full flex flex-col p-4">
                <div className="flex mb-4">
                  <div className="relative h-24 w-24 mr-4 flex-shrink-0 bg-gray-100 rounded">
                    <Image
                      src={product.imageUrl || 'https://placehold.co/200x200/png?text=No+Image'}
                      alt={getTranslatedText(product, 'name')}
                      fill
                      sizes="96px"
                      style={{ objectFit: 'contain' }}
                      priority={false}
                      onError={() => {
                        console.log('Image failed to load:', product.imageUrl);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTranslatedText(product, 'brand')}</p>
                    <h3 className="text-lg font-semibold">{getTranslatedText(product, 'name')}</h3>
                    <p className="text-sm mb-2 line-clamp-2">{getTranslatedText(product, 'description')}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                        {product.store}
                      </span>
                      <span className="font-bold">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => handleRemoveItem(product.id)}
                    className="btn w-full bg-white text-black border border-black hover:bg-gray-100"
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      language === 'es' ? 'Eliminando...' : 'Removing...'
                    ) : (
                      language === 'es' ? 'Eliminar' : 'Remove'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total Price Display */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:pl-64">
            <div className="container mx-auto flex justify-start items-center gap-2 px-4">
              <span className="text-lg font-semibold">
                {language === 'es' ? 'Total:' : 'Total:'}
              </span>
              <span className="text-xl font-bold">
                {formatPrice(groceryList.reduce((total, product) => total + product.price, 0))}
              </span>
            </div>
          </div>
          
          {/* Add padding at the bottom to prevent content from being hidden behind the total price bar */}
          <div className="h-20"></div>
        </div>
      )}
    </div>
  );
} 