@echo off
echo 🚀 Hostel-Bros PWA Setup Script
echo ===============================

REM Check Node.js version
echo 📦 Checking Node.js version...
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local template...
    (
        echo # Firebase Configuration
        echo NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
        echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
        echo NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
        echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
        echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
        echo NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
        echo NEXT_PUBLIC_FIREBASE_DATABASE_URL="your-database-url"
        echo.
        echo # Google Drive Configuration
        echo GOOGLE_CLIENT_ID="your-google-oauth-client-id"
        echo GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
        echo NEXTAUTH_SECRET="your-random-32-character-secret"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo.
        echo # App Configuration
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
        echo NEXT_PUBLIC_ENV=development
    ) > .env.local
    echo ✅ Created .env.local template
) else (
    echo ℹ️  .env.local already exists
)

echo.
echo 🎯 Next Steps:
echo 1. Update .env.local with your Firebase configuration
echo 2. Set up Google Cloud OAuth credentials
echo 3. Run 'npm run dev' to start development server
echo 4. Follow the INSTALLATION_GUIDE.md for complete setup
echo.
echo 📚 Documentation:
echo - INSTALLATION_GUIDE.md - Complete setup guide
echo - PWA_SETUP.md - PWA features and usage
echo - GOOGLE_DRIVE_SETUP.md - Google Drive integration
echo.
echo 🚀 Ready to launch your Hostel-Bros PWA!
pause