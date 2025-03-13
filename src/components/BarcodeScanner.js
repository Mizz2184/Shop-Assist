import { useZxing } from "react-zxing";
import { useState } from "react";

const BarcodeScanner = () => {
  const [result, setResult] = useState("");
  
  const { ref } = useZxing({
    onDecodeResult(result) {
      setResult(result.getText());
      // Handle your barcode result here
      console.log("Barcode detected:", result.getText());
    },
    constraints: {
      video: {
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
    },
  });

  return (
    <div className="scanner-container">
      <video ref={ref} />
      <p>{result}</p>
    </div>
  );
};

export default BarcodeScanner;