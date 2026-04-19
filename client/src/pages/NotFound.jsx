import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, WifiOff, Terminal } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono grid-bg relative overflow-hidden">
      <div className="scanline" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 flex flex-col items-center text-center p-8"
      >
        <div className="bg-red-500 text-black px-4 py-2 font-black text-xl mb-8 flex items-center gap-3">
          <WifiOff size={24} />
          <span>ERROR_CODE: 404</span>
        </div>

        <h1 className="text-[12rem] md:text-[20rem] font-black tracking-tighter leading-none italic select-none">
          404
        </h1>

        <div className="mt-8 space-y-4">
          <p className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
            COORDINATES_NOT_FOUND
          </p>
          <p className="text-white/40 text-sm max-w-md mx-auto uppercase font-bold tracking-widest">
            YOU HAVE VENTURED BEYOND THE KNOWN UNIVERSE. THE SYSTEM CANNOT LOCATE THE REQUESTED NODE.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-12 border-4 border-white px-12 py-6 text-2xl font-black uppercase tracking-tighter hover:bg-white hover:text-black transition-all duration-150 flex items-center gap-4 group"
        >
          <ArrowLeft className="group-hover:-translate-x-2 transition-transform" />
          <span>REBOOT_TO_HOME</span>
        </button>
      </motion.div>

      {/* Decorative */}
      <div className="absolute bottom-[-5%] left-[-5%] opacity-5">
        <Terminal size={400} strokeWidth={1} />
      </div>
      
      <div className="absolute top-10 left-10 text-[10px] text-white/20 font-black flex flex-col gap-1">
        <span>LAT: 0.0000</span>
        <span>LONG: 0.0000</span>
        <span>ALT: NULL</span>
      </div>
    </div>
  );
};

export default NotFound;