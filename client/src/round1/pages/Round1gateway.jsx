import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Terminal, ArrowLeft, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const Round1Gateway = () => {
  const navigate = useNavigate();
  const { isLoggedIn, authData } = useAuth();
  const isUnlocked = authData?.unlockedRounds?.includes(1);

  useEffect(() => {
    // If already logged in and unlocked, maybe just go straight?
    // User said: "from round 2-3 directly open if logged in"
    // For Round 1: "ask me to register/login"
    if (isLoggedIn && isUnlocked) {
      // navigate('/round1/game', { replace: true });
    }
  }, [isLoggedIn, isUnlocked, navigate]);

  const handleProceed = () => {
    if (!isLoggedIn) {
      navigate('/auth', { state: { from: { pathname: '/round1/game' } } });
    } else {
      navigate('/round1/game');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono grid-bg p-6 md:p-16 flex flex-col relative overflow-hidden">
      <div className="scanline" />
      
      <div className="flex justify-between items-center z-10 mb-20">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 font-black uppercase text-xs md:text-sm hover:text-accent transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>BACK_TO_HOME</span>
        </button>
        
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5">
          <Activity size={14} className={isLoggedIn ? 'text-green-500' : 'text-gray-500'} />
          <div className="text-right">
            <div className="text-[8px] text-white/40 font-bold uppercase tracking-widest leading-none">TERMINAL_STATUS</div>
            <div className="text-accent font-black uppercase tracking-tighter text-[10px]">
              {authData?.teamName || 'GUEST_UNAFFILIATED'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="w-full max-w-md border-4 border-white p-8 bg-black relative"
        >
          <div className="absolute -top-4 -left-4 bg-white text-black px-3 py-1 font-black italic">
            SECURE_GATE_01
          </div>

          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-2">ROUND 1</h1>
            <div className="flex items-center gap-2 text-accent text-[10px] font-black tracking-[0.3em]">
              <ShieldCheck size={12} />
              <span>ACCESS_PROTOCOL: {isUnlocked ? 'AUTHORIZED' : 'PENDING_AUTH'}</span>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-xs text-white/60 leading-relaxed">
              WELCOME TO THE FIRST SEQUENCE. YOUR TEAM IDENTITY MUST BE VERIFIED BEFORE PROCEEDING TO THE CORE SYSTEM.
            </p>

            <button
              onClick={handleProceed}
              className="w-full border-4 border-white bg-white text-black py-6 flex items-center justify-center gap-4 text-xl font-black uppercase tracking-tighter hover:bg-black hover:text-white transition-all duration-150"
            >
              <span>{isLoggedIn ? 'PROCEED TO GAME' : 'LOGIN / REGISTER'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        <p className="mt-12 text-white/20 text-[10px] font-bold uppercase tracking-widest text-center max-w-xs leading-loose">
          SIGNAL_STRENGTH: OPTIMAL <br />
          DECODE_SEQUENCE_READY
        </p>
      </div>

      <div className="absolute bottom-[-10%] right-[-10%] opacity-5 hidden lg:block">
        <Terminal size={600} strokeWidth={1} />
      </div>
    </div>
  );
};

export default Round1Gateway;