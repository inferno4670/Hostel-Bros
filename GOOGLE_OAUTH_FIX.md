# 🔧 Fix Google OAuth Domain Authorization

## 🚨 Current Issue
**Error:** "This domain is not authorized for Google sign-in"
**Domain:** `hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app`

This happens because your Google OAuth app doesn't recognize the Vercel domain.

## ✅ Quick Fix - Add Domain to Google Cloud Console

### **Step 1: Open Google Cloud Console**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. **Select your project**: `hostel-bros` (or create if needed)

### **Step 2: Enable Google+ API (if not enabled)**
1. Go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click **"Enable"** if not already enabled

### **Step 3: Configure OAuth Consent Screen**
1. Go to **APIs & Services** → **OAuth consent screen**
2. If not configured, set it up:
   - **User Type**: External
   - **App name**: Hostel-Bros
   - **User support email**: Your email
   - **Developer contact**: Your email
3. **Save and Continue** through all steps

### **Step 4: Create/Update OAuth 2.0 Client**
1. Go to **APIs & Services** → **Credentials**
2. If no OAuth client exists:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client IDs"**
   - **Application type**: Web application
   - **Name**: Hostel-Bros Web App

3. **Add Authorized Domains:**
   - **Authorized JavaScript origins:**
     - `https://hostel-bros.vercel.app`
     - `https://hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app`
   
   - **Authorized redirect URIs:**
     - `https://hostel-bros.vercel.app/api/auth/callback/google`
     - `https://hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app/api/auth/callback/google`

4. **Save** the configuration

### **Step 5: Get Client Credentials**
After saving, you'll get:
- **Client ID**: (copy this)
- **Client Secret**: (copy this)

## 🔄 Update Vercel Environment Variables

Add these new environment variables to Vercel:

1. Go to [vercel.com](https://vercel.com) → Your project → Settings → Environment Variables
2. Add:
   - `GOOGLE_CLIENT_ID` = (your client ID from above)
   - `GOOGLE_CLIENT_SECRET` = (your client secret from above)
   - `NEXTAUTH_SECRET` = `kRQFqzWdbKJ65Tz9ghI3p4yyWWg2IiWuwpwkQjYop+s=`
   - `NEXTAUTH_URL` = `https://hostel-bros.vercel.app`

3. **Redeploy** the app

## 🎯 Alternative: Quick Domain Fix Only

If you want a quick fix without setting up new OAuth:

### **Option A: Add Domain to Existing OAuth App**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. **Find your existing OAuth 2.0 Client**
4. **Edit** and add these domains:
   - `https://hostel-bros.vercel.app`
   - `https://hostel-bros-hcm1rohme-rehan-khans-projects-fa136713.vercel.app`
5. **Save**

### **Option B: Use Custom Domain**
1. In Vercel, add a custom domain like `hostelbros.com`
2. Update Google OAuth to use the custom domain
3. More stable than Vercel's auto-generated URLs

## 🚀 Test After Fix

1. **Wait 5-10 minutes** for Google changes to propagate
2. **Clear browser cache** and cookies
3. **Try signing in** at `https://hostel-bros.vercel.app`
4. **Should work** without domain authorization error

## ⚡ Quick Commands (Run These After Google Setup)

```bash
# Add Google OAuth credentials to Vercel
echo "your-google-client-id" | vercel env add GOOGLE_CLIENT_ID production
echo "your-google-client-secret" | vercel env add GOOGLE_CLIENT_SECRET production
echo "kRQFqzWdbKJ65Tz9ghI3p4yyWWg2IiWuwpwkQjYop+s=" | vercel env add NEXTAUTH_SECRET production
echo "https://hostel-bros.vercel.app" | vercel env add NEXTAUTH_URL production

# Redeploy
vercel --prod
```

## 🎊 Expected Result
- ✅ Google sign-in works without domain error
- ✅ All app features accessible
- ✅ Ready for Android installation
- ✅ PWA install prompt appears

The domain authorization error will be completely resolved!