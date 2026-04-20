import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const authInfo = localStorage.getItem('authInfo');

      if (jwtToken && authInfo) {
        const parsedAuth = JSON.parse(authInfo);
        setAuthData(parsedAuth);
      }
    } catch (error) {
      console.error('Session load failed:', error);
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('authInfo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('authInfo');
    setAuthData(null);
  };

  const login = (data, jwtToken, allowedRound) => {
    const authPayload = {
      teamId: data.teamId,
      teamName: data.teamName,
      allowedRound
    };

    setAuthData(authPayload);
    localStorage.setItem('authInfo', JSON.stringify(authPayload));
    localStorage.setItem('jwtToken', jwtToken);
  };

  const logout = () => {
    clearAuth();
  };

  const getJWTToken = () => localStorage.getItem('jwtToken');

  return (
    <AuthContext.Provider value={{ 
      authData, 
      isLoading,
      login, 
      logout,
      getJWTToken,
      isLoggedIn: !!authData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};