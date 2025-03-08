'use client';

import { useState, useEffect } from 'react';
import { BrowserMultiFormatReader, Result, Exception } from '@zxing/library';
import { useAppContext } from '@/contexts/AppContext';
import { Product } from '@/types/product';

export default function BarcodeScanner() {
  const { language, theme } = useAppContext();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [lastResult, setLastResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize barcode reader
    const codeReader = new BrowserMultiFormatReader();

    // Get available video devices
    codeReader.listVideoInputDevices()
      .then((devices: MediaDeviceInfo[]) => {
        setVideoInputDevices(devices);
        // Select the first device by default (usually the back camera on phones)
        if (devices.length > 0) {
          setSelectedDeviceId(devices[0].deviceId);
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
              } else {
                setError(language === 'es'
                  ? 'Producto no encontrado'
                  : 'Product not found');
              }
            } catch (error) {
              setError(language === 'es'
                ? 'Error al buscar el producto'
                : 'Error searching for product');
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
        ? 'Error al iniciar el escáner'
        : 'Error starting scanner');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    const codeReader = new BrowserMultiFormatReader();
    codeReader.reset();
    setIsScanning(false);
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

      <div className="mb-6">
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className={`w-full p-2 rounded-lg ${
            theme === 'dark'
              ? 'bg-gray-900 text-white border-gray-700'
              : 'bg-white text-black border-gray-300'
          }`}
        >
          <option key="default" value="">
            {language === 'es' ? 'Seleccionar cámara' : 'Select camera'}
          </option>
          {videoInputDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || (language === 'es' ? 'Cámara' : 'Camera')}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center mb-6">
        <video
          id="video"
          className={`w-full max-w-lg rounded-lg mb-4 ${isScanning ? 'block' : 'hidden'}`}
        />

        {!isScanning ? (
          <button
            onClick={startScanning}
            className="btn bg-black text-white dark:bg-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100"
          >
            {language === 'es' ? 'Iniciar Escaneo' : 'Start Scanning'}
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {language === 'es' ? 'Detener Escaneo' : 'Stop Scanning'}
          </button>
        )}
      </div>

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
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="text-xl font-bold mb-2">{scannedProduct.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{scannedProduct.brand}</p>
              <p className="mb-4">{scannedProduct.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  ₡{scannedProduct.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {scannedProduct.store}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 