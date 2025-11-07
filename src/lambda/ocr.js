const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const bedrockClient = new BedrockRuntimeClient({});

exports.handler = async (event) => {
  console.log('OCR processing event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName.startsWith('ObjectCreated')) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      // Extract productId from the key (images/{productId}/{fileName})
      const pathParts = objectKey.split('/');
      if (pathParts.length < 3 || pathParts[0] !== 'images') {
        console.log('Skipping non-product image:', objectKey);
        continue;
      }
      
      const productId = pathParts[1];
      
      try {
        // Get image from S3
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
        
        const response = await s3Client.send(getCommand);
        const imageBytes = await response.Body.transformToByteArray();
        const base64Image = Buffer.from(imageBytes).toString('base64');

        // Prepare Bedrock request
        const prompt = `Analyze this product image and extract the following information in JSON format:
- productName: The name of the product
- brand: The brand or manufacturer
- category: Product category or type
- price: Any visible price information
- dimensions: Size or dimension specifications
- weight: Weight information if visible
- description: Product description or key features
- additionalDetails: Any other relevant product information

Return only valid JSON without additional text or formatting.`;

        const bedrockPayload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: response.ContentType || "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ]
        };

        const bedrockCommand = new InvokeModelCommand({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          contentType: 'application/json',
          body: JSON.stringify(bedrockPayload),
        });

        const bedrockResponse = await bedrockClient.send(bedrockCommand);
        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        
        let extractedData;
        try {
          const content = responseBody.content[0].text;
          extractedData = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse Bedrock response as JSON:', parseError);
          extractedData = {
            productName: "Unable to extract",
            brand: "Unable to extract",
            category: "Unable to extract",
            price: "Unable to extract",
            dimensions: "Unable to extract",
            weight: "Unable to extract",
            description: "OCR processing completed but data extraction failed",
            additionalDetails: {}
          };
        }

        // Update DynamoDB record
        const updateCommand = new UpdateItemCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            productId: { S: productId },
          },
          UpdateExpression: 'SET extractedData = :data, processingStatus = :status, #ts = :timestamp',
          ExpressionAttributeNames: {
            '#ts': 'timestamp'
          },
          ExpressionAttributeValues: {
            ':data': { S: JSON.stringify(extractedData) },
            ':status': { S: 'COMPLETED' },
            ':timestamp': { S: new Date().toISOString() },
          },
        });

        await dynamoClient.send(updateCommand);
        console.log(`Successfully processed product ${productId}`);

      } catch (error) {
        console.error(`Error processing ${objectKey}:`, error);
        
        // Update DynamoDB with error status
        try {
          const updateCommand = new UpdateItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
              productId: { S: productId },
            },
            UpdateExpression: 'SET processingStatus = :status, errorMessage = :error, #ts = :timestamp',
            ExpressionAttributeNames: {
              '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
              ':status': { S: 'FAILED' },
              ':error': { S: error.message },
              ':timestamp': { S: new Date().toISOString() },
            },
          });

          await dynamoClient.send(updateCommand);
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }
    }
  }
};
