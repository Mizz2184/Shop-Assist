'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';
import { useAppContext } from '@/contexts/AppContext';

interface SharedListItem extends Product {
  quantity: number;
  notes?: string;
}

export default function SharedList() {
  const { id } = useParams();
  const { language, currency, exchangeRate } = useAppContext();
  const [listName, setListName] = useState('');
  const [groceryList, setGroceryList] = useState<SharedListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedList = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First get the shared list details
        const { data: listData, error: listError } = await supabase
          .from('shared_grocery_lists')
          .select(`
            id,
            name,
            shared_list_items (
              quantity,
              notes,
              products (*)
            )
          `)
          .eq('id', id)
          .single();

        if (listError) throw listError;
        if (!listData) throw new Error('List not found');

        setListName(listData.name);

        // Transform the data structure
        const items = listData.shared_list_items.map((item: any) => ({
          ...item.products,
          quantity: item.quantity,
          notes: item.notes
        }));

        setGroceryList(items);
      } catch (err) {
        console.error('Error fetching shared list:', err);
        setError(
          language === 'es'
            ? 'No se pudo cargar la lista compartida'
            : 'Could not load the shared list'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSharedList();
    }
  }, [id, language]);

  // Format price based on currency
  const formatPrice = (price: number) => {
    if (currency === 'USD') {
      const usdPrice = price / exchangeRate;
      return `$${usdPrice.toFixed(2)}`;
    } else {
      return `₡${price.toLocaleString()}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500 text-white p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {listName || (language === 'es' ? 'Lista de Compras Compartida' : 'Shared Grocery List')}
      </h1>

      {groceryList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'es'
            ? 'Esta lista está vacía'
            : 'This list is empty'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groceryList.map((product) => (
            <div key={product.id} className="card h-full flex flex-col p-4">
              <div className="flex mb-4">
                <div className="relative h-24 w-24 mr-4 flex-shrink-0 bg-gray-100 rounded">
                  <Image
                    src={product.imageUrl || 'https://placehold.co/200x200/png?text=No+Image'}
                    alt={product.name}
                    fill
                    sizes="96px"
                    style={{ objectFit: 'contain' }}
                    priority={false}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      {product.store}
                    </span>
                    <span className="font-bold">{formatPrice(product.price)}</span>
                  </div>
                  {product.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {product.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Price Display */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto flex justify-start items-center gap-2">
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
  );
} 