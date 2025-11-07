const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product ID is required' }),
      };
    }

    const getCommand = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        productId: { S: productId },
      },
    });

    const response = await dynamoClient.send(getCommand);

    if (!response.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Product not found' }),
      };
    }

    // Convert DynamoDB item to regular object
    const item = {
      productId: response.Item.productId.S,
      imageUrl: response.Item.imageUrl.S,
      originalFileName: response.Item.originalFileName.S,
      processingStatus: response.Item.processingStatus.S,
      timestamp: response.Item.timestamp.S,
    };

    if (response.Item.extractedData) {
      item.extractedData = JSON.parse(response.Item.extractedData.S);
    }

    if (response.Item.errorMessage) {
      item.errorMessage = response.Item.errorMessage.S;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(item),
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
