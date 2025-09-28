# 🔧 Fix Vercel Environment Variables

## 🚨 The Issue
Your app is deployed at `https://hostel-bros.vercel.app` but showing Firebase authentication error because environment variables are missing.

## ✅ Quick Fix - Add Environment Variables in Vercel Dashboard

### **Step 1: Go to Vercel Dashboard**
1. Open [vercel.com](https://vercel.com) in your browser
2. Sign in to your account
3. Find and click on your "hostel-superapp" project

### **Step 2: Add Environment Variables**
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar
3. **Add these variables one by one:**

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDXiJI-19-fhSfFZ9puXkRSzIH6YLf8Kt8` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `hostel-bros.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `hostel-bros` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `hostel-bros.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `946063362575` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:946063362575:web:0eabca27e5d1aa06a5f17a` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://hostel-bros-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `NEXT_PUBLIC_APP_URL` | `https://hostel-bros.vercel.app` |
| `NEXT_PUBLIC_ENV` | `production` |

### **Step 3: Important Settings**
For each variable:
- ✅ **Environment**: Select "Production" (and optionally "Preview" and "Development")
- ✅ **Value**: Copy the exact value from the table above
- ✅ Click **"Add"** after each variable

### **Step 4: Redeploy**
After adding all variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait 2-3 minutes for deployment to complete

## 🎯 Expected Result
After redeployment:
- ✅ App loads without Firebase error
- ✅ Google sign-in works properly
- ✅ All features accessible
- ✅ Ready for Android installation

## 📱 Install on Android (After Fix)
Once the error is fixed:
1. **Open Chrome** on your Android phone
2. **Go to**: `https://hostel-bros.vercel.app`
3. **Look for install prompt** or tap menu → "Add to Home screen"
4. **Confirm installation** - app appears on home screen!

## 🔄 Alternative: Re-deploy via CLI (if needed)
If you prefer command line:
```bash
vercel --prod
```

## ⚡ Quick Test
Test your fix by visiting: https://hostel-bros.vercel.app
- Should load without Firebase error
- Google sign-in should work
- Ready for mobile installation!