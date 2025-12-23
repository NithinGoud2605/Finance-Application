import React, { useMemo, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { useThemeMode } from '../../../../contexts/ThemeModeContext';
import DynamicInvoiceTemplate from '../templates/DynamicInvoiceTemplate';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const LivePreview = ({ formData }) => {
  const { mode, isDarkMode } = useThemeMode();
  const theme = useTheme();
  const [pdfMode, setPdfMode] = useState(true);
  
  // Enable PDF mode for preview to ensure consistent rendering
  useEffect(() => {
    setPdfMode(true);
  }, []);

  // Create preview data from form data with proper structure
  const previewData = useMemo(() => {
    if (!formData) {
      return {
        sender: { 
          name: '', 
          email: '', 
          address: '', 
          city: '', 
          zipCode: '', 
          country: '', 
          phone: '',
          taxId: '',
          registrationNumber: '',
          logo: null
        },
        receiver: { 
          name: '', 
          email: '', 
          address: '', 
          city: '', 
          zipCode: '', 
          country: '', 
          phone: '',
          companyName: ''
        },
        details: { 
          invoiceNumber: `INV-${Date.now()}`, 
          invoiceDate: new Date().toISOString().split('T')[0],
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currency: 'USD', 
          items: [], 
          charges: [],
          pdfTemplate: 1,
          notes: '',
          additionalNotes: '',
          paymentTerms: '',
          
          paymentInformation: {}
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
          bankBranch: '',
          accountName: '',
          accountNumber: '',
          swiftCode: '',
          routingNumber: '',
          paypalEmail: '',
          merchantId: '',
          additionalInstructions: ''
        }
      };
    }

    // Merge form data with defaults, ensuring proper structure
    const merged = {
      sender: {
        name: formData.sender?.name || '',
        email: formData.sender?.email || '',
        address: formData.sender?.address || '',
        city: formData.sender?.city || '',
        state: formData.sender?.state || '',
        zipCode: formData.sender?.zipCode || '',
        country: formData.sender?.country || '',

        logo: formData.sender?.logo || null
      },
      receiver: {
        name: formData.receiver?.name || '',
        email: formData.receiver?.email || '',
        address: formData.receiver?.address || '',
        city: formData.receiver?.city || '',
        state: formData.receiver?.state || '',
        zipCode: formData.receiver?.zipCode || '',
        country: formData.receiver?.country || '',

        companyName: formData.receiver?.companyName || ''
      },
      details: {
        invoiceNumber: formData.details?.invoiceNumber || `INV-${Date.now()}`,
        invoiceDate: formData.details?.issueDate || formData.details?.invoiceDate || new Date().toISOString().split('T')[0],
        issueDate: formData.details?.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.details?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: formData.details?.currency || 'USD',
        pdfTemplate: formData.details?.pdfTemplate || 1,
        items: formData.details?.items || [],
        charges: formData.details?.charges || [],
        notes: formData.details?.notes || '',
        additionalNotes: formData.details?.additionalNotes || '',
        paymentTerms: formData.details?.paymentTerms || '',

        invoiceLogo: formData.details?.invoiceLogo || null,
        signature: formData.details?.signature || null,
        paymentInformation: formData.details?.paymentInformation || formData.paymentInformation || {}
      },
      charges: {
        subTotal: formData.charges?.subTotal || 0,
        tax: formData.charges?.tax || 0,
        taxAmount: formData.charges?.taxAmount || 0,
        discount: formData.charges?.discount || 0,
        shipping: formData.charges?.shipping || 0,
        totalAmount: formData.charges?.totalAmount || 0
      },
      paymentInformation: {
        bankName: formData.paymentInformation?.bankName || '',
        bankBranch: formData.paymentInformation?.bankBranch || '',
        accountName: formData.paymentInformation?.accountName || '',
        accountNumber: formData.paymentInformation?.accountNumber || '',
        swiftCode: formData.paymentInformation?.swiftCode || '',
        routingNumber: formData.paymentInformation?.routingNumber || '',
        paypalEmail: formData.paymentInformation?.paypalEmail || '',
        merchantId: formData.paymentInformation?.merchantId || '',
        additionalInstructions: formData.paymentInformation?.additionalInstructions || ''
      },
      status: formData.status || 'DRAFT'
    };

    return merged;
  }, [formData]);

  // Check if we have meaningful data to show
  const hasData = useMemo(() => {
    return previewData.sender?.name || 
           previewData.receiver?.name || 
           previewData.details?.items?.length > 0 ||
           previewData.details?.invoiceNumber !== `INV-${Date.now()}`;
  }, [previewData]);

  if (!previewData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        position: 'relative',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {hasData ? (
        <Box
          id="invoice-preview"
          sx={{
            width: '133.33%', // Compensate for scale (1/0.75)
            height: 'auto',
            minHeight: '100%',
            backgroundColor: '#ffffff', // Force white background for PDF mode
            color: '#000000', // Force black text for PDF mode
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            overflow: 'visible',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            
            // Optimized scaling for preview only - removed for PDF generation
            transform: 'scale(0.75)',
            transformOrigin: 'top center',
            margin: '0 auto',
            left: '-16.67%', // Center the scaled content ((133.33-100)/2)
            
            // Override transforms during PDF generation
            '&.pdf-generating': {
              transform: 'none !important',
              width: '100% !important',
              left: '0 !important',
              margin: '0 !important'
            },
            
            // Global styling for perfect fit and print-ready appearance
            '& *': {
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            },
            
            // Invoice container styling
            '& .invoice-container, & > div > *': {
              padding: '28px !important',
              margin: '0 !important',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: '#ffffff',
              color: '#000000',
            },
            
            // Typography optimization for readability and PDF generation
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              margin: '0 0 12px 0 !important',
              fontWeight: 'bold',
              lineHeight: 1.3,
              color: '#000000',
              fontFamily: 'inherit',
            },
            '& p, & div': {
              margin: '0 0 8px 0 !important',
              lineHeight: 1.4,
              color: '#000000',
              fontFamily: 'inherit',
            },
            
            // Table styling for perfect fit and professional appearance
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              margin: '16px 0 !important',
              fontSize: '1em',
              backgroundColor: '#ffffff',
              border: `1px solid #e0e0e0`,
            },
            '& th, & td': {
              padding: '10px 12px !important',
              borderBottom: `1px solid #e0e0e0`,
              borderRight: `1px solid #e0e0e0`,
              textAlign: 'left',
              fontSize: '0.95em',
              lineHeight: 1.3,
              color: '#000000',
              backgroundColor: '#ffffff',
            },
            '& th': {
              backgroundColor: theme.palette.primary.main,
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '0.9em',
              borderBottom: `2px solid ${theme.palette.primary.dark}`,
            },
            
            // Image optimization for logos and signatures
            '& img': {
              maxWidth: '180px !important',
              maxHeight: '140px !important',
              height: 'auto',
              objectFit: 'contain',
              backgroundColor: 'transparent',
            },
            
            // Material-UI component overrides for consistency
            '& .MuiBox-root': {
              marginBottom: '16px !important',
              backgroundColor: 'transparent',
            },
            '& .MuiTypography-h4': {
              fontSize: '1.5rem !important',
              marginBottom: '12px !important',
              color: theme.palette.primary.main,
            },
            '& .MuiTypography-h5': {
              fontSize: '1.3rem !important',
              marginBottom: '10px !important',
              color: theme.palette.primary.main,
            },
            '& .MuiTypography-h6': {
              fontSize: '1.2rem !important',
              marginBottom: '8px !important',
              color: theme.palette.primary.main,
            },
            '& .MuiTypography-body1': {
              fontSize: '1rem !important',
              lineHeight: '1.4 !important',
              color: '#000000',
            },
            '& .MuiTypography-body2': {
              fontSize: '0.95rem !important',
              lineHeight: '1.3 !important',
              color: '#333333',
            },
            '& .MuiTypography-caption': {
              fontSize: '0.85rem !important',
              lineHeight: '1.2 !important',
              color: '#333333',
            },
            
            // Specific spacing and layout adjustments
            '& > div': {
              gap: '12px !important',
              backgroundColor: '#ffffff',
            },
            
            // Payment terms and notes styling
            '& .payment-terms, & .notes-section': {
              marginTop: '20px !important',
              padding: '12px !important',
              border: `1px solid #e0e0e0`,
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            },
            
            // Payment information styling
            '& .payment-information': {
              marginTop: '20px !important',
              padding: '16px !important',
              border: `2px solid ${theme.palette.primary.main}`,
              borderRadius: '8px',
              backgroundColor: '#f0f4ff',
            },
            
            // Signature and footer areas
            '& .signature-area': {
              marginTop: '30px !important',
              minHeight: '80px !important',
              borderTop: `2px solid ${theme.palette.primary.main}`,
              paddingTop: '20px !important',
            },
            
            // Business terms sections
            '& .terms-conditions, & .late-payment, & .custom-clauses': {
              marginTop: '20px !important',
              padding: '12px !important',
              border: `1px solid #e0e0e0`,
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            },
            
            // Ensure proper page breaks for PDF
            '& .page-break-avoid': {
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            },
            
            // Color overrides for PDF mode
            '& .MuiGrid-root': {
              backgroundColor: 'transparent !important',
            },
            
            // Fix any remaining color issues for PDF
            '& *[style*="color"]': {
              color: '#000000 !important',
            },
          }}
        >
          <DynamicInvoiceTemplate 
            {...previewData} 
            forPdf={true}
            paymentInformation={previewData.paymentInformation}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 4,
            textAlign: 'center',
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DescriptionIcon fontSize="small" />
            Live Invoice Preview
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2, fontSize: '0.9rem' }}>
            Start filling out the form to see your invoice preview in real-time
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> Perfect A4 Format
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> Real-time Updates
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> Print-ready Layout
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> All Data Included
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.8rem', mt: 2 }}>
            Industry-standard invoice design with complete payment information
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LivePreview;

