import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const UserAuth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 starfield opacity-30" />
      <div className="orbit-arc w-[1000px] h-[1000px] -top-1/2 -left-1/4" />
      
      {/* Header */}
      <div className="flex justify-between items-center p-12 z-20">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] hover:text-accent transition-all"
        >
          <ArrowLeft size={16} />
          <span>RETURN TO ORBIT</span>
        </button>
        <div className="text-[10px] font-black tracking-[0.6em] opacity-20 uppercase">Auth Protocol</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 px-6 pb-20">
        <div className="w-full max-w-lg">
          <div className="minimal-box overflow-hidden">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'login' ? 'bg-white text-black' : 'hover:bg-white/5 opacity-40'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'register' ? 'bg-white text-black' : 'hover:bg-white/5 opacity-40'
                }`}
              >
                REGISTER
              </button>
            </div>

            <div className="p-12">
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
    </div>
  );
};

export default UserAuth;