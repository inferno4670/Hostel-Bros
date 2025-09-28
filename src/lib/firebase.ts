import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// import { getStorage } from 'firebase/storage'; // Disabled until Blaze plan

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
// export const storage = getStorage(app); // Disabled until Blaze plan
export const storage = null; // Temporarily disabled

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;