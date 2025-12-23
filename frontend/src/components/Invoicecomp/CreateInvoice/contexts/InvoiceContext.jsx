// /frontend/src/components/Invoicecomp/CreateInvoice/contexts/InvoiceContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

const InvoiceContext = createContext();

// A valid transparent 1×1 PNG fallback data URL
const transparentFallbackLogo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const InvoiceProvider = ({ children }) => {
  const [invoicePdf, setInvoicePdf] = useState({ size: 0, url: '' });
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Real-time invoice data state
  const [invoiceData, setInvoiceData] = useState({
    sender: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
          zipCode: '',
    country: '',
      registrationNumber: '',
      logo: null
    },
    receiver: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
          zipCode: '',
    country: '',
    companyName: ''
    },
    details: {
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      pdfTemplate: 1,
      items: [],
      notes: '',
      additionalNotes: '',
      paymentTerms: ''
    },
    charges: {
      subTotal: 0,
      tax: 0,
      taxAmount: 0,
      discount: 0,
      shipping: 0,
      totalAmount: 0
    },
      paymentInformation: {
        bankName: '',
        accountName: '',
        accountNumber: '',
      routingNumber: '',
      swiftCode: ''
    },
    status: 'DRAFT'
  });

  // Update invoice data with deep merge
  const updateInvoiceData = useCallback((updates) => {
    setInvoiceData(prev => {
      const newData = { ...prev };

      // Deep merge function
      const deepMerge = (target, source) => {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      };
      
      return deepMerge(newData, updates);
    });
  }, []);

  // Calculate totals automatically when items or charges change
  const calculateTotals = useCallback((data = invoiceData) => {
    const { items = [] } = data.details || {};
    const { discount = 0, shipping = 0, tax = 0 } = data.charges || {};
    
    // Calculate subtotal from items
    const subTotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    // Get charges as numbers
    const discountAmount = Number(discount) || 0;
    const shippingAmount = Number(shipping) || 0;
    const taxRate = Number(tax) || 0;
    
    // Calculate tax amount (tax is applied to subtotal + shipping - discount)
    const taxableAmount = Math.max(0, subTotal + shippingAmount - discountAmount);
    const taxAmount = taxableAmount * (taxRate / 100);
    
    // Calculate total
    const totalAmount = Math.max(0, taxableAmount + taxAmount);
    
    return {
      subTotal: Math.max(0, subTotal),
      taxAmount: Math.max(0, taxAmount),
      totalAmount: Math.max(0, totalAmount),
      discount: discountAmount,
      shipping: shippingAmount,
      tax: taxRate
    };
  }, [invoiceData]);

  // Auto-calculate totals when items or charges change
  useEffect(() => {
    const newCharges = calculateTotals(invoiceData);
    
    // Only update if there's a meaningful difference to prevent infinite loops
    const current = invoiceData.charges || {};
    const hasChanged = Math.abs(newCharges.subTotal - (current.subTotal || 0)) > 0.01 ||
                      Math.abs(newCharges.taxAmount - (current.taxAmount || 0)) > 0.01 ||
                      Math.abs(newCharges.totalAmount - (current.totalAmount || 0)) > 0.01 ||
                      Math.abs(newCharges.discount - (current.discount || 0)) > 0.01 ||
                      Math.abs(newCharges.shipping - (current.shipping || 0)) > 0.01 ||
                      Math.abs(newCharges.tax - (current.tax || 0)) > 0.01;
    
    if (hasChanged) {
      console.log('Updating charges:', newCharges); // Debug log
      setInvoiceData(prev => ({
        ...prev,
        charges: {
          ...prev.charges,
          ...newCharges
        }
      }));
    }
  }, [
    // Track items changes more precisely
    invoiceData.details?.items?.length,
    JSON.stringify(invoiceData.details?.items?.map(item => ({ 
      quantity: Number(item.quantity) || 0, 
      unitPrice: Number(item.unitPrice) || 0 
    }))),
    // Track charges inputs
    Number(invoiceData.charges?.discount) || 0,
    Number(invoiceData.charges?.shipping) || 0,
    Number(invoiceData.charges?.tax) || 0,
    calculateTotals
  ]);

  // Format currency utility
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Number(amount) || 0);
  }, []);
  
  // PDF Generation with better error handling
  const generatePdf = useCallback(async (elementId = 'invoice-preview', formData = null) => {
    setIsGenerating(true);
    try {
      console.log('Starting PDF generation...');
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Invoice preview element not found');
      }

      // Add class to disable scaling during PDF generation
      element.classList.add('pdf-generating');

      // Use provided form data or current invoice data
      const dataForFilename = formData || invoiceData;
      
      // Optimized PDF generation options
      const options = {
        margin: 0.25, // Simple uniform margins to match live preview
        filename: `invoice-${dataForFilename.details?.invoiceNumber || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      console.log('Generating PDF blob...');
      const pdfBlob = await html2pdf().from(element).set(options).output('blob');
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF blob is empty');
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setInvoicePdf({ size: pdfBlob.size, url });

      console.log('PDF generated successfully!');
      return url;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      // Always remove the class after PDF generation
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.remove('pdf-generating');
      }
      setIsGenerating(false);
    }
  }, [invoiceData]);

  // PDF utility functions
  const previewPdfInTab = useCallback(() => {
    if (invoicePdf.url) {
      window.open(invoicePdf.url, '_blank');
    }
  }, [invoicePdf.url]);

  const downloadPdf = useCallback(() => {
    if (invoicePdf.url) {
      const link = document.createElement('a');
      link.href = invoicePdf.url;
      link.download = `invoice-${invoiceData.details.invoiceNumber || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [invoicePdf.url, invoiceData.details.invoiceNumber]);

  const printPdf = useCallback(() => {
    if (invoicePdf.url) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = invoicePdf.url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
      iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  }, [invoicePdf.url]);

  const removeFinalPdf = useCallback(() => {
    if (invoicePdf.url) {
      URL.revokeObjectURL(invoicePdf.url);
    }
    setInvoicePdf({ size: 0, url: '' });
  }, [invoicePdf.url]);

  // Reset invoice
  const resetInvoice = useCallback(() => {
    removeFinalPdf();
    setInvoiceData({
      sender: {
        name: '', email: '', address: '', city: '', state: '', 
        zipCode: '', country: '', logo: null
      },
      receiver: {
        name: '', email: '', address: '', city: '', state: '', 
        zipCode: '', country: '', companyName: ''
      },
      details: {
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        pdfTemplate: 1,
        items: [],
        notes: '',
        additionalNotes: '',
        paymentTerms: ''
      },
      charges: { subTotal: 0, tax: 0, taxAmount: 0, discount: 0, shipping: 0, totalAmount: 0 },
      paymentInformation: { bankName: '', accountName: '', accountNumber: '', routingNumber: '', swiftCode: '' },
      status: 'DRAFT'
    });
  }, [removeFinalPdf]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (invoicePdf.url) {
        URL.revokeObjectURL(invoicePdf.url);
      }
    };
  }, [invoicePdf.url]);

  const contextValue = {
    // State
    invoiceData,
    invoicePdf,
        savedInvoices,
    isGenerating,
    
    // Data management
    updateInvoiceData,
    calculateTotals,
    
    // PDF operations
    generatePdf,
        previewPdfInTab,
        downloadPdf,
        printPdf,
        removeFinalPdf,
    resetInvoice,
    
    // Utilities
        formatCurrency,
    
    // Legacy support (for backward compatibility)
    invoiceFormData: invoiceData,
    updateInvoiceFormData: updateInvoiceData,
    onFormSubmitHtml2pdf: () => generatePdf(),
    calculateTotal: calculateTotals,
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoiceContext must be used within InvoiceProvider');
  }
  return context;
};
