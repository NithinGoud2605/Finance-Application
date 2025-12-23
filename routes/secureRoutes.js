const express = require('express');
const router = express.Router();
const { Invoice, Contract } = require('../models');
const supabaseStorage = require('../utils/supabaseStorage');

// Secure PDF proxy for public invoices
router.get('/pdf/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invoice = await Invoice.findOne({
      where: { publicViewToken: token },
      attributes: ['id', 'pdfUrl', 'invoiceNumber']
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({ error: 'PDF not available for this invoice' });
    }

    // Download file from Supabase Storage
    const fileBuffer = await supabaseStorage.downloadFile(invoice.pdfUrl);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the buffer
    res.send(fileBuffer);

  } catch (err) {
    console.error('Error in secure PDF proxy:', err);
    res.status(500).json({ error: 'Failed to access PDF' });
  }
});

// Secure PDF proxy for public contracts  
router.get('/contract-pdf/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const contract = await Contract.findOne({
      where: { publicViewToken: token },
      attributes: ['id', 'pdfUrl', 'contractUrl', 'title']
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or link expired' });
    }

    const pdfKey = contract.pdfUrl || contract.contractUrl;
    if (!pdfKey) {
      return res.status(404).json({ error: 'PDF not available for this contract' });
    }

    // Security validation - reject any URLs
    if (pdfKey.startsWith('https://') || pdfKey.includes('.amazonaws.com') || pdfKey.includes('supabase.co/storage')) {
      console.error('Security violation: URLs not allowed in secure proxy:', pdfKey);
      return res.status(400).json({ error: 'Invalid file reference format' });
    }

    // Download file from Supabase Storage
    const fileBuffer = await supabaseStorage.downloadFile(pdfKey);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Contract_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the buffer
    res.send(fileBuffer);

  } catch (err) {
    console.error('Error in secure contract PDF proxy:', err);
    res.status(500).json({ error: 'Failed to access PDF' });
  }
});

module.exports = router;
