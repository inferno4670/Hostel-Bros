# Google Drive Integration Setup Guide

## Current Status ✅

Your hostel superapp now has Google Drive integration implemented! Here's what has been completed:

### ✅ Completed Tasks:
1. **Dependencies Installed**: `googleapis` and `next-auth` packages
2. **NextAuth.js Configuration**: Set up with Google Drive scopes
3. **Google Drive Service**: Complete utility class for file operations
4. **API Routes**: Upload, list, and delete endpoints for Google Drive
5. **Firebase Configuration**: Updated with Google Drive scopes
6. **Wall Page**: Updated to use Google Drive for file uploads
7. **Chat Page**: Updated to use Google Drive for file sharing

## 📋 Next Steps to Complete Setup

### 1. Google Cloud Console Setup

1. **Create/Access Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-domain.com/api/auth/callback/google` (for production)
   - Copy the Client ID and Client Secret

### 2. Environment Variables Setup

Update your `.env.local` file with the actual values:

```env
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"

# Generate a random secret (you can use: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-nextauth-secret"

# Your app URL
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Firebase Authentication Setup

Add the authorized domain to Firebase:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to "Authentication" > "Settings" > "Authorized domains"
4. Add `localhost` (for development)
5. Add your production domain when deploying

### 4. Test the Integration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test file uploads**:
   - Navigate to the Wall page
   - Create a post with image/document type
   - Upload a file and verify it appears in your Google Drive
   - Check that files are organized in "Hostel SuperApp" folder

3. **Test chat file sharing**:
   - Go to Chat page
   - Send a message with file attachment
   - Verify file is uploaded to Google Drive

## 🚀 Features Now Available

### File Storage
- **Automatic folder organization**: Files are organized in Google Drive under "Hostel SuperApp" with subfolders:
  - `Posts/` - Wall post files
  - `Chat Files/` - Chat attachments
  - `Documents/` - General documents

### File Sharing
- **Public access**: Uploaded files are automatically made publicly viewable
- **Direct links**: Files have both view and download links
- **Large file support**: No size limitations (within Google Drive limits)

### User Experience
- **Seamless integration**: Users don't need separate Google Drive authentication
- **Familiar interface**: Files appear directly in the app
- **Backup access**: Users can access files directly in their Google Drive

## 🔧 Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**:
   - Check that Google OAuth credentials are correct
   - Verify redirect URIs match exactly
   - Ensure Google Drive API is enabled

2. **"Permission denied" errors**:
   - Check that Google Drive scopes are properly configured
   - Verify user has granted Drive permissions during login

3. **"Quota exceeded" errors**:
   - User's Google Drive is full
   - Check Google Drive API quota limits

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify API routes are responding correctly
3. Test OAuth flow manually
4. Check Google Cloud Console for API usage

## 🔒 Security Notes

- Files are uploaded to the user's personal Google Drive
- Public sharing is enabled automatically for seamless access
- Users control their own data through Google Drive
- No server-side file storage reduces security risks

## 📈 Future Enhancements

Possible improvements:
- File preview in app
- Collaborative editing integration
- Advanced search functionality
- File versioning tracking
- Bulk file operations

Your Google Drive integration is now ready! Just complete the Google Cloud Console setup and update the environment variables to start using it.