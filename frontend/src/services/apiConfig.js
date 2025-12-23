// Frontend API Configuration Utility
// Centralized logic for determining the correct API base URL

/**
 * Detect if we're running in production based on multiple factors
 * @returns {boolean} True if running in production
 */
const isProduction = () => {
  // Check Vite environment mode
  if (import.meta.env.MODE === 'production') return true;
  
  // Check if we're on a production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production indicators
    if (hostname.includes('awsapprunner.com') || 
        hostname.includes('render.com') ||
        hostname.includes('onrender.com') ||
        hostname.includes('finorn.com') ||
        hostname === 'localhost' && window.location.port === '') {
      return true;
    }
  }
  
  return false;
};

/**
 * Get the API base URL with smart environment detection
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // 1. Check for explicit environment variable first (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. In browser environment, use intelligent detection
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    if (isProduction()) {
      // Production: use same origin
      return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
    } else {
      // Development: check if we're on the default dev frontend port
      if (port === '5173' || port === '3001') {
        // Assume backend is on port 3000
        return `${protocol}//${hostname}:3000/api`;
      } else {
        // Use same origin with /api path
        return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
      }
    }
  }
  
  // 3. Fallback for SSR/build environment - avoid hardcoded localhost
  // This should rarely be used since we have environment variables and browser detection
  return import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';
};

/**
 * Get environment information for debugging
 * @returns {Object} Environment details
 */
export const getEnvironmentInfo = () => {
  const info = {
    mode: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    apiBaseUrl: getApiBaseUrl(),
    isProduction: isProduction(),
    isDevelopment: !isProduction()
  };
  
  if (typeof window !== 'undefined') {
    info.location = {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      origin: window.location.origin
    };
  }
  
  return info;
};

// Log environment info (always log in production to help debug)
if (typeof console !== 'undefined') {
  const envInfo = getEnvironmentInfo();
  console.log('🔍 API Config Environment:', envInfo);
  console.log('🔍 Current API Base URL:', getApiBaseUrl());
}

/**
 * Get headers with authentication and organization context
 * @returns {Object} Headers object for API requests
 */
export const getApiHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Add authentication token
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  
  // Add organization context for business accounts
  const accountType = localStorage.getItem('accountType');
  if (accountType === 'business') {
    const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
    if (cachedUser.defaultOrganizationId) {
      headers['x-organization-id'] = cachedUser.defaultOrganizationId;
    }
  } else {
    // For individual accounts, add org header if explicitly set
    const orgId = localStorage.getItem('lastSelectedOrgId');
    if (orgId && orgId !== 'undefined') {
      headers['x-organization-id'] = orgId;
    }
  }
  
  return headers;
};

/**
 * Make a configured fetch request with proper headers
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const apiFetch = (endpoint, options = {}) => {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultOptions = {
    headers: getApiHeaders(),
    credentials: 'include'
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  return fetch(url, mergedOptions);
};

/**
 * Debug function to log current API configuration
 */
export const debugApiConfig = () => {
  console.log('🔍 API Configuration Debug:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    calculatedBaseUrl: getApiBaseUrl(),
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A (SSR)',
    headers: getApiHeaders()
  });
};

export default {
  getApiBaseUrl,
  getApiHeaders,
  apiFetch,
  debugApiConfig
}; 