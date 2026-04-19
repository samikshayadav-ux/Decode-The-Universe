import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    teamId: '',
    password: '',
    members: ['', '', '', ''],
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();
  
  // Get the intended destination (same logic as Login)
  const getIntendedRound = () => {
    // Check if user came from a specific round gateway
    const fromPath = location.state?.from?.pathname;
    if (fromPath) {
      const pathSegments = fromPath.split('/').filter(Boolean);
      const roundFromPath = pathSegments.find(segment => segment.startsWith('round'));
      if (roundFromPath) return roundFromPath;
    }

    // Check current URL path
    const currentPathSegments = location.pathname.split('/').filter(Boolean);
    const roundFromCurrentPath = currentPathSegments.find(segment => segment.startsWith('round'));
    if (roundFromCurrentPath) return roundFromCurrentPath;

    // Check stored intended round
    const storedIntendedRound = sessionStorage.getItem('intendedRound');
    if (storedIntendedRound) return storedIntendedRound;

    return 'round1'; // Default
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      const targetRound = getIntendedRound();
      navigate(`/${targetRound}/game`, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index, value) => {
    const updated = [...formData.members];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, members: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const intendedRound = getIntendedRound();
    console.log('Registration attempt for intended round:', intendedRound);

    try {
      const { teamName, teamId, password, members } = formData;

      // Call backend API for registration
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: teamName,
          teamId: teamId,
          password: password,
          members: members.filter(m => m.trim())
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const authData = {
        teamId: data.team.teamId,
        teamName: data.team.teamName,
        isGuest: false,
        currentRound: intendedRound,
        completedRounds: []
      };

      login(authData, data.token, intendedRound);
      setSuccess('Registration successful!');
      
      // Clear stored intended round
      sessionStorage.removeItem('intendedRound');
      
      setTimeout(() => {
        const gamePath = `/${intendedRound}/game`;
        console.log('Register redirecting to:', gamePath);
        navigate(gamePath, { replace: true });
      }, 1000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const currentDisplayRound = getIntendedRound();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-mono text-white mb-2">
            REGISTER
        </h2>
        <div className="text-gray-400 font-mono text-sm">
          Register your team 
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 text-red-400 rounded-lg text-sm font-mono mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-900/30 border border-green-700 text-green-400 rounded-lg text-sm font-mono mb-4">
            {success}
          </div>
        )}

        {/* Team Name */}
        <div className="mb-4">
          <label className="block text-gray-400 font-mono text-xs mb-1">TEAM NAME*</label>
          <input
            name="teamName"
            value={formData.teamName}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter the team name"
            className="w-full p-3 bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none rounded"
          />
        </div>

        {/* Team ID */}
        <div className="mb-4">
          <label className="block text-gray-400 font-mono text-xs mb-1">UNIQUE ID*</label>
          <input
            name="teamId"
            value={formData.teamId}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter the given Team ID"
            className="w-full p-3 bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none rounded"
          />
        </div>

        {/* Members */}
        <div className="mb-4">
          <label className="block text-gray-400 font-mono text-xs mb-1">TEAM MEMBERS</label>
          <div className="grid grid-cols-2 gap-4">
            {formData.members.map((member, i) => (
              <input
                key={i}
                value={member}
                onChange={(e) => handleMemberChange(i, e.target.value)}
                placeholder={`MEMBER ${i + 1}${i < 3 ? '*' : ''}`}
                required={i < 3}
                disabled={loading}
                className="w-full p-3 bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none rounded"
              />
            ))}
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-gray-400 font-mono text-xs mb-1">PASSWORD*</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Create a password"
              className="w-full p-3 pr-10 bg-black border border-gray-800 text-white font-mono placeholder-gray-600 focus:border-blue-500 focus:outline-none rounded"
            />
            <span
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 border font-mono transition-colors rounded ${
            loading
              ? 'border-gray-600 text-gray-500 cursor-not-allowed'
              : 'border-blue-500 text-blue-500 hover:bg-blue-500/10 active:bg-blue-500/20'
          }`}
        >
          {loading ? ' REGISTERING...' : ' REGISTER'}
        </button>
      </form>
    </div>
  );
};

export default Register;