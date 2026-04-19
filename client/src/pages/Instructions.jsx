import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Info, Rocket } from 'lucide-react';

const Instructions = () => {
  const categories = [
    {
      title: "FORMAT_SEQUENCE",
      icon: <Rocket size={18} />,
      items: [
        "Teams comprise 3-4 members exclusively.",
        "One authorized device per team allowed for terminal access.",
        "Report to registration for ID sequence allocation.",
        "Operational area: campus boundaries only."
      ]
    },
    {
      title: "GAME_MECHANICS",
      icon: <Terminal size={18} />,
      items: [
        "Round 1: Initial filtering quiz.",
        "Round 2: Multi-stage challenge sequence.",
        "Final Round: Core system decryption.",
        "Clues exist in both physical and digital space.",
        "Solving physical components unlocks digital progression."
      ]
    },
    {
      title: "CONDUCT_PROTOCOLS",
      icon: <Shield size={18} />,
      items: [
        "Zero tolerance for clue removal or tampering.",
        "No external AI or search engine assistance authorized.",
        "Physical damage to environment results in immediate disqualification.",
        "Cheating/clue sharing triggers terminal lockout."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 md:p-12 relative overflow-hidden grid-bg">
      <div className="scanline" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="border-b-4 border-white pb-8 mb-12">
          <div className="flex items-center gap-2 bg-accent text-black px-2 py-1 text-xs font-black mb-4 w-fit">
            <Info size={14} />
            <span>MISSION_BRIEF // PROTOCOL_V.2026</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
            INSTR<span className="text-accent underline">UCTIONS</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={cat.title} 
              className="border-2 border-white/20 p-6 hover:border-white transition-colors"
            >
              <div className="flex items-center gap-3 mb-6 text-accent">
                {cat.icon}
                <h2 className="font-black text-sm uppercase tracking-widest">{cat.title}</h2>
              </div>
              <ul className="space-y-4">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-xs leading-relaxed">
                    <span className="text-accent font-black">[{i+1}]</span>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <footer className="mt-12 p-8 border-4 border-red-500 bg-red-500/5">
          <p className="text-red-500 font-black text-sm uppercase tracking-tighter mb-4 italic">CRITICAL_NOTICE</p>
          <p className="text-[10px] md:text-xs text-red-500/70 font-bold uppercase leading-loose">
            IN CASE OF TIE_CONDITION: FASTEST SYSTEM COMPLETION TIME DETERMINES RANK. <br />
            ADMINISTRATIVE OVERRIDE IS FINAL. <br />
            UNAUTHORIZED PERSISTENCE IN TERMINAL ACCESS AFTER ELIMINATION IS PROHIBITED.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Instructions;
