export const updateLastActivity = () => {
  localStorage.setItem('lastActivity', Date.now().toString());
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
  
  const updateActivity = () => {
    updateLastActivity();
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