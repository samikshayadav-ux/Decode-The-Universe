import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRounds } from '../utils/adminApi';

const AdminAuth = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (adminId === 'admin123' && password === 'Jayy@admin.123') {
      setIsLoading(true);
      setError('');
      
      try {
        // Store credentials for API access
        localStorage.setItem('adminCredentials', JSON.stringify({ adminId, password }));
        
        // Validate credentials with backend
        await getAllRounds();
        
        // Backend validation successful
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin-dashboard');
      } catch (err) {
        setError('Backend authentication failed: ' + err.message);
        localStorage.removeItem('adminCredentials');
        setIsLoading(false);
      }
    } else {
      setError('Invalid ID or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <div className="mb-4">
          <label className="block mb-2">Admin ID</label>
          <input
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Validating...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminAuth;
