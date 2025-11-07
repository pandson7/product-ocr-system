import React from 'react';

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

interface ProductResultsProps {
  product: ProductData;
  onNewUpload: () => void;
}

const ProductResults: React.FC<ProductResultsProps> = ({ product, onNewUpload }) => {
  const formatValue = (value: string | undefined) => {
    return value && value !== 'Unable to extract' ? value : 'Not detected';
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Product Analysis Results</h2>
        <button onClick={onNewUpload} className="new-upload-btn">
          Upload Another Image
        </button>
      </div>

      <div className="results-content">
        <div className="image-section">
          <h3>Original Image</h3>
          <div className="image-info">
            <p><strong>File:</strong> {product.originalFileName}</p>
            <p><strong>Status:</strong> 
              <span className={`status ${product.processingStatus.toLowerCase()}`}>
                {product.processingStatus}
              </span>
            </p>
            <p><strong>Processed:</strong> {new Date(product.timestamp).toLocaleString()}</p>
          </div>
        </div>

        {product.processingStatus === 'FAILED' && (
          <div className="error-section">
            <h3>Processing Error</h3>
            <p className="error-text">{product.errorMessage || 'Unknown error occurred'}</p>
          </div>
        )}

        {product.processingStatus === 'COMPLETED' && product.extractedData && (
          <div className="extracted-data">
            <h3>Extracted Product Information</h3>
            <div className="data-grid">
              <div className="data-item">
                <label>Product Name:</label>
                <span>{formatValue(product.extractedData.productName)}</span>
              </div>
              <div className="data-item">
                <label>Brand:</label>
                <span>{formatValue(product.extractedData.brand)}</span>
              </div>
              <div className="data-item">
                <label>Category:</label>
                <span>{formatValue(product.extractedData.category)}</span>
              </div>
              <div className="data-item">
                <label>Price:</label>
                <span>{formatValue(product.extractedData.price)}</span>
              </div>
              <div className="data-item">
                <label>Dimensions:</label>
                <span>{formatValue(product.extractedData.dimensions)}</span>
              </div>
              <div className="data-item">
                <label>Weight:</label>
                <span>{formatValue(product.extractedData.weight)}</span>
              </div>
              <div className="data-item full-width">
                <label>Description:</label>
                <span>{formatValue(product.extractedData.description)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="product-id">
          <small>Product ID: {product.productId}</small>
        </div>
      </div>
    </div>
  );
};

export default ProductResults;
