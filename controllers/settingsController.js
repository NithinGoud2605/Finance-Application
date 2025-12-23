// controllers/settingsController.js
const { User, Organization, UserPreference } = require('../models');
const { AppError } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Profile Management
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log('Getting profile for user:', userId);
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    console.log('Profile retrieved successfully');
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;  // Fix: use req.user.id instead of destructuring
    const { firstName, lastName, name, email, phone, bio, industry } = req.body;
    
    console.log('Updating profile for user:', userId);
    console.log('Update data received:', { firstName, lastName, name, email, phone, bio, industry });

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Handle name field - either use provided name or combine firstName/lastName
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || user.name);

    const updateData = {
      email,
      phone,
      name: fullName
    };

    // Add optional fields if they exist
    if (bio !== undefined) updateData.bio = bio;
    if (industry !== undefined) updateData.industry = industry;

    console.log('Final update data:', updateData);
    await user.update(updateData);

    console.log('Profile updated successfully');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    next(error);
  }
};

exports.uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', 'NO_FILE', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Update profile image URL
    await user.update({
      profileImage: `/uploads/${file.filename}`
    });

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: { profileImage: user.profileImage }
    });
  } catch (error) {
    next(error);
  }
};

// Organization Management
exports.getOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const organization = await Organization.findByPk(orgId);
    res.json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.context;
    const { name, website, address, phone } = req.body;

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new AppError('Organization not found', 'ORG_NOT_FOUND', 404);
    }

    await organization.update({
      name,
      website,
      address,
      phone
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

// Preferences Management
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await UserPreference.findOne({
      where: { userId }
    });
    res.json({ success: true, data: preferences });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, darkMode, language } = req.body;

    const [preferences] = await UserPreference.findOrCreate({
      where: { userId },
      defaults: {
        emailNotifications,
        pushNotifications,
        darkMode,
        language
      }
    });

    if (preferences) {
      await preferences.update({
        emailNotifications,
        pushNotifications,
        darkMode,
        language
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

// Security Management
exports.getSecuritySettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'twoFactorEnabled']
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateSecuritySettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 2FA Management
exports.enable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const secret = speakeasy.generateSecret({
      name: `YourApp:${user.email}`
    });

    await user.update({
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      message: '2FA setup initiated',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      throw new AppError('Invalid verification code', 'INVALID_CODE', 400);
    }

    await user.update({ twoFactorEnabled: true });

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      throw new AppError('Invalid verification code', 'INVALID_CODE', 400);
    }

    await user.update({
      twoFactorSecret: null,
      twoFactorEnabled: false
    });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    next(error);
  }
  };
  