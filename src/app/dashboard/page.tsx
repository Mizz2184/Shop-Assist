'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import React from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function Dashboard() {
  const { language, currency, formatPrice } = useAppContext();
  const { user, session, isLoading: authLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<number>(0);
  const [promotions, setPromotions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return; // Don't fetch data if not logged in
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get a fresh access token
        const token = await getAccessToken();
        
        if (!token) {
          throw new Error(language === 'es' 
            ? 'No se pudo obtener un token de acceso válido. Por favor, inicie sesión de nuevo.' 
            : 'Could not get a valid access token. Please log in again.');
        }
        
        // Fetch recent grocery list items with authentication
        const groceryResponse = await fetch('/api/grocery-list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!groceryResponse.ok) {
          console.error('Grocery list API error:', groceryResponse.status);
          throw new Error(language === 'es' 
            ? 'Error al cargar los datos del dashboard' 
            : 'Error loading dashboard data');
        }
        
        const { data, error } = await groceryResponse.json();
        if (error) {
          throw new Error(error);
        }

        setRecentItems(data || []);
        
        // Calculate monthly spending
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyItems = data?.filter((item: Product) => {
          const itemDate = new Date(item.created_at || '');
          return itemDate.getMonth() === currentMonth && 
                 itemDate.getFullYear() === currentYear;
        }) || [];
        
        const total = monthlyItems.reduce((sum: number, item: Product) => 
          sum + (item.price || 0), 0);
        setMonthlySpending(total);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || (language === 'es' 
          ? 'No se pudo cargar los datos del dashboard' 
          : 'Failed to load dashboard data'));
        setRecentItems([]);
        setMonthlySpending(0);
        setIsLoading(false);
      }
    };
    
    // Only fetch when component mounts or when dependencies change
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDashboardData();
    }
    
    // Clean up function
    return () => {
      // We don't reset the ref here to prevent refetching on every render
    };
  }, [language, user, getAccessToken]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingAnimation text="Loading dashboard..." />
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingAnimation text="Loading your dashboard data..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
        {language === 'es' ? 'Dashboard' : 'Dashboard'}
      </h1>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Monthly Spending Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'es' ? 'Gasto Mensual' : 'Monthly Spending'}
          </h2>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {formatPrice ? formatPrice(monthlySpending) : `₡${monthlySpending.toLocaleString()}`}
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {language === 'es' 
              ? 'Total gastado en productos este mes' 
              : 'Total spent on products this month'}
          </div>
        </div>

        {/* Recent Items Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {language === 'es' ? 'Lista de Compras Reciente' : 'Recent Grocery List'}
            </h2>
            <Link href="/grocery-list" className="text-sm text-blue-500 hover:underline">
              {language === 'es' ? 'Ver todo' : 'View all'}
            </Link>
          </div>
          {recentItems.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentItems.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 mr-3 overflow-hidden">
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name} 
                          width={32} 
                          height={32} 
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">N/A</span>
                        </div>
                      )}
                    </div>
                    <span className="truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-medium">
                    {formatPrice ? formatPrice(item.price) : `₡${item.price.toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              {language === 'es' 
                ? 'No hay elementos recientes' 
                : 'No recent items'}
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/product-search" 
              className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">
                {language === 'es' ? 'Buscar Productos' : 'Search Products'}
              </span>
            </Link>
            <Link 
              href="/barcode-scanner" 
              className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-sm">
                {language === 'es' ? 'Escanear Código' : 'Scan Barcode'}
              </span>
            </Link>
            <Link 
              href="/grocery-list" 
              className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm">
                {language === 'es' ? 'Lista de Compras' : 'Grocery List'}
              </span>
            </Link>
            <Link 
              href="/settings" 
              className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">
                {language === 'es' ? 'Configuración' : 'Settings'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Promotions Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {language === 'es' ? 'Promociones de MaxiPali' : 'MaxiPali Promotions'}
          </h2>
          <Link href="/product-search" className="text-sm text-blue-500 hover:underline">
            {language === 'es' ? 'Ver más' : 'View more'}
          </Link>
        </div>
        
        {promotions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {promotions.map((product) => (
              <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                  {product.brand && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.brand}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      {formatPrice ? formatPrice(product.price) : `₡${product.price.toLocaleString()}`}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      MaxiPali
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'es' 
                ? 'No hay promociones disponibles en este momento' 
                : 'No promotions available at this time'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}