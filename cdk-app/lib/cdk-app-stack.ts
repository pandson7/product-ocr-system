import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class ProductOcrStack110720251818 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const suffix = '110720251818';

    // S3 Bucket for images
    const imagesBucket = new s3.Bucket(this, `ProductImagesBucket${suffix}`, {
      bucketName: `product-images-bucket-${suffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table
    const productTable = new dynamodb.Table(this, `ProductSpecsTable${suffix}`, {
      tableName: `ProductSpecifications-${suffix}`,
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto scaling
    productTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });
    productTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, `LambdaExecutionRole${suffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [imagesBucket.arnForObjects('*')],
            }),
          ],
        }),
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
              resources: [productTable.tableArn],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['bedrock:InvokeModel'],
              resources: [
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
              ],
            }),
          ],
        }),
      },
    });

    // Upload Lambda Function
    const uploadFunction = new lambda.Function(this, `UploadFunction${suffix}`, {
      functionName: `product-upload-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'upload.handler',
      code: lambda.Code.fromAsset('../src/lambda'),
      role: lambdaRole,
      environment: {
        BUCKET_NAME: imagesBucket.bucketName,
        TABLE_NAME: productTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // OCR Processing Lambda Function
    const ocrFunction = new lambda.Function(this, `OcrFunction${suffix}`, {
      functionName: `product-ocr-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'ocr.handler',
      code: lambda.Code.fromAsset('../src/lambda'),
      role: lambdaRole,
      environment: {
        BUCKET_NAME: imagesBucket.bucketName,
        TABLE_NAME: productTable.tableName,
      },
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
    });

    // Retrieval Lambda Function
    const retrieveFunction = new lambda.Function(this, `RetrieveFunction${suffix}`, {
      functionName: `product-retrieve-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'retrieve.handler',
      code: lambda.Code.fromAsset('../src/lambda'),
      role: lambdaRole,
      environment: {
        TABLE_NAME: productTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // S3 Event Notification
    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(ocrFunction)
    );

    // API Gateway
    const api = new apigateway.RestApi(this, `ProductOcrApi${suffix}`, {
      restApiName: `product-ocr-api-${suffix}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // API Endpoints
    const uploadIntegration = new apigateway.LambdaIntegration(uploadFunction);
    api.root.addResource('upload').addMethod('POST', uploadIntegration);

    const productsResource = api.root.addResource('products');
    const productIntegration = new apigateway.LambdaIntegration(retrieveFunction);
    productsResource.addResource('{id}').addMethod('GET', productIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
