# 🔧 Firebase Domain Authorization Fix

## 🚨 The Issue
**Error:** "This domain is not authorized for Google sign-in. Please contact the administrator."

This happens because your Firebase project doesn't recognize your Vercel domain for Google OAuth.

## ✅ Quick Fix - Add Domain to Firebase Console

### **Step 1: Open Firebase Console**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your **"hostel-bros"** project
3. If you don't have this project, create it first

### **Step 2: Enable Google Authentication**
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. **Enable** Google sign-in if not already enabled
4. **Add these authorized domains:**

**Required Domains to Add:**
```
hostel-bros.vercel.app
hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app
localhost
```

### **Step 3: Configure OAuth Settings**
1. In the Google provider settings, you'll see **Web SDK configuration**
2. If you already have Web Client ID and Secret, note them down
3. If not, click **"Web SDK Configuration"** to create them

### **Step 4: Get Your Firebase Config**
1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. If no web app exists, click **"Add app"** → **Web**
4. Copy the **Firebase config object**

Your config should look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDXiJI-19-fhSfFZ9puXkRSzIH6YLf8Kt8",
  authDomain: "hostel-bros.firebaseapp.com", 
  projectId: "hostel-bros",
  storageBucket: "hostel-bros.firebasestorage.app",
  messagingSenderId: "946063362575",
  appId: "1:946063362575:web:0eabca27e5d1aa06a5f17a",
  databaseURL: "https://hostel-bros-default-rtdb.asia-southeast1.firebasedatabase.app"
};
```

### **Step 5: Update Authorized Domains**
1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. **Add these domains:**
   - `hostel-bros.vercel.app`
   - `hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app`
   - `localhost` (for testing)

## 🔄 After Firebase Setup - Redeploy App

Once you've updated Firebase settings:

1. **Wait 5-10 minutes** for Firebase changes to propagate
2. **Redeploy your Vercel app:**

```bash
vercel --prod
```

## 🎯 Expected Result

After fixing Firebase authorization:
- ✅ No more "domain not authorized" error  
- ✅ Google sign-in works perfectly
- ✅ App loads without authentication errors
- ✅ Ready for Android installation

## 📱 Test Your Fix

1. **Visit:** `https://hostel-bros.vercel.app`
2. **Click "Continue with Google"**
3. **Should work** without domain errors
4. **Sign in successfully** and access all features

## 🆘 If Still Not Working

### **Option A: Clear Browser Data**
1. Clear cookies and cache
2. Try in incognito/private mode
3. Test with different browser

### **Option B: Check Firebase Project**
1. Verify project name is **"hostel-bros"**
2. Ensure **Google Auth is enabled**
3. Double-check **authorized domains** list

### **Option C: Alternative Domain Setup**
If Vercel domains keep changing, use a custom domain:
1. In Vercel, add a custom domain like `hostelbros.com`
2. Update Firebase to use the custom domain
3. More stable than auto-generated Vercel URLs

## 🚀 Once Fixed - Install on Android

After the domain authorization is fixed:

1. **Open Chrome** on your Android phone
2. **Go to:** `https://hostel-bros.vercel.app`  
3. **Sign in** with Google (should work now!)
4. **Look for install prompt** or tap menu → "Add to Home screen"
5. **Install** - your Android app is ready!

---

**🎊 Your Hostel-Bros Android app will be fully functional after this Firebase fix!**