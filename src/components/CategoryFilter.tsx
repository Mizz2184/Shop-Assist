'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface CategoryFilterProps {
  selectedCategory: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onChange }: CategoryFilterProps) {
  const { language } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  // Define categories with translations
  const categories = [
    { id: '', name_en: 'All Categories', name_es: 'Todas las Categorías' },
    { id: 'abarrotes', name_en: 'Groceries', name_es: 'Abarrotes' },
    { id: 'limpieza', name_en: 'Cleaning', name_es: 'Limpieza' },
    { id: 'electronica', name_en: 'Electronics', name_es: 'Electrónica' },
    { id: 'higiene-belleza', name_en: 'Hygiene & Beauty', name_es: 'Higiene y Belleza' },
    { id: 'lacteos-huevos', name_en: 'Dairy & Eggs', name_es: 'Lácteos y Huevos' },
    { id: 'jugos-bebidas', name_en: 'Juices & Beverages', name_es: 'Jugos y Bebidas' },
    { id: 'hogar', name_en: 'Household Items', name_es: 'Artículos para el Hogar' },
    { id: 'bebes-ninos', name_en: 'Babies & Children', name_es: 'Bebés y Niños' },
    { id: 'panaderia-tortilleria', name_en: 'Bakery & Tortillas', name_es: 'Panadería y Tortillería' },
    { id: 'licores', name_en: 'Beer, Wine & Spirits', name_es: 'Cervezas, Vinos y Licores' },
    { id: 'carnes-pescados', name_en: 'Meat & Fish', name_es: 'Carnes y Pescados' },
    { id: 'congelados', name_en: 'Frozen Foods', name_es: 'Alimentos Congelados' },
    { id: 'farmacia', name_en: 'Pharmacy', name_es: 'Farmacia' },
    { id: 'embutidos', name_en: 'Cold Cuts', name_es: 'Embutidos' },
    { id: 'mascotas', name_en: 'Pets', name_es: 'Mascotas' },
    { id: 'juguetes', name_en: 'Toys', name_es: 'Juguetes' },
    { id: 'frutas-verduras', name_en: 'Fruits & Vegetables', name_es: 'Frutas y Verduras' },
    { id: 'deportes', name_en: 'Sports', name_es: 'Deportes' },
    { id: 'ropa-zapateria', name_en: 'Clothing & Footwear', name_es: 'Ropa y Zapatería' }
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCategorySelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  // Get the current category name based on language
  const getCurrentCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return language === 'es' 
      ? category?.name_es || 'Todas las Categorías'
      : category?.name_en || 'All Categories';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium bg-white text-black border border-black rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
      >
        <span>{getCurrentCategoryName()}</span>
        <svg
          className="w-5 h-5 ml-2 -mr-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-black dark:border-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1 text-sm text-black dark:text-white">
            {categories.map((category) => (
              <li
                key={category.id}
                className={`cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  selectedCategory === category.id ? 'bg-gray-100 dark:bg-gray-900' : ''
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                {language === 'es' ? category.name_es : category.name_en}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 