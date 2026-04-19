import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const backgroundMusic = '/sounds/bgaudioplayback.mp3';

// Global cache to share data across all component instances
const globalCache = {
  roundData: null,
  lastFetch: 0,
  subscribers: new Set(),
  isSubscribed: false
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Debounce delay for rapid updates
const DEBOUNCE_DELAY = 500;

const Home = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(null);
  const [isComponentActive, setIsComponentActive] = useState(true);
  
  const audioRef = useRef(null);
  const channelRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const componentIdRef = useRef(Symbol('home-component'));

  // Optimized round fetching with caching
  const fetchRoundStatus = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheIsValid = globalCache.roundData && 
                        (now - globalCache.lastFetch) < CACHE_DURATION;

    // Use cache if valid and not forcing refresh
    if (cacheIsValid && !forceRefresh) {
      setCurrentRoundNumber(globalCache.roundData?.roundNumber ?? null);
      return globalCache.roundData;
    }

    try {
      // Only fetch if we're the first component or cache is expired
      if (globalCache.subscribers.size <= 1 || forceRefresh || !cacheIsValid) {
        const response = await fetch(`${API_URL}/api/gateway/rounds?status=live`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        // data should be an array; get the first live round
        const liveRound = Array.isArray(data) ? data[0] : data;

        if (liveRound) {
          globalCache.roundData = liveRound;
          globalCache.lastFetch = now;
          
          // Notify all subscribers about the update
          globalCache.subscribers.forEach(callback => {
            if (typeof callback === 'function') {
              callback(liveRound?.roundNumber ?? null);
            }
          });
        } else {
          globalCache.roundData = null;
          globalCache.lastFetch = now;
        }
      }

      setCurrentRoundNumber(globalCache.roundData?.roundNumber ?? null);
      return globalCache.roundData;
    } catch (error) {
      console.error('Error fetching round status:', error);
      return null;
    }
  }, []);

  // Debounced update handler
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (isComponentActive) {
        fetchRoundStatus(true);
      }
    }, DEBOUNCE_DELAY);
  }, [fetchRoundStatus, isComponentActive]);

  // Initialize audio with error handling
  useEffect(() => {
    const initializeAudio = () => {
      try {
        audioRef.current = new Audio(backgroundMusic);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'metadata'; // Changed from 'auto' to reduce bandwidth

        const handleCanPlay = () => {
          setAudioLoaded(true);
          setAudioError(null);
        };

        const handleError = () => {
          setAudioError('Failed to load audio file');
          setAudioLoaded(false);
        };

        audioRef.current.addEventListener('canplaythrough', handleCanPlay);
        audioRef.current.addEventListener('error', handleError);

        // Only load when user might interact with it
        const loadAudio = () => {
          if (audioRef.current && audioRef.current.readyState < 2) {
            audioRef.current.load();
          }
        };

        // Lazy load audio on user interaction
        const userInteractionEvents = ['click', 'touchstart', 'keydown'];
        const handleUserInteraction = () => {
          loadAudio();
          userInteractionEvents.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
          });
        };

        userInteractionEvents.forEach(event => {
          document.addEventListener(event, handleUserInteraction, { once: true });
        });

        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
            audioRef.current.removeEventListener('error', handleError);
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          userInteractionEvents.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
          });
        };
      } catch (error) {
        setAudioError('Failed to initialize audio');
        console.error('Audio initialization error:', error);
      }
    };

    return initializeAudio();
  }, []);

  // Page visibility handling to pause updates when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsComponentActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Optimized subscription management with polling fallback
  useEffect(() => {
    const componentId = componentIdRef.current;
    
    // Add this component to subscribers
    const updateCallback = (roundNumber) => {
      if (isComponentActive) {
        setCurrentRoundNumber(roundNumber);
      }
    };
    globalCache.subscribers.add(updateCallback);

    // Initial fetch with cache consideration
    fetchRoundStatus();

    // Set up polling to check for round updates
    const pollInterval = setInterval(() => {
      if (isComponentActive && globalCache.subscribers.size > 0) {
        fetchRoundStatus(true); // Force refresh to check for new rounds
      }
    }, DEBOUNCE_DELAY);

    console.log('Round status polling started');

    // Cleanup function
    return () => {
      // Remove this component from subscribers
      globalCache.subscribers.delete(updateCallback);
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear polling interval
      clearInterval(pollInterval);
      
      console.log('Round status polling cleaned up');
    };
  }, [fetchRoundStatus, isComponentActive]);

  // Optimized music toggle
  const toggleMusic = useCallback(async () => {
    if (!audioLoaded || !audioRef.current) {
      setAudioError('Audio not ready');
      return;
    }

    try {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          await playPromise;
          setIsMusicPlaying(true);
          setAudioError(null);
        }
      }
    } catch (error) {
      setAudioError('Playback failed - user interaction required');
      setIsMusicPlaying(false);
      console.warn('Audio play failed:', error);
    }
  }, [audioLoaded, isMusicPlaying]);

  // Navigation handlers with preloading considerations
  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleRoundButtonClick = useCallback(() => {
    if (currentRoundNumber !== null) {
      navigate(`/round${currentRoundNumber}`);
    } else {
      setShowModal(true);
    }
  }, [currentRoundNumber, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6 py-8 flex flex-col items-center justify-start relative overflow-hidden">
      
      {/* Audio Error Display */}
      {audioError && (
        <motion.div 
          className="fixed top-4 left-4 right-4 z-50 bg-red-600/90 text-white p-3 rounded-lg text-sm backdrop-blur-sm"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center">
            <span>{audioError}</span>
            <button onClick={() => setAudioError(null)} aria-label="Dismiss error">×</button>
          </div>
        </motion.div>
      )}

      {/* Sound Toggle Button */}
      <motion.button
        className={`absolute bottom-6 left-6 z-10 p-3 rounded-full transition-all duration-300 ${
          !audioLoaded 
            ? 'bg-gray-600/50 cursor-not-allowed' 
            : 'bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer'
        } backdrop-blur-sm`}
        onClick={toggleMusic}
        disabled={!audioLoaded}
        aria-label={isMusicPlaying ? 'Mute audio' : 'Play audio'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        whileHover={audioLoaded ? { scale: 1.1 } : {}}
        whileTap={audioLoaded ? { scale: 0.9 } : {}}
      >
        {!audioLoaded ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-6 h-6 text-gray-400" />
          </motion.div>
        ) : isMusicPlaying ? (
          <Volume2 className="w-6 h-6 text-yellow-400" />
        ) : (
          <VolumeX className="w-6 h-6 text-gray-400" />
        )}
      </motion.button>

      {/* Background elements - Reduced for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/3"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              opacity: 0.05
            }}
            animate={{
              x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)],
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
              transition: {
                duration: Math.random() * 40 + 30,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear'
              }
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div className="mt-20 mb-12 text-center z-10">
        <motion.h1 
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          TECH HUNT
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Get ready to explore, decode, and conquer!
        </motion.p>
      </motion.div>

      {/* Nav Links */}
      <motion.div 
        className="flex gap-8 text-lg font-medium mb-12 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {[
          { name: 'Instructions', path: '/instructions' },
          { name: 'About', path: '/about' },
          { name: 'Credits', path: '/credits' }
        ].map((item) => (
          <motion.div
            key={item.name}
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <span 
              className="text-gray-300 group-hover:text-yellow-400 transition-colors"
              onClick={() => handleNavigation(item.path)}
            >
              {item.name}
            </span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
          </motion.div>
        ))}
      </motion.div>

      {/* Dynamic Round Button */}
      <motion.div 
        className="mt-8 z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <motion.button
          onClick={handleRoundButtonClick}
          className="relative overflow-hidden group bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {currentRoundNumber !== null ? (
              currentRoundNumber === 0
                ? "Quiz Round"
                : currentRoundNumber === 3
                ? "Final Round"
                : `Round ${currentRoundNumber}`
            ) : (
              "Round Starting Soon"
            )}
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </motion.button>
      </motion.div>

      {/* Game Engine Link */}
      <motion.div
        className="absolute bottom-6 right-6 text-sm md:text-base text-purple-300 hover:text-purple-100 transition cursor-pointer font-mono flex items-center gap-1 z-10"
        onClick={() => handleNavigation('/gameengine')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span>Game Engine</span>
        <ChevronRight className="w-4 h-4" />
      </motion.div>

      {/* Modal */}
      {showModal && (
        <motion.div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-md mx-4 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Loader2 className="text-yellow-400 w-12 h-12" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Get Ready!
            </h2>
            <p className="text-gray-300 mb-6 text-lg">
              The round will begin shortly. Stay tuned!
            </p>
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <motion.button
                onClick={() => {
                  setShowModal(false);
                  handleNavigation('/instructions');
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Read Instructions
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;