import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// HMAC Implementation using SubtleCrypto
const signData = async (data, secret) => {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToSign = encoder.encode(JSON.stringify(data));
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (e) {
    console.error('Signing failed:', e);
    return null;
  }
};

const verifyData = async (data, signature, secret) => {
  try {
    const expectedSignature = await signData(data, secret);
    return signature === expectedSignature;
  } catch (e) {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('authInfo');
    localStorage.removeItem('authSig');
    setAuthData(null);
  }, []);

  // Load session from localStorage on mount with HMAC verification
  useEffect(() => {
    const loadSession = async () => {
      try {
        const jwtToken = localStorage.getItem('jwtToken');
        const authInfo = localStorage.getItem('authInfo');
        const authSig = localStorage.getItem('authSig');

        if (jwtToken && authInfo && authSig) {
          const parsedAuth = JSON.parse(authInfo);
          const isValid = await verifyData(parsedAuth, authSig, jwtToken);
          
          if (isValid) {
            setAuthData(parsedAuth);
          } else {
            console.warn('LocalStorage tampering detected. Clearing session.');
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Session load failed:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [clearAuth]);

  const login = async (data, jwtToken) => {
    const authPayload = {
      teamId: data.teamId,
      teamName: data.teamName,
      currentRound: data.currentRound,
      unlockedRounds: data.unlockedRounds || []
    };

    const signature = await signData(authPayload, jwtToken);
    
    setAuthData(authPayload);
    localStorage.setItem('authInfo', JSON.stringify(authPayload));
    localStorage.setItem('jwtToken', jwtToken);
    if (signature) localStorage.setItem('authSig', signature);
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

        const signature = await signData(updatedAuth, token);
        
        setAuthData(updatedAuth);
        localStorage.setItem('authInfo', JSON.stringify(updatedAuth));
        if (signature) localStorage.setItem('authSig', signature);
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