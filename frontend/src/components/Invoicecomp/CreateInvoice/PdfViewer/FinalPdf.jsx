import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Stack,
  Paper,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { 
  ArrowBack, 
  Download, 
  Save,
  CheckCircle,
  Edit,
  Description,
  TaskAlt
} from '@mui/icons-material';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import { updateInvoice, uploadPdfOnly, createInvoice } from '../../../../services/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const FinalPdf = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    invoicePdf,
    invoiceData,
    removeFinalPdf,
    previewPdfInTab,
    downloadPdf,
    printPdf,
  } = useInvoiceContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);

  if (!invoicePdf?.url) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No PDF Available
        </Typography>
        <Button 
          variant="outlined" 
          onClick={removeFinalPdf} 
          startIcon={<ArrowBack />}
        >
          Back to Live Preview
        </Button>
      </Box>
    );
  }

  // Function to validate PDF blob
  const validatePdfBlob = async (url) => {
    try {
      console.log('Validating PDF blob from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Invalid blob URL response: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob validation result:', {
        size: blob.size,
        type: blob.type,
        sizeKB: (blob.size / 1024).toFixed(2)
      });
      
      if (blob.size === 0) {
        throw new Error('PDF blob is empty (0 bytes)');
      }
      
      if (blob.size < 1024) {
        console.warn('Warning: PDF blob is very small, may be corrupted');
      }
      
      if (!blob.type.includes('application/pdf') && !blob.type.includes('octet-stream')) {
        console.warn('Warning: Blob type is not PDF:', blob.type);
      }
      
      return blob;
    } catch (error) {
      console.error('PDF blob validation failed:', error);
      throw new Error(`PDF validation failed: ${error.message}`);
    }
  };

  // Enhanced save function with draft option
  const handleSaveAsDraft = async () => {
    setIsUploading(true);
    try {
      console.log('=== SAVING INVOICE AS DRAFT ===');
      console.log('Invoice data:', invoiceData);
      console.log('Invoice PDF:', invoicePdf);

      // Step 1: Validate PDF availability
      if (!invoicePdf?.url) {
        throw new Error('No PDF available. Please generate the PDF first.');
      }

      // Step 2: Validate PDF blob
      console.log('Validating PDF blob...');
      const pdfBlob = await validatePdfBlob(invoicePdf.url);
      console.log('[FinalPdf] PDF blob validated:', { size: pdfBlob.size, type: pdfBlob.type });

      // Step 3: Prepare invoice payload with DRAFT status
      const invoicePayload = {
        // Core invoice details
        invoiceNumber: invoiceData.details?.invoiceNumber || `DRAFT-${Date.now()}`,
        issueDate: invoiceData.details?.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.details?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: invoiceData.details?.currency || 'USD',
        status: 'DRAFT', // Always save as draft
        
        // Client information handling
        ...(invoiceData.clientId ? {
          clientId: invoiceData.clientId
        } : {
          // Create new client if no ID exists
          client: {
            name: invoiceData.receiver?.name || '',
            email: invoiceData.receiver?.email || '',
            address: invoiceData.receiver?.address || '',
            city: invoiceData.receiver?.city || '',
            state: invoiceData.receiver?.state || '',
            zipCode: invoiceData.receiver?.zipCode || '',
            country: invoiceData.receiver?.country || '',
            companyName: invoiceData.receiver?.companyName || ''
          }
        }),
        
        // Line items and calculations
        items: (invoiceData.details?.items || []).map(item => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
        })),
        
        // Financial calculations
        subTotal: invoiceData.charges?.subTotal || 0,
        taxAmount: invoiceData.charges?.taxAmount || 0,
        totalAmount: invoiceData.charges?.totalAmount || 0,
        discount: invoiceData.charges?.discount || 0,
        shipping: invoiceData.charges?.shipping || 0,
        taxRate: invoiceData.charges?.tax || 0,
        
        // Additional information
        notes: invoiceData.details?.notes || invoiceData.details?.additionalNotes || '',
        paymentTerms: invoiceData.details?.paymentTerms || '',
        paymentInformation: invoiceData.paymentInformation || {},
        
        // Sender information
        sender: {
          name: invoiceData.sender?.name || '',
          email: invoiceData.sender?.email || '',
          address: invoiceData.sender?.address || '',
          city: invoiceData.sender?.city || '',
          state: invoiceData.sender?.state || '',
          zipCode: invoiceData.sender?.zipCode || '',
          country: invoiceData.sender?.country || '',
          registrationNumber: invoiceData.sender?.registrationNumber || ''
        }
      };

      console.log('[FinalPdf] Invoice payload prepared:', invoicePayload);

      // Step 4: Create invoice in database
      console.log('Creating invoice draft in database...');
      const createdInvoice = await createInvoice(invoicePayload);
      console.log('[FinalPdf] Invoice draft created successfully:', createdInvoice);

      // Step 5: Upload PDF to S3
      console.log('Preparing PDF for upload...');
      const fileName = `invoice_draft_${invoicePayload.invoiceNumber}_${Date.now()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      console.log('Uploading PDF securely...');
      const uploadResponse = await uploadPdfOnly(formData);
      console.log('[FinalPdf] PDF uploaded successfully:', uploadResponse);

      // Step 6: Update invoice with PDF URL
      if (uploadResponse?.uploadedFileKey) {
        console.log('Updating invoice with PDF reference...');
        const updateData = {
          pdfUrl: uploadResponse.uploadedFileKey,
          pdfFileName: fileName,
          pdfSize: pdfBlob.size,
          status: 'DRAFT'
        };

        const updatedInvoice = await updateInvoice(createdInvoice.id, updateData);
        console.log('[FinalPdf] Invoice draft updated with PDF:', updatedInvoice);
        
        // Store the saved invoice ID
        setSavedInvoiceId(createdInvoice.id);
        setIsSaved(true);

        // Success notification
        Swal.fire({
          title: 'Draft Saved!',
          html: `
            <div style="text-align: center;">
              <p>Your invoice has been saved as a draft.</p>
              <br>
              <p style="color: #666; font-size: 14px;">
                Invoice: <strong>${invoicePayload.invoiceNumber}</strong><br>
                Amount: <strong>$${invoicePayload.totalAmount?.toFixed(2) || '0.00'}</strong><br>
                Status: <strong>DRAFT</strong>
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Great!',
          timer: 4000
        });

      } else {
        throw new Error('PDF upload failed - no file key returned from server');
      }

    } catch (error) {
      console.error('[FinalPdf] Save draft process failed:', error);
      
      let errorMessage = 'Failed to save invoice draft. Please try again.';
      
      // More specific error handling
      if (error.message?.includes('PDF')) {
        errorMessage = 'PDF processing failed. Please regenerate the PDF and try again.';
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('authentication') || error.status === 401) {
        errorMessage = 'Authentication expired. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        title: 'Save Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Try Again',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/invoices');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* Success Alert */}
      {isSaved && (
        <Alert 
          severity="success" 
          icon={<CheckCircle />}
          sx={{ m: 2, mb: 0 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={handleGoToDashboard} variant="outlined">
                View All Invoices
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  Swal.fire({
                    title: 'Create New Invoice?',
                    text: 'Would you like to create another invoice?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Create New',
                    cancelButtonText: 'Stay Here'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      window.location.href = '/dashboard/invoices/create';
                    }
                  });
                }}
                variant="contained"
                sx={{ bgcolor: 'primary.main' }}
              >
                Create New
              </Button>
            </Stack>
          }
        >
          <Box>
            <Typography variant="body2" component="div">
              <strong>Invoice draft saved successfully!</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your invoice is saved as a draft and can be finalized or sent later.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Header with Quick Actions */}
      <Paper
        elevation={1}
        sx={{
          m: 2,
          mb: isSaved ? 2 : 1,
          p: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <Description color="primary" />
            Invoice PDF Ready
          </Typography>
        </Box>

        {/* Essential Actions Only */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={downloadPdf}
              startIcon={<Download />}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', color: theme.palette.primary.main }}
            >
              Download PDF
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSaveAsDraft}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <Save />}
              disabled={isUploading || isSaved}
              sx={{ 
                bgcolor: isSaved ? theme.palette.success.main : theme.palette.warning.main,
                color: 'white',
                '&:hover': { 
                  bgcolor: isSaved ? theme.palette.success.dark : theme.palette.warning.dark 
                },
                '&:disabled': {
                  bgcolor: isSaved ? theme.palette.success.main : theme.palette.grey[400],
                  color: 'white'
                }
              }}
            >
              {isUploading ? 'Saving...' : isSaved ? <><TaskAlt sx={{ mr: 0.5, fontSize: 18 }} /> Saved</> : 'Save as Draft'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={removeFinalPdf}
              startIcon={<Edit />}
              sx={{
                color: 'inherit',
                borderColor: 'currentColor',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'currentColor',
                }
              }}
            >
              Edit Invoice
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Divider />

      {/* PDF Viewer */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          bgcolor: theme.palette.grey[100],
          p: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: '#ffffff',
          }}
        >
          <iframe
            title="Generated Invoice PDF"
            src={`${invoicePdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              display: 'block'
            }}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Paper elevation={0} sx={{ p: 1, bgcolor: theme.palette.grey[50], textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          PDF Size: {(invoicePdf.size / 1024).toFixed(1)} KB • 
          Generated at {new Date().toLocaleTimeString()} • 
          Ready for sharing and distribution
        </Typography>
      </Paper>
    </Box>
  );
};

export default FinalPdf;
