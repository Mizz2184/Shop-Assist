import { useZxing } from "react-zxing";
import { useState } from "react";

const BarcodeScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(true);
  
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (isScanning) {
        setIsScanning(false);
        const code = result.getText();
        // Handle your barcode result here
        console.log("Barcode detected:", code);
        if (onScan) {
          onScan(code);
        }
      }
    },
    onError(error) {
      console.error("Scanner error:", error);
      if (onError) {
        onError(error);
      }
    },
    constraints: {
      video: {
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
    },
  });

  const resetScanner = () => {
    setIsScanning(true);
  };

  return {
    scannerRef: ref,
    resetScanner,
    isScanning
  };
};

export default BarcodeScanner;