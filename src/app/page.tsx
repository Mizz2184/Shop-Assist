'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import { useAppContext } from '@/contexts/AppContext';

function HomeContent() {
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useAppContext();
  
  // Load search results when the search parameters change
  useEffect(() => {
    const query = searchParams.get('query');
    const stores = searchParams.get('stores');
    
    if (query && stores) {
      performSearch(query, stores.split(','));
    }
  }, [searchParams, language]);

  const performSearch = async (query: string, stores: string[]) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchResults([]);
    
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        stores: stores.join(','),
        language
      });
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const products = data.products || [];
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          {searchParams.get('query') ? (
            <>
              {language === 'es' ? 'Resultados para' : 'Results for'}: <span className="text-black dark:text-white">{searchParams.get('query')}</span>
            </>
          ) : (
            language === 'es' ? 'Buscar Productos de Supermercado' : 'Search for Grocery Products'
          )}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isPriority={index < 4}
            />
          ))}
        </div>
      ) : searchParams.get('query') ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
            {language === 'es'
              ? 'No se encontraron productos para esta búsqueda.'
              : 'No products found for this search.'}
          </p>
          <div className="max-w-md mx-auto">
            <h3 className="font-medium mb-2">
              {language === 'es' ? 'Sugerencias:' : 'Suggestions:'}
            </h3>
            <ul className="text-left list-disc pl-6 text-gray-500 dark:text-gray-400">
              <li>
                {language === 'es'
                  ? 'Intente con términos de búsqueda más generales (ej: "arroz" en lugar de "arroz integral")'
                  : 'Try more general search terms (e.g., "rice" instead of "brown rice")'}
              </li>
              <li>
                {language === 'es'
                  ? 'Verifique que ha seleccionado las tiendas correctas'
                  : 'Check that you have selected the correct stores'}
              </li>
              <li>
                {language === 'es'
                  ? 'Revise si hay errores ortográficos en su búsqueda'
                  : 'Check for spelling errors in your search'}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            {language === 'es'
              ? 'Busque productos para comenzar'
              : 'Search for products to get started'}
          </p>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </main>
  );
} 