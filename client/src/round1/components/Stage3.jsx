import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '@googlemaps/js-api-loader';
import { completeRound } from '../../utils/quizApi';

const Stage3 = ({ onComplete }) => {
  // Sequential Questions (Q1-Q5)
  const sequentialQuestions = [
    // Q1 - Image Combination
    {
      id: 1,
      type: 'image-combo',
      images: [
        'https://i.imgur.com/8zJqP9j.png', // Bee emoji
        'https://i.imgur.com/XWpzp7k.png', // Honey pot
        'https://i.imgur.com/JvQ6Q7a.png'  // Book
      ],
      answer: ['beehive story', 'story about beehive'],
      prompt: "Combine the concepts from these images"
    },
    // Q2 - Street View
    {
      id: 2,
      type: 'street-view',
      image: 'https://i.imgur.com/5RtQbBx.jpg', // Paris street view
      answer: ['france', 'paris'],
      prompt: "Guess the country from this Street View"
    },
    // Q3 - Zoomed Image
    {
      id: 3,
      type: 'zoomed-image',
      image: 'https://i.imgur.com/3JyX7Zl.jpg', // Eiffel Tower close-up
      answer: ['eiffel tower', 'tower'],
      prompt: "Identify this famous structure"
    },
    // Q4 - Hidden Text
    {
      id: 4,
      type: 'hidden-text',
      image: 'https://i.imgur.com/9QZqJ9t.png', // Text in tree bark
      answer: ['evergreen', 'forest'],
      prompt: "Find the hidden word in this image"
    },
    // Q5 - Dynamic Street View
    {
      id: 5,
      type: 'dynamic-street-view',
      answer: ['france', 'paris', 'spain', 'barcelona', 'italy', 'rome', 'japan', 'tokyo'],
      prompt: "Guess the country or city from this Street View",
      locations: [
        { lat: 48.8584, lng: 2.2945, heading: 165 }, // Paris
        { lat: 41.3851, lng: 2.1734, heading: 90 },   // Barcelona
        { lat: 41.9028, lng: 12.4964, heading: 135 }, // Rome
        { lat: 35.6762, lng: 139.6503, heading: 45 }  // Tokyo
      ]
    }
  ];

  // Simultaneous Questions (Q6-Q10) - Monaco Grand Prix style
  const simultaneousQuestions = {
    id: "monaco-2024",
    title: "Monaco Grand Prix Challenge",
    imageUrl: "https://a.espncdn.com/combiner/i?img=%2Fphoto%2F2025%2F0521%2Fr1496092_1296x729_16%2D9.jpg&w=920&h=518&scale=crop&cquality=80&location=origin&format=jpg",
    imageAttribution: "Source: https://www.espn.in",
    questions: [
      { 
        id: "q6", 
        prompt: "Which Grand Prix is this?", 
        answer: "monaco" 
      },
      { 
        id: "q7", 
        prompt: "Which team is the red car from?", 
        answer: "ferrari" 
      },
      { 
        id: "q8", 
        prompt: "Which brand is on the banner?", 
        answer: "tagheuer" 
      },
      { 
        id: "q9", 
        prompt: "Which city/state hosts this race?", 
        answer: "monaco" 
      },
      { 
        id: "q10", 
        prompt: "Name of the harbor the track goes by?", 
        answer: "port hercules" 
      }
    ]
  };

  // State management
  const [currentSeqIndex, setCurrentSeqIndex] = useState(0);
  const [seqAnswer, setSeqAnswer] = useState('');
  const [isSeqCorrect, setIsSeqCorrect] = useState(false);
  const [simultaneousAnswers, setSimultaneousAnswers] = useState(
    Object.fromEntries(simultaneousQuestions.questions.map(q => [q.id, '']))
  );
  const [simultaneousCorrect, setSimultaneousCorrect] = useState(
    Object.fromEntries(simultaneousQuestions.questions.map(q => [q.id, false]))
  );
  const [cooldown, setCooldown] = useState(0);
  const [showGoogleOverlay, setShowGoogleOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const cooldownRef = useRef(null);

  // Street View Refs and State
  const streetViewRef = useRef(null);
  const [streetView, setStreetView] = useState(null);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [isStreetViewLoaded, setIsStreetViewLoaded] = useState(false);

  // Initialize Q6-Q10
  useEffect(() => {
    if (currentSeqIndex >= sequentialQuestions.length) {
      startCooldown();
    }
  }, [currentSeqIndex]);

  // Validation for sequential questions (Q1-Q5)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSeqIndex < sequentialQuestions.length) {
        const currentQ = sequentialQuestions[currentSeqIndex];
        const normalized = seqAnswer.trim().toLowerCase();
        const isMatch = currentQ.answer.some(ans => 
          normalized.includes(ans.toLowerCase())
        );

        if (isMatch && !isSeqCorrect) {
          setIsSeqCorrect(true);
          setTimeout(() => {
            setCurrentSeqIndex(prev => 
              prev < sequentialQuestions.length - 1 ? prev + 1 : sequentialQuestions.length
            );
            setSeqAnswer('');
            setIsSeqCorrect(false);
          }, 300);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentSeqIndex, seqAnswer, isSeqCorrect]);

  // Validation for simultaneous questions (Q6-Q10)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSeqIndex >= sequentialQuestions.length) {
        const newCorrect = {...simultaneousCorrect};
        let allCorrect = true;

        simultaneousQuestions.questions.forEach(q => {
          const normalized = simultaneousAnswers[q.id].trim().toLowerCase();
          newCorrect[q.id] = normalized.includes(q.answer.toLowerCase());
          if (!newCorrect[q.id]) allCorrect = false;
        });

        setSimultaneousCorrect(newCorrect);
        
        if (allCorrect && !isSubmitting) {
          // Call completeRound API when all stage 3 questions are correct
          const submitStage3Completion = async () => {
            try {
              setIsSubmitting(true);
              setError(null);
              
              const teamId = sessionStorage.getItem('authInfo') 
                ? JSON.parse(sessionStorage.getItem('authInfo')).teamId 
                : null;
              
              if (!teamId) {
                throw new Error('Team ID not found');
              }
              
              // Call completeRound to mark round 1 completion
              await completeRound(1, teamId, {
                totalTime: 0, // Time will be tracked by parent component
                completionType: 'manual_submit'
              });
              
              console.log('[Stage3] Round 1 completion submitted');
              setTimeout(onComplete, 300);
            } catch (err) {
              console.error('[Stage3] Error completing round:', err);
              setError(err.message);
              setIsSubmitting(false);
            }
          };
          
          submitStage3Completion();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [simultaneousAnswers, currentSeqIndex, isSubmitting]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => setCooldown(prev => prev - 1000), 1000);
    }
    return () => clearTimeout(cooldownRef.current);
  }, [cooldown]);

  // Initialize Google Maps for Q5
  useEffect(() => {
    if (currentSeqIndex === 4) { // Only for Q5
      const loader = new Loader({
        apiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with your actual API key
        version: "weekly",
        libraries: ["streetView"]
      });

      let streetViewInstance;
      
      const initializeStreetView = async () => {
        try {
          await loader.load();
          const currentLocation = sequentialQuestions[4].locations[currentLocationIndex];
          
          streetViewInstance = new google.maps.StreetViewPanorama(
            streetViewRef.current,
            {
              position: { lat: currentLocation.lat, lng: currentLocation.lng },
              pov: { 
                heading: currentLocation.heading, 
                pitch: 0 
              },
              zoom: 1,
              disableDefaultUI: true,
              showRoadLabels: false,
              linksControl: false,
              panControl: false,
              enableCloseButton: false,
              addressControl: false
            }
          );
          
          setStreetView(streetViewInstance);
          
          google.maps.event.addListener(streetViewInstance, 'status_changed', () => {
            setIsStreetViewLoaded(streetViewInstance.getStatus() === 'OK');
          });
        } catch (error) {
          console.error("Error loading Google Maps:", error);
          // Fallback to static image if Street View fails
          setIsStreetViewLoaded(false);
        }
      };

      initializeStreetView();

      return () => {
        if (streetViewInstance) {
          google.maps.event.clearInstanceListeners(streetViewInstance);
        }
      };
    }
  }, [currentSeqIndex, currentLocationIndex]);

  // Rotate locations every 30 seconds if not answered
  useEffect(() => {
    let timer;
    if (currentSeqIndex === 4 && !isSeqCorrect) {
      timer = setInterval(() => {
        setCurrentLocationIndex(prev =>
          (prev + 1) % sequentialQuestions[4].locations.length
        );
      }, 30000);
    }
    return () => clearInterval(timer);
  }, [currentSeqIndex, isSeqCorrect]);

  const handleSimultaneousChange = (qId, value) => {
    setSimultaneousAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const refreshUnanswered = () => {
    const newAnswers = { ...simultaneousAnswers };
    simultaneousQuestions.questions.forEach(q => {
      if (!simultaneousCorrect[q.id]) {
        newAnswers[q.id] = '';
      }
    });
    setSimultaneousAnswers(newAnswers);
    startCooldown();
  };

  const startCooldown = () => {
    setCooldown(120000); // 2 minutes
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
  };

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render current question based on type
  const renderQuestion = (q) => {
    switch(q.type) {
      case 'image-combo':
        return (
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {q.images.map((img, i) => (
              <motion.img 
                key={i}
                src={img}
                alt={`Clue ${i+1}`}
                className="max-h-40 object-contain"
                whileHover={{ scale: 1.05 }}
              />
            ))}
          </div>
        );
      case 'street-view':
      case 'zoomed-image':
      case 'hidden-text':
        return (
          <div className="mb-6 flex justify-center">
            <img 
              src={q.image} 
              alt={q.prompt}
              className="max-h-96 rounded-lg border border-gray-600"
            />
          </div>
        );
      case 'dynamic-street-view':
        return (
          <div className="mb-6 relative">
            <div
              ref={streetViewRef}
              className="w-full h-96 rounded-lg border border-gray-600 overflow-hidden"
            />
            {!isStreetViewLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                <p className="text-white">Loading Street View...</p>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-400 text-center">
              The view will change every 30 seconds if not answered
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Sequential Questions (Q1-Q5) */}
      {currentSeqIndex < sequentialQuestions.length ? (
        <motion.div
          key={`seq-${currentSeqIndex}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-2">
            Question {currentSeqIndex + 1} of 5
          </h2>
          <p className="text-gray-400 mb-4">{sequentialQuestions[currentSeqIndex].prompt}</p>
          
          {renderQuestion(sequentialQuestions[currentSeqIndex])}

          <div className="relative">
            <input
              type="text"
              value={seqAnswer}
              onChange={(e) => setSeqAnswer(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 text-white"
              autoFocus
              disabled={isSeqCorrect}
            />
            {isSeqCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-2xl"
              >
                ✓
              </motion.span>
            )}
          </div>

          {isSeqCorrect && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-green-400 text-center"
              aria-live="polite"
            >
              Correct! Next question loading...
            </motion.p>
          )}
        </motion.div>
      ) : (
        /* Simultaneous Questions (Q6-Q10) - Monaco GP Style */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
        >
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-white">
              {simultaneousQuestions.title}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowGoogleOverlay(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2"
              >
                <span></span> Open Google (overlay)
              </button>
              <button
                onClick={refreshUnanswered}
                disabled={cooldown > 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  cooldown > 0 ? 'bg-gray-700 text-gray-400' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <span></span>
                {cooldown > 0 ? `Refresh in ${formatTime(cooldown)}` : 'Refresh Unanswered'}
              </button>
            </div>
          </div>

          {/* COLUMN LAYOUT: Image on top, questions below */}
          <div className="flex flex-col items-center gap-6">
            {/* Image on top */}
            <div className="w-full max-w-2xl mb-2">
              <div className="border rounded overflow-hidden">
                <div className="relative">
                  <img
                    src={simultaneousQuestions.imageUrl}
                    alt={simultaneousQuestions.title}
                    className="w-full h-auto object-contain"
                    draggable="false"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <a
                      href={simultaneousQuestions.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white/90 px-2 py-1 rounded shadow text-sm hover:bg-white"
                      title="Open large image"
                    >
                      Open
                    </a>
                  </div>
                </div>
                {simultaneousQuestions.imageAttribution && (
                  <div className="text-xs text-gray-500 p-2">
                    {simultaneousQuestions.imageAttribution}
                  </div>
                )}
              </div>
            </div>

            {/* Questions below */}
            <div className="w-full max-w-2xl flex flex-col gap-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}
              
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-blue-900/30 border border-blue-600 rounded-lg text-blue-300 text-sm flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚙️
                  </motion.div>
                  Submitting your completion...
                </motion.div>
              )}
              
              {simultaneousQuestions.questions.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  className={`p-4 rounded-lg border ${
                    simultaneousCorrect[q.id]
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 bg-gray-700/50'
                  }`}
                >
                  <div className="text-sm font-medium mb-2">
                    Q{q.id.replace('q','')}. {q.prompt}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={simultaneousAnswers[q.id]}
                      onChange={(e) => handleSimultaneousChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 focus:ring-1 focus:ring-blue-500 text-white"
                      disabled={simultaneousCorrect[q.id]}
                    />
                    {simultaneousCorrect[q.id] && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-xl">
                        ✓
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Google Search Overlay */}
      <AnimatePresence>
        {showGoogleOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-gray-800 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col border border-gray-600 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-blue-400"></span> Google Search Helper
                </h3>
                <button
                  onClick={() => setShowGoogleOverlay(false)}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1">
                <iframe
                  src="https://www.google.com"
                  className="w-full h-full border-0"
                  title="Google Search"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stage3;