const router = require('express').Router();
const invoiceCtrl = require('../controllers/invoiceController');
const { authenticate } = require('../middlewares/authMiddleware');

// File upload route must come before param routes to avoid conflicts
router.post(
  '/upload',
  authenticate,
  invoiceCtrl.upload.single('file'),
  invoiceCtrl.uploadInvoice,
  (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large (max 20 MB)' 
      });
    }
    next(err);
  }
);

// PDF-only upload route (no invoice creation)
router.post(
  '/upload-pdf',
  authenticate,
  invoiceCtrl.upload.single('file'),
  invoiceCtrl.uploadPdfOnly,
  (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large (max 20 MB)' 
      });
    }
    next(err);
  }
);

// Overview and aggregated data
router.get('/overview', authenticate, invoiceCtrl.getInvoiceOverview);
router.get('/aggregated', authenticate, invoiceCtrl.getAggregatedInvoices);
router.get('/report', authenticate, invoiceCtrl.report);

// Basic CRUD routes
router.get('/', authenticate, invoiceCtrl.getAllInvoices);
router.post('/', authenticate, invoiceCtrl.createInvoice);
router.get('/:id', authenticate, invoiceCtrl.getInvoiceById);
router.put('/:id', authenticate, invoiceCtrl.updateInvoice);
router.delete('/:id', authenticate, invoiceCtrl.deleteInvoice);

// Additional invoice actions
router.get('/:id/pdf', authenticate, invoiceCtrl.getInvoicePdf);
router.post('/:id/send', authenticate, invoiceCtrl.sendInvoice);

module.exports = router;
