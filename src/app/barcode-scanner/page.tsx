'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat } from '@zxing/library';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simple Skeleton component
const Skeleton = ({ className, isInline = false }: { className?: string; isInline?: boolean }) => (
  isInline ? (
    <span className={`animate-pulse bg-gray-200 rounded inline-block ${className}`} />
  ) : (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
);

// Simple shopping list hook implementation
const useShoppingList = () => {
  const addItem = (product: Product) => {
    // Get existing items from localStorage
    const existingItems = localStorage.getItem('shoppingList');
    const items = existingItems ? JSON.parse(existingItems) : [];
    
    // Add the new item
    items.push(product);
    
    // Save back to localStorage
    localStorage.setItem('shoppingList', JSON.stringify(items));
  };
  
  return { addItem };
};

export default function BarcodeScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useShoppingList();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    console.log('Initializing barcode scanner...');
    
    const initializeScanner = async () => {
      try {
        // First check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API is not supported in your browser');
        }

        // Start with basic constraints for mobile
        let constraints: MediaStreamConstraints = {
          video: {
            facingMode: { exact: 'environment' }, // Force rear camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        let mediaStream: MediaStream;

        try {
          console.log('Requesting camera access with constraints:', JSON.stringify(constraints));
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // If we get here, we successfully got the stream
          console.log('Camera stream obtained successfully');
          
          if (videoRef.current) {
            console.log('Setting up video element...');
            videoRef.current.srcObject = mediaStream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                  console.log('Video metadata loaded');
                  resolve(true);
                };
              }
            });
            
            await videoRef.current.play();
            console.log('Video playback started');
            setCameraReady(true);
            
            // Initialize ZXing reader
            console.log('Initializing barcode reader...');
            const reader = new BrowserMultiFormatReader();
            
            const controls = await reader.decodeFromVideoDevice(
              undefined, 
              videoRef.current, 
              (result, err) => {
                if (result) {
                  console.log('Barcode detected:', result.getText());
                  handleCapture(result.getText());
                }
                if (err && !(err instanceof TypeError)) {
                  console.debug('Scanning error:', err);
                  if (err.name !== 'NotFoundException') {
                    setError('Error scanning barcode. Please try again or adjust the camera position.');
                  }
                }
              }
            );
            
            controlsRef.current = controls;
            
            // Add video event listeners
            videoRef.current.addEventListener('loadedmetadata', () => {
              console.log('Video metadata loaded');
            });
            
            videoRef.current.addEventListener('error', (e) => {
              console.error('Video error:', e);
              setError('Camera error. Please try reloading the page.');
            });
          }
        } catch (streamError: any) {
          console.error('Error getting stream:', streamError);
          
          // If exact 'environment' fails, try without 'exact'
          if (streamError.name === 'OverconstrainedError') {
            console.log('Retrying with fallback constraints...');
            constraints = {
              video: {
                facingMode: 'environment', // Try without 'exact'
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            };
            
            try {
              console.log('Requesting camera access with fallback constraints');
              mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
              
              if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                setCameraReady(true);
                
                // Initialize reader with fallback stream
                const reader = new BrowserMultiFormatReader();
                const controls = await reader.decodeFromVideoDevice(
                  undefined,
                  videoRef.current,
                  (result, err) => {
                    if (result) {
                      console.log('Barcode detected:', result.getText());
                      handleCapture(result.getText());
                    }
                  }
                );
                controlsRef.current = controls;
              }
            } catch (fallbackError) {
              console.error('Fallback camera access failed:', fallbackError);
              throw new Error('Could not access the camera. Please check your camera permissions and try again.');
            }
          } else {
            throw streamError;
          }
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Camera access denied. Please allow camera access in your browser settings and reload the page.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found. Please ensure your device has a camera and reload the page.');
          } else if (err.name === 'NotReadableError') {
            setError('Could not access your camera. Please make sure no other app is using it and reload the page.');
          } else {
            setError(err.message || 'Failed to initialize camera. Please reload the page.');
          }
        } else {
          setError('An unexpected error occurred. Please reload the page.');
        }
        setScanning(false);
      }
    };

    if (scanning) {
      initializeScanner();
    }

    // Cleanup
    return () => {
      if (controlsRef.current) {
        console.log('Cleaning up scanner...');
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        console.log('Cleaning up video stream...');
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        videoRef.current.srcObject = null;
      }
    };
  }, [scanning]);

  // Handle barcode detection
  const handleCapture = async (rawValue: string) => {
    console.log('handleCapture called with barcode:', rawValue);
    
    if (loading || !scanning) {
      console.log('Loading in progress or not scanning, ignoring barcode');
      return;
    }
    
    try {
      // Skip if we've already scanned this code recently
      if (lastScannedCode === rawValue) {
        console.log('Skipping duplicate barcode');
        return;
      }
      
      setLastScannedCode(rawValue);
      setScanning(false);
      setLoading(true);
      setError(null);
      
      // Stop the scanner
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
      
      // Fetch product data from API
      console.log('Fetching product data for barcode:', rawValue);
      const response = await axios.get(`/api/products/barcode/${rawValue}`);
      
      if (response.status === 200 && response.data) {
        console.log('Product found:', response.data);
        setProduct(response.data);
        toast({
          title: 'Product found!',
          description: `${response.data.name} has been scanned successfully.`,
        });
      } else {
        console.log('No product found for barcode:', rawValue);
        setError('Product not found. Please try again.');
        setScanAttempts(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.error || 'Failed to fetch product. Please try again.');
      setScanAttempts(prev => prev + 1);
      
      // Special handling for Bimbo Cero Cero Blanco
      if (rawValue === '7441029522686') {
        console.log('Detected Bimbo Cero Cero Blanco EAN, retrying with direct lookup...');
        try {
          const retryResponse = await axios.get(`/api/products/barcode/7441029522686?retry=true`);
          if (retryResponse.status === 200 && retryResponse.data) {
            setProduct(retryResponse.data);
            setError(null);
            toast({
              title: 'Product found!',
              description: `${retryResponse.data.name} has been scanned successfully.`,
            });
          }
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset scanner
  const handleReset = () => {
    console.log('Resetting scanner');
    setScanning(true);
    setProduct(null);
    setError(null);
    setLastScannedCode(null);
  };

  // Add product to shopping list
  const handleAddToList = () => {
    if (product) {
      console.log('Adding product to shopping list:', product.name);
      addItem(product);
      toast({
        title: 'Added to list',
        description: `${product.name} has been added to your shopping list.`,
      });
      router.push('/shopping-list');
    }
  };

  // Go back to home
  const handleBack = () => {
    console.log('Navigating back to home');
    router.push('/');
  };

  // Handle manual test scan (for debugging)
  const handleTestScan = () => {
    console.log('Testing with Bimbo Cero Cero Blanco EAN');
    handleCapture('7441029522686');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-6">Barcode Scanner</h1>
        
        {scanning ? (
          <div className="w-full max-w-md">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 mb-4">
              {cameraReady ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">Waiting for camera access...</p>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1 bg-red-500 opacity-50"></div>
              </div>
            </div>
            <p className="text-center text-gray-500 mb-4">
              {cameraReady 
                ? "Position the barcode within the scanner view" 
                : "Waiting for camera access..."}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
              <Button onClick={handleTestScan} variant="secondary" className="w-full">
                Test with Sample Product
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-4 w-3/4" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-1/2" isInline />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square relative w-full mb-4">
                    <Skeleton className="h-full w-full absolute" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </CardFooter>
              </Card>
            ) : error ? (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-500">Error</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={handleReset} className="w-full">
                    Try Again
                  </Button>
                </CardFooter>
              </Card>
            ) : product ? (
              <Card>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.brand}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square relative w-full mb-4 bg-gray-100 rounded-md overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">No image available</p>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-lg">₡{product.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {product.description || `Available at ${product.store}`}
                  </p>
                  {product.ean && (
                    <p className="text-xs text-gray-400 mt-1">EAN: {product.ean}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={handleReset} variant="outline">
                    Scan Again
                  </Button>
                  <Button onClick={handleAddToList}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to List
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Product Found</CardTitle>
                  <CardDescription>Please try scanning again</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={handleReset} className="w-full">
                    Try Again
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 