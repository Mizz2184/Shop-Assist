'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useZxing } from 'react-zxing';
import axios from 'axios';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function BarcodeScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  
  // Configure zxing barcode scanner
  const { ref, torch } = useZxing({
    onDecodeResult(result) {
      // Only process if we're actively scanning
      if (isScanning) {
        handleDecode(result.getText());
      }
    },
    onError(error) {
      handleScannerError(error as Error);
    },
    paused: !isScanning || !!product || loading || cameraPermissionDenied
  });
  
  // Start camera by default when component mounts
  useEffect(() => {
    // Reset error state and start scanning
    setError(null);
    setIsScanning(true);
    
    // Clean up on unmount
    return () => {
      setIsScanning(false);
    };
  }, []);
  
  // Handle scan errors
  function handleScannerError(error: Error) {
    console.error('Scanner error:', error);
    
    // Check for permission errors
    if (error.name === 'NotAllowedError' || 
        error.message.includes('Permission denied') || 
        error.message.includes('not allowed')) {
      setCameraPermissionDenied(true);
      setError('Camera access denied. Please allow camera access in your browser settings.');
      
      toast({
        title: "Camera Access Denied",
        description: "You need to allow camera access to use the barcode scanner",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      setError(`Camera error: ${error.message}`);
    }
  }
  
  // Handle successful barcode scan
  async function handleDecode(result: string) {
    // Skip if already loading or showing product details
    if (loading || product) return;
    
    try {
      // Pause scanning while processing this barcode
      setIsScanning(false);
      setLoading(true);
      setError(null);
      console.log('Barcode detected:', result);
      
      // Fetch product data from API
      console.log('Fetching product data for barcode:', result);
      const response = await axios.get(`/api/products/barcode/${result}`);
      
      if (response.status === 200 && response.data) {
        console.log('Product found:', response.data);
        setProduct(response.data);
        
        toast({
          title: 'Product found!',
          description: `${response.data.name} has been scanned successfully.`,
          duration: 3000,
        });
      } else {
        console.log('No product found for barcode:', result);
        setError('Product not found. Please try scanning again.');
        
        // Add a small delay before resuming scan
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setError('Failed to process barcode. Please try again.');
      
      // Add a small delay before resuming scan
      setTimeout(() => {
        setError(null);
        setIsScanning(true);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }
  
  // Handle adding product to grocery list
  async function handleAddToList() {
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
      
      // Reset and start scanning again
      resetScanner();
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
  }
  
  // Reset scanner to scan another barcode
  function resetScanner() {
    setProduct(null);
    setError(null);
    setCameraPermissionDenied(false);
    setIsScanning(true);
  }
  
  // Format price
  function formatPrice(price: number) {
    return `₡${price.toLocaleString()}`;
  }
  
  // Try to restart camera when permission denied and user wants to try again
  function tryRestartCamera() {
    setCameraPermissionDenied(false);
    setError(null);
    setIsScanning(true);
  }
  
  // Toggle torch/flashlight
  function toggleTorch() {
    if (torch.isAvailable) {
      if (torch.isOn) {
        torch.off();
      } else {
        torch.on();
      }
    } else {
      toast({
        title: "Flashlight unavailable",
        description: "Your device does not support flashlight control",
        variant: "destructive",
      });
    }
  }
  
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
                {cameraPermissionDenied ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-4">
                    <Camera className="h-16 w-16 text-gray-600 mb-4" />
                    <p className="text-white text-center mb-4">
                      Camera access is required to scan barcodes.
                      Please allow camera access in your browser settings.
                    </p>
                    <Button onClick={tryRestartCamera}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    <video ref={ref} className="w-full h-full object-cover" />
                    
                    {/* Scanner guide frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-500 w-2/3 h-1/3 rounded-lg"></div>
                    </div>
                  </>
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
              
              {!cameraPermissionDenied && torch.isAvailable !== null && (
                <Button
                  className="w-full"
                  onClick={toggleTorch}
                  disabled={loading || !torch.isAvailable}
                >
                  {torch.isOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                </Button>
              )}
              
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                {!cameraPermissionDenied
                  ? "Position barcode inside the green frame to scan"
                  : "Camera access required for scanning"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 