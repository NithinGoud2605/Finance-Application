import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { reloadUserContext } from '../services/api';

// Module-level initialization tracking
const isInitialFetchStarted = { value: false };
const isInitialFetchCompleted = { value: false };

export const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage, but this will be immediately refreshed
    const cachedUser = localStorage.getItem('cachedUser');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Use a ref to track if we're already fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const minFetchIntervalMs = 30000; // Minimum 30 seconds between refreshes
  const backgroundFetchIntervalMs = 300000; // Background refresh every 5 minutes

  // Background refresh function that doesn't show loading states
  const backgroundRefreshUser = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || 
        now - lastFetchTimeRef.current < minFetchIntervalMs) {
      return user;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      const userData = await reloadUserContext(true); // Silent background refresh
      
      if (userData) {
        localStorage.setItem('cachedUser', JSON.stringify(userData));
        localStorage.setItem('lastUserDataRefresh', now.toString());
        
        setUser(userData);
        setLastRefresh(now);
        return userData;
      }
      return null;
    } catch (err) {
      // Silently handle background refresh errors
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  // Initial refresh function that shows loading states (only for first load)
  const initialRefreshUser = useCallback(async () => {
    if (isFetchingRef.current) {
      return user;
    }
    
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      const userData = await reloadUserContext(false); // Verbose initial refresh
      
      if (userData) {
        localStorage.setItem('cachedUser', JSON.stringify(userData));
        localStorage.setItem('lastUserDataRefresh', Date.now().toString());
        
        setUser(userData);
        setLastRefresh(Date.now());
        isInitialFetchCompleted.value = true;
        return userData;
      }
      return null;
    } catch (err) {
      console.error('Error during initial user fetch:', err);
      setError(err.message || 'Failed to load user data');
      return null;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Public refresh function for manual refreshes (e.g., after important actions)
  const refreshUser = useCallback(async (showLoading = false) => {
    if (showLoading) {
      return initialRefreshUser();
    } else {
      return backgroundRefreshUser();
    }
  }, [initialRefreshUser, backgroundRefreshUser]);

  // Initialize user data on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (!isInitialFetchStarted.value) {
        isInitialFetchStarted.value = true;
        initialRefreshUser();
      } else if (isInitialFetchCompleted.value) {
        const cachedUser = localStorage.getItem('cachedUser');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          setLoading(false);
        }
      } else {
        const checkInterval = setInterval(() => {
          if (isInitialFetchCompleted.value) {
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
              setUser(JSON.parse(cachedUser));
              setLoading(false);
            }
            clearInterval(checkInterval);
          }
        }, 100);
        
        return () => clearInterval(checkInterval);
      }
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []); 

  // Background refresh on window focus (with aggressive debouncing)
  useEffect(() => {
    let focusTimeout;
    let lastFocusTime = 0;
    
    const handleFocus = () => {
      const now = Date.now();
      
      // Only refresh if more than 5 minutes since last focus refresh
      if (now - lastFocusTime < 300000) {
        return;
      }
      
      if (focusTimeout) clearTimeout(focusTimeout);
      
      focusTimeout = setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token && user) {
          lastFocusTime = now;
          backgroundRefreshUser();
        }
      }, 2000); // 2 second delay after focus
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [user, backgroundRefreshUser]);

  // Periodic background refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const interval = setInterval(() => {
      backgroundRefreshUser();
    }, backgroundFetchIntervalMs);

    return () => clearInterval(interval);
  }, [user, backgroundRefreshUser]);
  
  // Listen for storage events from other tabs (with debouncing)
  useEffect(() => {
    let storageTimeout;
    
    const handleStorageChange = (e) => {
      if (storageTimeout) clearTimeout(storageTimeout);
      
      storageTimeout = setTimeout(() => {
        if (e.key === 'cachedUser' && e.newValue) {
          try {
            const updatedUser = JSON.parse(e.newValue);
            if (JSON.stringify(user) !== e.newValue) {
              setUser(updatedUser);
              setLastRefresh(Date.now());
            }
          } catch (err) {
            console.error('Error parsing user data from storage event:', err);
          }
        }
        
        if (e.key === 'token' && !e.newValue) {
          setUser(null);
        }
      }, 500); // Increased debounce time
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (storageTimeout) clearTimeout(storageTimeout);
    };
  }, [user]);

  // Enhanced logout function with better cleanup and error handling
  const logout = useCallback(async (showMessage = true) => {
    try {
      console.log('🔄 Starting logout process...');
      
      // Call backend logout endpoint to ensure server-side cleanup
      try {
        await apiLogout(); // Call API logout function
        console.log('✅ Server-side logout successful');
      } catch (apiError) {
        console.warn('⚠️ Server-side logout failed, continuing with client cleanup:', apiError.message);
        // Continue with client-side cleanup even if server logout fails
      }
      
      // Clear all authentication-related data from localStorage
      const authKeys = [
        'token',
        'accessToken', 
        'refreshToken',
        'cachedUser',
        'lastUserDataRefresh',
        'isAuthenticated',
        'accountType',
        'isSubscribed',
        'subscriptionFeatures',
        'selectedPlan'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared ${key} from localStorage`);
      });
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Clear any pending invitations or temporary data
      localStorage.removeItem('pendingInvite');
      
      // Reset user state
      setUser(null);
      setError(null);
      setLastRefresh(Date.now());
      
      // Clear any cached API headers
      if (typeof window !== 'undefined' && window.apiClient) {
        delete window.apiClient.defaults.headers.common['Authorization'];
        delete window.apiClient.defaults.headers.common['x-access-token'];
      }
      
      console.log('✅ Logout process completed successfully');
      
      // Show success message if requested
      if (showMessage && typeof window !== 'undefined') {
        // You could show a toast notification here if you have a toast system
        console.log('👋 User logged out successfully');
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error during logout process:', error);
      
      // Even if there's an error, we should still clear local state
    setUser(null);
      setError(null);
    setLastRefresh(Date.now());
      
      // Try to clear localStorage anyway
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }
      
      return { 
        success: false, 
        error: error.message || 'Logout failed but local data was cleared' 
      };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    lastRefresh,
    refreshUser,
    logout
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
