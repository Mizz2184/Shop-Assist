'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, Result, Exception } from '@zxing/library';
import { useAppContext } from '@/contexts/AppContext';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BarcodeScanner() {
  const { language, theme } = useAppContext();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [lastResult, setLastResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Function to detect mobile devices
  const isMobile = () => {
    if (typeof window !== 'undefined') {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
  };

  useEffect(() => {
    // Initialize barcode reader
    const codeReader = new BrowserMultiFormatReader();

    // Get available video devices
    codeReader.listVideoInputDevices()
      .then((devices: MediaDeviceInfo[]) => {
        setVideoInputDevices(devices);
        
        // For mobile devices, try to select the back camera
        if (devices.length > 0) {
          if (isMobile()) {
            // Look for back camera (usually contains "back" in the label)
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('trasera') ||
              device.label.toLowerCase().includes('rear')
            );
            
            if (backCamera) {
              setSelectedDeviceId(backCamera.deviceId);
            } else {
              // Default to the first camera if back camera not found
              setSelectedDeviceId(devices[0].deviceId);
            }
          } else {
            // For desktop, just use the first camera
            setSelectedDeviceId(devices[0].deviceId);
          }
        }
      })
      .catch((err: Error) => {
        console.error(err);
        setError(language === 'es' 
          ? 'Error al acceder a la cámara. Por favor, asegúrese de que tiene permiso para usar la cámara.'
          : 'Error accessing camera. Please make sure you have camera permissions enabled.');
      });

    return () => {
      codeReader.reset();
    };
  }, [language]);

  const startScanning = async () => {
    if (!selectedDeviceId) {
      setError(language === 'es'
        ? 'Por favor, seleccione una cámara'
        : 'Please select a camera');
      return;
    }

    setIsScanning(true);
    setError('');
    setScannedProduct(null);
    setAddSuccess(false);

    const codeReader = new BrowserMultiFormatReader();

    try {
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        'video',
        async (result: Result | null, err: Exception | undefined) => {
          if (result && result.getText() !== lastResult) {
            const barcode = result.getText();
            setLastResult(barcode);
            
            // Search for product by barcode
            try {
              const response = await fetch(`/api/products/barcode/${barcode}`);
              if (response.ok) {
                const product = await response.json();
                setScannedProduct(product);
                codeReader.reset(); // Stop scanning after successful scan
                setIsScanning(false);
                
                // Vibrate on success (mobile devices)
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }
              } else {
                const errorData = await response.json();
                setError(language === 'es'
                  ? `Producto no encontrado: ${errorData.error || ''}`
                  : `Product not found: ${errorData.error || ''}`);
              }
            } catch (error) {
              console.error('Error searching for product:', error);
              setError(language === 'es'
                ? 'Error al buscar el producto. Intente de nuevo.'
                : 'Error searching for product. Please try again.');
            }
          }
          if (err && !(err instanceof TypeError)) {
            // Ignore TypeError as it's thrown when stopping the scan
            console.error(err);
          }
        }
      );
    } catch (err) {
      console.error(err);
      setError(language === 'es'
        ? 'Error al iniciar el escáner. Asegúrese de que su dispositivo tiene acceso a la cámara.'
        : 'Error starting scanner. Make sure your device has camera access.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    const codeReader = new BrowserMultiFormatReader();
    codeReader.reset();
    setIsScanning(false);
  };

  const addToGroceryList = async () => {
    if (!scannedProduct) return;
    
    setIsAddingToList(true);
    setAddSuccess(false);
    
    try {
      const response = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scannedProduct),
      });
      
      if (response.ok) {
        setAddSuccess(true);
        // Vibrate on success (mobile devices)
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        setError(language === 'es'
          ? 'Error al agregar el producto a la lista'
          : 'Error adding product to list');
      }
    } catch (error) {
      console.error('Error adding to grocery list:', error);
      setError(language === 'es'
        ? 'Error al agregar el producto a la lista'
        : 'Error adding product to list');
    } finally {
      setIsAddingToList(false);
    }
  };

  const scanNewProduct = () => {
    setScannedProduct(null);
    setLastResult('');
    setError('');
    setAddSuccess(false);
  };

  const goToGroceryList = () => {
    router.push('/grocery-list');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {language === 'es' ? 'Escáner de Código de Barras' : 'Barcode Scanner'}
      </h1>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {addSuccess && (
        <div className="bg-green-500 text-white p-4 rounded-lg mb-6">
          {language === 'es' 
            ? 'Producto agregado a la lista de compras' 
            : 'Product added to grocery list'}
        </div>
      )}

      {!scannedProduct && (
        <>
          <div className="mb-6">
            <label className="block mb-2 font-medium">
              {language === 'es' ? 'Seleccionar cámara:' : 'Select camera:'}
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className={`w-full p-3 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-900 text-white border-gray-700'
                  : 'bg-white text-black border-gray-300'
              }`}
            >
              {[
                { id: 'default', value: '', label: language === 'es' ? 'Seleccionar cámara' : 'Select camera' },
                ...videoInputDevices.map(device => ({
                  id: device.deviceId,
                  value: device.deviceId,
                  label: device.label || (language === 'es' ? 'Cámara' : 'Camera')
                }))
              ].map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-full max-w-lg relative">
              <video
                id="video"
                ref={videoRef}
                className={`w-full aspect-[4/3] rounded-lg mb-4 ${isScanning ? 'block' : 'hidden'}`}
              />
              {isScanning && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-red-500 w-64 h-64 rounded-lg"></div>
                </div>
              )}
            </div>

            {!isScanning ? (
              <button
                onClick={startScanning}
                className="btn bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 py-3 px-6 text-lg w-full max-w-xs"
              >
                {language === 'es' ? 'Iniciar Escaneo' : 'Start Scanning'}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="btn bg-red-600 text-white hover:bg-red-700 py-3 px-6 text-lg w-full max-w-xs"
              >
                {language === 'es' ? 'Detener Escaneo' : 'Stop Scanning'}
              </button>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {language === 'es' 
                ? 'Escanee el código de barras de un producto para ver su información y agregarlo a su lista de compras.' 
                : 'Scan a product barcode to view its information and add it to your grocery list.'}
            </p>
            <Link href="/grocery-list" className="text-blue-500 hover:underline">
              {language === 'es' ? 'Ver mi lista de compras' : 'View my grocery list'}
            </Link>
          </div>
        </>
      )}

      {scannedProduct && (
        <div className={`rounded-lg p-6 ${
          theme === 'dark'
            ? 'bg-gray-900 border border-gray-800'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="relative h-64 w-full">
                <img
                  src={scannedProduct.imageUrl || 'https://placehold.co/400x400?text=No+Image'}
                  alt={scannedProduct.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  EAN: {scannedProduct.ean}
                </span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="text-xl font-bold mb-2">{scannedProduct.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{scannedProduct.brand}</p>
              <p className="mb-4">{scannedProduct.description}</p>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold">
                  ₡{scannedProduct.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {scannedProduct.store}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={addToGroceryList}
                  disabled={isAddingToList || addSuccess}
                  className={`btn w-full ${
                    addSuccess 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100'
                  } py-3 px-6`}
                >
                  {isAddingToList 
                    ? (language === 'es' ? 'Agregando...' : 'Adding...') 
                    : addSuccess 
                      ? (language === 'es' ? 'Agregado ✓' : 'Added ✓')
                      : (language === 'es' ? 'Agregar a la lista' : 'Add to grocery list')}
                </button>
                
                <button
                  onClick={scanNewProduct}
                  className="btn border border-gray-300 dark:border-gray-700 py-3 px-6 w-full"
                >
                  {language === 'es' ? 'Escanear otro producto' : 'Scan another product'}
                </button>
              </div>
              
              {addSuccess && (
                <button
                  onClick={goToGroceryList}
                  className="btn bg-blue-500 text-white hover:bg-blue-600 py-3 px-6 w-full mt-4"
                >
                  {language === 'es' ? 'Ver mi lista de compras' : 'View my grocery list'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          {language === 'es' 
            ? 'Esta función busca productos de MaxiPali por su código de barras (EAN).' 
            : 'This feature searches for MaxiPali products by their barcode (EAN).'}
        </p>
      </div>
    </div>
  );
} 