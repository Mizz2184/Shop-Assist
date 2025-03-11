'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import Image from 'next/image';

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStores, setSelectedStores] = useState<string[]>(['maxipali']);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { language, theme } = useAppContext();

  // Define categories with translations
  const categories = [
    { value: 'all', es: 'Todas las categorías', en: 'All categories' },
    { value: 'dairy', es: 'Lácteos', en: 'Dairy' },
    { value: 'produce', es: 'Frutas y Verduras', en: 'Produce' },
    { value: 'meat', es: 'Carnes', en: 'Meat' },
    { value: 'bakery', es: 'Panadería', en: 'Bakery' },
    { value: 'beverages', es: 'Bebidas', en: 'Beverages' },
    { value: 'snacks', es: 'Snacks', en: 'Snacks' },
    { value: 'household', es: 'Hogar', en: 'Household' },
    { value: 'personal', es: 'Cuidado Personal', en: 'Personal Care' },
  ];

  // Define stores
  const stores = [
    { id: 'maxipali', name: 'MaxiPalí' },
    { id: 'automercado', name: 'Auto Mercado' },
    { id: 'masxmenos', name: 'Mas x Menos' },
    { id: 'pricesmart', name: 'PriceSmart' }
  ];

  // Clear search state on component mount
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  }, []);

  // Clear search bar when user leaves the page
  useEffect(() => {
    // Function to clear search state
    const clearSearchState = () => {
      setSearchQuery('');
      setSearchResults([]);
      setSearchPerformed(false);
    };
    
    // Add event listener for page unload
    window.addEventListener('beforeunload', clearSearchState);
    
    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('beforeunload', clearSearchState);
    };
  }, []);

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const performSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    
    const query = overrideQuery || searchQuery;
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    setSearchPerformed(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: query.trim(),
        stores: selectedStores.join(','),
        language
      });
      
      // Add category if not 'all'
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      console.log(`Searching for: ${query} in stores: ${selectedStores.join(', ')}`);
      
      // Fetch search results
      const apiUrl = `/api/search?${params.toString()}`;
      console.log(`Fetching from API: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        // Show a user-friendly error message
        setError(language === 'es' 
          ? 'Error al buscar productos. Por favor intente de nuevo más tarde.' 
          : 'Error searching products. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Check if the response contains an error message
      if (data.error) {
        console.error('API returned error:', data.error);
        setError(language === 'es'
          ? `Error: ${data.error}`
          : `Error: ${data.error}`);
        setIsLoading(false);
        return;
      }
      
      // Log the number of products received
      console.log(`Received ${data.length} products from API`);
      
      // If we have products, set them in state
      setSearchResults(data);
      
      // If no products were found, show a message
      if (data.length === 0) {
        setError(language === 'es'
          ? 'No se encontraron productos. Intente con otros términos de búsqueda.'
          : 'No products found. Try different search terms.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(language === 'es'
        ? 'Error al buscar productos. Por favor intente de nuevo más tarde.'
        : 'Error searching products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
        {language === 'es' ? 'Buscar Productos' : 'Product Search'}
      </h1>
      
      {/* Search Form */}
      <form onSubmit={performSearch} className="mb-8 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="search-query" className="block text-sm font-medium mb-2">
              {language === 'es' ? 'Nombre del producto' : 'Product name'}
            </label>
            <input
              type="text"
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'es' ? 'Ej: leche, arroz, café...' : 'E.g., milk, rice, coffee...'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800"
            />
          </div>
          
          <div className="md:w-1/3">
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              {language === 'es' ? 'Categoría' : 'Category'}
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {language === 'es' ? category.es : category.en}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Store Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {language === 'es' ? 'Tiendas' : 'Stores'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stores.map((store) => (
              <label
                key={store.id}
                className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer border ${
                  selectedStores.includes(store.id)
                    ? theme === 'dark'
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-100 border-gray-300'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 mr-2"
                  checked={selectedStores.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                />
                <span>{store.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {language === 'es' ? 'Buscar' : 'Search'}
        </button>
      </form>
      
      {/* API Source Notice */}
      {selectedStores.includes('maxipali') && (
        <div className="text-center mb-4 text-sm text-gray-500 dark:text-gray-400">
          {/* {language === 'es' 
            ? 'Los resultados de MaxiPali provienen directamente de su API oficial.' 
            : 'MaxiPali results come directly from their official API.'} */}
        </div>
      )}
      
      {/* Search Results or Initial State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
          {error}
        </div>
      ) : !searchPerformed ? (
        // Initial state - no search performed yet
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-48 h-48 mb-6">
            <Image 
              src="/images/search-illustration.svg" 
              alt="Search" 
              width={200} 
              height={200} 
              className="dark:invert"
              priority 
            />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {language === 'es' ? 'Busca productos de tus tiendas favoritas' : 'Search for products from your favorite stores'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            {language === 'es' 
              ? 'Ingresa un término de búsqueda arriba para encontrar productos de MaxiPali, Auto Mercado, Mas x Menos y PriceSmart.' 
              : 'Enter a search term above to find products from MaxiPali, Auto Mercado, Mas x Menos, and PriceSmart.'}
          </p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div className="text-center mb-6 text-gray-600 dark:text-gray-400">
            {language === 'es' 
              ? `Se encontraron ${searchResults.length} productos`
              : `Found ${searchResults.length} products`}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg">
            {language === 'es' 
              ? 'No se encontraron productos. Intente con otros términos de búsqueda.' 
              : 'No products found. Try different search terms.'}
          </p>
        </div>
      )}
    </div>
  );
} 