#!/bin/bash

# VinVenture Lambda Build Script
set -e

echo "🚀 Building VinVenture for Lambda deployment..."

# Clean previous builds
rm -rf lambda/ lambda-layers/

# Create lambda directories
mkdir -p lambda/api lambda/ssr lambda/image-processor lambda-layers/dependencies

echo "📦 Building Next.js application..."
cd apps

# Build Next.js app
npm run build

echo "🔧 Preparing API Lambda..."
cd ../

# Copy API routes and dependencies for Lambda
cp -r apps/src/app/api/* lambda/api/ 2>/dev/null || echo "No API routes found"
cp -r apps/src/lib lambda/api/ 2>/dev/null || echo "No lib folder found"

# Create API Lambda handler
cat > lambda/api/index.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// AWS Lambda adapter for Next.js API routes
exports.handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  // Convert API Gateway event to Node.js request format
  const req = {
    method: httpMethod,
    url: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
    headers,
    body: body ? (headers['content-type']?.includes('application/json') ? JSON.parse(body) : body) : undefined,
  };

  try {
    // Import and execute the API route
    const apiPath = path.replace('/api/', '');
    const handler = require(`./${apiPath}/route.js`);
    
    const method = httpMethod.toUpperCase();
    if (handler[method]) {
      const response = await handler[method](req);
      return {
        statusCode: response.status || 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(response.body || response),
      };
    } else {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
EOF

echo "🎨 Preparing SSR Lambda..."

# Create SSR Lambda handler
cat > lambda/ssr/index.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ 
  dev: false,
  conf: {
    distDir: '.next',
    generateEtags: false,
    compress: false,
  }
});

const handle = app.getRequestHandler();

let serverlessServer;

exports.handler = async (event, context) => {
  if (!serverlessServer) {
    await app.prepare();
    serverlessServer = true;
  }

  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  // Convert API Gateway event to Node.js request/response
  const req = {
    method: httpMethod,
    url: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
    headers,
    body,
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader: function(name, value) { this.headers[name] = value; },
    getHeader: function(name) { return this.headers[name]; },
    write: function(chunk) { this.body += chunk; },
    end: function(chunk) { if (chunk) this.body += chunk; },
  };

  try {
    await handle(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: {
        ...res.headers,
        'Content-Type': res.headers['content-type'] || 'text/html',
      },
      body: res.body,
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body><h1>Internal Server Error</h1></body></html>',
    };
  }
};
EOF

# Copy Next.js build output for SSR
cp -r apps/.next lambda/ssr/ 2>/dev/null || echo "No .next build found"
cp apps/package.json lambda/ssr/ 2>/dev/null || echo "No package.json found"

echo "🖼️  Preparing Image Processor Lambda..."

# Create Image Processor Lambda
cat > lambda/image-processor/index.js << 'EOF'
const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Image processing event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    try {
      // Get the uploaded image
      const image = await s3.getObject({ Bucket: bucket, Key: key }).promise();
      
      // Process image with sharp
      const resizedImage = await sharp(image.Body)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Save processed image
      const processedKey = key.replace('uploads/', 'processed/');
      await s3.putObject({
        Bucket: bucket,
        Key: processedKey,
        Body: resizedImage,
        ContentType: 'image/jpeg',
      }).promise();
      
      console.log(`Successfully processed ${key} -> ${processedKey}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
    }
  }
};

exports.handler.package = {
  dependencies: {
    'sharp': '^0.32.0'
  }
};
EOF

echo "📚 Creating Lambda Layer..."

# Create dependencies layer
cd lambda-layers/dependencies
npm init -y
npm install aws-sdk @prisma/client firebase firebase-admin next react react-dom

# Create layer structure
mkdir -p nodejs/node_modules
cp -r node_modules/* nodejs/node_modules/
rm -rf node_modules package*.json

cd ../../

# Create package.json for each Lambda
for dir in lambda/*/; do
  if [ -d "$dir" ]; then
    cat > "$dir/package.json" << EOF
{
  "name": "vinventure-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1400.0"
  }
}
EOF
  fi
done

echo "✅ Lambda functions built successfully!"
echo "📁 Lambda functions are ready in:"
echo "   - lambda/api/ (API routes)"
echo "   - lambda/ssr/ (Server-side rendering)"
echo "   - lambda/image-processor/ (Image processing)"
echo "   - lambda-layers/dependencies/ (Shared dependencies)"
echo ""
echo "🚀 Ready for CDK deployment!"