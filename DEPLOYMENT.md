# Deployment Guide - Hostel SuperApp

This guide will walk you through deploying your Hostel SuperApp to production using Vercel and Firebase.

## 📋 Pre-Deployment Checklist

- [ ] Firebase project created and configured
- [ ] All Firebase services enabled (Auth, Firestore, Realtime DB, Storage)
- [ ] Google Authentication provider configured
- [ ] Firebase security rules set up
- [ ] Vercel account created
- [ ] GitHub repository ready

## 🔥 Firebase Production Setup

### 1. Create Production Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it `hostel-superapp-prod` (or your preferred name)
4. Enable Google Analytics (optional)
5. Wait for project creation

### 2. Enable Required Services

#### Authentication
1. Go to Authentication → Sign-in method
2. Enable "Google" provider
3. Add your production domain (will be provided by Vercel)
4. Save configuration

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Choose your preferred location
5. Update security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all users (for displaying names, etc.)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Allow authenticated users to read/write shared collections
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
    
    match /messMenus/{menuId} {
      allow read, write: if request.auth != null;
    }
    
    match /events/{eventId} {
      allow read, write: if request.auth != null;
    }
    
    match /laundrySlots/{slotId} {
      allow read, write: if request.auth != null;
    }
    
    match /posts/{postId} {
      allow read, write: if request.auth != null;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

#### Realtime Database
1. Go to Realtime Database
2. Click "Create Database"
3. Start in **locked mode**
4. Update rules:

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

#### Storage
1. Go to Storage
2. Click "Get started"
3. Start in **production mode**
4. Update rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /chat-files/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web
4. Register app name: "Hostel SuperApp"
5. Copy the configuration object

## 🚀 Vercel Deployment

### 1. Prepare Repository

1. Initialize git in your project:
```bash
git init
git add .
git commit -m "Initial commit: Hostel SuperApp"
```

2. Create GitHub repository and push:
```bash
git remote add origin https://github.com/yourusername/hostel-superapp.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: hostel-superapp
# - Directory: ./
# - Settings detected, override? No
```

### 3. Configure Environment Variables

1. In Vercel Dashboard, go to your project
2. Navigate to Settings → Environment Variables
3. Add the following variables (replace with your Firebase config):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_ENV=production
```

4. Click "Save" for each variable

### 4. Update Firebase Authorized Domains

1. Go back to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-app-name.vercel.app`
   - If using custom domain, add that too

### 5. Redeploy

1. In Vercel Dashboard, go to Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## 🔧 Post-Deployment Configuration

### 1. Test the Application

1. Visit your Vercel URL
2. Test Google login
3. Create test data in each feature:
   - Add an expense
   - Create an event
   - Post on social wall
   - Send a chat message
   - Book a laundry slot

### 2. Set Up Admin User

1. Login with your Google account
2. Go to Firebase Console → Firestore
3. Find your user document in `users` collection
4. Edit the document and change `role` from `"user"` to `"admin"`
5. Refresh the app - you should now see the Admin tab

### 3. Create Initial Content

As an admin, create some initial content:
- Add today's mess menu
- Create welcome post on social wall
- Set up a few events
- Create general hostel group chat

## 🎨 Custom Domain (Optional)

### 1. Purchase Domain
- Use any domain registrar (Namecheap, GoDaddy, etc.)

### 2. Configure in Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Update Firebase
1. Add custom domain to Firebase authorized domains
2. Update `NEXT_PUBLIC_APP_URL` environment variable

## 📱 Share with Hostel Residents

### 1. Create Welcome Guide

Create a simple guide for residents:

```markdown
# Welcome to Hostel SuperApp! 🏠

## Getting Started
1. Visit: https://your-app-name.vercel.app
2. Click "Continue with Google"
3. Sign in with your Google account
4. Complete your profile

## Features to Explore
- 💰 Split expenses with friends
- 🍽️ Rate daily mess food
- 📅 Plan study sessions and events
- 🧺 Book laundry time slots
- 📱 Share memes and connect
- 💬 Chat with everyone
- 🦉 Find late-night study buddies

## Need Help?
Contact the admin through the app or create a post on the social wall!
```

### 2. Distribution Methods
- Share link in hostel WhatsApp groups
- Put up QR code posters in common areas
- Announce during hostel meetings
- Send email to all residents

## 🔍 Monitoring & Maintenance

### 1. Monitor Usage
- Check Vercel Analytics
- Monitor Firebase usage quotas
- Review error logs regularly

### 2. Regular Maintenance
- Monitor and approve social wall posts
- Clean up old expired events
- Manage user roles as needed
- Update mess menus regularly

### 3. Backup Strategy
- Firebase automatically backs up data
- Export important data periodically
- Keep local development environment updated

## 🚨 Troubleshooting

### Common Issues:

**Build Failures:**
- Check environment variables are set correctly
- Ensure all dependencies are in package.json
- Check for TypeScript errors

**Authentication Issues:**
- Verify Firebase Auth domain configuration
- Check Google OAuth settings
- Ensure production domain is authorized

**Database Connection Issues:**
- Verify Firebase rules allow authenticated access
- Check Firestore quotas haven't been exceeded
- Ensure environment variables are correct

**Performance Issues:**
- Enable Vercel caching
- Optimize images and assets
- Consider database query optimization

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Firebase console for errors
3. Review browser console for client-side errors
4. Check this deployment guide for missed steps

## 🎉 Success!

Your Hostel SuperApp is now live and ready for your community to use!

**Next Steps:**
- Monitor initial usage and gather feedback
- Make iterative improvements based on user needs
- Consider adding more features based on community requests
- Enjoy building a connected hostel community! 🏠✨