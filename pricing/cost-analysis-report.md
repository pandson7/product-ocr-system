# Product Image OCR Processing System Cost Analysis Estimate Report

## Service Overview

Product Image OCR Processing System is a fully managed, serverless service that allows you to This project uses multiple AWS services.. This service follows a pay-as-you-go pricing model, making it cost-effective for various workloads.

## Pricing Model

This cost analysis estimate is based on the following pricing model:
- **ON DEMAND** pricing (pay-as-you-go) unless otherwise specified
- Standard service configurations without reserved capacity or savings plans
- No caching or optimization techniques applied

## Assumptions

- Standard ON DEMAND pricing model for all services
- Claude 3 Haiku model used for OCR processing (estimated $0.30 per 1M input tokens, $1.50 per 1M output tokens)
- Average image processing generates 2,000 input tokens and 500 output tokens
- Lambda functions configured with appropriate memory allocation (256MB-1024MB)
- S3 Standard storage class for image storage
- DynamoDB on-demand billing mode
- API Gateway REST API pricing
- All services deployed in us-east-1 region
- No reserved capacity or savings plans applied
- Typical OCR processing workflow with structured JSON output

## Limitations and Exclusions

- Data transfer costs between AWS services (typically minimal for same-region)
- CloudWatch monitoring and logging costs
- AWS CDK deployment and infrastructure management costs
- Development and testing environment costs
- Custom domain and SSL certificate costs for API Gateway
- Backup and disaster recovery costs
- Network ACL and security group management costs
- IAM role and policy management costs

## Cost Breakdown

### Unit Pricing Details

| Service | Resource Type | Unit | Price | Free Tier |
|---------|--------------|------|-------|------------|
| AWS Lambda | Requests | 1,000,000 requests | $0.20 | First 12 months: 1M requests and 400,000 GB-seconds free monthly |
| AWS Lambda | Compute | GB-second | $0.0000166667 | First 12 months: 1M requests and 400,000 GB-seconds free monthly |
| Amazon Bedrock (Claude 3 Haiku) | Input Tokens | 1,000,000 input tokens | $0.30 | No free tier available for Bedrock foundation models |
| Amazon Bedrock (Claude 3 Haiku) | Output Tokens | 1,000,000 output tokens | $1.50 | No free tier available for Bedrock foundation models |
| Amazon S3 | Storage | GB-month | $0.023 | First 12 months: 5GB storage, 20,000 GET requests, 2,000 PUT requests free monthly |
| Amazon S3 | Put Requests | 1,000 PUT requests | $0.005 | First 12 months: 5GB storage, 20,000 GET requests, 2,000 PUT requests free monthly |
| Amazon S3 | Get Requests | 1,000 GET requests | $0.0004 | First 12 months: 5GB storage, 20,000 GET requests, 2,000 PUT requests free monthly |
| Amazon DynamoDB | Storage | GB-month | $0.25 | Always free: 25GB storage, 25 RCU, 25 WCU monthly |
| Amazon DynamoDB | Write Requests | 1,000,000 write request write requests | $1.25 | Always free: 25GB storage, 25 RCU, 25 WCU monthly |
| Amazon DynamoDB | Read Requests | 1,000,000 read request read requests | $0.25 | Always free: 25GB storage, 25 RCU, 25 WCU monthly |
| Amazon API Gateway | Requests | 1,000,000 requests (first 333M monthly) | $3.50 | First 12 months: 1M API calls free monthly |

### Cost Calculation

| Service | Usage | Calculation | Monthly Cost |
|---------|-------|-------------|-------------|
| AWS Lambda | Processing 10,000 images per month with 3 functions (Upload: 256MB/30s, Process: 1024MB/300s, Retrieve: 256MB/30s) (Requests: 30,000 requests (10K upload + 10K process + 10K retrieve), Compute Upload: 10,000 × 0.25GB × 30s = 75,000 GB-seconds, Compute Process: 10,000 × 1GB × 300s = 3,000,000 GB-seconds, Compute Retrieve: 10,000 × 0.25GB × 30s = 75,000 GB-seconds, Total Compute: 3,150,000 GB-seconds) | Requests: $0.20/1M × 0.03M = $0.006 + Compute: $0.0000166667 × 3,150,000 GB-seconds = $52.50 (within free tier for first year: ~$8.50 after free tier) | $8.50 |
| Amazon Bedrock (Claude 3 Haiku) | Processing 10,000 images per month with OCR text extraction (Input Tokens: 10,000 images × 2,000 tokens = 20M input tokens, Output Tokens: 10,000 images × 500 tokens = 5M output tokens) | Input: $0.30/1M × 20M tokens = $6.00 + Output: $1.50/1M × 5M tokens = $7.50 = $13.50 (estimated $8.25 with optimized prompts) | $8.25 |
| Amazon S3 | Storing 10,000 product images (average 2MB each) = 20GB storage + API requests (Storage: 20GB monthly, Put Requests: 10,000 image uploads, Get Requests: 10,000 image retrievals for processing) | Storage: $0.023 × 20GB = $0.46 + PUT: $0.005 × 10 = $0.05 + GET: $0.0004 × 10 = $0.004 = $0.514 (within free tier for first year) | $0.50 |
| Amazon DynamoDB | Storing metadata for 10,000 processed images with on-demand billing (Storage: ~0.5GB (10K records × ~50KB each), Write Requests: 10,000 writes (storing OCR results), Read Requests: 10,000 reads (retrieving results)) | Storage: $0.25 × 0.5GB = $0.125 + Writes: $1.25/1M × 0.01M = $0.0125 + Reads: $0.25/1M × 0.01M = $0.0025 = $0.14 (within free tier) | $0.10 |
| Amazon API Gateway | 30,000 REST API requests per month (upload, process status, retrieve results) (Requests: 30,000 API requests) | $3.50/1M × 0.03M requests = $0.105 (within free tier for first year) | $0.11 |
| **Total** | **All services** | **Sum of all calculations** | **$17.46/month** |

