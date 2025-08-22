import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  email: string;
  plan: string;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    industry?: string;
  };
  preferences?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  userId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  industry?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const backend_url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Check for existing auth data on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUserId = localStorage.getItem('userId');
    
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      // We'll fetch user data separately to ensure it's fresh
      fetchUserData(savedUserId, savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (uid: string, authToken: string) => {
    try {
      const response = await fetch(`${backend_url}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'user': uid,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          // If profile fetch fails, clear auth data
          clearAuthData();
        }
      } else {
        // If profile fetch fails, clear auth data
        clearAuthData();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setUserId(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${backend_url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (data.success && data.data) {
        const { user: userData, token: authToken } = await data.data;
        
        await setUser(userData);
        setUserId(userData._id);
        setToken(authToken);
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userData._id);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${backend_url}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      if (data.success && data.data) {
        const { user: newUser, token: authToken } = data.data;
        
        setUser(newUser);
        setUserId(newUser._id);
        setToken(authToken);
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', newUser._id);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token && userId) {
        // Call logout endpoint to blacklist token
        await fetch(`${backend_url}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'user': userId,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshUserData = async () => {
    if (userId && token) {
      await fetchUserData(userId, token);
    }
  };

  const value: AuthContextType = {
    user,
    userId,
    token,
    isLoading,
    isAuthenticated: !!token && !!userId && !!user && user.isActive,
    login,
    register,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 