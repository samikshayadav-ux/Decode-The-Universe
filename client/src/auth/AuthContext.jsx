import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount (persistent)
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

  const login = (data, jwtToken) => {
    const authPayload = {
      teamId: data.teamId,
      teamName: data.teamName,
      currentRound: data.currentRound,
      unlockedRounds: data.unlockedRounds || []
    };

    setAuthData(authPayload);
    localStorage.setItem('authInfo', JSON.stringify(authPayload));
    localStorage.setItem('jwtToken', jwtToken);
  };

  const logout = () => {
    clearAuth();
  };

  const getJWTToken = () => localStorage.getItem('jwtToken');

  const refreshTeamProgress = async () => {
    if (!authData?.teamId) return;
    
    try {
      const token = getJWTToken();
      const response = await fetch(`${API_URL}/api/auth/team/${authData.teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedAuth = {
          ...authData,
          currentRound: data.team.currentRound,
          unlockedRounds: data.team.unlockedRounds
        };
        setAuthData(updatedAuth);
        localStorage.setItem('authInfo', JSON.stringify(updatedAuth));
        return updatedAuth;
      }
    } catch (error) {
      console.error('Failed to refresh team progress:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      authData, 
      isLoading,
      login, 
      logout,
      getJWTToken,
      refreshTeamProgress,
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