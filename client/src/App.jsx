import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

// Main Pages
import Home from './pages/Home';
import About from './pages/About';
import Instructions from './pages/Instructions';
import LeaderBoard from './pages/LeaderBoard';
import NotFound from './pages/NotFound';
import GameEngine from './pages/GameEngine'; 

// Authentication
import Login from './auth/Login';
import UserAuth from './auth/UserAuth';

// Admin
import AdminAuth from './admin/AdminAuth';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Round Components
import Round0Gateway from './round0/pages/round0gateway';
import Quizround0 from './round0/pages/Quizround0';

import Round2Gateway from './round2/pages/Round2gateway';
import TreasureHuntRound2 from './round2/pages/TreasureHuntRound2';

import Round3Gateway from './round3/pages/Round3gateway';
import TreasureHuntRound3 from './round3/pages/TreasureHuntRound3';

import PrivateRoute from './components/PrivateRoute';

// Test component (temporary)
import Test from './Test';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/live" element={<LeaderBoard />} />
          <Route path="/gameengine" element={<GameEngine />} />
          <Route path="/test" element={<Test />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<UserAuth />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminAuth />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Round 1 (Was Round 0) */}
          <Route path="/round1" element={<Round0Gateway />} />
          <Route
            path="/round1/game"
            element={
              <PrivateRoute roundNumber={1}>
                <Quizround0 />
              </PrivateRoute>
            }
          />

          {/* Round 2 */}
          <Route path="/round2" element={<Round2Gateway />} />
          <Route
            path="/round2/game"
            element={
              <PrivateRoute roundNumber={2}>
                <TreasureHuntRound2 />
              </PrivateRoute>
            }
          />

          {/* Final Round (Was Round 3) */}
          <Route path="/final-round" element={<Round3Gateway />} />
          <Route
            path="/final-round/game"
            element={
              <PrivateRoute roundNumber={3}>
                <TreasureHuntRound3 />
              </PrivateRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;