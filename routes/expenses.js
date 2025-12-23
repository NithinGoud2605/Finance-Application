const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authMiddleware');

// Receipt upload route (must come before param routes)
router.post('/upload-receipt', 
  authenticate, 
  expenseController.upload.single('receipt'),
  expenseController.uploadReceipt,
  (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large (max 10 MB)' 
      });
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next(err);
  }
);

// Basic expense operations (for all account types)
router.get('/', authenticate, expenseController.getAllExpenses);
router.post('/', authenticate, expenseController.createExpense);
router.get('/overview', authenticate, expenseController.getExpenseOverview);
router.get('/:id', authenticate, expenseController.getExpenseById);
router.get('/:id/receipt', authenticate, expenseController.getReceiptUrl);
router.put('/:id', authenticate, expenseController.updateExpense);
router.delete('/:id', authenticate, expenseController.deleteExpense);

module.exports = router;