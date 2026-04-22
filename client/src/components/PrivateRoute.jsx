import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PrivateRoute = ({ children, round }) => {
  const { authData, isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono animate-pulse">
          <div className="text-center">
            <div className="text-2xl mb-2">◯</div>
            <div>LOADING...</div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth with current path
  if (!isLoggedIn || !authData) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user is authorized for this specific round
  if (authData.allowedRound !== round) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center font-mono">
          <div className="text-red-500 text-2xl mb-4">✗ ACCESS DENIED</div>
          <div className="text-gray-400 text-sm mb-6">
            You are only authorized for <span className="text-blue-400 font-bold">{authData.allowedRound}</span>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;