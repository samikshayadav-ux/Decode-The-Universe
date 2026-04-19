import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Network } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 md:p-12 relative overflow-hidden grid-bg">
      <div className="scanline" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="border-b-4 border-white pb-8 mb-12">
          <div className="flex items-center gap-2 bg-accent text-black px-2 py-1 text-xs font-black mb-4 w-fit">
            <Network size={14} />
            <span>SYSTEM_MANIFESTO // CORE_INIT</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-none">
            AB<span className="text-accent underline">OUT</span>
          </h1>
        </header>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-l-4 border-white p-8 space-y-8 bg-white/5 backdrop-blur-sm"
        >
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
              <Cpu className="text-accent" /> THE_PLATFORM
            </h2>
            <p className="text-sm md:text-lg leading-relaxed text-white/70">
              DECODE THE UNIVERSE is a next-generation technical treasure hunt platform 
              engineered for high-intellect competition. It merges physical exploration 
              with digital decryption protocols.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
              <Terminal className="text-accent" /> ARCHITECTURE
            </h2>
            <p className="text-sm md:text-lg leading-relaxed text-white/70">
              Built on a low-latency stack (MERN + Socket.IO), the system provides 
              millisecond-accurate leaderboard synchronization and multi-stage 
              cryptographic validation for every solved mystery.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black tracking-widest text-white/30 uppercase italic">
              ENGINEERED_FOR_KLE_COLLEGE // 2026
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-[10px] font-black">JS</div>
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-[10px] font-black">RT</div>
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-[10px] font-black">DT</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
