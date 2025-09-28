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
  signInDemo: () => Promise<void>;
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
    // Check for demo mode first
    const demoMode = localStorage.getItem('demoMode');
    const demoUserData = localStorage.getItem('demoUser');
    
    if (demoMode === 'true' && demoUserData) {
      try {
        const demoUser = JSON.parse(demoUserData);
        setUser(demoUser);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing demo user data:', error);
        localStorage.removeItem('demoMode');
        localStorage.removeItem('demoUser');
      }
    }

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
      console.log('Auth domain:', auth.app.options.authDomain);
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
      } else if (error.code === 'auth/invalid-api-key') {
        alert('Firebase configuration error. Please check API key.');
      } else if (error.code === 'auth/project-not-found') {
        alert('Firebase project not found. Please check project configuration.');
      } else {
        alert(`Sign in failed: ${error.message}. Please try again.`);
      }
      throw error;
    }
  };

  const signInDemo = async () => {
    try {
      console.log('Signing in with demo account...');
      // Create a demo user
      const demoUser: User = {
        id: 'demo-user-123',
        name: 'Demo User',
        email: 'demo@hostelbros.com',
        profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'user',
        status: 'online',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isNightOwl: false,
        roomNumber: 'A-101'
      };
      
      setUser(demoUser);
      setLoading(false);
      
      // Store demo mode in localStorage
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      
      console.log('Demo sign in successful');
    } catch (error) {
      console.error('Error signing in with demo:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Check if in demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        localStorage.removeItem('demoMode');
        localStorage.removeItem('demoUser');
        setUser(null);
        setFirebaseUser(null);
        return;
      }
      
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
    signInDemo,
    signOut,
    updateUserStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}