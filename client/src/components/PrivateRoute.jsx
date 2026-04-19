import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PrivateRoute = ({ children, roundNumber }) => {
  const { authData, isLoggedIn, isLoading, getJWTToken, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [serverVerified, setServerVerified] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const verifyAccess = useCallback(async () => {
    if (!isLoggedIn || !authData) {
      setIsVerifying(false);
      return;
    }

    // If locally locked, don't even bother verifying
    if (!authData.unlockedRounds?.includes(roundNumber)) {
      setIsVerifying(false);
      setServerVerified(false);
      return;
    }

    try {
      const endpoint = roundNumber === 3 ? '/api/gateway/finalround' : `/api/gateway/round${roundNumber}`;
      const token = getJWTToken();
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        setServerVerified(true);
        setVerificationError(null);
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or team doesn't have access
        setServerVerified(false);
        setVerificationError('Session expired or access denied');
        if (response.status === 401) logout();
      } else {
        setServerVerified(false);
        setVerificationError('Failed to verify round access');
      }
    } catch (err) {
      console.error('Access verification failed:', err);
      setServerVerified(false);
      setVerificationError('Network error during verification');
    } finally {
      setIsVerifying(false);
    }
  }, [roundNumber, isLoggedIn, authData, getJWTToken, API_URL, logout]);

  useEffect(() => {
    setIsVerifying(true);
    verifyAccess();
  }, [verifyAccess]);

  // Re-verify on window focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, re-verifying access...');
      verifyAccess();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [verifyAccess]);

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono animate-pulse">
          <div className="text-center">
            <div className="text-2xl mb-2">◯</div>
            <div>{isLoading ? 'LOADING...' : 'VERIFYING ACCESS...'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth with current path
  if (!isLoggedIn || !authData) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user is authorized for this specific round (Frontend check)
  if (!authData.unlockedRounds?.includes(roundNumber) || (!serverVerified && !verificationError)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center font-mono bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/50 flex items-center justify-center rounded-full mx-auto mb-6">
            <span className="text-red-500 text-3xl font-bold">!</span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">ROUND {roundNumber} LOCKED</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your team has not unlocked this round yet. Please complete the previous rounds or wait for the administrator to open access.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              RECHECK ACCESS
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              RETURN TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Server side verification failed but user thought they had access (tampering or session issue)
  if (verificationError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center font-mono">
          <div className="text-red-500 text-2xl mb-4">✗ ACCESS DENIED</div>
          <div className="text-gray-400 text-sm mb-6">{verificationError}</div>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;