const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.generateApiKey);
router.get('/', userController.listApiKeys);
router.delete('/', userController.revokeApiKey);

module.exports = router;