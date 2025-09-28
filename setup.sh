#!/bin/bash
# Quick Setup Script for Hostel-Bros PWA

echo "🚀 Hostel-Bros PWA Setup Script"
echo "==============================="

# Check Node.js version
echo "📦 Checking Node.js version..."
node --version

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate NextAuth secret
echo "🔐 Generating NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Create .env.local template if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << EOF
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="your-database-url"

# Google Drive Configuration
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
EOF
    echo "✅ Created .env.local template with generated NextAuth secret"
else
    echo "ℹ️  .env.local already exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update .env.local with your Firebase configuration"
echo "2. Set up Google Cloud OAuth credentials"
echo "3. Run 'npm run dev' to start development server"
echo "4. Follow the INSTALLATION_GUIDE.md for complete setup"
echo ""
echo "📚 Documentation:"
echo "- INSTALLATION_GUIDE.md - Complete setup guide"
echo "- PWA_SETUP.md - PWA features and usage"
echo "- GOOGLE_DRIVE_SETUP.md - Google Drive integration"
echo ""
echo "🚀 Ready to launch your Hostel-Bros PWA!"