'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

export default function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { language, setLanguage, currency, setCurrency, groceryListCount, theme, toggleTheme } = useAppContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([
    'maxipali', 'automercado', 'masxmenos', 'pricesmart'
  ]);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);

  const stores = [
    { id: 'maxipali', name: 'MaxiPalí' },
    { id: 'automercado', name: 'Auto Mercado' },
    { id: 'masxmenos', name: 'Mas x Menos' },
    { id: 'pricesmart', name: 'PriceSmart' }
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams();
    params.set('query', searchQuery);
    params.set('stores', selectedStores.join(','));
    
    setIsStoreMenuOpen(false);
    
    router.push(`/?${params.toString()}`);
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  return (
    <header className={`sticky top-0 z-30 w-full border-b transition-colors ${
      theme === 'dark' 
        ? 'bg-black border-gray-800 text-white' 
        : 'bg-white border-gray-200 text-black'
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col py-2">
          {/* Icons Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className={`p-2 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <span className="text-sm font-medium">{language.toUpperCase()}</span>
              </button>
              <button
                onClick={() => setCurrency(currency === 'USD' ? 'CRC' : 'USD')}
                className={`p-2 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <span className="text-sm font-medium">{currency}</span>
              </button>
            </div>
            <div className="flex items-center gap-x-4">
              <Link
                href="/grocery-list"
                className={`relative p-2 transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {groceryListCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
                    {groceryListCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 p-2 text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {user ? (
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      {user.email?.[0].toUpperCase()}
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 ring-opacity-5 ${
                    theme === 'dark'
                      ? 'bg-black ring-gray-700'
                      : 'bg-white ring-black'
                  }`}>
                    <div className="py-1">
                      {user ? (
                        <>
                          <div className={`px-4 py-2 text-sm border-b ${
                            theme === 'dark'
                              ? 'text-gray-300 border-gray-800'
                              : 'text-gray-700 border-gray-200'
                          }`}>
                            {user.email}
                          </div>
                          <button
                            onClick={handleSignOut}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/auth/login"
                            className={`block px-4 py-2 text-sm ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                          </Link>
                          <Link
                            href="/auth/signup"
                            className={`block px-4 py-2 text-sm ${
                              theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {language === 'es' ? 'Registrarse' : 'Sign Up'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="flex items-center gap-x-2">
            <div className="relative">
              <button
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className={`flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={language === 'es' ? 'Filtrar por tiendas' : 'Filter by stores'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {selectedStores.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-black dark:bg-white text-white dark:text-black text-xs rounded-full flex items-center justify-center">
                    {selectedStores.length}
                  </span>
                )}
              </button>
              {isStoreMenuOpen && (
                <div className={`absolute left-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-opacity-5 z-50 ${
                  theme === 'dark'
                    ? 'bg-black ring-gray-700'
                    : 'bg-white ring-black'
                }`}>
                  <div className="p-2 max-h-60 overflow-y-auto scrollbar-none">
                    {stores.map((store) => (
                      <label
                        key={store.id}
                        className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer ${
                          theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedStores.includes(store.id)}
                          onChange={() => toggleStore(store.id)}
                        />
                        <span className="ml-3">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'es' ? 'Buscar productos...' : 'Search products...'}
                  className={`w-full rounded-lg py-2 pl-4 pr-10 text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-black placeholder-gray-500'
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex h-16 items-center justify-between gap-8">
          {/* Search Section */}
          <div className="flex flex-1 items-center gap-x-3">
            {/* Store Filter */}
            <div className="relative">
              <button
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>
                  {language === 'es' ? 'Tiendas' : 'Stores'}
                  {selectedStores.length > 0 && ` (${selectedStores.length})`}
                </span>
              </button>
              {isStoreMenuOpen && (
                <div className={`absolute left-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-opacity-5 ${
                  theme === 'dark'
                    ? 'bg-black ring-gray-700'
                    : 'bg-white ring-black'
                }`}>
                  <div className="p-2">
                    {stores.map((store) => (
                      <label
                        key={store.id}
                        className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer ${
                          theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedStores.includes(store.id)}
                          onChange={() => toggleStore(store.id)}
                        />
                        <span className="ml-3">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'es' ? 'Buscar productos...' : 'Search products...'}
                  className={`w-full rounded-lg py-2 pl-4 pr-10 text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-black placeholder-gray-500'
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className={`p-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Currency Toggle */}
            <button
              onClick={() => setCurrency(currency === 'USD' ? 'CRC' : 'USD')}
              className={`p-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <span className="text-sm font-medium">{currency}</span>
            </button>

            {/* Grocery List Link */}
            <Link
              href="/grocery-list"
              className={`relative p-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {groceryListCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
                  {groceryListCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 p-2 text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {user ? (
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    {user.email?.[0].toUpperCase()}
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>

              {isUserMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 ring-opacity-5 ${
                  theme === 'dark'
                    ? 'bg-black ring-gray-700'
                    : 'bg-white ring-black'
                }`}>
                  <div className="py-1">
                    {user ? (
                      <>
                        <div className={`px-4 py-2 text-sm border-b ${
                          theme === 'dark'
                            ? 'text-gray-300 border-gray-800'
                            : 'text-gray-700 border-gray-200'
                        }`}>
                          {user.email}
                        </div>
                        <button
                          onClick={handleSignOut}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className={`block px-4 py-2 text-sm ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                        </Link>
                        <Link
                          href="/auth/signup"
                          className={`block px-4 py-2 text-sm ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {language === 'es' ? 'Registrarse' : 'Sign Up'}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 