export const updateLastActivity = () => {
  const timestamp = Date.now().toString();
  localStorage.setItem('lastActivity', timestamp);
  // Trigger a custom event for same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent('activityUpdated', { detail: timestamp }));
};

export const getLastActivity = (): number => {
  return parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
};

export const isSessionValid = (): boolean => {
  const lastActivity = getLastActivity();
  const fifteenMinutes = 15 * 60 * 1000;
  return Date.now() - lastActivity < fifteenMinutes;
};

export const setupActivityListeners = (): (() => void) => {
  const events = [
    'mousedown', 
    'mousemove', 
    'keypress', 
    'scroll', 
    'touchstart',
    'wheel',
    'click'
  ];
  
  // Throttle activity updates to avoid excessive localStorage writes
  let lastUpdateTime = 0;
  const throttleMs = 1000; // Update at most once per second
  
  const updateActivity = () => {
    const now = Date.now();
    if (now - lastUpdateTime >= throttleMs) {
      updateLastActivity();
      lastUpdateTime = now;
    }
  };

  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  // Initial activity
  updateLastActivity();

  return () => {
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
};

export const checkTokenExpiry = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expiry - now > fiveMinutes;
  } catch {
    return false;
  }
};