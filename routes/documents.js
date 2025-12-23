const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { loadOrgContext, requireOrgMembership } = require('../middlewares/organizationMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const documentController = require('../controllers/documentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Apply authentication and organization context to all routes
router.use(authenticate);
router.use(loadOrgContext);
router.use(requireOrgMembership);

// Document analytics (must be before /:id routes to avoid conflicts)
router.get('/analytics', documentController.getDocumentAnalytics);

// Document folders
router.get('/folders', documentController.getDocumentFolders);
router.post('/folders', documentController.createDocumentFolder);
router.put('/folders/:id', documentController.updateDocumentFolder);
router.delete('/folders/:id', documentController.deleteDocumentFolder);

// Basic CRUD operations
router.get('/', documentController.getDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

// Document versions and sharing
router.get('/:id/versions', documentController.getDocumentVersions);
router.post('/:id/share', documentController.shareDocument);
router.get('/:id/download', documentController.downloadDocument);

module.exports = router; 