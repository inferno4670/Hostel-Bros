# 🚀 Complete Installation & Deployment Guide for Hostel-Bros

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Installation](#local-installation)
3. [Google Cloud Setup](#google-cloud-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [GitHub Repository Setup](#github-repository-setup)
6. [Production Deployment](#production-deployment)
7. [Testing the PWA](#testing-the-pwa)
8. [Mobile Installation Guide](#mobile-installation-guide)
9. [Troubleshooting](#troubleshooting)

## 📦 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed
- **Git** installed
- **GitHub account**
- **Vercel account** (free)
- **Google account** for Firebase and Google Cloud
- **Modern browser** (Chrome, Safari, Edge, Firefox)

## 💻 Local Installation

### Step 1: Clone the Repository
```bash
# Navigate to your desired directory
cd C:\Users\INFERNO VICTORES\

# Clone the project (if not already cloned)
git clone <your-github-repo-url>
cd hostel-superapp

# Or if already have the files locally, initialize git
git init
```

### Step 2: Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Environment Setup
Create `.env.local` file with these variables:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="your-database-url"

# Google Drive Configuration (we'll set these up next)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

### Step 4: Start Development Server
```bash
npm run dev
```
Your app will be available at `http://localhost:3000`

## ☁️ Google Cloud Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: "Hostel-Bros" → Create

### Step 2: Enable APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - **Google Drive API**
   - **Google+ API** (for authentication)

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure consent screen first if prompted:
   - User Type: External
   - App name: "Hostel-Bros"
   - User support email: your email
   - Developer contact: your email
4. Create OAuth client:
   - Application type: Web application
   - Name: "Hostel-Bros Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app-domain.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret

### Step 4: Update Environment Variables
Update your `.env.local` file:
```env
GOOGLE_CLIENT_ID="your-actual-client-id-from-step-3"
GOOGLE_CLIENT_SECRET="your-actual-client-secret-from-step-3"
NEXTAUTH_SECRET="generate-random-32-char-string"
```

## 🔥 Firebase Configuration

### Step 1: Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or use existing
3. Name: "hostel-bros"
4. Enable Google Analytics (optional)

### Step 2: Enable Authentication
1. Go to Authentication → Get started
2. Sign-in method → Google → Enable
3. Add your domain to Authorized domains:
   - `localhost` (for development)
   - `your-app-domain.vercel.app` (for production)

### Step 3: Create Firestore Database
1. Go to Firestore Database → Create database
2. Start in production mode
3. Choose location close to your users

### Step 4: Create Realtime Database
1. Go to Realtime Database → Create database
2. Start in locked mode
3. Update rules:
```json
{
  "rules": {
    "status": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Step 5: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Your apps → Add app → Web
3. App nickname: "Hostel-Bros"
4. Copy the config and update your `.env.local`

## 📚 GitHub Repository Setup

### Step 1: Create GitHub Repository
```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Hostel-Bros PWA"

# Create repository on GitHub (via web interface)
# Then connect local to remote
git remote add origin https://github.com/yourusername/hostel-bros.git
git branch -M main
git push -u origin main
```

### Step 2: Create .gitignore (if not exists)
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build

# Misc
.DS_Store
*.log

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# PWA files
**/sw.js
**/workbox-*.js
**/worker-*.js
**/fallback-*.js
```

### Step 3: Push to GitHub
```bash
# Make changes, then:
git add .
git commit -m "Add PWA features and Google Drive integration"
git push origin main
```

## 🚀 Production Deployment

### Step 1: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 2: Set Environment Variables in Vercel
1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from your `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-value
NEXT_PUBLIC_FIREBASE_APP_ID=your-value
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-value
GOOGLE_CLIENT_ID=your-value
GOOGLE_CLIENT_SECRET=your-value
NEXTAUTH_SECRET=your-value
NEXTAUTH_URL=https://your-app-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
NEXT_PUBLIC_ENV=production
```

### Step 3: Update OAuth Redirect URLs
1. Go back to Google Cloud Console
2. Credentials → Your OAuth client
3. Add your Vercel domain to Authorized redirect URIs:
   - `https://your-app-domain.vercel.app/api/auth/callback/google`

### Step 4: Update Firebase Authorized Domains
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain:
   - `your-app-domain.vercel.app`

### Step 5: Deploy
```bash
# Commit any final changes
git add .
git commit -m "Production configuration"
git push origin main
```
Vercel will automatically deploy!

## 🧪 Testing the PWA

### Step 1: Test in Browser
1. Open your deployed app URL
2. Open DevTools → Application → Manifest
3. Verify manifest is loaded correctly
4. Check Service Worker is registered

### Step 2: Test Installation
1. Look for install prompt in address bar
2. Click install button
3. App should open in standalone mode

### Step 3: Test Features
- ✅ Sign in with Google
- ✅ Upload files (will use Google Drive)
- ✅ Switch themes in Settings
- ✅ Test offline functionality
- ✅ Mobile responsiveness

## 📱 Mobile Installation Guide

### For iOS (Safari):
1. Open your app URL in Safari
2. Tap Share button (square with arrow up)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen

### For Android (Chrome):
1. Open your app URL in Chrome
2. Tap menu (three dots)
3. "Add to Home screen"
4. Tap "Add"
5. App appears in app drawer

### For Desktop:
1. Chrome/Edge: Install icon in address bar
2. Click install
3. App opens in standalone window

## 🔧 Troubleshooting

### Common Issues:

#### 1. "PWA not installing"
**Solution:**
- Ensure HTTPS is enabled (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered
- Clear browser cache

#### 2. "Google OAuth not working"
**Solution:**
- Check redirect URIs match exactly
- Verify client ID/secret are correct
- Ensure Google+ API is enabled
- Check authorized domains in Firebase

#### 3. "File uploads failing"
**Solution:**
- Verify Google Drive API is enabled
- Check OAuth scopes include Drive access
- Ensure user grants Drive permissions
- Check API quotas in Google Cloud

#### 4. "Theme not switching"
**Solution:**
- Check browser console for errors
- Verify ThemeProvider is wrapping app
- Clear localStorage if needed

#### 5. "Build errors"
**Solution:**
- Run `npm install` to update dependencies
- Check for TypeScript errors
- Verify environment variables are set

### Debug Commands:
```bash
# Check for errors
npm run build

# Clear cache and restart
rm -rf .next
npm run dev

# Check PWA status in production
npm run build && npm run start
```

## 🎯 Post-Deployment Checklist

- [ ] App loads correctly on desktop and mobile
- [ ] Google sign-in works
- [ ] File uploads work (Google Drive)
- [ ] PWA can be installed on mobile devices
- [ ] Dark/light mode toggle works
- [ ] Offline functionality works
- [ ] All pages are responsive
- [ ] Admin panel accessible (for admin users)

## 🎉 Success!

Your Hostel-Bros PWA is now:
- 📱 **Installable** on mobile devices
- 🌐 **Live** on the internet
- 💾 **Using free Google Drive storage**
- 🌙 **Theme-enabled** with dark/light modes
- 🚀 **Production-ready** and scalable

### 📞 Need Help?
- Check the browser console for errors
- Review Firebase and Google Cloud settings
- Verify all environment variables are set
- Test on different devices and browsers

Enjoy your new mobile-ready Hostel-Bros app! 🎊