import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const locations = [
  { id: 1, lat: 48.8584, lng: 2.2945, answers: ["france", "paris"] },
  { id: 2, lat: 40.7580, lng: -73.9855, answers: ["usa", "united states", "america", "new york", "us"] },
  { id: 3, lat: 35.6895, lng: 139.6917, answers: ["japan", "tokyo"] },
  { id: 4, lat: -33.8568, lng: 151.2153, answers: ["australia", "sydney"] },
  { id: 5, lat: 51.5007, lng: -0.1246, answers: ["uk", "united kingdom", "britain", "london", "england"] },
  { id: 6, lat: 41.9028, lng: 12.4964, answers: ["italy", "rome"] },
  { id: 7, lat: 52.5200, lng: 13.4050, answers: ["germany", "berlin"] },
  { id: 8, lat: 40.4168, lng: -3.7038, answers: ["spain", "madrid"] },
  { id: 9, lat: 55.7558, lng: 37.6173, answers: ["russia", "moscow"] },
  { id: 10, lat: 30.0444, lng: 31.2357, answers: ["egypt", "cairo"] },
  { id: 11, lat: 39.9042, lng: 116.4074, answers: ["china", "beijing"] },
  { id: 12, lat: 28.6139, lng: 77.2090, answers: ["india", "delhi", "new delhi"] },
  { id: 13, lat: -23.5505, lng: -46.6333, answers: ["brazil", "sao paulo"] },
  { id: 14, lat: 34.0522, lng: -118.2437, answers: ["usa", "los angeles", "la"] },
  { id: 15, lat: 59.3293, lng: 18.0686, answers: ["sweden", "stockholm"] },
  { id: 16, lat: 43.6532, lng: -79.3832, answers: ["canada", "toronto"] },
  { id: 17, lat: -37.8136, lng: 144.9631, answers: ["australia", "melbourne"] },
  { id: 18, lat: 37.9838, lng: 23.7275, answers: ["greece", "athens"] },
  { id: 19, lat: 31.2304, lng: 121.4737, answers: ["china", "shanghai"] },
  { id: 20, lat: 25.2048, lng: 55.2708, answers: ["uae", "dubai", "united arab emirates"] },
  { id: 21, lat: 1.3521, lng: 103.8198, answers: ["singapore"] },
  { id: 22, lat: 37.5665, lng: 126.9780, answers: ["south korea", "seoul"] },
  { id: 23, lat: 13.7563, lng: 100.5018, answers: ["thailand", "bangkok"] },
  { id: 24, lat: -34.6037, lng: -58.3816, answers: ["argentina", "buenos aires"] },
  { id: 25, lat: 19.4326, lng: -99.1332, answers: ["mexico", "mexico city"] },
  { id: 26, lat: 52.3676, lng: 4.9041, answers: ["netherlands", "amsterdam"] },
  { id: 27, lat: 47.3769, lng: 8.5417, answers: ["switzerland", "zurich"] },
  { id: 28, lat: 50.8503, lng: 4.3517, answers: ["belgium", "brussels"] },
  { id: 29, lat: 53.3498, lng: -6.2603, answers: ["ireland", "dublin"] },
  { id: 30, lat: 59.9139, lng: 10.7522, answers: ["norway", "oslo"] },
  { id: 31, lat: 55.6761, lng: 12.5683, answers: ["denmark", "copenhagen"] },
  { id: 32, lat: 38.7223, lng: -9.1393, answers: ["portugal", "lisbon"] },
  { id: 33, lat: 41.0082, lng: 28.9784, answers: ["turkey", "istanbul"] },
  { id: 34, lat: 35.6762, lng: 51.4145, answers: ["iran", "tehran"] },
  { id: 35, lat: 33.3152, lng: 44.3661, answers: ["iraq", "baghdad"] },
  { id: 36, lat: 32.0853, lng: 34.7818, answers: ["israel", "tel aviv"] },
  { id: 37, lat: 24.7136, lng: 46.6753, answers: ["saudi arabia", "riyadh"] },
  { id: 38, lat: 15.7835, lng: -90.2308, answers: ["guatemala"] },
  { id: 39, lat: 18.4861, lng: -69.9312, answers: ["dominican republic", "santo domingo"] },
  { id: 40, lat: 10.4806, lng: -66.9036, answers: ["venezuela", "caracas"] },
  { id: 41, lat: -12.0464, lng: -77.0428, answers: ["peru", "lima"] },
  { id: 42, lat: -33.4489, lng: -70.6693, answers: ["chile", "santiago"] },
  { id: 43, lat: -15.7975, lng: -47.8919, answers: ["brazil", "brasilia"] },
  { id: 44, lat: 6.2442, lng: -75.5812, answers: ["colombia", "medellin"] },
  { id: 45, lat: 10.9639, lng: -74.7964, answers: ["colombia", "barranquilla"] },
  { id: 46, lat: -26.2041, lng: 28.0473, answers: ["south africa", "johannesburg"] },
  { id: 47, lat: -33.9249, lng: 18.4241, answers: ["south africa", "cape town"] },
  { id: 48, lat: -1.2921, lng: 36.8219, answers: ["kenya", "nairobi"] },
  { id: 49, lat: 33.8869, lng: 9.5375, answers: ["tunisia"] },
  { id: 50, lat: 30.0333, lng: 31.2333, answers: ["egypt", "giza"] }
];

