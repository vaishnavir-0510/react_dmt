/**
 * Environment Configuration
 * 
 * This module provides environment-specific configuration similar to the Dart implementation.
 * Supports: dev, qa, uat, and prod environments.
 * 
 * Environment is determined by VITE_ENVIRONMENT variable or defaults to 'dev'.
 */

// HTTP base URLs for different environments
const _devBaseUrl = 'https://api-dev.datamatter.tech';
const _qaBaseUrl = 'https://api-qa.datamatter.tech';
const _uatBaseUrl = 'https://uat.datamatter.tech';
const _prodBaseUrl = 'https://api.datamatter.tech';

// WebSocket base URLs for different environments
const _devWebSocketUrl = 'wss://api-dev.datamatter.tech';
const _qaWebSocketUrl = 'wss://api-qa.datamatter.tech';
const _uatWebSocketUrl = 'wss://uat.datamatter.tech';
const _prodWebSocketUrl = 'wss://api.datamatter.tech';

/**
 * Get the current environment from VITE_ENVIRONMENT or default to 'dev'
 */
export const getEnvironment = (): string => {
  return import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'dev';
};

/**
 * Environment convenience checks
 */
export const isDevelopment = (): boolean => {
  const env = getEnvironment().toLowerCase();
  return env === 'dev' || env === 'development';
};

export const isQA = (): boolean => {
  return getEnvironment().toLowerCase() === 'qa';
};

export const isUAT = (): boolean => {
  return getEnvironment().toLowerCase() === 'uat';
};

export const isProduction = (): boolean => {
  const env = getEnvironment().toLowerCase();
  return env === 'prod' || env === 'production';
};

/**
 * Get base URL depending on environment
 */
export const getBaseUrl = (): string => {
  const env = getEnvironment().toLowerCase();
  
  // Allow override via VITE_API_BASE_URL if explicitly set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  switch (env) {
    case 'dev':
    case 'development':
      return _devBaseUrl;
    case 'qa':
      return _qaBaseUrl;
    case 'uat':
      return _uatBaseUrl;
    case 'prod':
    case 'production':
      return _prodBaseUrl;
    default:
      return _devBaseUrl;
  }
};

/**
 * Get WebSocket base URL depending on environment
 */
export const getWebSocketUrl = (): string => {
  const env = getEnvironment().toLowerCase();
  
  // Allow override via VITE_WS_BASE_URL if explicitly set
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  
  switch (env) {
    case 'dev':
    case 'development':
      return _devWebSocketUrl;
    case 'qa':
      return _qaWebSocketUrl;
    case 'uat':
      return _uatWebSocketUrl;
    case 'prod':
    case 'production':
      return _prodWebSocketUrl;
    default:
      return _devWebSocketUrl;
  }
};

/**
 * Helper method to get full HTTP URL for an endpoint
 */
export const getUrl = (endpoint: string): string => {
  const baseUrl = getBaseUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Remove trailing slash from baseUrl if present
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
};

/**
 * Helper method to get full WebSocket URL for an endpoint
 */
export const getWebSocketUrlForEndpoint = (endpoint: string): string => {
  const baseUrl = getWebSocketUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Remove trailing slash from baseUrl if present
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
};

/**
 * Environment Config Object
 * Provides a class-like interface similar to the Dart implementation
 */
export const EnvironmentConfig = {
  // Get current environment
  get environment(): string {
    return getEnvironment();
  },
  
  // Convenience checks
  get isDevelopment(): boolean {
    return isDevelopment();
  },
  
  get isQA(): boolean {
    return isQA();
  },
  
  get isUAT(): boolean {
    return isUAT();
  },
  
  get isProduction(): boolean {
    return isProduction();
  },
  
  // Get base URLs
  get baseUrl(): string {
    return getBaseUrl();
  },
  
  get webSocketUrl(): string {
    return getWebSocketUrl();
  },
  
  // Helper methods
  getUrl,
  getWebSocketUrlForEndpoint,
} as const;

// Export default for convenience
export default EnvironmentConfig;

