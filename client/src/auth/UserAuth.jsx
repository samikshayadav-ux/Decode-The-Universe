import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Terminal, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const UserAuth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg text-[#F5F5F5] font-sans grid-bg-tech p-4 md:p-8 flex flex-col relative overflow-hidden">
      <div className="scanline opacity-5" />
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center z-20 mb-12 max-w-6xl mx-auto w-full">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 font-mono text-[10px] font-black uppercase hover:text-accent transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>ESC // BACK_TO_ORIGIN</span>
        </button>
        
        <div className="flex items-center gap-4">
           <div className="h-px w-12 bg-white/10 hidden md:block" />
           <div className="text-[10px] font-mono font-black tracking-[0.4em] opacity-30 uppercase">IDENTITY_SERVICE</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start z-10 w-full max-w-6xl mx-auto pt-10">
        <div className="w-full max-w-4xl">
          {/* Unified Auth Container with Neo-Shadow */}
          <div className="bg-bg border-2 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden">
            
            {/* Header Tabs inside the box */}
            <div className="flex border-b-2 border-white/10">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'login' ? 'bg-white text-black' : 'hover:bg-white/5 opacity-50'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition-all border-l-2 border-white/10 ${
                  activeTab === 'register' ? 'bg-white text-black' : 'hover:bg-white/5 opacity-50'
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Dynamic Content */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === 'login' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === 'login' ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'login' ? <Login /> : <Register />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center z-10">
        <p className="text-[8px] font-mono font-black tracking-[0.6em] uppercase opacity-20 italic">
          SECURE_AUTH // END_TO_END_ENCRYPTION_v4
        </p>
      </div>
    </div>
  );
};

export default UserAuth;