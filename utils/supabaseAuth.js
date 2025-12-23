const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

// Admin client (for server-side operations with full permissions)
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Public client (for client-side operations - uses anon key)
const supabasePublic = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Sign up a new user
 * @param {string} email 
 * @param {string} password 
 * @param {object} metadata - User metadata (name, accountType, etc.)
 * @returns {{ data: { user, session }, error }}
 */
async function signUp(email, password, metadata = {}) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    // Use admin API to create user (allows setting metadata and bypasses email confirmation if needed)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (skip verification email)
      user_metadata: metadata
    });
    
    if (error) {
      logger.error('Supabase signup error:', error);
      return { data: null, error };
    }
    
    return {
      data: {
        user: data.user,
        session: null // Admin API doesn't return a session
      },
      error: null
    };
  } catch (error) {
    logger.error('Supabase signup error:', error);
    return { data: null, error };
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {{ data: { user, session }, error }}
 */
async function signIn(email, password) {
  try {
    if (!supabasePublic) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logger.error('Supabase signin error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    logger.error('Supabase signin error:', error);
    return { data: null, error };
  }
}

/**
 * Verify a JWT token and get the user
 * @param {string} token - JWT access token
 * @returns {object|null} User object or null if invalid
 */
async function verifyToken(token) {
  try {
    if (!supabaseAdmin) {
      logger.error('Supabase not configured for token verification');
      return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      logger.error('Token verification error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    logger.error('Token verification error:', error);
    return null;
  }
}

/**
 * Get user by ID (admin)
 * @param {string} userId 
 * @returns {{ data: { user }, error }}
 */
async function getUser(userId) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error) {
      logger.error('Get user error:', error);
      return { data: null, error };
    }
    
    return { data: { user }, error: null };
  } catch (error) {
    logger.error('Get user error:', error);
    return { data: null, error };
  }
}

/**
 * Update user metadata (admin)
 * @param {string} userId 
 * @param {object} updates - User updates (user_metadata, email, etc.)
 * @returns {{ data: { user }, error }}
 */
async function updateUser(userId, updates) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data: { user }, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updates
    );
    
    if (error) {
      logger.error('Update user error:', error);
      return { data: null, error };
    }
    
    return { data: { user }, error: null };
  } catch (error) {
    logger.error('Update user error:', error);
    return { data: null, error };
  }
}

/**
 * Reset password (send reset email)
 * @param {string} email 
 * @returns {{ data, error }}
 */
async function resetPassword(email) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/reset-password`
      }
    );
    
    if (error) {
      logger.error('Reset password error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    logger.error('Reset password error:', error);
    return { data: null, error };
  }
}

/**
 * Refresh session
 * @param {string} refreshToken 
 * @returns {{ data: { session }, error }}
 */
async function refreshSession(refreshToken) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      logger.error('Refresh session error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    logger.error('Refresh session error:', error);
    return { data: null, error };
  }
}

/**
 * Resend confirmation email
 * @param {string} email 
 * @returns {{ data, error }}
 */
async function resendConfirmation(email) {
  try {
    if (!supabasePublic) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabasePublic.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      logger.error('Resend confirmation error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    logger.error('Resend confirmation error:', error);
    return { data: null, error };
  }
}

/**
 * Sign out user (client-side)
 */
async function signOut() {
  try {
    if (!supabasePublic) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabasePublic.auth.signOut();
    
    if (error) {
      logger.error('Sign out error:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    logger.error('Sign out error:', error);
    return { error };
  }
}

/**
 * Delete user (admin)
 * @param {string} userId 
 * @returns {{ data, error }}
 */
async function deleteUser(userId) {
  try {
    if (!supabaseAdmin) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      logger.error('Delete user error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    logger.error('Delete user error:', error);
    return { data: null, error };
  }
}

module.exports = {
  signUp,
  signIn,
  verifyToken,
  getUser,
  updateUser,
  resetPassword,
  refreshSession,
  resendConfirmation,
  signOut,
  deleteUser,
  supabaseAdmin,
  supabasePublic,
  // Legacy exports for backward compatibility
  supabaseAuth: {
    signUp,
    signIn,
    verifyToken,
    getUser,
    updateUser,
    resetPassword,
    refreshSession,
    resendConfirmation,
    signOut,
    deleteUser
  }
};
