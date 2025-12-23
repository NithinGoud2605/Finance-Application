// routes/contracts.js
const router = require('express').Router();
const contractController = require('../controllers/contractController');
const { authenticate } = require('../middlewares/authMiddleware');

// Collection endpoints
router.get('/', authenticate, contractController.getAllContracts);
router.post('/', authenticate, contractController.createContract);

// File upload endpoint
router.post('/upload', 
  authenticate,
  contractController.upload.single('file'), 
  contractController.uploadContract
);

// PDF-only upload endpoint (for generated PDFs) - enhanced with error handling
router.post('/upload-pdf', 
  authenticate,
  (req, res, next) => {
    console.log('=== CONTRACT PDF UPLOAD ROUTE HIT ===');
    console.log('User ID:', req.user?.id);
    console.log('Organization ID from header:', req.headers['x-organization-id']);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('File present:', !!req.file);
    next();
  },
  contractController.upload.single('file'), 
  contractController.uploadPdfOnly,
  // Error handling middleware specifically for file uploads
  (err, req, res, next) => {
    console.error('Contract PDF upload error middleware:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large (max 20 MB)' 
      });
    }
    if (err.message && err.message.includes('Only PDF files')) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next(err);
  }
);

// Single contract endpoints
router.get('/:id', authenticate, contractController.getContract);
router.put('/:id', authenticate, contractController.updateContract);
router.delete('/:id', authenticate, contractController.deleteContract);

// Contract actions
router.post('/:id/approve', authenticate, contractController.approveContract);
router.post('/:id/cancel', authenticate, contractController.cancelContract);
router.post('/:id/renew', authenticate, contractController.renewContract);
router.post('/:id/sign', authenticate, contractController.sendForSignature);
router.post('/:id/send', authenticate, contractController.sendContract);
router.get('/:id/pdf', authenticate, contractController.getContractPdf);

module.exports = router;
