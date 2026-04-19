import React, { useState, useEffect, useCallback } from 'react';
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
    if (!isLoggedIn) {
      setIsVerifying(false);
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
      } else {
        const data = await response.json();
        setServerVerified(false);
        setVerificationError(data.message || 'Access Denied');
        if (response.status === 401) logout();
      }
    } catch (err) {
      console.error('Access verification failed:', err);
      setServerVerified(false);
      setVerificationError('Network error during verification');
    } finally {
      setIsVerifying(false);
    }
  }, [roundNumber, isLoggedIn, getJWTToken, API_URL, logout]);

  useEffect(() => {
    setIsVerifying(true);
    verifyAccess();
  }, [verifyAccess]);

  useEffect(() => {
    const handleFocus = () => verifyAccess();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [verifyAccess]);

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono animate-pulse">
          <div className="text-center">
            <div className="text-2xl mb-2 italic font-black">WAITING_FOR_UPSTREAM...</div>
            <div className="text-[10px] tracking-widest uppercase opacity-50">BYPASSING_LOCAL_STATE // SYNCING_GATEWAY</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!serverVerified || verificationError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4 text-white">
        <div className="border-4 border-red-500 p-8 max-w-md w-full bg-red-500/5 relative">
          <div className="absolute -top-4 -left-4 bg-red-500 text-white px-3 py-1 font-black text-xs">GATEWAY_BLOCK</div>
          <h2 className="text-4xl font-black italic tracking-tighter mb-4">ACCESS_CLOSED</h2>
          <p className="text-sm opacity-60 mb-8 uppercase leading-relaxed">
            {verificationError || 'THE GATEWAY SYSTEM HAS REJECTED YOUR AUTH_STRING FOR THIS ROUND.'}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 border-4 border-white bg-white text-black font-black uppercase tracking-tighter hover:bg-black hover:text-white transition-all"
            >
              RECHECK_RESPONSE
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 border-b-4 border-white/20 text-white/40 font-black uppercase text-xs hover:text-white hover:border-white transition-all"
            >
              RETURN_TO_HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;