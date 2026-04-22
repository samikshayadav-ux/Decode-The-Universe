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
import Register from './auth/Register';
import UserAuth from './auth/UserAuth';

// Admin
import AdminAuth from './admin/AdminAuth';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Round Components
import Round1Gateway from './round1/pages/Round1gateway';
import TreasureHuntRound1 from './round1/pages/TreasureHuntRound1';
import Round1Live from './round1/components/round1live';

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
          <Route path="/register" element={<Register />} />
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

          {/* Round 1 (Quiz Round) */}
          <Route path="/round1" element={<Round1Gateway />} />
          <Route path="/round1/login" element={<Login />} />
          <Route path="/round1/register" element={<Register />} />
          <Route path="/round1/live" element={<Round1Live />} /> {/* Now uses Round1Live for Round 1 leaderboard */}
          <Route
            path="/round1/game"
            element={
              <PrivateRoute round="round1">
                <TreasureHuntRound1 />
              </PrivateRoute>
            }
          />

          {/* Round 2 (Stages/Treasure Hunt) */}
          <Route path="/round2" element={<Round2Gateway />} />
          <Route path="/round2/login" element={<Login />} />
          <Route path="/round2/register" element={<Register />} />
          <Route path="/round2/live" element={<Round1Live />} /> {/* Old round1live is now Round 2 leaderboard */}
          <Route
            path="/round2/game"
            element={
              <PrivateRoute round="round2">
                <TreasureHuntRound2 />
              </PrivateRoute>
            }
          />

          {/* Round 3 */}
          <Route path="/round3" element={<Round3Gateway />} />
          <Route path="/round3/login" element={<Login />} />
          <Route path="/round3/register" element={<Register />} />
          <Route
            path="/round3/game"
            element={
              <PrivateRoute round="round3">
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