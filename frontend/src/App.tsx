import React, { useState } from 'react';
import './App.css';
import ImageUpload from './components/ImageUpload';
import ProductResults from './components/ProductResults';

interface ProductData {
  productId: string;
  imageUrl: string;
  originalFileName: string;
  processingStatus: string;
  timestamp: string;
  extractedData?: {
    productName: string;
    brand: string;
    category: string;
    price: string;
    dimensions: string;
    weight: string;
    description: string;
    additionalDetails: any;
  };
  errorMessage?: string;
}

function App() {
  const [currentProduct, setCurrentProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = (productId: string) => {
    setIsLoading(true);
    // Poll for results
    const pollForResults = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentProduct(data);
          
          if (data.processingStatus === 'COMPLETED' || data.processingStatus === 'FAILED') {
            setIsLoading(false);
          } else {
            // Continue polling
            setTimeout(pollForResults, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling for results:', error);
        setIsLoading(false);
      }
    };
    
    pollForResults();
  };

  const handleNewUpload = () => {
    setCurrentProduct(null);
    setIsLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Image OCR System</h1>
        <p>Upload product images to automatically extract specifications</p>
      </header>
      
      <main className="App-main">
        {!currentProduct && !isLoading && (
          <ImageUpload onUploadSuccess={handleUploadSuccess} />
        )}
        
        {isLoading && (
          <div className="loading">
            <h2>Processing your image...</h2>
            <p>Please wait while we extract product specifications.</p>
            <div className="spinner"></div>
          </div>
        )}
        
        {currentProduct && !isLoading && (
          <ProductResults 
            product={currentProduct} 
            onNewUpload={handleNewUpload}
          />
        )}
      </main>
    </div>
  );
}

export default App;
