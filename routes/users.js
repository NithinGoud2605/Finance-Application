const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User management routes
router.get('/me', userController.getMe);
router.put('/me', userController.updateUser);
router.delete('/me', userController.deleteUser);

// User settings
router.get('/settings', userController.getSettings);
router.put('/settings', userController.updateSettings);

// API key management (business accounts only)
router.post('/api-key', userController.generateApiKey);
router.get('/api-keys', userController.listApiKeys);
router.delete('/api-key', userController.revokeApiKey);

module.exports = router;