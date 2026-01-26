import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import storage from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = storage.getUser();
      const token = storage.getToken();
      
      if (savedUser && token) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.users.login(email, password);
      
      if (response.status === 200 && response.data) {
        const userData = response.data;
        
        // Save to localStorage
        storage.setUser(userData);
        storage.setToken('mock-jwt-token');
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Invalid email or password' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.users.create(userData);
      
      if (response.status === 201 && response.data) {
        const newUser = response.data;
        
        // Save to localStorage
        storage.setUser(newUser);
        storage.setToken('mock-jwt-token');
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Signup failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: 'Signup failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    storage.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}