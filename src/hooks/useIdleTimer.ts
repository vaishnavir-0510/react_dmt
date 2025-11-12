import { useEffect, useRef, useState, useCallback } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useAuth } from './useAuth';
import { useDispatch } from 'react-redux';
import { useRefreshTokenMutation } from '../store/api/authApi';
import { updateAccessToken } from '../store/slices/authSlice';

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

  const getTokenExpiry = useCallback((token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return Date.now() + 30 * 60 * 1000; // Default 30 minutes if parsing fails
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        const result = await refreshToken({ refresh_token: refreshTokenValue }).unwrap();
        dispatch(updateAccessToken(result.access_token));
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  }, [refreshToken, dispatch, logout]);

  // Token refresh logic
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const checkAndRefreshToken = () => {
      try {
        const tokenExpiry = getTokenExpiry(accessToken);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (tokenExpiry - now <= fiveMinutes) {
          refreshAccessToken();
        }
      } catch (error) {
        console.error('Token check failed:', error);
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up interval to check every minute
    refreshIntervalRef.current = window.setInterval(checkAndRefreshToken, 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        window.clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = undefined;
      }
    };
  }, [accessToken, isAuthenticated, getTokenExpiry, refreshAccessToken]);

  const handleLogout = useCallback(() => {
    setShowIdleDialog(false);
    setCountdown(0);
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
    logout();
  }, [logout]);

  const handleStayActive = useCallback(() => {
    setShowIdleDialog(false);
    setCountdown(0);
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = undefined;
    }
    // Trigger activity to reset idle timer
    document.dispatchEvent(new MouseEvent('mousemove'));
  }, []);

  const onIdle = useCallback(() => {
    if (!isAuthenticated) return;
    
    setShowIdleDialog(true);
    setCountdown(60); // 1 minute countdown
    
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = undefined;
          }
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isAuthenticated, handleLogout]);

  const onActive = useCallback(() => {
    if (showIdleDialog) {
      handleStayActive();
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
    startOnMount: isAuthenticated,
    stopOnIdle: false
  });

  // Reset idle timer when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      idleTimer.reset();
    } else {
      idleTimer.pause();
    }
  }, [isAuthenticated, idleTimer]);

  return {
    showIdleDialog,
    countdown,
    handleStayActive,
    handleLogout,
    lastActivity: idleTimer.getLastActiveTime(),
  };
};