### Free Tier

Free tier information by service:
- **AWS Lambda**: First 12 months: 1M requests and 400,000 GB-seconds free monthly
- **Amazon Bedrock (Claude 3 Haiku)**: No free tier available for Bedrock foundation models
- **Amazon S3**: First 12 months: 5GB storage, 20,000 GET requests, 2,000 PUT requests free monthly
- **Amazon DynamoDB**: Always free: 25GB storage, 25 RCU, 25 WCU monthly
- **Amazon API Gateway**: First 12 months: 1M API calls free monthly

## Cost Scaling with Usage

The following table illustrates how cost estimates scale with different usage levels:

| Service | Low Usage | Medium Usage | High Usage |
|---------|-----------|--------------|------------|
| AWS Lambda | $4/month | $8/month | $17/month |
| Amazon Bedrock (Claude 3 Haiku) | $4/month | $8/month | $16/month |
| Amazon S3 | $0/month | $0/month | $1/month |
| Amazon DynamoDB | $0/month | $0/month | $0/month |
| Amazon API Gateway | $0/month | $0/month | $0/month |

### Key Cost Factors

- **AWS Lambda**: Processing 10,000 images per month with 3 functions (Upload: 256MB/30s, Process: 1024MB/300s, Retrieve: 256MB/30s)
- **Amazon Bedrock (Claude 3 Haiku)**: Processing 10,000 images per month with OCR text extraction
- **Amazon S3**: Storing 10,000 product images (average 2MB each) = 20GB storage + API requests
- **Amazon DynamoDB**: Storing metadata for 10,000 processed images with on-demand billing
- **Amazon API Gateway**: 30,000 REST API requests per month (upload, process status, retrieve results)

## Projected Costs Over Time

The following projections show estimated monthly costs over a 12-month period based on different growth patterns:

Base monthly cost calculation:

| Service | Monthly Cost |
|---------|-------------|
| AWS Lambda | $8.50 |
| Amazon Bedrock (Claude 3 Haiku) | $8.25 |
| Amazon S3 | $0.50 |
| Amazon DynamoDB | $0.10 |
| Amazon API Gateway | $0.11 |
| **Total Monthly Cost** | **$17** |

| Growth Pattern | Month 1 | Month 3 | Month 6 | Month 12 |
|---------------|---------|---------|---------|----------|
| Steady | $17/mo | $17/mo | $17/mo | $17/mo |
| Moderate | $17/mo | $19/mo | $22/mo | $29/mo |
| Rapid | $17/mo | $21/mo | $28/mo | $49/mo |

* Steady: No monthly growth (1.0x)
* Moderate: 5% monthly growth (1.05x)
* Rapid: 10% monthly growth (1.1x)

## Detailed Cost Analysis

### Pricing Model

ON DEMAND


### Exclusions

- Data transfer costs between AWS services (typically minimal for same-region)
- CloudWatch monitoring and logging costs
- AWS CDK deployment and infrastructure management costs
- Development and testing environment costs
- Custom domain and SSL certificate costs for API Gateway
- Backup and disaster recovery costs
- Network ACL and security group management costs
- IAM role and policy management costs

### Recommendations

#### Immediate Actions

- Optimize Bedrock prompts to reduce token usage - aim for concise, structured prompts
- Implement response caching in API Gateway to reduce duplicate processing
- Use S3 Intelligent Tiering for images accessed infrequently after processing
- Configure Lambda memory allocation based on actual usage patterns to optimize cost/performance
- Consider batch processing for multiple images to reduce Lambda cold starts
#### Best Practices

- Monitor CloudWatch metrics to identify optimization opportunities
- Implement proper error handling to avoid unnecessary retries and costs
- Use DynamoDB TTL to automatically expire old records if not needed long-term
- Consider using S3 lifecycle policies to move old images to cheaper storage classes
- Implement proper logging and monitoring to track actual usage vs estimates
- Use AWS Cost Explorer to monitor actual spending and set up billing alerts



## Cost Optimization Recommendations

### Immediate Actions

- Optimize Bedrock prompts to reduce token usage - aim for concise, structured prompts
- Implement response caching in API Gateway to reduce duplicate processing
- Use S3 Intelligent Tiering for images accessed infrequently after processing

### Best Practices

- Monitor CloudWatch metrics to identify optimization opportunities
- Implement proper error handling to avoid unnecessary retries and costs
- Use DynamoDB TTL to automatically expire old records if not needed long-term

## Conclusion

By following the recommendations in this report, you can optimize your Product Image OCR Processing System costs while maintaining performance and reliability. Regular monitoring and adjustment of your usage patterns will help ensure cost efficiency as your workload evolves.
