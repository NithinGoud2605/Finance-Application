const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Basic CRUD operations
router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// Client activity and analytics
router.get('/:id/activity', clientController.getClientActivity);
router.get('/analytics', clientController.getClientAnalytics);

// Client relationships
router.get('/:id/projects', clientController.getClientProjects);
router.get('/:id/invoices', clientController.getClientInvoices);
router.get('/:id/contracts', clientController.getClientContracts);

// Search
router.get('/search', clientController.searchClients);

module.exports = router;