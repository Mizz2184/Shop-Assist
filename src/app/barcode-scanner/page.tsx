'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import axios from 'axios';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Simple Skeleton component
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
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
  const { user, session } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize barcode reader
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      // Clean up
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);
  
  // Handle camera errors
  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    setCameraStarted(false);
    
    const errorMessage = error instanceof DOMException ? error.message : error;
    
    if ((error instanceof DOMException && error.name === 'NotAllowedError') || 
        (typeof error === 'string' && error.includes('Permission denied'))) {
      setPermissionDenied(true);
      setError('Camera access denied. Please allow camera access in your browser settings.');
      
      toast({
        title: "Camera Access Denied",
        description: "You need to allow camera access to use the barcode scanner",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      setError(`Camera error: ${errorMessage}`);
    }
  };
  
  // Start scanning process
  const startScanning = useCallback(() => {
    if (!webcamRef.current?.video || !readerRef.current) {
      return;
    }
    
    setScanning(true);
    setError(null);
    
    const scanBarcode = async () => {
      if (!webcamRef.current?.video || !scanning) return;
      
      try {
        // Get current frame from webcam
        const video = webcamRef.current.video;
        
        // Only scan if video is playing and has dimensions
        if (video.readyState === video.HAVE_ENOUGH_DATA &&
            video.videoWidth > 0 &&
            video.videoHeight > 0) {
          
          // Decode from video element
          const result = await readerRef.current?.decodeFromVideoElement(video);
          
          if (result) {
            console.log('Barcode detected:', result.getText());
            handleCapture(result.getText());
          }
        }
      } catch (error) {
        // Ignore 'not found' errors as they're expected when no barcode is in frame
        if (error instanceof NotFoundException) {
          // Barcode not found in this frame, continue scanning
          return;
        }
        
        console.error('Scan error:', error);
      }
    };
    
    // Set up scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Scan every 500ms
    scanIntervalRef.current = setInterval(scanBarcode, 500);
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [scanning]);
  
  // Handle camera start/stop
  const toggleCamera = () => {
    if (cameraStarted) {
      // Stop camera
      setCameraStarted(false);
      setScanning(false);
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    } else {
      // Start camera
      setCameraStarted(true);
      setPermissionDenied(false);
      setError(null);
      
      // Start scanning after a short delay to ensure camera is initialized
      setTimeout(() => {
        startScanning();
      }, 1000);
    }
  };
  
  // Start scanning when camera is started
  useEffect(() => {
    if (cameraStarted && !scanning) {
      startScanning();
    }
  }, [cameraStarted, scanning, startScanning]);
  
  // Handle barcode capture
  const handleCapture = async (barcodeValue: string) => {
    // Ignore if already loading or same barcode scanned again
    if (loading || lastScannedCode === barcodeValue) {
      return;
    }
    
    try {
      setLastScannedCode(barcodeValue);
      setScanning(false);
      setLoading(true);
      setError(null);
      
      // Clear scanning interval
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      
      // Fetch product data from API
      console.log('Fetching product data for barcode:', barcodeValue);
      const response = await axios.get(`/api/products/barcode/${barcodeValue}`);
      
      if (response.status === 200 && response.data) {
        console.log('Product found:', response.data);
        setProduct(response.data);
        
        toast({
          title: 'Product found!',
          description: `${response.data.name} has been scanned successfully.`,
          duration: 3000,
        });
      } else {
        console.log('No product found for barcode:', barcodeValue);
        setError('Product not found. Please try again.');
        // Reset to scanning mode after error
        setTimeout(() => {
          setScanning(true);
          startScanning();
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setError('Failed to process barcode. Please try again.');
      
      // Reset to scanning mode after error
      setTimeout(() => {
        setScanning(true);
        startScanning();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding product to grocery list
  const handleAddToList = async () => {
    if (!product) return;
    
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add items to your grocery list",
          variant: "destructive",
        });
        
        router.push('/auth/login');
        return;
      }
      
      if (!session?.access_token) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        
        router.push('/auth/login');
        return;
      }
      
      setLoading(true);
      
      // Call API to add to grocery list
      const response = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(product)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to grocery list');
      }
      
      toast({
        title: "Added to list",
        description: `${product.name} added to your grocery list`,
      });
      
      // Reset scanner
      setProduct(null);
      setLastScannedCode(null);
      setScanning(true);
      startScanning();
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Error",
        description: "Failed to add item to grocery list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Reset scanner
  const resetScanner = () => {
    setProduct(null);
    setLastScannedCode(null);
    setScanning(true);
    startScanning();
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return `₡${price.toLocaleString()}`;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="p-0 mr-4" 
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Barcode Scanner</h1>
      </div>
      
      <Card className="w-full max-w-md mx-auto mb-6">
        <CardContent className="p-4">
          {product ? (
            // Product details view
            <div className="space-y-4">
              <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 rounded">
                <Image
                  src={product.imageUrl || '/placeholder-product.png'}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="p-2"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-sm mb-2">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                    {product.store}
                  </span>
                  <span className="font-bold">{formatPrice(product.price)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={handleAddToList}
                  disabled={loading}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to List
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={resetScanner}
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Scan Again
                </Button>
              </div>
            </div>
          ) : (
            // Scanner view
            <div className="space-y-4">
              <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
                {cameraStarted ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    videoConstraints={{
                      facingMode: "environment",
                      width: { min: 640, ideal: 1280 },
                      height: { min: 480, ideal: 720 }
                    }}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    onUserMediaError={handleCameraError}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Camera className="h-20 w-20 text-gray-600" />
                  </div>
                )}
                
                {scanning && cameraStarted && (
                  // Scanner overlay
                  <div className="absolute inset-x-0 top-1/2 h-1 bg-red-500 animate-pulse"></div>
                )}
                
                {loading && (
                  // Loading overlay
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="text-sm text-red-500 text-center py-2">
                  {error}
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={toggleCamera}
                disabled={loading}
              >
                {cameraStarted ? 'Stop Camera' : 'Start Camera'}
              </Button>
              
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                {cameraStarted 
                  ? (scanning 
                      ? "Position barcode within view to scan" 
                      : "Processing...") 
                  : "Click 'Start Camera' to begin scanning"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 