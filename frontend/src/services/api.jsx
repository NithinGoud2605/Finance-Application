// src/api.jsx
// -----------------------------------------------------------------------------
// Axios helper: attaches JWT, x‑organization‑id, 5‑min GET cache, unified errors
// -----------------------------------------------------------------------------

import axios from 'axios';
import { getApiBaseUrl, debugApiConfig } from './apiConfig.js';

const API_URL = getApiBaseUrl();

// Debug API configuration in development
if (import.meta.env.DEV) {
  console.log('🚀 API Service Initialized:', { API_URL });
  debugApiConfig();
}
const CACHE_FOR_MS  = 5 * 60 * 1000;           // 5 minutes
const cache         = new Map();               // in‑memory GET cache

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable sending cookies
});

/* ───────────────────────────── helpers ───────────────────────────── */

const getOrgId = () => {
  const id = localStorage.getItem('lastSelectedOrgId');
  return id && id !== 'undefined' ? id : null;
};

/* ────────────────────────── request interceptor ────────────────────────── */

apiClient.interceptors.request.use((config) => {
  const idToken = localStorage.getItem('token');
  const accountType = localStorage.getItem('accountType');

  // Skip token validation for auth and public endpoints
  if (config.url.includes('/auth') || config.url.includes('/public/')) {
    return config;
  }

  // block unauthenticated calls (except /auth and /public)
  if (!idToken && !config.url.includes('/auth') && !config.url.includes('/public/')) {
    throw new Error('No authentication token found');
  }

  /* ---- JWT header + expiry check --------------------------------------- */
  if (idToken && !config.url.includes('/public/')) {
    // Extract raw token (remove 'Bearer ' prefix if present)
    const rawToken = idToken.startsWith('Bearer ') ? idToken.split(' ')[1] : idToken;
    
    // Set Authorization header with ID token
    config.headers.Authorization = `Bearer ${rawToken}`;

    try {
      const payload = JSON.parse(atob(rawToken.split('.')[1]));
      
      if (payload.exp * 1000 < Date.now()) {
        // Token expired, try to refresh
        return refreshTokens().then(() => {
          // After refresh, update headers with new token
          const newToken = localStorage.getItem('token');
          if (!newToken) {
            throw new Error('No token available after refresh');
          }
          // Extract raw token from new token
          const newRawToken = newToken.startsWith('Bearer ') ? newToken.split(' ')[1] : newToken;
          config.headers.Authorization = `Bearer ${newRawToken}`;
          return config;
        }).catch(() => {
          // If refresh fails, clear auth state
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('isAuthenticated');
          throw new Error('Session expired. Please sign in again.');
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development' && err.message !== 'Token expired') {
        console.error('Token validation error:', err);
      }
      throw err;
    }
  }

  /* ---- Organization header for business accounts ----------------------- */
  if (!config.url.includes('/public/')) {
    if (accountType === 'business') {
      // For business accounts, automatically use their organization
      // No manual selection needed since they're locked to one org
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      const defaultOrgId = cachedUser.defaultOrganizationId;
      
      if (defaultOrgId) {
        config.headers['x-organization-id'] = defaultOrgId;
      } else {
        // Fallback to stored org ID if available
        const orgId = getOrgId();
        if (orgId) {
          config.headers['x-organization-id'] = orgId;
        }
      }
    } else {
      // For individual accounts, only add org header if explicitly set
      const orgId = getOrgId();
      if (orgId) {
        config.headers['x-organization-id'] = orgId;
      }
    }
  }

  return config;
});

/* ───────────────────────── response interceptor ───────────────────────── */

apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    if (response.config.method !== 'get') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Log all errors for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });

    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Don't redirect for account confirmation issues
      if (errorCode === 'ACCOUNT_NOT_CONFIRMED') {
        return Promise.reject({
          ...error.response.data.error,
          accountNotConfirmed: true
        });
      }

      // Skip session handling for auth and public endpoints - let them handle their own errors
      if (originalRequest?.url?.includes('/auth') || originalRequest?.url?.includes('/public/')) {
        return Promise.reject(error.response?.data || error);
      }

      // Clear auth data and redirect to sign in for protected endpoints
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('cachedUser');
      localStorage.removeItem('isAuthenticated');
      
      // Delete the authorization header
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on auth pages and not during initial load
      if (!window.location.pathname.includes('/sign-in') && 
          !window.location.pathname.includes('/sign-up') &&
          !window.location.pathname.includes('/auth') &&
          !originalRequest._redirected) {
        originalRequest._redirected = true;
        window.location.href = '/sign-in';
      }
      
      return Promise.reject({
        message: 'Session expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
        status: 401
      });
    }

    // Handle subscription errors (402)
    if (error.response?.status === 402) {
      const errorData = error.response?.data;
      const errorCode = errorData?.code;
      
      // Handle different subscription error types
      if (errorCode === 'SUBSCRIPTION_REQUIRED') {
        // Individual account needs subscription
        if (!window.location.pathname.includes('/pricing') && !originalRequest._subscriptionRedirected) {
          originalRequest._subscriptionRedirected = true;
          window.location.href = '/pricing';
        }
        
        return Promise.reject({
          message: errorData.message || 'Subscription required to access this feature',
          code: 'SUBSCRIPTION_REQUIRED',
          status: 402,
          redirectTo: '/pricing'
        });
      }
      
      if (errorCode === 'ORG_SUBSCRIPTION_REQUIRED') {
        // Organization needs subscription
        const canManage = errorData.canManageSubscription;
        const message = canManage 
          ? 'Your organization needs an active subscription. You can manage it in the organization settings.'
          : 'Your organization needs an active subscription. Please contact the organization owner.';
        
        return Promise.reject({
          message,
          code: 'ORG_SUBSCRIPTION_REQUIRED',
          status: 402,
          canManageSubscription: canManage,
          redirectTo: errorData.redirectTo || '/pricing'
        });
      }
      
      if (errorCode === 'PAYMENT_PAST_DUE') {
        return Promise.reject({
          message: errorData.message || 'Payment is past due. Please update your payment method.',
          code: 'PAYMENT_PAST_DUE',
          status: 402,
          redirectTo: '/my-account' // Redirect to billing section
        });
      }
      
      // Generic subscription error
      return Promise.reject({
        message: errorData.message || 'Subscription issue detected',
        code: errorCode || 'SUBSCRIPTION_ERROR',
        status: 402,
        redirectTo: errorData.redirectTo || '/pricing'
      });
    }

    // Handle organization context errors (400)
    if (error.response?.status === 400 && error.response?.data?.code === 'ORG_CONTEXT_REQUIRED') {
      return Promise.reject({
        message: 'Please select an organization to continue',
        code: 'ORG_CONTEXT_REQUIRED',
        status: 400
      });
    }

    // Handle other client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          `Request failed with status ${error.response?.status}`;
      
      return Promise.reject({
        message: errorMessage,
        status: error.response?.status,
        code: error.response?.data?.code
      });
    }

    // Handle server errors (5xx) - but preserve auth error details
    if (error.response?.status >= 500) {
      // Check if this is an authentication error with specific details
      if (error.response?.data?.error?.code && 
          ['AUTH_FAILED', 'INVALID_CREDENTIALS', 'ACCOUNT_NOT_CONFIRMED'].includes(error.response.data.error.code)) {
        // Preserve the original auth error details
        return Promise.reject(error);
      }
      
      return Promise.reject({
        message: 'Server error occurred. Please try again later.',
        status: error.response?.status,
        code: 'SERVER_ERROR'
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      });
    }

    // Default error handling
    return Promise.reject(error);
  }
);

