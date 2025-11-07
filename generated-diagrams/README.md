# Product Image OCR Processing System - Architecture Diagrams

## Overview
This document contains the AWS Architecture Diagrams generated for the Product Image OCR Processing System based on the technical design specifications.

## Generated Diagrams

### 1. Product OCR Architecture (product-ocr-architecture.png)
- **Purpose**: High-level system architecture overview
- **Shows**: Main components and data flow between services
- **Key Components**:
  - React Frontend
  - API Gateway
  - Lambda Functions (Upload, Process, Retrieve)
  - S3 Bucket for image storage
  - DynamoDB for metadata
  - Amazon Bedrock (Claude) for OCR processing
  - CloudWatch for monitoring

### 2. Detailed OCR Architecture (detailed-ocr-architecture.png)
- **Purpose**: Comprehensive system architecture with technical details
- **Shows**: Complete service interactions, security, and monitoring
- **Key Features**:
  - Detailed Lambda configurations (memory, timeout)
  - IAM roles and security policies
  - CloudWatch Logs and Metrics integration
  - Specific API endpoints and data operations
  - Service-to-service communication patterns

### 3. OCR Data Flow (ocr-data-flow.png)
- **Purpose**: Step-by-step processing pipeline visualization
- **Shows**: Complete user journey from upload to results
- **Process Flow**:
  1. User uploads image via React frontend
  2. API Gateway routes to Upload Lambda
  3. Image stored in S3, record created in DynamoDB (PENDING)
  4. S3 event triggers OCR Processing Lambda
  5. Bedrock Claude extracts product specifications
  6. DynamoDB record updated (COMPLETED)
  7. Frontend retrieves and displays results

## Technical Architecture Highlights

### Serverless Design
- **Lambda Functions**: Three specialized functions for upload, processing, and retrieval
- **Event-Driven**: S3 events automatically trigger OCR processing
- **Auto-Scaling**: All services scale automatically based on demand

### Storage Strategy
- **S3**: Secure object storage for product images with event notifications
- **DynamoDB**: NoSQL database for extracted product specifications with status tracking

### AI/ML Integration
- **Amazon Bedrock**: Managed AI service using Claude model for text extraction
- **Structured Output**: JSON-formatted product specifications extraction

### Security & Monitoring
- **IAM**: Least-privilege access policies for all Lambda functions
- **CloudWatch**: Comprehensive logging and metrics collection
- **Encryption**: At-rest encryption for both S3 and DynamoDB

## File Locations
All diagrams are saved in PNG format in the following directory:
```
/home/pandson/echo-architect-artifacts/product-ocr-system-110720251818/generated-diagrams/generated-diagrams/
```

## Usage
These diagrams can be used for:
- System documentation
- Architecture reviews
- Development team onboarding
- Stakeholder presentations
- Infrastructure planning
