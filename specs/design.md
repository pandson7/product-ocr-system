# Technical Design Document

## Architecture Overview

The AWS Product Image OCR Processing System follows a serverless, event-driven architecture using AWS managed services. The system processes product images through an automated pipeline that extracts specifications using AI/ML capabilities.

## System Components

### Frontend Layer
- **React Application**: Single-page application for image upload and results display
- **Local Development Server**: Runs on localhost for development and testing
- **File Upload Interface**: Drag-and-drop functionality with progress indicators

### API Layer
- **AWS Lambda Functions**: Serverless compute for business logic
  - Image Upload Handler: Manages S3 upload operations
  - OCR Processing Function: Orchestrates Bedrock analysis
  - Data Retrieval Function: Fetches results from DynamoDB
- **API Gateway**: RESTful endpoints for frontend communication

### Storage Layer
- **Amazon S3**: Object storage for product images
  - Bucket: product-images-bucket
  - Event notifications for automatic processing triggers
- **Amazon DynamoDB**: NoSQL database for extracted specifications
  - Table: ProductSpecifications
  - Partition Key: productId (UUID)
  - Attributes: imageUrl, extractedData, timestamp, processingStatus

### AI/ML Layer
- **Amazon Bedrock**: Managed AI service for text extraction
  - Model: Claude (latest available version)
  - Custom prompts for product specification extraction
  - Structured JSON output formatting

## Data Flow Architecture

```
User Upload → React Frontend → API Gateway → Lambda (Upload) → S3 Bucket
                                                                    ↓
DynamoDB ← Lambda (Save) ← Bedrock (Claude) ← Lambda (Process) ← S3 Event
    ↓
API Gateway ← Lambda (Retrieve) ← Frontend (Display Results)
```

## Technical Specifications

### Lambda Functions

#### 1. Image Upload Function
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Triggers**: API Gateway POST /upload
- **Permissions**: S3 PutObject, DynamoDB PutItem

#### 2. OCR Processing Function
- **Runtime**: Node.js 18.x
- **Memory**: 1024 MB
- **Timeout**: 300 seconds
- **Triggers**: S3 Object Created events
- **Permissions**: S3 GetObject, Bedrock InvokeModel, DynamoDB UpdateItem

#### 3. Data Retrieval Function
- **Runtime**: Node.js 18.x
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **Triggers**: API Gateway GET /products/{id}
- **Permissions**: DynamoDB GetItem, Query

### Database Schema

#### ProductSpecifications Table
```json
{
  "productId": "string (UUID)",
  "imageUrl": "string (S3 URL)",
  "originalFileName": "string",
  "extractedData": {
    "productName": "string",
    "brand": "string",
    "category": "string",
    "price": "string",
    "dimensions": "string",
    "weight": "string",
    "description": "string",
    "additionalDetails": "object"
  },
  "processingStatus": "string (PENDING|COMPLETED|FAILED)",
  "timestamp": "string (ISO 8601)",
  "errorMessage": "string (optional)"
}
```

### Bedrock Integration

#### Claude Prompt Template
```
Analyze this product image and extract the following information in JSON format:
- productName: The name of the product
- brand: The brand or manufacturer
- category: Product category or type
- price: Any visible price information
- dimensions: Size or dimension specifications
- weight: Weight information if visible
- description: Product description or key features
- additionalDetails: Any other relevant product information

Return only valid JSON without additional text or formatting.
```

## Security Design

### IAM Roles and Policies

#### Lambda Execution Role
- S3 read/write access to product-images-bucket
- DynamoDB read/write access to ProductSpecifications table
- Bedrock invoke permissions for Claude model
- CloudWatch Logs write permissions

#### API Gateway Integration
- CORS configuration for frontend domain
- Request validation and throttling
- Error handling and response formatting

### Data Security
- S3 bucket encryption at rest
- DynamoDB encryption at rest
- Secure API endpoints with proper error handling
- No sensitive data logging

## Deployment Architecture

### AWS CDK Infrastructure
- **Stack Name**: ProductOcrStack
- **Region**: us-east-1 (configurable)
- **Resources**:
  - S3 Bucket with event notifications
  - DynamoDB table with on-demand billing
  - Lambda functions with proper IAM roles
  - API Gateway with CORS configuration

### Frontend Deployment
- Local React development server
- Build process for production-ready assets
- Environment configuration for API endpoints

## Performance Considerations

### Scalability
- Lambda auto-scaling based on demand
- DynamoDB on-demand capacity mode
- S3 unlimited storage capacity

### Optimization
- Image size validation before processing
- Efficient DynamoDB queries with proper indexing
- Lambda cold start mitigation through provisioned concurrency (if needed)

## Error Handling

### Processing Failures
- Retry logic for transient Bedrock failures
- Dead letter queues for failed processing
- Comprehensive error logging and monitoring

### User Experience
- Progress indicators during processing
- Clear error messages for upload failures
- Graceful degradation for service unavailability

## Monitoring and Logging

### CloudWatch Integration
- Lambda function metrics and logs
- API Gateway access logs
- Custom metrics for processing success rates
- Alarms for error thresholds

### Operational Visibility
- Processing time tracking
- Success/failure rate monitoring
- Cost optimization insights
