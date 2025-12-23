// routes/public.js - Public routes for viewing invoices and contracts
const router = require('express').Router();
const invoiceController = require('../controllers/invoiceController');
const contractController = require('../controllers/contractController');

// Public invoice viewing (no authentication required)
router.get('/invoice/:token', invoiceController.getPublicInvoice);

// Public contract viewing (no authentication required)
router.get('/contract/:token', contractController.getPublicContract);

// Send invoice copy to email (no authentication required)
router.post('/send-invoice-copy', invoiceController.sendPublicInvoiceCopy);

// Send contract copy to email (no authentication required)
router.post('/send-contract-copy', contractController.sendPublicContractCopy);

// Get invoice PDF URL (no authentication required)
router.get('/invoice-pdf/:token', invoiceController.getPublicInvoicePdf);

// Get contract PDF URL (no authentication required)
router.get('/contract-pdf/:token', contractController.getPublicContractPdf);

module.exports = router; 