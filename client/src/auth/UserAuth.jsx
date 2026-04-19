// src/auth/UserAuth.jsx
import React from 'react';
import Login from './Login';

const UserAuth = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 font-mono">
      <div className="w-full max-w-md border-2 border-gray-800 bg-black rounded-xl overflow-hidden">
        {/* Content Area */}
        <div className="p-6">
          <Login />
        </div>
      </div>
    </div>
  );
};

export default UserAuth;