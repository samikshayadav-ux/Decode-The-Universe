// src/auth/UserAuth.jsx
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const UserAuth = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 font-mono">
      <div className="w-full max-w-md border-2 border-gray-800 bg-black rounded-xl overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-sm tracking-wider transition-colors ${
              activeTab === 'login'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-sm tracking-wider transition-colors ${
              activeTab === 'register'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'login' ? <Login /> : <Register />}
        </div>

        
      </div>
    </div>
  );
};

export default UserAuth;