/* ─────────────────────────── generic wrapper ─────────────────────────── */

export const apiRequest = async (method, url, data = null, config = {}) => {
  // simple GET cache
  if (method === 'get' && !config.skipCache) {
    const key = `${url}${JSON.stringify(config.params || {})}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.t < CACHE_FOR_MS) {
      return cached.v;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    const token = localStorage.getItem('token');
    console.debug(`🔒 Token for ${url}:`, token ? 'Present' : 'Missing');
  }

  const resp = await apiClient[method](url, data, config).then((r) => r.data);

  if (method === 'get' && !config.skipCache) {
    const key = `${url}${JSON.stringify(config.params || {})}`;
    cache.set(key, { v: resp, t: Date.now() });
  }

  return resp;
};

/* ───────────────────────────── ROUTE HELPERS ─────────────────────────────
   (all endpoints below simply call apiRequest – feel free to trim / group)
   ----------------------------------------------------------------------- */

/* ---------- AUTH ---------- */
export const register = (userData) => {
  // Format user attributes for registration
  const userAttributes = [
    {
      Name: 'email',
      Value: userData.email
    },
    {
      Name: 'name',
      Value: userData.name
    },
    {
      Name: 'custom:accountType',
      Value: userData.accountType || 'individual'
    }
  ];

  // Add industry only for business accounts
  if (userData.accountType === 'business' && userData.industry) {
    userAttributes.push({
      Name: 'custom:industry',
      Value: userData.industry
    });
  }

  // Format the request payload
  const payload = {
    email: userData.email,
    password: userData.password,
    name: userData.name,
    accountType: userData.accountType || 'individual',
    industry: userData.industry,
    inviteToken: userData.inviteToken,
    orgId: userData.orgId,
    userAttributes
  };

  console.log('register() payload:', JSON.stringify(payload, null, 2));

  return apiClient.post('/auth/register', payload)
    .then(r => ({ success: true, ...r.data }))
    .catch(error => {
      // Log the full error for debugging
      console.error('Registration error details:', error.response?.data);
      
      // Preserve the original error structure for auth error handler
      // The auth error handler will process these properly
      throw error;
    });
};
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    
    if (response.data.success) {
      const { user, tokens } = response.data.data;
      
      // Store all tokens
      const idToken = tokens.idToken;
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;
      
      // Store tokens with proper format
      localStorage.setItem('token', `Bearer ${idToken}`);
      localStorage.setItem('accessToken', `Bearer ${accessToken}`);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('accountType', user.accountType);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Store complete user data
      localStorage.setItem('cachedUser', JSON.stringify({
        ...user,
        isSubscribed: user.isSubscribed || false,
        lastLogin: new Date().toISOString()
      }));
      
      // Update the default Authorization headers for subsequent requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      apiClient.defaults.headers.common['x-access-token'] = `Bearer ${accessToken}`;
      
      return { 
        success: true, 
        data: {
          user,
          tokens
        }
      };
    }
    
    throw new Error(response.data.error?.message || 'Login failed');
  } catch (error) {
    console.error('Login error:', error);
    
    // For authentication errors, preserve the original error structure
    // Our auth error handler will process these properly
    throw error;
  }
};
export const confirmAccount         = (p)              => apiClient.post('/auth/confirm', p).then(r => r.data);
export const resendConfirmationCode = (email)          => apiClient.post('/auth/resend-code', { email }).then(r => r.data);
export const forgotPassword         = (email)          => apiClient.post('/auth/forgot-password', { email }).then(r => r.data);
export const confirmForgotPassword  = (p)              => apiClient.post('/auth/confirm-forgot-password', p).then(r => r.data);
export const logout                 = ()               => apiRequest('post', '/auth/logout');
export const signIn = (credentials) => {
  return apiClient.post('/auth/login', credentials)
    .then(r => ({ success: true, ...r.data }))
    .catch(error => {
      // Handle specific error cases
      if (error.response?.data?.error?.code === 'ACCOUNT_NOT_CONFIRMED') {
        throw new Error('Please confirm your account before signing in');
      }
      if (error.response?.data?.error?.code === 'INVALID_CREDENTIALS') {
        throw new Error('Invalid email or password');
      }
      // Log the full error for debugging
      console.error('Sign in error details:', error.response?.data);
      throw error;
    });
};

/* ---------- INVOICES ---------- */
export const getAllInvoices         = (filters = {})   => {
  // Only pass actual filter parameters, not React Query internals
  const cleanParams = {};
  if (filters.status && filters.status !== 'ALL') cleanParams.status = filters.status;
  if (filters.date && filters.date !== 'ALL') cleanParams.date = filters.date;
  if (filters.sort) cleanParams.sort = filters.sort;
  
  return apiRequest('get', '/invoices', null, { params: cleanParams });
};
export const createInvoice          = (d)              => apiRequest('post', '/invoices', d);
export const getInvoiceOverview     = ()               => apiRequest('get', '/invoices/overview');
export const getInvoiceReport       = ()               => apiRequest('get', '/invoices/report');
export const sendInvoice            = (id, p = {})     => apiRequest('post', `/invoices/${id}/send`, p);
export const getInvoiceById         = (id)             => apiRequest('get', `/invoices/${id}`);
export const updateInvoice          = (id, d)          => apiRequest('put', `/invoices/${id}`, d);
export const deleteInvoice          = (id)             => apiRequest('delete', `/invoices/${id}`);
export const getInvoicePdf          = (id, action = 'view') => apiRequest('get', `/invoices/${id}/pdf?action=${action}`);
export const getPublicInvoice       = (token)          => apiRequest('get', `/public/invoice/${token}`);

/* ---------- CONTRACTS ---------- */
export const getAllContracts        = ()               => apiRequest('get', '/contracts');
export const uploadContract         = (formData)       => {
  return apiClient.post('/contracts/upload', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => {
    console.log('Contract upload response:', r.data);
    return r.data;
  }).catch(error => {
    console.error('Contract upload error:', error);
    throw error;
  });
};
export const uploadContractPdf      = (formData)       => {
  return apiClient.post('/contracts/upload-pdf', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => {
    console.log('Contract PDF upload response:', r.data);
    return r.data;
  }).catch(error => {
    console.error('Contract PDF upload error:', error);
    throw error;
  });
};
export const createContract         = (d)              => apiRequest('post', '/contracts', d);
export const updateContract         = (id, d)          => apiRequest('put', `/contracts/${id}`, d);
export const deleteContract         = (id)             => apiRequest('delete', `/contracts/${id}`);
export const cancelContract         = (id)             => apiRequest('post', `/contracts/${id}/cancel`);
export const renewContract          = (id, b)          => apiRequest('post', `/contracts/${id}/renew`, b);
export const sendForSignature       = (id)             => apiRequest('post', `/contracts/${id}/send-for-signature`);
export const getContractPdf         = (id, action = 'view') => apiRequest('get', `/contracts/${id}/pdf?action=${action}`);
export const getContractById        = (id)             => apiRequest('get', `/contracts/${id}`);
export const approveContract        = (id)             => apiRequest('post', `/contracts/${id}/approve`);
export const sendContract           = (id, p = {})     => apiRequest('post', `/contracts/${id}/send`, p);
export const getContractsPdf        = (id, action = 'view') => apiRequest('get', `/contracts/${id}/pdf?action=${action}`);
export const getPublicContract      = (token)          => apiRequest('get', `/public/contract/${token}`);

/* ---------- EXPENSES ---------- */
export const getAllExpenses         = ()               => apiRequest('get', '/expenses');
export const getExpenseTotal        = ()               => apiRequest('get', '/expenses/total');
export const getAggregatedExpenses  = ()               => apiRequest('get', '/expenses/aggregated');
export const createExpense          = (d)              => apiRequest('post', '/expenses', d);
export const getExpenseOverview     = ()               => apiRequest('get', '/expenses/overview');
export const getExpenseById         = (id)             => apiRequest('get', `/expenses/${id}`);
export const updateExpense          = (id, d)          => apiRequest('put', `/expenses/${id}`, d);
export const deleteExpense          = (id)             => apiRequest('delete', `/expenses/${id}`);
export const getExpenseReceiptUrl   = (id)             => apiRequest('get', `/expenses/${id}/receipt`);

/* ---------- BANK ---------- */
export const getBankAccounts        = ()               => apiRequest('get', '/bank-accounts');
export const connectBankAccount     = (d)              => apiRequest('post', '/bank-accounts', d);
export const getBankTransactions    = ()               => apiRequest('get', '/bank-transactions');

/* ---------- USER ---------- */
export const getMe = () => {
  return apiClient.get('/auth/me-direct')
    .then(response => {
      // Extract user data from the response
      const userData = response.data.user || response.data;
      
      // Make sure industry field is set if state is "Software"
      if (userData && userData.state === "Software" && !userData.industry) {
        userData.industry = "Software";
      }
      
      return userData;
    });
};
export const updateMe               = (d)              => apiRequest('put', '/users/me', d);

/* ---------- SETTINGS & PROFILE - REMOVED DUE TO 404 ERRORS ---------- */
// The following API endpoints were causing 404 errors and have been removed:
// - getSettings, updateSettings, getProfile, updateProfile
// - uploadProfileImage, updateOrgSettings, updatePreferences

// Password & Authentication
export const changePassword        = (data)           => apiRequest('post', '/auth/change-password', data);
export const enable2FA            = ()               => apiRequest('post', '/auth/2fa/enable');
export const disable2FA           = ()               => apiRequest('post', '/auth/2fa/disable');
export const verify2FA            = (code)           => apiRequest('post', '/auth/2fa/verify', { code });

/* ---------- ADMIN ---------- */
export const getAllUsers            = ()               => apiRequest('get', '/admin/users');
export const updateUser             = (id, d)          => apiRequest('put', `/admin/users/${id}`, d);

/* ---------- CLIENTS ---------- */
export const getAllClients         = ()               => apiRequest('get', '/clients');
export const getClients            = ()               => apiRequest('get', '/clients');
export const getClientById         = (id)             => apiRequest('get', `/clients/${id}`);
export const createClient          = (data)           => apiRequest('post', '/clients', data);
export const updateClient          = (id, data)       => apiRequest('put', `/clients/${id}`, data);
export const deleteClient          = (id)             => apiRequest('delete', `/clients/${id}`);
export const getClientActivity     = (id)             => apiRequest('get', `/clients/${id}/activity`);
export const searchClients         = (query)          => apiRequest('get', `/clients/search?q=${encodeURIComponent(query)}`);
export const getClientAnalytics    = ()               => apiRequest('get', '/clients/analytics');
export const getClientProjects     = (id)             => apiRequest('get', `/clients/${id}/projects`);
export const getClientInvoices     = (id)             => apiRequest('get', `/clients/${id}/invoices`);
export const getClientContracts    = (id)             => apiRequest('get', `/clients/${id}/contracts`);

/* ---------- SUBSCRIPTION ---------- */
export const getSubscription        = ()               => apiRequest('get', '/subscription/status');
export const cancelSubscription     = ()               => apiRequest('post', '/subscription/cancel');
export const resumeSubscription     = ()               => apiRequest('post', '/subscription/resume');
export const getPaymentHistory      = ()               => apiRequest('get', '/subscription/payment-history');

/* ---------- ORGANISATIONS ---------- */
export const getUserOrganizations   = ()               => apiRequest('get', '/organizations/my-organizations');
export const createOrganization     = (d)              => apiRequest('post', '/organizations', d);
export const getOrganization        = (id)             => apiRequest('get', `/organizations/${id}`);
export const updateOrganization     = (id, d)          => apiRequest('put', `/organizations/${id}`, d);
export const deleteOrganization     = (id)             => apiRequest('delete', `/organizations/${id}`);
export const setCurrentOrganization = (id)             => apiRequest('post', `/organizations/${id}/select`);

/* ---------- ORG MEMBERS ---------- */
export const getOrganizationMembers = (orgId)          => apiRequest('get', `/organizations/${orgId}/members`);
export const inviteMember           = (orgId, d)       => apiRequest('post', `/organizations/${orgId}/members/invite`, d);
export const updateMember           = (orgId, uid, d)  => apiRequest('put', `/organizations/${orgId}/members/${uid}`, d);
export const removeMember           = (orgId, uid)     => apiRequest('delete', `/organizations/${orgId}/members/${uid}`);

/* ---------- ORG INVITES ---------- */
export const acceptInvitation       = (orgId, d)       => apiRequest('post', `/organizations/${orgId}/invitations/accept`, d);
export const rejectInvitation       = (orgId, d)       => apiRequest('post', `/organizations/${orgId}/invitations/reject`, d);
export const sendInvitation         = (orgId, d)       => apiRequest('post', `/organizations/${orgId}/invitations`, d);

/* ---------- ORG SETTINGS ---------- */
export const getOrganizationSettings  = (orgId)        => apiRequest('get', `/organizations/${orgId}/settings`);
export const updateOrganizationSettings = (orgId, d)   => apiRequest('put', `/organizations/${orgId}/settings`, d);

/* ---------- ORG SUBSCRIPTION ---------- */
export const getOrganizationSubscription = (orgId)     => apiRequest('get', `/organizations/${orgId}/subscription`);
export const updateOrganizationSubscription = (orgId, d) => apiRequest('post', `/organizations/${orgId}/subscription`, d);
export const cancelOrganizationSubscription  = (orgId) => apiRequest('delete', `/organizations/${orgId}/subscription`);
export const getOrganizationRoles  = (orgId) => apiRequest('get', `/organizations/${orgId}/roles`);
export const getOrganizationPaymentHistory = async (orgId) => {
  try {
    // Try to get data from the API endpoint
    return await apiRequest('get', `/organizations/${orgId}/payment-history`);
  } catch (error) {
    console.warn('Payment history API not implemented yet, using fallback data');
    // Return fallback data if the API endpoint doesn't exist yet
    return {
      payments: [],
      message: 'Payment history not available'
    };
  }
};

/* ---------- ORGANIZATION ACTIVATION ---------- */
export const createOrganizationActivationSession = async ({ organizationId }) => {
  try {
    const idToken = localStorage.getItem('token');
    if (!idToken) {
      throw new Error('Authentication required');
    }

    // Check if organization already has an active subscription
    // Get organization data from localStorage if available
    const cachedOrganizations = JSON.parse(localStorage.getItem('organizations') || '[]');
    const organization = cachedOrganizations.find(org => org.id === organizationId);
    
    if (organization && organization.isSubscribed) {
      throw new Error('Organization already has an active subscription');
    }

    const rawToken = idToken.startsWith('Bearer ') ? idToken.split(' ')[1] : idToken;
    
    // Ensure the URLs are properly constructed
    const successUrl = `${window.location.origin}/organization/${organizationId}/dashboard?activation=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/organization/${organizationId}/settings?activation=cancelled`;
    
    // Include URLs and organization ID in the request
    const response = await apiClient.post('/payments/activate-organization', { 
      organizationId,
      successUrl,
      cancelUrl
    }, {
      headers: {
        'Authorization': `Bearer ${rawToken}`
      }
    });

    if (!response.data) {
      throw new Error('No response data received');
    }

    // Check if we have a checkout URL, if so redirect
    if (response.data.url) {
      console.log('Redirecting to Stripe checkout:', response.data.url);
      window.location.href = response.data.url;
    } else {
      console.error('Missing checkout URL in response:', response.data);
      throw new Error('No checkout URL received');
    }

    return response.data;
  } catch (error) {
    console.error('Organization activation error:', error);
    
    // Extract the error message if available
    let errorMessage = 'Failed to create activation session. Please try again later.';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/* ---------- STRIPE ---------- */
export const createCheckoutSession = async ({ planType }) => {
  try {
    // Get the current user's account type and token
    const accountType = localStorage.getItem('accountType') || 'individual';
    const idToken = localStorage.getItem('token');
    const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
    
    // Validate authentication state
    if (!idToken || !cachedUser.id) {
      console.error('Auth validation failed:', {
        hasToken: !!idToken,
        hasUserId: !!cachedUser.id,
        cachedUser
      });
      throw new Error('Please sign in to subscribe');
    }

    // Check if user already has an active subscription
    if (cachedUser.isSubscribed) {
      console.error('User already has an active subscription');
      throw new Error('You already have an active subscription');
    }
    
    // Extract raw token (remove 'Bearer ' prefix if present)
    const rawToken = idToken.startsWith('Bearer ') ? idToken.split(' ')[1] : idToken;

    const response = await apiClient.post('/payments/stripe-checkout-session', { 
      planType,
      accountType,
      successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`,
      metadata: {
        userId: cachedUser.id,
        accountType
      }
    }, {
      headers: {
        'Authorization': `Bearer ${rawToken}`
      }
    });

    if (!response.data) {
      throw new Error('No response data received');
    }

    if (response.data.url) {
      // Store the plan type in localStorage for post-payment processing
      localStorage.setItem('selectedPlan', planType);
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } else {
      throw new Error('No checkout URL received');
    }

    return response.data;
  } catch (error) {
    console.error('Checkout session error:', error);
    throw new Error(error.message || 'Failed to create checkout session. Please try again later.');
  }
};

