'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarcodeScanner } from 'react-barcode-scanner';
// Import the polyfill for browsers that don't support the Barcode Detection API
import 'react-barcode-scanner/polyfill';

export default function BarcodeScannerPage() {
  const { language, theme } = useAppContext();
  const [scanning, setScanning] = useState(true);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToList, setAddedToList] = useState(false);
  const router = useRouter();

  // Handle successful scan
  const handleCapture = (barcodes: any[]) => {
    if (barcodes.length > 0 && scanning) {
      const data = barcodes[0].rawValue;
      console.log('Barcode detected:', data);
      setBarcode(data);
      setScanning(false);
      searchProduct(data);
    }
  };

  // Handle scan errors
  const handleError = (err: Error) => {
    console.error('Barcode scanner error:', err);
    setError(language === 'es' 
      ? 'Error al acceder a la cámara. Por favor, asegúrate de que has concedido permisos de cámara.'
      : 'Error accessing camera. Please make sure you have granted camera permissions.');
  };

  // Search for product using the scanned barcode
  const searchProduct = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Searching for product with barcode:', barcode);
      const response = await fetch(`/api/products/barcode/${barcode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search product');
      }
      
      const data = await response.json();
      console.log('Product found:', data);
      
      if (data) {
        setProduct(data);
      } else {
        setError(language === 'es'
          ? 'No se encontró ningún producto con este código de barras.'
          : 'No product found with this barcode.');
      }
    } catch (error: any) {
      console.error('Error searching product:', error);
      setError(error.message || (language === 'es'
        ? 'Error al buscar el producto.'
        : 'Error searching for product.'));
    } finally {
      setLoading(false);
    }
  };

  // Add the scanned product to grocery list
  const addToGroceryList = async () => {
    if (!product) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product to grocery list');
      }
      
      setAddedToList(true);
      console.log('Product added to grocery list');
    } catch (error: any) {
      console.error('Error adding product to grocery list:', error);
      setError(error.message || (language === 'es'
        ? 'Error al añadir el producto a la lista.'
        : 'Error adding product to list.'));
    } finally {
      setLoading(false);
    }
  };

  // Reset the scanner to scan a new product
  const scanNewProduct = () => {
    setScanning(true);
    setBarcode(null);
    setProduct(null);
    setError(null);
    setAddedToList(false);
  };

  // Navigate to grocery list
  const goToGroceryList = () => {
    router.push('/grocery-list');
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {language === 'es' ? 'Escáner de Código de Barras' : 'Barcode Scanner'}
      </h1>
      
      {scanning ? (
        <div className="mb-6">
          <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ height: '300px' }}>
            <BarcodeScanner 
              onCapture={handleCapture}
              options={{
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'qr_code']
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {language === 'es'
              ? 'Apunta la cámara al código de barras del producto'
              : 'Point the camera at the product barcode'}
          </p>
        </div>
      ) : (
        <div className="mb-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : product ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              {product.brand && <p className="text-gray-600 dark:text-gray-300 mb-1">{product.brand}</p>}
              {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.description}</p>}
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat(language === 'es' ? 'es-CR' : 'en-US', {
                    style: 'currency',
                    currency: 'CRC',
                  }).format(product.price)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{product.store}</span>
              </div>
              
              {!addedToList ? (
                <button
                  onClick={addToGroceryList}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {language === 'es' ? 'Añadir a la Lista' : 'Add to List'}
                </button>
              ) : (
                <div className="text-center text-green-600 dark:text-green-400 mb-4">
                  {language === 'es' ? '¡Producto añadido!' : 'Product added!'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'es'
                  ? 'Código de barras escaneado:'
                  : 'Scanned barcode:'}
              </p>
              <p className="font-mono text-lg mb-4">{barcode}</p>
              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col space-y-3">
        {!scanning && (
          <button
            onClick={scanNewProduct}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {language === 'es' ? 'Escanear Nuevo Producto' : 'Scan New Product'}
          </button>
        )}
        
        <button
          onClick={goToGroceryList}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {language === 'es' ? 'Ver Lista de Compras' : 'View Grocery List'}
        </button>
        
        <Link
          href="/product-search"
          className="text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {language === 'es' ? 'Buscar Productos' : 'Search Products'}
        </Link>
      </div>
    </div>
  );
} 