import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store team info and token
      login({
        teamId: data.team.teamId,
        teamName: data.team.teamName,
        currentRound: data.team.currentRound,
        unlockedRounds: data.team.unlockedRounds
      }, data.token);

      setSuccess('Login successful!');
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-mono text-white mb-2">LOGIN</h2>
        <div className="text-gray-400 font-mono text-sm">Enter your credentials</div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 text-red-400 rounded-lg text-sm font-mono">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-900/20 border border-green-700 text-green-400 rounded-lg text-sm font-mono">
            {success}
          </div>
        )}

        <div>
          <label className="block text-gray-400 font-mono text-xs mb-1">TEAM ID*</label>
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Enter your Team ID"
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-gray-400 font-mono text-xs mb-1">PASSWORD*</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 pr-10 rounded-lg bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg border font-mono transition-colors ${
            isLoading
              ? 'border-gray-600 text-gray-500 cursor-not-allowed'
              : 'border-blue-500 text-blue-500 hover:bg-blue-500/10 active:bg-blue-500/20'
          }`}
        >
          {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
        </button>
      </form>
    </div>
  );
};

export default Login;