// Centralized user data reloading with improved caching
export const reloadUserContext = async (silent = false) => {
  const timestamp = new Date().toISOString();
  
  // Check if we've fetched recently to avoid duplicate calls
  const lastRefresh = localStorage.getItem('lastUserDataRefresh');
  const now = Date.now();
  if (lastRefresh && (now - parseInt(lastRefresh)) < 30000) {
    // Return cached data if refreshed within last 30 seconds
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
  }

  try {
    // Create headers for the request
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('currentOrgId');
    
    const headers = {
      'Authorization': token,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    if (orgId) {
      headers['x-organization-id'] = orgId;
    }

    try {
      if (!silent) {
        console.log('🔄 Fetching user data from /auth/me-direct endpoint');
      }
      
      const response = await apiClient.get(`/auth/me-direct`, { 
        headers,
        skipCache: true 
      });
      
      const userData = response.data.user || response.data;
      
      if (userData && typeof userData === 'object') {
        if (!silent) {
          console.log('✅ User data refreshed successfully:', userData);
        }
        
        // Make sure industry field is set if state is "Software"
        if (userData.state === "Software" && !userData.industry) {
          userData.industry = "Software";
        }
        
        // Update cached user data in localStorage
        localStorage.setItem('cachedUser', JSON.stringify(userData));
        localStorage.setItem('accountType', userData.accountType || 'individual');
        localStorage.setItem('isSubscribed', userData.isSubscribed ? 'true' : 'false');
        localStorage.setItem('subscriptionFeatures', JSON.stringify(userData.subscriptionFeatures || {}));
        localStorage.setItem('lastUserDataRefresh', timestamp);
        
        // Trigger refresh events only if not silent
        if (!silent && typeof window !== 'undefined') {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'cachedUser',
            newValue: JSON.stringify(userData)
          }));
          
          window.dispatchEvent(new CustomEvent('userDataRefreshed', { 
            detail: userData 
          }));
        }
        
        return userData;
      } else {
        console.error('Invalid user data structure received:', response.data);
        throw new Error('Invalid user data structure received from server');
      }
    } catch (error) {
      if (!silent) {
      console.error('API error fetching user data:', error);
      }
      
      // For server errors, try to use cached data as fallback
      const cachedUser = localStorage.getItem('cachedUser');
      if (cachedUser) {
        if (!silent) {
        console.warn('Using cached user data due to API error');
        }
        return JSON.parse(cachedUser);
      }
      
      throw error;
    }
  } catch (error) {
    if (!silent) {
    console.error('Failed to reload user context:', error);
    }
    throw error;
  }
}

