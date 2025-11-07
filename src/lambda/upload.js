const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'fileName and fileType are required' }),
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }),
      };
    }

    const productId = uuidv4();
    const key = `images/${productId}/${fileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Create initial record in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        productId: { S: productId },
        imageUrl: { S: `s3://${process.env.BUCKET_NAME}/${key}` },
        originalFileName: { S: fileName },
        processingStatus: { S: 'PENDING' },
        timestamp: { S: new Date().toISOString() },
      },
    });

    await dynamoClient.send(putCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        productId,
        uploadUrl,
        message: 'Upload URL generated successfully',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
