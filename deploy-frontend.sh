#!/bin/bash

# Frontend Build and Deployment Script for cPanel

echo "🚀 Starting frontend build for production..."

# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building React app for production..."
npm run build

echo "✅ Build completed! Files are ready in the 'dist' directory."
echo ""
echo "📁 Next steps for cPanel deployment:"
echo "1. Compress the 'dist' folder contents"
echo "2. Upload to your cPanel File Manager"
echo "3. Extract in /public_html/ directory"
echo "4. Ensure index.html is in the root of public_html"
echo ""
echo "🔗 Remember to update VITE_APP_API_URL in .env.production to your domain!"

# Optional: Create a zip file for easy upload
echo "📦 Creating deployment zip file..."
cd dist
powershell "Compress-Archive -Path * -DestinationPath ../frontend-deployment.zip -Force"
cd ..
echo "✅ Created frontend-deployment.zip for easy upload to cPanel"