const Game4 = ({ onComplete }) => {
  const [randomLoc, setRandomLoc] = useState(() => locations[Math.floor(Math.random() * locations.length)]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState(null);
  const panoRef = useRef(null);
  const streetViewRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const initStreetView = () => {
    if (!window.google || !panoRef.current) return;

    const service = new window.google.maps.StreetViewService();
    const location = { lat: randomLoc.lat, lng: randomLoc.lng };

    // Snap to the nearest valid street view with navigation links
    service.getPanorama({
      location: location,
      radius: 100, // Search within 100 meters
      source: window.google.maps.StreetViewSource.OUTDOOR // Prefer outdoor street view
    }, (data, status) => {
      if (status === "OK") {
        const panorama = new window.google.maps.StreetViewPanorama(panoRef.current, {
          pano: data.location.pano, // Use the specific snapped panorama ID
          pov: { heading: 34, pitch: 10 },
          addressControl: false,
          showRoadLabels: false,
          zoomControl: true,
          panControl: true,
          enableCloseButton: false,
          linksControl: true,
          clickToGo: true,
          scrollwheel: true,
          visible: true,
          motionTracking: false,
          motionTrackingControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          disableDefaultUI: false
        });
        streetViewRef.current = panorama;
      } else {
        console.error("Street View not found for this location:", status);
        setError("Could not load street view. Refreshing location...");
        // If specific location fails, pick another one
        setTimeout(() => {
          setRandomLoc(locations[Math.floor(Math.random() * locations.length)]);
        }, 2000);
      }
    });
  };

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initStreetView;
      document.head.appendChild(script);
    } else {
      initStreetView();
    }
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps) {
      initStreetView();
    }
  }, [randomLoc]);

  const handleCheckAnswer = (e) => {
    e.preventDefault();
    const normalizedInput = userAnswer.trim().toLowerCase();
    
    const isAnswerValid = randomLoc.answers.some(ans => normalizedInput === ans.toLowerCase() || normalizedInput.includes(ans.toLowerCase()));

    if (isAnswerValid) {
      setIsCorrect(true);
      setError(null);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      setError("Incorrect! Refreshing to a new location...");
      setUserAnswer('');
      // Refresh to a NEW random location on wrong answer
      setTimeout(() => {
        setRandomLoc(locations[Math.floor(Math.random() * locations.length)]);
        setError(null);
      }, 2000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
      {/* FIX 1: Removed overflow-hidden and scale transform from motion.div */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl rounded-3xl flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mt-1">Which country is this?</h2>
          </div>
        </div>

        {/* FIX 2: Added pointer-events auto on pano div */}
        <div className="relative w-full h-[450px] bg-gray-900 rounded-xl overflow-hidden">
          <div
            ref={panoRef}
            className="w-full h-full"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-black/40">
          <form onSubmit={handleCheckAnswer} className="relative max-w-md mx-auto">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isCorrect || !!error}
              className={`w-full px-6 py-4 bg-white/[0.03] border-b-2 transition-all duration-300 outline-none text-xl font-bold placeholder:text-white/10 text-center ${
                isCorrect
                  ? 'border-emerald-500 text-emerald-400'
                  : error
                  ? 'border-red-500 text-red-400'
                  : 'border-white/10 focus:border-blue-500 text-white'
              }`}
              placeholder="Enter country name..."
              autoFocus
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 text-center text-red-500 text-xs font-bold uppercase tracking-widest"
                >
                  {error}
                </motion.div>
              )}
              {isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center text-emerald-500 text-xs font-bold uppercase tracking-widest"
                >
                  Correct! Moving to next location...
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Game4;