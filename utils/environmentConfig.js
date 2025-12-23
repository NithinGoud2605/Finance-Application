/**
 * Centralized Environment Configuration Utility
 * Provides consistent URL handling across different environments
 */

const logger = require('./logger');

class EnvironmentConfig {
  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.isProduction = this.NODE_ENV === 'production';
    this.isDevelopment = this.NODE_ENV === 'development';
  }

  /**
   * Get the client origin URL (frontend URL)
   * @returns {string} The client origin URL
   */
  getClientOrigin() {
    if (this.isProduction) {
      // In production, use CLIENT_ORIGIN or fall back to production URL
      return process.env.CLIENT_ORIGIN || 'https://finorn.com';
    } else {
      // In development, use CLIENT_ORIGIN or default to localhost:5173
      return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    }
  }

  /**
   * Get the server/API URL (backend URL)
   * @returns {string} The server URL
   */
  getServerUrl() {
    if (this.isProduction) {
      // In production, use APP_URL or derive from CLIENT_ORIGIN
      return process.env.APP_URL || process.env.CLIENT_ORIGIN || 'https://finorn.com';
    } else {
      // In development, use APP_URL or default to localhost:3000
      return process.env.APP_URL || 'http://localhost:3000';
    }
  }

  /**
   * Get the API base URL
   * @returns {string} The API base URL
   */
  getApiUrl() {
    return `${this.getServerUrl()}/api`;
  }

  /**
   * Get OAuth callback URL
   * @returns {string} The OAuth callback URL
   */
  getOAuthCallbackUrl() {
    return `${this.getClientOrigin()}/auth/callback`;
  }

  /**
   * Get dashboard URL with optional token
   * @param {string} token - Optional token to include in URL
   * @returns {string} The dashboard URL
   */
  getDashboardUrl(token = null) {
    const baseUrl = `${this.getClientOrigin()}/dashboard`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  }

  /**
   * Get invitation acceptance URL
   * @param {string} token - Invitation token
   * @param {string} orgId - Organization ID
   * @param {string} email - Email address
   * @returns {string} The invitation URL
   */
  getInvitationUrl(token, orgId, email) {
    const baseUrl = `${this.getClientOrigin()}/accept-invite`;
    const params = new URLSearchParams({
      token,
      orgId,
      email
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get public view URL for documents
   * @param {string} type - Document type (invoice, contract)
   * @param {string} token - Document token
   * @returns {string} The public view URL
   */
  getPublicViewUrl(type, token) {
    return `${this.getClientOrigin()}/public/${type}/${token}`;
  }

  /**
   * Get sign-up URL with optional invite parameters
   * @param {Object} params - Optional parameters
   * @param {string} params.email - Email address
   * @param {string} params.invite - Invite token
   * @param {string} params.orgId - Organization ID
   * @returns {string} The sign-up URL
   */
  getSignUpUrl(params = {}) {
    const baseUrl = `${this.getClientOrigin()}/sign-up`;
    const urlParams = new URLSearchParams();
    
    if (params.email) urlParams.set('email', params.email);
    if (params.invite) urlParams.set('invite', params.invite);
    if (params.orgId) urlParams.set('orgId', params.orgId);
    
    return urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl;
  }

  /**
   * Log current environment configuration
   */
  logConfig() {
    logger.info('Environment Configuration:', {
      NODE_ENV: this.NODE_ENV,
      clientOrigin: this.getClientOrigin(),
      serverUrl: this.getServerUrl(),
      apiUrl: this.getApiUrl(),
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment
    });
  }

  /**
   * Validate that all required environment variables are set
   * @returns {Object} Validation result with missing variables
   */
  validateConfig() {
    const missing = [];
    const warnings = [];

    // Check CLIENT_ORIGIN
    if (!process.env.CLIENT_ORIGIN) {
      if (this.isProduction) {
        missing.push('CLIENT_ORIGIN (required in production)');
      } else {
        warnings.push('CLIENT_ORIGIN (using default localhost:5173)');
      }
    }

    // Check APP_URL
    if (!process.env.APP_URL) {
      if (this.isProduction) {
        warnings.push('APP_URL (deriving from CLIENT_ORIGIN)');
      } else {
        warnings.push('APP_URL (using default localhost:3000)');
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
      warnings
    };
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig; 