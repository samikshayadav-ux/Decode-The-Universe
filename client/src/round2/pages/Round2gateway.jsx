// src/round1/pages/Round1Gateway.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const Round1Gateway = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { isLoggedIn, authData } = useAuth();

  const correctPassword = 'KLE&';

  // Store intended round and handle logged-in users
  useEffect(() => {
    // Store the intended round for login redirect
    localStorage.setItem('intendedRound', 'round2');
    
    if (isLoggedIn && authData) {
      // Only redirect if already logged in for THIS round (round2)
      const userRound = authData.allowedRound;
      const isRound2 = userRound === 'round2' || userRound === 2;
      
      if (isRound2) {
        console.log('User already logged in for round2, redirecting to game');
        navigate('/round2/game', { replace: true });
      }
    }
  }, [isLoggedIn, authData, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (password.trim() === correctPassword) {
        // Redirect to authentication page with round context
        navigate('/auth', { state: { from: { pathname: '/round2' } } });
      } else {
        setError('Invalid key. Try again.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>
      
      {/* Main card */}
      <div className="relative z-10 bg-gray-950 border-2 border-gray-600 rounded-xl p-8 w-full max-w-md shadow-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            ROUND 2
          </h1>
          <p className="text-gray-400 text-sm font-mono">
            Enter Access Key to Continue
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full p-3 pr-10 border border-gray-800 rounded-md focus:outline-none focus:border-blue-500 text-white font-mono placeholder-gray-600 bg-transparent transition-colors"
              placeholder="Enter The Access Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            {error && (
              <p className="mt-2 text-sm text-red-500 font-mono flex items-center">
                <span className="text-red-500 mr-1"></span>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={`w-full py-3 px-4 rounded-md font-mono font-medium border transition-colors ${
              isLoading || !password.trim()
                ? 'border-gray-800 text-gray-500 cursor-not-allowed'
                : 'border-blue-500 text-blue-500 hover:bg-blue-500/10 active:bg-blue-500/20'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-pulse mr-2"></span>
                VERIFYING...
              </span>
            ) : (
              'Unlock'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Round1Gateway;