// Authentication Context Provider
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange, getUserDocument, logout as firebaseLogout, createOrUpdateUserDocument, ADMIN_EMAIL } from '@/lib/firebase';

// User data interface matching Firestore structure
interface UserData {
  id: string;
  name: string;
  reg_no: string;
  department: string;
  role: 'student' | 'admin';
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

  // Function to fetch user data from Firestore
  const fetchUserData = async (uid: string, email: string) => {
    try {
      let data = await getUserDocument(uid);
      
      // If user document exists, check if we need to update role for admin email
      if (data) {
        const existingData = data as UserData;
        if (email === ADMIN_EMAIL && existingData.role !== 'admin') {
          // Update role to admin
          data = await createOrUpdateUserDocument(uid, email, { name: existingData.name });
        }
        setUserData({ ...existingData, role: email === ADMIN_EMAIL ? 'admin' : existingData.role });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Refresh user data function
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.uid, user.email || '');
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
        await fetchUserData(firebaseUser.uid, firebaseUser.email || '');
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
