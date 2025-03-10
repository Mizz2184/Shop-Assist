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

  // Load initial products when the page loads
  useEffect(() => {
    // Default search terms based on language
    const defaultSearchTerm = language === 'es' ? 'arroz' : 'rice';
    
    // Set the search query and perform the search
    setSearchQuery(defaultSearchTerm);
    
    // Perform the search with a slight delay to ensure the UI is rendered first
    const timer = setTimeout(() => {
      performSearch(undefined, defaultSearchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [language]);
  
  // Clear search bar when user leaves the page
  useEffect(() => {
    // Function to clear search state
    const clearSearchState = () => {
      setSearchQuery('');
      setSearchResults([]);
      setSearchPerformed(false);
    };
    
    // Add event listener for page navigation
    const handleRouteChange = () => {
      clearSearchState();
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
              required
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
          {language === 'es' 
            ? 'Los resultados de MaxiPali provienen directamente de su API oficial.' 
            : 'MaxiPali results come directly from their official API.'}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
          {error}
        </div>
      )}
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
        </div>
      )}
      
      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isPriority={index < 4}
            />
          ))}
        </div>
      )}
      
      {/* No Results Message */}
      {!isLoading && searchPerformed && searchResults.length === 0 && !error && (
        <div className="text-center py-10 max-w-2xl mx-auto">
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
                  ? 'Pruebe una categoría diferente'
                  : 'Try a different category'}
              </li>
              <li>
                {language === 'es'
                  ? 'Revise si hay errores ortográficos en su búsqueda'
                  : 'Check for spelling errors in your search'}
              </li>
              <li>
                {language === 'es'
                  ? 'Asegúrese de que ha seleccionado al menos una tienda'
                  : 'Make sure you have selected at least one store'}
              </li>
              <li>
                {language === 'es'
                  ? 'Pruebe con un término en español (ej: "café" en lugar de "coffee")'
                  : 'Try with a Spanish term (e.g., "café" instead of "coffee")'}
              </li>
            </ul>
          </div>
          <div className="mt-6">
            <button
              onClick={() => performSearch(undefined, language === 'es' ? 'arroz' : 'rice')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {language === 'es' ? 'Buscar arroz' : 'Search for rice'}
            </button>
          </div>
        </div>
      )}
      
      {/* Initial State - No Search Performed Yet */}
      {!isLoading && !searchPerformed && (
        <div className="text-center py-10">
          <div className="mb-6">
            <Image 
              src="/images/search-illustration.svg" 
              alt="Search" 
              width={200} 
              height={200}
              className="mx-auto opacity-60"
              onError={(e) => {
                // Fallback if the image doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            {language === 'es'
              ? 'Ingrese un término de búsqueda para encontrar productos.'
              : 'Enter a search term to find products.'}
          </p>
        </div>
      )}
    </div>
  );
} 