const { User, Organization } = require('../models');
const { ValidationError } = require('sequelize');
const logger = require('../utils/logger');

// GET /api/users/me or /api/auth/me - Get current user profile
exports.getMe = exports.getCurrentUser = async (req, res) => {
  try {
    // Ensure req.user exists
    if (!req.user || !req.user.id) {
      logger.error('Authentication failed - user not in request', { 
        headers: req.headers,
        user: req.user
      });
      return res.status(401).json({ error: 'Authentication required - user not found in request' });
    }
    
    const userId = req.user.id;
    logger.debug('Fetching fresh user data', { userId });
    
    // Fetch user with organizations
    const user = await User.findByPk(userId, {
      include: [{
        model: Organization,
        through: { attributes: ['role'] }
      }]
    });

    if (!user) {
      logger.warn('User not found in database', { userId });
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate subscription status
    const today = new Date();
    const subscriptionIsActive = 
      user.isSubscribed || 
      (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > today) ||
      (user.subscriptionPlanId && !user.cancelScheduled);

    // Get the raw user data
    const userData = user.get({ plain: true });
    
    // Only add computed fields without altering existing ones
    userData.isSubscribed = subscriptionIsActive;
    
    logger.debug('User data retrieved successfully', { 
      userId, 
      hasOrgData: userData.Organizations && userData.Organizations.length > 0
    });
    
    // Disable all caching with comprehensive headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Data-Last-Modified': new Date().toISOString()
    });
    
    // Return raw user data directly from DB
    return res.json(userData);
  } catch (error) {
    logger.error('Error in getCurrentUser:', { 
      error: error.message,
      stack: error.stack,
      user: req.user?.id
    });
    return res.status(500).json({ 
      error: 'Failed to fetch user data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT /api/users/me - Update current user profile
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all allowed fields from the request body
    const allowedFields = [
      'name', 'email', 'phone', 'timezone', 'language',
      'industry', 'state', 'country', 'city', 'address', 'zipCode',
      'businessName', 'taxId', 'department', 'jobTitle', 'employeeId',
      'notifications', 'preferences', 'businessSize', 'industrySpecificSettings'
    ];
    
    // Filter updates to only include allowed fields
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Update the user with all provided fields
    await user.update(updates);
    
    // Fetch the fresh user data
    const updatedUser = await User.findByPk(req.user.id);
    
    // Disable caching for the response
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    // Return the updated user data
    res.json(updatedUser.get({ plain: true }));
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in updateUser:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// GET /api/users/me/settings - Get user settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const settings = {
      // Common settings
      notifications: user.notifications || {},
      theme: user.theme || 'light',
      language: user.language || 'en',
      timezone: user.timezone || 'UTC',
      
      // Account type specific settings
      features: user.accountType === 'business' ? {
        emailNotifications: true,
        smsNotifications: true,
        apiAccess: true,
        customReports: true,
        batchOperations: true,
        teamManagement: true
      } : {
        emailNotifications: true,
        smsNotifications: false,
        apiAccess: false,
        customReports: false,
        batchOperations: false,
        teamManagement: false
      }
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error in getSettings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
};

// PUT /api/users/me/settings - Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const updates = {};

    // Common settings
    if (req.body.notifications) updates.notifications = req.body.notifications;
    if (req.body.theme) updates.theme = req.body.theme;
    if (req.body.language) updates.language = req.body.language;
    if (req.body.timezone) updates.timezone = req.body.timezone;

    // Business account specific settings
    if (user.accountType === 'business') {
      if (req.body.emailNotifications !== undefined) {
        updates.emailNotifications = req.body.emailNotifications;
      }
      if (req.body.smsNotifications !== undefined) {
        updates.smsNotifications = req.body.smsNotifications;
      }
      if (req.body.apiSettings) {
        updates.apiSettings = req.body.apiSettings;
      }
    }

    await user.update(updates);
    res.json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in updateSettings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// DELETE /api/users/me - Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    // Handle business account specific cleanup
    if (user.accountType === 'business') {
      // Clean up team memberships
      await user.removeOrganizations();
      
      // Clean up API keys
      if (user.apiKeys) {
        // Implement API key cleanup logic
      }
    }

    await user.destroy();
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
};

// POST /api/users/me/api-key - Generate API key (Business accounts only)
exports.generateApiKey = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user.accountType !== 'business') {
      return res.status(403).json({ 
        error: 'API key generation is only available for business accounts' 
      });
    }

    // Implement API key generation logic
    const apiKey = 'generated-api-key'; // Replace with actual implementation
    
    await user.update({
      apiKeys: [...(user.apiKeys || []), apiKey]
    });

    res.json({ apiKey });
  } catch (error) {
    logger.error('Error in generateApiKey:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

// GET /api/users/me/api-keys - List API keys (Business accounts only)
exports.listApiKeys = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user.accountType !== 'business') {
      return res.status(403).json({ 
        error: 'API key management is only available for business accounts' 
      });
    }

    res.json({ apiKeys: user.apiKeys || [] });
  } catch (error) {
    logger.error('Error in listApiKeys:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
};

// DELETE /api/users/me/api-key - Revoke API key (Business accounts only)
exports.revokeApiKey = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user.accountType !== 'business') {
      return res.status(403).json({ 
        error: 'API key management is only available for business accounts' 
      });
    }

    const { keyToRevoke } = req.body;
    const updatedKeys = (user.apiKeys || []).filter(key => key !== keyToRevoke);
    
    await user.update({ apiKeys: updatedKeys });
    
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    logger.error('Error in revokeApiKey:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

module.exports = exports;
