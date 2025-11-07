# AWS Product Image OCR Processing System

A complete serverless solution for extracting product specifications from images using Amazon Bedrock Claude AI, built with AWS CDK and React.

## 🚀 Features

- **Serverless Architecture**: Built entirely on AWS managed services
- **AI-Powered OCR**: Uses Amazon Bedrock Claude 3 Haiku for intelligent text extraction
- **Secure Image Upload**: Direct S3 uploads with presigned URLs
- **Real-time Processing**: Automatic processing with status updates
- **Modern Frontend**: React TypeScript application with drag-and-drop interface
- **Structured Data**: Extracts product name, brand, category, price, dimensions, and more

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   React App     │───▶│ API Gateway  │───▶│ Lambda Functions│
│  (Frontend)     │    │              │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                     │
                       ┌─────────────────┐          │
                       │   S3 Bucket     │◀─────────┘
                       │ (Image Storage) │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Amazon Bedrock  │───▶│   DynamoDB      │
                       │ (Claude AI)     │    │ (Results Store) │
                       └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker (for CDK asset bundling)

## 🛠️ Installation & Deployment

### 1. Clone the Repository

```bash
git clone <repository-url>
cd product-ocr-system
```

### 2. Deploy Backend Infrastructure

```bash
cd cdk-app
npm install
cdk bootstrap  # First time only
cdk deploy
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

### 4. Configure Frontend API Endpoint

Update the API endpoint in `frontend/src/App.tsx` with your deployed API Gateway URL:

```typescript
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';
```

### 5. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

1. **Upload Image**: Drag and drop or click to select a product image (JPEG, PNG, WebP)
2. **Processing**: The system automatically processes the image using AI
3. **View Results**: Extracted product specifications are displayed in a structured format

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Maximum file size: 10MB

## 📊 Extracted Data Fields

The system extracts the following product information:

- **Product Name**: Main product title
- **Brand**: Manufacturer or brand name
- **Category**: Product category/type
- **Price**: Price information (when visible)
- **Dimensions**: Size specifications (when available)
- **Weight**: Product weight (when available)
- **Description**: Product description and features
- **Additional Details**: Extra specifications and details

## 🔧 Configuration

### Environment Variables

The system uses the following AWS resources (automatically configured by CDK):

- **S3 Bucket**: `product-images-bucket-{timestamp}`
- **DynamoDB Table**: `ProductSpecifications-{timestamp}`
- **Lambda Functions**: 
  - `product-upload-{timestamp}`
  - `product-ocr-{timestamp}`
  - `product-retrieve-{timestamp}`

### AWS Permissions

The CDK stack creates IAM roles with least-privilege access:

- S3 read/write permissions for image storage
- DynamoDB read/write for results storage
- Bedrock invoke permissions for AI processing
- CloudWatch logs for monitoring

## 🧪 Testing

### Run Backend Tests

```bash
cd cdk-app
npm test
```

### Test with Sample Images

Sample images are provided in the `test-images/` directory for testing various product types.

## 📈 Performance

- **Upload Time**: ~2-3 seconds for presigned URL generation
- **Processing Time**: ~10-15 seconds for AI text extraction
- **Retrieval Time**: <1 second for results fetching
- **Scalability**: Auto-scaling DynamoDB and serverless Lambda functions

## 💰 Cost Optimization

- Uses Claude 3 Haiku (most cost-effective Bedrock model)
- Serverless architecture (pay-per-use)
- DynamoDB auto-scaling (1-10 capacity units)
- S3 standard storage with lifecycle policies

## 🔒 Security Features

- **Encryption**: S3 and DynamoDB encryption at rest
- **IAM Roles**: Least-privilege access policies
- **CORS**: Properly configured API endpoints
- **Presigned URLs**: Secure direct S3 uploads
- **No Hardcoded Secrets**: All credentials managed by AWS

## 📁 Project Structure

```
product-ocr-system/
├── README.md
├── PROJECT_SUMMARY.md
├── cdk-app/                    # AWS CDK Infrastructure
│   ├── lib/
│   │   └── cdk-app-stack.ts   # Main CDK stack
│   ├── bin/
│   │   └── cdk-app.ts         # CDK app entry point
│   └── test/
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.tsx            # Main React component
│   │   └── components/        # UI components
│   └── public/
├── src/lambda/                 # Lambda Functions
│   ├── upload.js              # Upload handler
│   ├── ocr.js                 # OCR processor
│   └── retrieve.js            # Data retrieval
├── specs/                      # Technical specifications
├── pricing/                    # Cost analysis
├── generated-diagrams/         # Architecture diagrams
└── jira-stories-summary.md     # Development stories
```

## 🚀 Production Deployment

### Recommended Enhancements

1. **Monitoring**: Add CloudWatch dashboards and alarms
2. **Authentication**: Implement AWS Cognito for user management
3. **Rate Limiting**: Add API throttling policies
4. **Batch Processing**: Support multiple image uploads
5. **Image Preprocessing**: Add format conversion and optimization

### Environment-Specific Deployments

```bash
# Development
cdk deploy --context environment=dev

# Production
cdk deploy --context environment=prod
```

## 🐛 Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**: Run `cdk bootstrap` in your target region
2. **Permission Denied**: Ensure AWS CLI is configured with proper permissions
3. **API CORS Error**: Check API Gateway CORS configuration
4. **Lambda Timeout**: Increase timeout in CDK stack for large images

### Logs and Monitoring

- **Lambda Logs**: Available in CloudWatch Logs
- **API Gateway Logs**: Enable in API Gateway console
- **S3 Access Logs**: Configure bucket logging if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Amazon Bedrock team for Claude AI integration
- AWS CDK team for infrastructure as code
- React team for the frontend framework

## 📞 Support

For support and questions:

- Create an issue in this repository
- Check the [troubleshooting section](#-troubleshooting)
- Review AWS documentation for service-specific issues

---

**Built with ❤️ using AWS serverless technologies**
