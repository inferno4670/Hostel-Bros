import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// Note: Firebase Storage is disabled, using Google Drive API instead

// Production Firebase config with environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDXiJI-19-fhSfFZ9puXkRSzIH6YLf8Kt8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hostel-bros.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hostel-bros",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hostel-bros.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "946063362575",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:946063362575:web:0eabca27e5d1aa06a5f17a",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://hostel-bros-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Debug: Log the configuration being used
console.log('Firebase Config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
// Firebase Storage disabled - using Google Drive API for file storage
export const storage = null; // Google Drive replaces Firebase Storage

// Configure Google Auth Provider with enhanced scopes for Google Drive
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add Google Drive scopes for file storage functionality
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

export default app;