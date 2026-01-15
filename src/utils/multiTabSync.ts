// utils/multiTabSync.ts
// Multi-tab synchronization using localStorage events
// Syncs auth state and app state across browser tabs

import { store } from '../store';
import { logout, updateTokens } from '../store/slices/authSlice';
import { syncStateWithRoute } from '../store/slices/appSlice';

/**
 * Sets up multi-tab synchronization
 * Listens for localStorage changes from other tabs and syncs Redux state
 * @returns Cleanup function to remove event listeners
 */
export const setupMultiTabSync = (): (() => void) => {
  // Handle storage events from other tabs
  const handleStorageChange = (e: StorageEvent) => {
    // Ignore events from the same tab
    if (!e.key || !e.newValue) return;

    try {
      // Handle auth token updates
      if (e.key === 'accessToken' || e.key === 'refreshToken') {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          store.dispatch(updateTokens({
            accessToken,
            refreshToken,
          }));
        }
      }

      // Handle logout (when localStorage is cleared)
      if (e.key === 'accessToken' && !e.newValue && e.oldValue) {
        // Access token was removed, likely a logout
        const currentToken = localStorage.getItem('accessToken');
        if (!currentToken) {
          store.dispatch(logout());
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }

      // Handle app state changes
      if (e.key === 'app_state') {
        try {
          const appState = JSON.parse(e.newValue);
          // Sync route if it changed
          if (appState.lastRoute && appState.lastRoute !== window.location.pathname) {
            // Don't navigate automatically, just sync the state
            // The route will be restored on next navigation
          }
        } catch (error) {
          console.error('Failed to parse app_state from storage event:', error);
        }
      }

      // Handle lastActivity updates
      if (e.key === 'lastActivity') {
        // Activity was updated in another tab, no action needed
        // The idle timer will check this value
      }
    } catch (error) {
      console.error('Error handling storage event:', error);
    }
  };

  // Listen for storage events
  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

