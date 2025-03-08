'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';
type Currency = 'USD' | 'CRC';
type Theme = 'dark' | 'light';

interface AppContextType {
  language: Language;
  currency: Currency;
  theme: Theme;
  exchangeRate: number;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  translate: (text: string) => Promise<string>;
  groceryListCount: number;
  setGroceryListCount: (count: number) => void;
}

const AppContext = createContext<AppContextType>({
  language: 'en',
  currency: 'USD',
  theme: 'dark',
  exchangeRate: 1,
  setLanguage: () => {},
  setCurrency: () => {},
  setTheme: () => {},
  toggleTheme: () => {},
  translate: async () => '',
  groceryListCount: 0,
  setGroceryListCount: () => {},
});

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [theme, setTheme] = useState<Theme>('dark');
  const [exchangeRate, setExchangeRate] = useState(540); // 1 USD = 540 CRC (approx)
  const [groceryListCount, setGroceryListCount] = useState(0);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Load saved preferences and fetch exchange rate
  useEffect(() => {
    // Load saved preferences from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    const savedCurrency = localStorage.getItem('currency') as Currency;
    
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedCurrency) setCurrency(savedCurrency);

    // Fetch exchange rate
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/1df26945f747275d9fb40bdc/latest/USD');
        const data = await response.json();
        
        if (data && data.conversion_rates && data.conversion_rates.CRC) {
          setExchangeRate(data.conversion_rates.CRC);
        } else {
          console.error('Exchange rate data not found in response:', data);
          // Fallback to a default rate if API fails
          setExchangeRate(535);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to a default rate if API fails
        setExchangeRate(535);
      }
    };

    fetchExchangeRate();

    // Refresh exchange rate every hour
    const interval = setInterval(fetchExchangeRate, 3600000);

    return () => clearInterval(interval);
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('language', language);
    localStorage.setItem('currency', currency);
  }, [language, currency]);

  // Translation function using Google Translate API
  const translate = async (text: string): Promise<string> => {
    // If language is Spanish or text is empty/null, return the original text
    if (language === 'es' || !text) return text || '';
    
    try {
      // In a real app, you would call a translation API here
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text || '',
          from: 'es',
          to: 'en',
        }),
      });
      
      if (!response.ok) {
        console.error('Translation API error:', response.status, response.statusText);
        return text || ''; // Return original text if translation fails
      }
      
      const data = await response.json();
      return data.translatedText || text || '';
    } catch (error) {
      console.error('Translation error:', error);
      return text || ''; // Return original text if translation fails
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        currency,
        theme,
        exchangeRate,
        setLanguage,
        setCurrency,
        setTheme,
        toggleTheme,
        translate,
        groceryListCount,
        setGroceryListCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}; 