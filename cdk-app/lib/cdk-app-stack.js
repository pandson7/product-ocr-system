"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductOcrStack110720251818 = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const s3n = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
class ProductOcrStack110720251818 extends cdk.Stack {
    constructor(scope, id, props) {
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
        imagesBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(ocrFunction));
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
exports.ProductOcrStack110720251818 = ProductOcrStack110720251818;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFwcC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1hcHAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLG1FQUFxRDtBQUNyRCwrREFBaUQ7QUFDakQsdUVBQXlEO0FBQ3pELHlEQUEyQztBQUMzQyxzRUFBd0Q7QUFHeEQsTUFBYSwyQkFBNEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN4RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQztRQUU5Qix1QkFBdUI7UUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxzQkFBc0IsTUFBTSxFQUFFLEVBQUU7WUFDdkUsVUFBVSxFQUFFLHlCQUF5QixNQUFNLEVBQUU7WUFDN0MsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLElBQUksRUFBRSxDQUFDO29CQUNMLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUM3RSxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztpQkFDdEIsQ0FBQztZQUNGLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ2pCLE1BQU0sWUFBWSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLE1BQU0sRUFBRSxF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SyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLGlCQUFpQjtTQUMvQixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsWUFBWSxDQUFDLFVBQVU7WUFDOUIsV0FBVyxFQUFFLGdCQUFnQjtTQUM5QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEzSkQsa0VBMkpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzM24gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLW5vdGlmaWNhdGlvbnMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBQcm9kdWN0T2NyU3RhY2sxMTA3MjAyNTE4MTggZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBzdWZmaXggPSAnMTEwNzIwMjUxODE4JztcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgaW1hZ2VzXG4gICAgY29uc3QgaW1hZ2VzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBgUHJvZHVjdEltYWdlc0J1Y2tldCR7c3VmZml4fWAsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBwcm9kdWN0LWltYWdlcy1idWNrZXQtJHtzdWZmaXh9YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGNvcnM6IFt7XG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuR0VULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5QVVRdLFxuICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgIH1dLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlXG4gICAgY29uc3QgcHJvZHVjdFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGBQcm9kdWN0U3BlY3NUYWJsZSR7c3VmZml4fWAsIHtcbiAgICAgIHRhYmxlTmFtZTogYFByb2R1Y3RTcGVjaWZpY2F0aW9ucy0ke3N1ZmZpeH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwcm9kdWN0SWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBST1ZJU0lPTkVELFxuICAgICAgcmVhZENhcGFjaXR5OiA1LFxuICAgICAgd3JpdGVDYXBhY2l0eTogNSxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBFbmFibGUgYXV0byBzY2FsaW5nXG4gICAgcHJvZHVjdFRhYmxlLmF1dG9TY2FsZVJlYWRDYXBhY2l0eSh7XG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxMCxcbiAgICB9KTtcbiAgICBwcm9kdWN0VGFibGUuYXV0b1NjYWxlV3JpdGVDYXBhY2l0eSh7XG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxMCxcbiAgICB9KTtcblxuICAgIC8vIElBTSBSb2xlIGZvciBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBgTGFtYmRhRXhlY3V0aW9uUm9sZSR7c3VmZml4fWAsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgIFMzQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0J10sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW2ltYWdlc0J1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIER5bmFtb0RCQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydkeW5hbW9kYjpHZXRJdGVtJywgJ2R5bmFtb2RiOlB1dEl0ZW0nLCAnZHluYW1vZGI6VXBkYXRlSXRlbSddLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtwcm9kdWN0VGFibGUudGFibGVBcm5dLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIEJlZHJvY2tBY2Nlc3M6IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2JlZHJvY2s6SW52b2tlTW9kZWwnXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgJ2Fybjphd3M6YmVkcm9jazoqOjpmb3VuZGF0aW9uLW1vZGVsL2FudGhyb3BpYy5jbGF1ZGUtMy1oYWlrdS0yMDI0MDMwNy12MTowJ1xuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVXBsb2FkIExhbWJkYSBGdW5jdGlvblxuICAgIGNvbnN0IHVwbG9hZEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBgVXBsb2FkRnVuY3Rpb24ke3N1ZmZpeH1gLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBwcm9kdWN0LXVwbG9hZC0ke3N1ZmZpeH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIyX1gsXG4gICAgICBoYW5kbGVyOiAndXBsb2FkLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9zcmMvbGFtYmRhJyksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQlVDS0VUX05BTUU6IGltYWdlc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBUQUJMRV9OQU1FOiBwcm9kdWN0VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIC8vIE9DUiBQcm9jZXNzaW5nIExhbWJkYSBGdW5jdGlvblxuICAgIGNvbnN0IG9jckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBgT2NyRnVuY3Rpb24ke3N1ZmZpeH1gLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBwcm9kdWN0LW9jci0ke3N1ZmZpeH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIyX1gsXG4gICAgICBoYW5kbGVyOiAnb2NyLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9zcmMvbGFtYmRhJyksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQlVDS0VUX05BTUU6IGltYWdlc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBUQUJMRV9OQU1FOiBwcm9kdWN0VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwMCksXG4gICAgICBtZW1vcnlTaXplOiAxMDI0LFxuICAgIH0pO1xuXG4gICAgLy8gUmV0cmlldmFsIExhbWJkYSBGdW5jdGlvblxuICAgIGNvbnN0IHJldHJpZXZlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGBSZXRyaWV2ZUZ1bmN0aW9uJHtzdWZmaXh9YCwge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgcHJvZHVjdC1yZXRyaWV2ZS0ke3N1ZmZpeH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIyX1gsXG4gICAgICBoYW5kbGVyOiAncmV0cmlldmUuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL3NyYy9sYW1iZGEnKSxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9kdWN0VGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIC8vIFMzIEV2ZW50IE5vdGlmaWNhdGlvblxuICAgIGltYWdlc0J1Y2tldC5hZGRFdmVudE5vdGlmaWNhdGlvbihcbiAgICAgIHMzLkV2ZW50VHlwZS5PQkpFQ1RfQ1JFQVRFRCxcbiAgICAgIG5ldyBzM24uTGFtYmRhRGVzdGluYXRpb24ob2NyRnVuY3Rpb24pXG4gICAgKTtcblxuICAgIC8vIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBgUHJvZHVjdE9jckFwaSR7c3VmZml4fWAsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgcHJvZHVjdC1vY3ItYXBpLSR7c3VmZml4fWAsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ1gtQW16LURhdGUnLCAnQXV0aG9yaXphdGlvbicsICdYLUFwaS1LZXknXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgRW5kcG9pbnRzXG4gICAgY29uc3QgdXBsb2FkSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGxvYWRGdW5jdGlvbik7XG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VwbG9hZCcpLmFkZE1ldGhvZCgnUE9TVCcsIHVwbG9hZEludGVncmF0aW9uKTtcblxuICAgIGNvbnN0IHByb2R1Y3RzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncHJvZHVjdHMnKTtcbiAgICBjb25zdCBwcm9kdWN0SW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyZXRyaWV2ZUZ1bmN0aW9uKTtcbiAgICBwcm9kdWN0c1Jlc291cmNlLmFkZFJlc291cmNlKCd7aWR9JykuYWRkTWV0aG9kKCdHRVQnLCBwcm9kdWN0SW50ZWdyYXRpb24pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlVcmwnLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IGltYWdlc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBCdWNrZXQgTmFtZScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==