// Add function to reload organization context
export const reloadOrganizationContext = async (orgId) => {
  try {
    const idToken = localStorage.getItem('token');
    if (!idToken) {
      throw new Error('No authentication token found');
    }
    
    const rawToken = idToken.startsWith('Bearer ') ? idToken.split(' ')[1] : idToken;
    
    // First, get user organizations to update the list
    const orgsResponse = await apiClient.get('/organizations', {
      headers: {
        'Authorization': `Bearer ${rawToken}`
      }
    });
    
    if (!orgsResponse.data || !Array.isArray(orgsResponse.data)) {
      throw new Error('Failed to fetch organizations');
    }
    
    // If specific organization ID provided, get details for that organization
    if (orgId) {
      const orgResponse = await apiClient.get(`/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${rawToken}`
        }
      });
      
      if (!orgResponse.data) {
        throw new Error('Failed to fetch organization details');
      }
      
      return { 
        organizations: orgsResponse.data,
        currentOrg: orgResponse.data
      };
    }
    
    return {
      organizations: orgsResponse.data
    };
  } catch (error) {
    console.error('Failed to reload organization context:', error);
    throw error;
  }
};

/* ---------- FILE UPLOAD ---------- */
export const uploadFile = (formData) => {
  return apiClient.post('/invoices/upload', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const uploadPdfOnly = (formData) => {
  return apiClient.post('/invoices/upload-pdf', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

/* ---------- PAYMENTS ---------- */
export const payInvoice             = (id)             => apiRequest('post', `/payments/invoice/${id}`);
export const getPaymentMethods      = ()               => apiRequest('get', '/payments/methods');
export const addPaymentMethod       = (d)              => apiRequest('post', '/payments/methods', d);
export const removePaymentMethod    = (id)             => apiRequest('delete', `/payments/methods/${id}`);
export const createBatchPayment     = (d)              => apiRequest('post', '/payments/business/advanced/batch', d);
export const getBatchPaymentStatus  = (batchId)        => apiRequest('get', `/payments/business/advanced/batch/${batchId}`);
export const setupRecurringPayment  = (d)              => apiRequest('post', '/payments/business/advanced/recurring', d);
export const getRecurringPayments   = ()               => apiRequest('get', '/payments/business/advanced/recurring');
export const updateRecurringPayment = (id, d)          => apiRequest('put', `/payments/business/advanced/recurring/${id}`, d);
export const cancelRecurringPayment = (id)             => apiRequest('delete', `/payments/business/advanced/recurring/${id}`);
export const getPaymentAnalytics    = ()               => apiRequest('get', '/payments/business/advanced/analytics');
export const generatePaymentReport  = ()               => apiRequest('get', '/payments/business/advanced/reports');

/* ---------- API‑KEYS ---------- */
export const generateApiKey         = ()               => apiRequest('post', '/api-keys');
export const listApiKeys            = ()               => apiRequest('get', '/api-keys');
export const revokeApiKey           = (keyToRevoke)    => apiRequest('delete', '/api-keys', { keyToRevoke });

/* ---------- ANALYTICS ---------- */
export const getAnalyticsOverview   = ()               => apiRequest('get', '/analytics/overview');
export const getAnalyticsReport     = (params)         => apiRequest('get', '/analytics/report', { params });
export const exportAnalytics        = (format)         => apiRequest('get', `/analytics/export?format=${format}`);
export const getClientStats         = (params)         => apiRequest('get', '/clients/stats', { params });
export const getDocumentAnalytics   = ()               => apiRequest('get', '/documents/analytics');
export const getTeamAnalytics       = ()               => apiRequest('get', '/team/analytics');

/* ---------- TEAM ---------- */
export const getTeamMembers         = ()               => apiRequest('get', '/team/members');
export const updateTeamMember       = (id, d)          => apiRequest('put', `/team/members/${id}`, d);
export const removeTeamMember       = (id)             => apiRequest('delete', `/team/members/${id}`);
export const getMemberPerformance   = (id)             => apiRequest('get', `/team/members/${id}/performance`);
export const getRoles              = ()               => apiRequest('get', '/team/roles');
export const inviteTeamMember      = (data)           => apiRequest('post', '/team/members/invite', data);
export const updateMemberPermissions = (id, d)         => apiRequest('put', `/team/members/${id}/permissions`, d);
export const updateMemberRole      = (id, d)          => apiRequest('put', `/team/members/${id}/role`, d);

/* ---------- DOCUMENTS ---------- */
export const getDocuments          = (params)         => apiRequest('get', '/documents', null, { params });
export const getDocumentById       = (id)             => apiRequest('get', `/documents/${id}`);
export const uploadDocument        = (formData)       => apiClient.post('/documents/upload', formData, { 
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    return progress;
  }
}).then(r => r.data);
export const updateDocument        = (id, data)       => apiRequest('put', `/documents/${id}`, data);
export const deleteDocument        = (id)             => apiRequest('delete', `/documents/${id}`);
export const getDocumentVersions   = (id)             => apiRequest('get', `/documents/${id}/versions`);
export const shareDocument         = (id, data)       => apiRequest('post', `/documents/${id}/share`, data);
export const downloadDocument      = (id)             => apiRequest('get', `/documents/${id}/download`, null, { responseType: 'blob' });
export const getDocumentFolders    = ()               => apiRequest('get', '/documents/folders');
export const createDocumentFolder  = (data)           => apiRequest('post', '/documents/folders', data);
export const updateDocumentFolder  = (id, data)       => apiRequest('put', `/documents/folders/${id}`, data);
export const deleteDocumentFolder  = (id)             => apiRequest('delete', `/documents/folders/${id}`);

// Add token refresh function
export const refreshTokens = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.warn('No refresh token available');
      throw new Error('No refresh token available');
    }

    // Use axios.post directly to avoid interceptor issues during refresh
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      console.log('Tokens refreshed successfully');
    } else {
      throw new Error('No access token in refresh response');
    }
    
    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear all auth data on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
    throw error;
  }
};

