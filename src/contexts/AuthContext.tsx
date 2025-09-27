'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, set, onDisconnect } from 'firebase/database';
import { auth, googleProvider, db, rtdb } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserStatus: (status: 'online' | 'offline' | 'away') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'signed out');
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get or create user document
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              profilePic: userData.profilePic || firebaseUser.photoURL || '',
              role: userData.role || 'user',
              status: 'online',
              roomNumber: userData.roomNumber,
              joinedAt: userData.joinedAt?.toDate() || new Date(),
              lastSeen: new Date(),
              isNightOwl: userData.isNightOwl || false,
            };
            setUser(user);
            
            // Update presence in Realtime Database
            const userStatusRef = ref(rtdb, `status/${firebaseUser.uid}`);
            set(userStatusRef, {
              state: 'online',
              lastSeen: Date.now(),
            });
            
            // Set up disconnect handler
            onDisconnect(userStatusRef).set({
              state: 'offline',
              lastSeen: Date.now(),
            });
            
            // Update last seen in Firestore
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastSeen: new Date(),
            });
          } else {
            // Create new user document
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || '',
              role: 'user',
              status: 'online',
              joinedAt: new Date(),
              lastSeen: new Date(),
              isNightOwl: false,
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              joinedAt: new Date(),
              lastSeen: new Date(),
            });
            
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error setting up user data:', error);
          // Don't sign out on database errors, just log
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in successful:', result.user?.email);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for Google sign-in. Please contact the administrator.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup');
      } else {
        alert('Sign in failed. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (firebaseUser) {
        // Update status to offline before signing out
        const userStatusRef = ref(rtdb, `status/${firebaseUser.uid}`);
        await set(userStatusRef, {
          state: 'offline',
          lastSeen: Date.now(),
        });
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserStatus = async (status: 'online' | 'offline' | 'away') => {
    if (!firebaseUser) return;
    
    try {
      // Update Realtime Database
      const userStatusRef = ref(rtdb, `status/${firebaseUser.uid}`);
      await set(userStatusRef, {
        state: status,
        lastSeen: Date.now(),
      });
      
      // Update Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        status,
        lastSeen: new Date(),
      });
      
      // Update local state
      if (user) {
        setUser({ ...user, status, lastSeen: new Date() });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signOut,
    updateUserStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}