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
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      
      // Make sure video element exists
      if (!videoRef.current) {
        throw new Error('Video element not ready. Please try again.');
      }

      // For iOS Safari, we need to start with minimal constraints
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Try to get all video devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);

      if (videoDevices.length === 0) {
        throw new Error('No cameras found on your device');
      }

      // Set up constraints based on device type and available cameras
      let constraints: MediaStreamConstraints;
      
      if (isMobile && videoDevices.length > 1) {
        // Mobile device with multiple cameras - try to use back camera
        constraints = {
          video: {
            facingMode: isIOS ? 'environment' : { exact: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else if (isMobile) {
        // Mobile device with single camera
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else {
        // Desktop device
        constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up video element
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', '');
      videoRef.current.setAttribute('muted', '');

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video loading timed out'));
        }, 10000);

        if (!videoRef.current) {
          clearTimeout(timeoutId);
          reject(new Error('Video element not found'));
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          clearTimeout(timeoutId);
          
          videoRef.current?.play()
            .then(() => {
              console.log('Video playback started successfully');
              setCameraReady(true);
              resolve();
            })
            .catch((error) => {
              console.error('Error starting video playback:', error);
              if (isIOS) {
                setCameraReady(true); // Set ready anyway on iOS
                resolve();
              } else {
                reject(error);
              }
            });
        };
      });

      // Initialize barcode reader
      console.log('Initializing barcode reader...');
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 100
      });
      
      const controls = await reader.decodeFromVideoDevice(
        undefined, 
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log('Barcode detected:', result.getText());
            handleCapture(result.getText());
          }
          if (err && !(err instanceof TypeError)) {
            if (err.name !== 'NotFoundException') {
              console.error('Scanning error:', err);
            }
          }
        }
      );
      
      controlsRef.current = controls;
      
      // Reset states
      setPermissionDenied(false);
      setScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error requesting camera permission:', err);
      let errorMessage = 'Failed to initialize camera.';
      
      if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
        errorMessage = 'Camera access denied. Please allow camera access and try again.';
        setPermissionDenied(true);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Could not find a suitable camera. Please try again.';
      }
      
      setError(errorMessage);
      setScanning(false);
    }
  };

  useEffect(() => {
    // Cleanup function for camera resources
    return () => {
      if (controlsRef.current) {
        console.log('Cleaning up scanner...');
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => {
          console.log('Stopping track:', track.label);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    };
  }, []);

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
        
        <div className="w-full max-w-md">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 mb-4">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              autoPlay
              muted
              style={{
                transform: 'scaleX(-1)', // Mirror the video feed
                width: '100%',
                height: '100%'
              }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 space-y-4 p-4">
                <p className="text-gray-500 text-center">
                  {permissionDenied 
                    ? 'Camera access was denied'
                    : 'Initializing camera...'}
                </p>
                <Button 
                  onClick={requestCameraPermission}
                  variant="outline"
                >
                  {permissionDenied 
                    ? 'Grant Camera Permission'
                    : 'Allow Camera Access'}
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  {permissionDenied 
                    ? 'You need to allow camera access in your browser settings'
                    : "If the camera doesn't start, click the button above"}
                </p>
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
      </div>
    </div>
  );
} 