// Upload receipt for expense
export const uploadExpenseReceipt = (file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  return apiClient.post('/expenses/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

// Download receipt for expense
export const downloadExpenseReceipt = async (expenseId, filename) => {
  try {
    const response = await getExpenseReceiptUrl(expenseId);
    if (response.url) {
      // Fetch the file as a blob
      const fileResponse = await fetch(response.url);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await fileResponse.blob();
      
      // Create object URL and download
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || `receipt-${expenseId}`;
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw error;
  }
};

/* ---------- ORG DASHBOARD ---------- */
export const getOrganizationDashboardOverview = (orgId) => apiRequest('get', `/organizations/${orgId}/dashboard/overview`);
export const getOrganizationTeamOverview = (orgId) => apiRequest('get', `/organizations/${orgId}/dashboard/team`);
export const getOrganizationActivityFeed = (orgId, params = {}) => apiRequest('get', `/organizations/${orgId}/dashboard/activities`, null, { params });
export const getOrganizationDepartmentDetails = (orgId, departmentId) => apiRequest('get', `/organizations/${orgId}/dashboard/departments/${departmentId}`);

/* ---------- AI ANALYSIS ---------- */
export const analyzeBusinessWithAI = async (businessMetadata) => {
  try {
    const response = await apiRequest('post', '/ai-analysis/analyze', { businessMetadata });
    return response;
  } catch (error) {
    console.error('AI Analysis API Error:', error);
    throw error;
  }
};

export const getAIServiceHealth = async () => {
  try {
    const response = await apiRequest('get', '/ai-analysis/health');
    return response;
  } catch (error) {
    console.error('AI Health Check Error:', error);
    throw error;
  }
};

export const getAIAnalysisHistory = async () => {
  try {
    const response = await apiRequest('get', '/ai-analysis/history');
    return response;
  } catch (error) {
    console.error('AI History Error:', error);
    throw error;
  }
};

export const updateAIAnalysisConfig = async (preferences) => {
  try {
    const response = await apiRequest('post', '/ai-analysis/config', { preferences });
    return response;
  } catch (error) {
    console.error('AI Config Error:', error);
    throw error;
  }
};