import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllRounds } from '../utils/adminApi';

// Global admin session management
const adminSession = {
  isAuthenticated: false,
  sessionStart: null,
  lastActivity: null,
  subscribers: new Set(),
  sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  activityTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
};

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  // Subscribe to global session changes
  const updateAuthState = useCallback((authState) => {
    setIsAuthenticated(authState.isAuthenticated);
    setSessionTimeLeft(authState.timeLeft || 0);
  }, []);

  // Session management functions
  const login = useCallback(async (adminId, password) => {
    // Validate credentials
    if (adminId === 'admin123' && password === 'Jayy@admin.123') {
      try {
        // Store credentials for API access
        localStorage.setItem('adminCredentials', JSON.stringify({ adminId, password }));
        
        // Validate credentials with backend
        await getAllRounds();
        
        const now = Date.now();
        adminSession.isAuthenticated = true;
        adminSession.sessionStart = now;
        adminSession.lastActivity = now;
        localStorage.setItem('isAdmin', 'true');
        
        // Notify all subscribers
        adminSession.subscribers.forEach(callback => {
          callback({
            isAuthenticated: true,
            timeLeft: adminSession.sessionTimeout
          });
        });
        
        return { success: true };
      } catch (error) {
        localStorage.removeItem('adminCredentials');
        return { success: false, error: 'Backend authentication failed: ' + error.message };
      }
    }
    return { success: false, error: 'Invalid ID or password' };
  }, []);

  const logout = useCallback(() => {
    adminSession.isAuthenticated = false;
    adminSession.sessionStart = null;
    adminSession.lastActivity = null;
    localStorage.removeItem('adminCredentials');
    localStorage.removeItem('isAdmin');
    
    // Notify all subscribers
    adminSession.subscribers.forEach(callback => {
      callback({
        isAuthenticated: false,
        timeLeft: 0
      });
    });
  }, []);

  const updateActivity = useCallback(() => {
    if (adminSession.isAuthenticated) {
      adminSession.lastActivity = Date.now();
    }
  }, []);

  const extendSession = useCallback(() => {
    if (adminSession.isAuthenticated) {
      adminSession.sessionStart = Date.now();
      adminSession.lastActivity = Date.now();
      
      adminSession.subscribers.forEach(callback => {
        callback({
          isAuthenticated: true,
          timeLeft: adminSession.sessionTimeout
        });
      });
    }
  }, []);

  // Session monitoring
  useEffect(() => {
    // Add this component as subscriber
    adminSession.subscribers.add(updateAuthState);
    
    // Initial state
    setIsAuthenticated(adminSession.isAuthenticated);
    setIsLoading(false);

    // Session monitoring interval
    const sessionMonitor = setInterval(() => {
      if (adminSession.isAuthenticated) {
        const now = Date.now();
        const sessionElapsed = now - adminSession.sessionStart;
        const activityElapsed = now - adminSession.lastActivity;
        
        // Check for session timeout or inactivity
        if (sessionElapsed > adminSession.sessionTimeout || 
            activityElapsed > adminSession.activityTimeout) {
          logout();
        } else {
          // Update time left
          const timeLeft = adminSession.sessionTimeout - sessionElapsed;
          adminSession.subscribers.forEach(callback => {
            callback({
              isAuthenticated: true,
              timeLeft
            });
          });
        }
      }
    }, 60000); // Check every minute

    // Activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      adminSession.subscribers.delete(updateAuthState);
      clearInterval(sessionMonitor);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateAuthState, logout, updateActivity]);

  const value = {
    isAuthenticated,
    isLoading,
    sessionTimeLeft,
    login,
    logout,
    extendSession,
    updateActivity
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};