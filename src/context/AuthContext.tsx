// Authentication Context Provider
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange, getUserDocument, logout as firebaseLogout, createOrUpdateUserDocument, ADMIN_EMAIL, registerFCMToken } from '@/lib/firebase';
import type { UserRole } from '@/lib/firebase';
// User data interface matching Firestore structure

interface UserData {
  id: string;
  name: string;
  reg_no: string;
  department: string;
  role: UserRole;
  email?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshUserData: async () => {}
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore and ensure doc exists
  const fetchUserData = async (uid: string, email: string, displayName?: string | null) => {
    try {
      let data = await getUserDocument(uid);
      const cleanEmail = email.trim().toLowerCase();

      // If user document does NOT exist in Firestore (e.g. direct Google sign-in), automatically create it!
      if (!data && cleanEmail) {
        data = await createOrUpdateUserDocument(uid, cleanEmail, {
          name: displayName || 'Student',
          role: cleanEmail === ADMIN_EMAIL.trim().toLowerCase() ? 'admin' : 'student',
        });
      }

      if (data) {
        const existingData = data as UserData;
        const isAdminUser = cleanEmail === ADMIN_EMAIL.trim().toLowerCase();

        // Ensure email field in Firestore document is up to date
        if (cleanEmail && (!existingData.email || existingData.email.toLowerCase() !== cleanEmail)) {
          await createOrUpdateUserDocument(uid, cleanEmail, { name: existingData.name });
          existingData.email = cleanEmail;
        }

        if (isAdminUser && existingData.role !== 'admin') {
          await createOrUpdateUserDocument(uid, cleanEmail, { name: existingData.name });
          existingData.role = 'admin';
        }

        setUserData({
          ...existingData,
          email: cleanEmail || existingData.email,
          role: isAdminUser ? 'admin' : existingData.role,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Refresh user data function
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.uid, user.email || '', user.displayName);
    }
  };

  // Logout function
  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    setUserData(null);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserData(firebaseUser.uid, firebaseUser.email || '', firebaseUser.displayName);
        // Register FCM token for push notifications
        await registerFCMToken(firebaseUser.uid);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userData,
    loading,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
