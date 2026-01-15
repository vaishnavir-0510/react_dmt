import { useEffect, useRef, useState, useCallback } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useAuth } from './useAuth';
import { useDispatch } from 'react-redux';

import { updateTokens } from '../store/slices/authSlice';
import { useRefreshTokenMutation } from '../store/api/authApi';

interface UseIdleTimerHookReturn {
  showIdleDialog: boolean;
  countdown: number;
  handleStayActive: () => void;
  handleLogout: () => void;
  lastActivity: Date | null;
}

export const useIdleTimerHook = (): UseIdleTimerHookReturn => {
  const { accessToken, logout, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const [refreshToken] = useRefreshTokenMutation();
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const refreshIntervalRef = useRef<number | undefined>(undefined);
  const countdownRef = useRef<number | undefined>(undefined);
  const lastLogTimeRef = useRef<number>(0);
  const isOnlineRef = useRef<boolean>(navigator.onLine);
  const isRefreshingRef = useRef<boolean>(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const lastActivitySyncRef = useRef<number>(0);

  const getTokenExpiry = useCallback((token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return Date.now() + 30 * 60 * 1000; // Default 30 minutes if parsing fails
    }
  }, []);

  const formatTimeRemaining = useCallback((expiryTime: number): string => {
    const now = Date.now();
    const remaining = expiryTime - now;
    
    if (remaining <= 0) return 'EXPIRED';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, []);

  const logTokenInfo = useCallback((token: string | null, tokenType: 'Access' | 'Refresh') => {
    if (!token) {
      console.log(`🔑 ${tokenType} Token: NOT AVAILABLE`);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const now = Date.now();
      const remaining = expiryTime - now;
      const expiryDate = new Date(expiryTime);
      const isExpired = remaining <= 0;

      console.group(`🔑 ${tokenType} Token Information`);
      console.log(`📅 Expiry Date: ${expiryDate.toLocaleString()}`);
      console.log(`⏰ Expiry Timestamp: ${expiryTime}`);
      console.log(`⏳ Remaining Time: ${formatTimeRemaining(expiryTime)}`);
      console.log(`✅ Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
      if (payload.iat) {
        const issuedDate = new Date(payload.iat * 1000);
        console.log(`📆 Issued Date: ${issuedDate.toLocaleString()}`);
      }
      console.groupEnd();
    } catch (error) {
      console.error(`❌ Error parsing ${tokenType} token:`, error);
    }
  }, [formatTimeRemaining]);

  const refreshAccessToken = useCallback(async () => {
    // Check if refresh is already in progress (shared state via localStorage)
    const refreshInProgress = localStorage.getItem('tokenRefreshInProgress') === 'true';
    if (refreshInProgress) {
      console.log('⏳ Token refresh already in progress (from another source) - skipping');
      return;
    }

    // Check if we're already refreshing in this hook
    if (isRefreshingRef.current) {
      console.log('⏳ Token refresh already in progress (in useIdleTimer) - skipping');
      return;
    }

    // Check cooldown period (don't refresh if we just refreshed in the last 2 minutes)
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    const twoMinutes = 2 * 60 * 1000;
    
    if (lastRefreshTimeRef.current > 0 && timeSinceLastRefresh < twoMinutes) {
      const secondsRemaining = Math.ceil((twoMinutes - timeSinceLastRefresh) / 1000);
      console.log(`⏸️ Token refresh cooldown active - ${secondsRemaining}s remaining. Skipping refresh.`);
      return;
    }

    const startTime = Date.now();
    console.group('🔄 Token Refresh Process Started (Proactive)');
    console.log(`⏰ Start Time: ${new Date(startTime).toLocaleString()}`);
    
    // Mark refresh as in progress
    isRefreshingRef.current = true;
    localStorage.setItem('tokenRefreshInProgress', 'true');
    
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        console.error('❌ No refresh token available');
        console.groupEnd();
        isRefreshingRef.current = false;
        localStorage.removeItem('tokenRefreshInProgress');
        await logout();
        window.location.href = '/login';
        return;
      }

      // Log refresh token info before refresh
      logTokenInfo(refreshTokenValue, 'Refresh');
      
      console.log('🔄 Calling refresh token API...');
      const result = await refreshToken({ refresh_token: refreshTokenValue }).unwrap();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Update both tokens
      dispatch(updateTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token || refreshTokenValue
      }));
      
      // Update last refresh time
      lastRefreshTimeRef.current = Date.now();
      
      console.log(`✅ Token refreshed successfully in ${duration}ms`);
      console.log(`⏰ End Time: ${new Date(endTime).toLocaleString()}`);
      console.log('⏸️ Cooldown period started (2 minutes) - will not refresh again during this time');
      
      // Log new token info
      console.log('📋 New Tokens:');
      logTokenInfo(result.access_token, 'Access');
      if (result.refresh_token) {
        logTokenInfo(result.refresh_token, 'Refresh');
      }
      
      console.groupEnd();
      
      // Clear refresh in progress flag
      isRefreshingRef.current = false;
      localStorage.removeItem('tokenRefreshInProgress');
    } catch (error: unknown) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Token refresh failed after ${duration}ms:`, error);
      const errorDetails = error as { status?: number; data?: { message?: string }; message?: string };
      console.error('Error Details:', {
        status: errorDetails?.status,
        message: errorDetails?.data?.message || errorDetails?.message,
        data: errorDetails?.data
      });
      
      // Clear refresh in progress flag on error
      isRefreshingRef.current = false;
      localStorage.removeItem('tokenRefreshInProgress');
      
      // Check if it's a 401 or other auth error
      const isAuthError = errorDetails?.status === 401 || 
                         (errorDetails?.data?.message?.toLowerCase().includes('token') ?? false) ||
                         (errorDetails?.data?.message?.toLowerCase().includes('unauthorized') ?? false);
      
      if (isAuthError) {
        console.error('🚪 Invalid or expired refresh token - logging out');
        console.groupEnd();
        // Invalid or expired refresh token - logout and redirect
        await logout();
        window.location.href = '/login';
      } else {
        // Network or other error - log but don't logout (might be temporary)
        console.warn('⚠️ Token refresh failed but not logging out (might be temporary network issue)');
        console.groupEnd();
      }
    }
  }, [refreshToken, dispatch, logout, logTokenInfo]);

  /**
   * Token Refresh Logic - Continuous Cycle
   * 
   * Flow:
   * 1. Access token expires in 30 minutes (from JWT payload)
   * 2. At 25 minutes (5 minutes before expiry), proactively refresh token
   * 3. Refresh token API returns new access_token and refresh_token
   * 4. updateTokens() updates both Redux state AND localStorage with new tokens
   * 5. All API calls automatically use new token from Redux state (via prepareHeaders)
   * 6. Cycle continues: New token is valid for 30 minutes, refreshes again at 25 minutes
   * 
   * This ensures seamless token refresh while user is actively working:
   * - Token refreshed every ~25 minutes automatically
   * - No interruption to user workflow
   * - All API calls use latest valid token
   */
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      console.log('⏸️ Token refresh check paused - not authenticated or no access token');
      return;
    }

    // Log initial token info
    console.group('🔐 Authentication Status');
    logTokenInfo(accessToken, 'Access');
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (refreshTokenValue) {
      logTokenInfo(refreshTokenValue, 'Refresh');
    }
    console.groupEnd();

    const checkAndRefreshToken = () => {
      try {
        // Skip check if refresh is in progress
        if (isRefreshingRef.current || localStorage.getItem('tokenRefreshInProgress') === 'true') {
          console.log('⏸️ Token refresh in progress - skipping check');
          return;
        }

        const tokenExpiry = getTokenExpiry(accessToken);
        const now = Date.now();
        const remaining = tokenExpiry - now;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes = refresh at 25 minutes (30 min - 5 min)

        console.log(`⏱️ Token Check - Remaining: ${formatTimeRemaining(tokenExpiry)}`);

        // If token expires in 5 minutes or less (i.e., at 25 minutes of 30 min token), refresh it
        // This creates a continuous cycle: refresh every ~25 minutes while user is working
        if (remaining <= fiveMinutes) {
          console.log(`🔄 Token expires soon (${formatTimeRemaining(tokenExpiry)} remaining) - Refreshing at 25 min mark...`);
          refreshAccessToken();
        } else {
          const minutesUntilRefresh = Math.floor((remaining - fiveMinutes) / 60000);
          console.log(`✅ Token valid - Will refresh in ~${minutesUntilRefresh} minutes (at 25 min mark)`);
        }
      } catch (error) {
        console.error('❌ Token check failed:', error);
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up interval to check every 60 seconds
    // This ensures we catch the 25-minute mark and refresh proactively
    console.log('⏰ Setting up token refresh check interval (every 60 seconds)');
    refreshIntervalRef.current = window.setInterval(checkAndRefreshToken, 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        console.log('🛑 Clearing token refresh check interval');
        window.clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = undefined;
      }
    };
  }, [accessToken, isAuthenticated, getTokenExpiry, refreshAccessToken, formatTimeRemaining, logTokenInfo]);

  const handleLogout = useCallback(async () => {
    console.group('🚪 Logout Process Started');
    console.log(`⏰ Logout Time: ${new Date().toLocaleString()}`);
    console.log(`🌐 Network Status: ${isOnlineRef.current ? 'ONLINE' : 'OFFLINE'}`);
    console.log('📋 Current Token Status:');
    logTokenInfo(accessToken || null, 'Access');
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (refreshTokenValue) {
      logTokenInfo(refreshTokenValue, 'Refresh');
    }
    
    setShowIdleDialog(false);
    setCountdown(0);
    if (countdownRef.current) {
      console.log('🛑 Clearing countdown interval');
      window.clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
    
    console.log('🧹 Calling logout to clear localStorage...');
    console.log('ℹ️ Logout works offline - clears localStorage and redirects');
    // Call logout which will clear localStorage
    // This works even when offline since it only clears localStorage
    await logout();
    
    console.log('🔄 Redirecting to login page...');
    console.log('ℹ️ Redirect will work even if network is disconnected');
    console.groupEnd();
    
    // Redirect to login page after logout using window.location
    // This works even outside Router context and ensures a full page reload
    // Works offline - browser will cache the login page
    window.location.href = '/login';
  }, [logout, accessToken, logTokenInfo]);

  const handleStayActive = useCallback(() => {
    console.group('👆 Stay Active - User Interaction');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('✅ User chose to stay active - resetting idle timer');
    console.log('📋 Current Token Status:');
    logTokenInfo(accessToken || null, 'Access');
    console.groupEnd();
    
    setShowIdleDialog(false);
    setCountdown(0);
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
    // Trigger activity to reset idle timer
    document.dispatchEvent(new MouseEvent('mousemove'));
  }, [accessToken, logTokenInfo]);

  const onIdle = useCallback(() => {
    console.group('⏱️ IDLE TIMEOUT CALLBACK TRIGGERED');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`🔐 isAuthenticated: ${isAuthenticated}`);
    console.log(`🌐 Network Status: ${isOnlineRef.current ? 'ONLINE' : 'OFFLINE'}`);
    
    if (!isAuthenticated) {
      console.warn('⚠️ onIdle called but user is not authenticated - ignoring');
      console.groupEnd();
      return;
    }

    console.log('⚠️ User has been idle for 14 minutes');
    console.log('📋 Current Token Status:');
    logTokenInfo(accessToken || null, 'Access');
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (refreshTokenValue) {
      logTokenInfo(refreshTokenValue, 'Refresh');
    }
    console.log('⏳ Starting 60-second countdown before auto-logout...');
    console.log('📢 Setting showIdleDialog to TRUE');
    console.log('ℹ️ Note: Countdown and logout will work even if network is disconnected');
    console.groupEnd();

    setShowIdleDialog(true);
    setCountdown(60); // 1 minute countdown

    console.log('✅ Idle dialog state updated - showIdleDialog: true, countdown: 60');

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.group('⏰ Auto-Logout Triggered');
          console.log(`⏰ Time: ${new Date().toLocaleString()}`);
          console.log(`🌐 Network Status: ${isOnlineRef.current ? 'ONLINE' : 'OFFLINE'}`);
          console.log('⚠️ User has been idle for 15 minutes (14 min idle + 1 min countdown)');
          console.log('🚪 Logging out user automatically...');
          console.groupEnd();
          
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = undefined;
          }
          // Logout works offline - it just clears localStorage and redirects
          handleLogout();
          return 0;
        }
        if (prev % 10 === 0 || prev <= 5) {
          // Log every 10 seconds or last 5 seconds
          const networkStatus = isOnlineRef.current ? 'ONLINE' : 'OFFLINE';
          console.log(`⏳ Idle timeout countdown: ${prev} seconds remaining (Network: ${networkStatus})`);
        }
        return prev - 1;
      });
    }, 1000);
  }, [isAuthenticated, handleLogout, accessToken, logTokenInfo]);

  const onActive = useCallback(() => {
    if (showIdleDialog) {
      console.log('👆 User activity detected while idle dialog is open');
      handleStayActive();
    } else {
      // Log activity but don't show in console too frequently
      const now = Date.now();
      if (!lastLogTimeRef.current || now - lastLogTimeRef.current > 60000) {
        // Log every minute
        console.log(`👆 User activity detected - Idle timer reset at ${new Date().toLocaleString()}`);
        lastLogTimeRef.current = now;
      }
    }
  }, [showIdleDialog, handleStayActive]);

  const idleTimer = useIdleTimer({
    onIdle,
    onActive,
    timeout: 14 * 60 * 1000, // 14 minutes (shows dialog at 14, logout at 15)
    throttle: 500,
    events: [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'wheel',
      'click'
    ],
    startOnMount: false, // We'll start it manually when authenticated
    stopOnIdle: false
  });

  // Start/stop idle timer when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.group('🔄 Starting Idle Timer');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log('✅ User is authenticated - Starting idle timer');
      console.log('⏱️ Timeout: 14 minutes (840,000ms)');
      console.log('📋 Events monitored:', [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'wheel',
        'click'
      ]);
      
      // Always reset and start the timer when authenticated
      try {
        // Initialize lastActivitySyncRef with current lastActivity
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          lastActivitySyncRef.current = parseInt(lastActivity);
        }
        
        console.log('🔄 Resetting idle timer...');
        idleTimer.reset();
        
        // Start the timer immediately
        console.log('▶️ Starting idle timer...');
        idleTimer.start();
        
        // Verify timer is running after a brief moment
        setTimeout(() => {
          const remaining = idleTimer.getRemainingTime();
          const elapsed = idleTimer.getElapsedTime();
          const isIdle = idleTimer.isIdle();
          
          console.log(`✅ Timer Status:`, {
            isIdle,
            remaining: `${Math.floor(remaining / 1000)}s (${Math.floor(remaining / 60000)}m)`,
            elapsed: `${Math.floor(elapsed / 1000)}s (${Math.floor(elapsed / 60000)}m)`,
            expectedTimeout: '14 minutes (840 seconds)'
          });
          
          if (remaining <= 0 || remaining > 15 * 60 * 1000) {
            console.warn('⚠️ Timer remaining time seems incorrect:', remaining);
            console.warn('⚠️ Attempting to restart timer...');
            idleTimer.reset();
            idleTimer.start();
          }
        }, 200);
      } catch (error) {
        console.error('❌ Error starting idle timer:', error);
      }
      
      const lastActive = idleTimer.getLastActiveTime();
      if (lastActive) {
        console.log(`📅 Last activity: ${new Date(lastActive).toLocaleString()}`);
        const timeSinceLastActive = Date.now() - lastActive.getTime();
        const minutesSinceActive = Math.floor(timeSinceLastActive / 60000);
        console.log(`⏳ Time since last activity: ${minutesSinceActive} minutes`);
      }
      
      // Log timer state
      console.log(`📊 Timer State:`, {
        isIdle: idleTimer.isIdle(),
        isRunning: !idleTimer.isIdle(),
        getRemainingTime: `${Math.floor(idleTimer.getRemainingTime() / 1000)}s`,
        getElapsedTime: `${Math.floor(idleTimer.getElapsedTime() / 1000)}s`,
        getTotalIdleTime: `${Math.floor(idleTimer.getTotalIdleTime() / 1000)}s`
      });
      
      console.groupEnd();
    } else {
      console.group('⏸️ Pausing Idle Timer');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log('❌ User not authenticated - Pausing idle timer');
      idleTimer.pause();
      console.log('✅ Timer paused');
      console.groupEnd();
    }
  }, [isAuthenticated, idleTimer]);

  // Cross-tab activity detection - listen for activity in other tabs
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Listen for lastActivity changes from other tabs
      if (e.key === 'lastActivity' && e.newValue) {
        const newActivityTime = parseInt(e.newValue);
        const currentActivityTime = lastActivitySyncRef.current;
        
        // Only reset if this is a new activity (from another tab)
        if (newActivityTime > currentActivityTime && !idleTimer.isIdle()) {
          console.log('🔄 Cross-tab activity detected - resetting idle timer');
          lastActivitySyncRef.current = newActivityTime;
          idleTimer.reset();
        }
      }
    };

    // Also listen for custom activityUpdated event (same-tab activity)
    const handleActivityUpdated = (e: CustomEvent) => {
      const newActivityTime = parseInt(e.detail);
      if (newActivityTime > lastActivitySyncRef.current && !idleTimer.isIdle()) {
        lastActivitySyncRef.current = newActivityTime;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('activityUpdated', handleActivityUpdated as EventListener);

    // Initialize lastActivitySyncRef
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      lastActivitySyncRef.current = parseInt(lastActivity);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('activityUpdated', handleActivityUpdated as EventListener);
    };
  }, [isAuthenticated, idleTimer]);

  // Add periodic logging to debug timer state
  useEffect(() => {
    if (!isAuthenticated) return;

    const debugInterval = setInterval(() => {
      const remaining = idleTimer.getRemainingTime();
      const elapsed = idleTimer.getElapsedTime();
      const minutesRemaining = Math.floor(remaining / 60000);
      const secondsRemaining = Math.floor((remaining % 60000) / 1000);
      const minutesElapsed = Math.floor(elapsed / 60000);
      const secondsElapsed = Math.floor((elapsed % 60000) / 1000);
      
      const totalTime = elapsed + remaining;
      
      // Log every 2 minutes or when close to timeout
      if (minutesElapsed % 2 === 0 && minutesElapsed > 0) {
        console.log(`⏱️ Idle Timer Status - Elapsed: ${minutesElapsed}m ${secondsElapsed}s, Remaining: ${minutesRemaining}m ${secondsRemaining}s (Total: ${Math.floor(totalTime / 60000)}m ${Math.floor((totalTime % 60000) / 1000)}s)`);
      }
      
      // Log when approaching timeout (last 2 minutes)
      if (minutesRemaining <= 2 && minutesRemaining > 0) {
        console.log(`⚠️ Approaching idle timeout - ${minutesRemaining}m ${secondsRemaining}s remaining`);
      }
    }, 60000); // Check every minute

    return () => clearInterval(debugInterval);
  }, [isAuthenticated, idleTimer]);

  // Debug: Log dialog state changes
  useEffect(() => {
    console.log(`📊 Idle Dialog State Changed - showIdleDialog: ${showIdleDialog}, countdown: ${countdown}`);
    if (showIdleDialog) {
      console.log('✅ Idle dialog should be visible now');
      console.log('🔍 Verifying dialog will render...');
    } else {
      console.log('❌ Idle dialog is closed');
    }
  }, [showIdleDialog, countdown]);

  // Monitor network status (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      console.group('🌐 Network Status Changed');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log('✅ Network: ONLINE');
      console.log('ℹ️ Idle timer continues to work normally');
      console.groupEnd();
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      console.group('🌐 Network Status Changed');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log('⚠️ Network: OFFLINE');
      console.log('ℹ️ Idle timer will continue to work offline');
      console.log('ℹ️ Auto-logout will still trigger after 15 minutes of idle time');
      console.log('ℹ️ Countdown timer works independently of network status');
      console.groupEnd();
    };

    // Set initial status
    isOnlineRef.current = navigator.onLine;
    console.log(`🌐 Initial Network Status: ${isOnlineRef.current ? 'ONLINE' : 'OFFLINE'}`);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add test function to manually trigger dialog (for debugging)
  useEffect(() => {
    // Expose test function to window for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).testIdleDialog = () => {
      console.log('🧪 TEST: Manually triggering idle dialog');
      setShowIdleDialog(true);
      setCountdown(60);
    };
    
    // Expose timer info to window for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).getIdleTimerInfo = () => {
      return {
        isIdle: idleTimer.isIdle(),
        remaining: idleTimer.getRemainingTime(),
        elapsed: idleTimer.getElapsedTime(),
        lastActive: idleTimer.getLastActiveTime(),
        showIdleDialog,
        countdown,
        isAuthenticated,
        isOnline: isOnlineRef.current
      };
    };
    
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).testIdleDialog;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).getIdleTimerInfo;
    };
  }, [idleTimer, showIdleDialog, countdown, isAuthenticated]);

  return {
    showIdleDialog,
    countdown,
    handleStayActive,
    handleLogout,
    lastActivity: idleTimer.getLastActiveTime(),
  };
};