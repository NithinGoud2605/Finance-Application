import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack
} from '@mui/material';
import { 
  CheckCircle, 
  Send, 
  SaveAlt, 
  PictureAsPdf,
  Warning,
  Error as ErrorIcon,
  Email,
  Download,
  Print,
  Share,
  Edit,
  Visibility,
  Description,
  CheckCircleOutline,
  FactCheck,
  Summarize,
  RocketLaunch,
  Celebration,
  TaskAlt,
  TrendingUp,
  Preview
} from '@mui/icons-material';
import { useFormContext } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createInvoice, uploadPdfOnly, updateInvoice, sendInvoice } from '../../../../services/api';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import SendEmailDialog from '../../../common/SendEmailDialog';

const FinalSubmission = ({ isBusinessAccount }) => {
  const { getValues, formState: { isValid, errors } } = useFormContext();
  const { invoiceData, updateInvoiceData, generatePdf, invoicePdf } = useInvoiceContext();
  const navigate = useNavigate();
  const [flowStep, setFlowStep] = useState('ready'); // ready, generating, options, saving, completed
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [saveOption, setSaveOption] = useState(null); // 'save' only now
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      console.log('Invoice created successfully:', data);
      setCreatedInvoice(data);
      setFlowStep('completed');
      setSnackbar({
        open: true,
        message: `Invoice ${data.invoiceNumber} saved successfully!`,
        severity: 'success'
      });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      setFlowStep('options'); // Go back to options
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save invoice. Please try again.',
        severity: 'error'
      });
    }
  });

  // Prepare form data for submission
  const prepareInvoiceData = useCallback((status = 'DRAFT') => {
    const formData = getValues();
    
    // Transform the form data to match the backend expected structure
    const invoicePayload = {
      // Basic invoice details
      invoiceNumber: formData.details?.invoiceNumber || `INV-${Date.now()}`,
      issueDate: formData.details?.issueDate || new Date().toISOString().split('T')[0],
      dueDate: formData.details?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: formData.details?.currency || 'USD',
      status: status,
      
      // Sender information (from section)
      sender: {
        name: formData.sender?.name || '',
        email: formData.sender?.email || '',
        address: formData.sender?.address || '',
        city: formData.sender?.city || '',
        state: formData.sender?.state || '',
        zipCode: formData.sender?.zipCode || '',
        country: formData.sender?.country || '',
        phone: formData.sender?.phone || '',
        ...(isBusinessAccount && {
          taxId: formData.sender?.taxId || '',
          registrationNumber: formData.sender?.registrationNumber || ''
        })
      },
      
      // Client information (to section) - check if we have an existing clientId first
      ...(formData.clientId ? {
        clientId: formData.clientId
      } : {
        client: {
          name: formData.receiver?.name || '',
          email: formData.receiver?.email || '',
          address: formData.receiver?.address || '',
          city: formData.receiver?.city || '',
          state: formData.receiver?.state || '',
          zipCode: formData.receiver?.zipCode || '',
          country: formData.receiver?.country || '',
          phone: formData.receiver?.phone || '',
          companyName: formData.receiver?.companyName || ''
        }
      }),
      
      // Items
      items: formData.details?.items || [],
      
      // Charges and totals
      subTotal: invoiceData.charges?.subTotal || 0,
      taxAmount: invoiceData.charges?.taxAmount || 0,
      totalAmount: invoiceData.charges?.totalAmount || 0,
      
      // Additional details
      notes: formData.details?.additionalNotes || '',
      paymentTerms: formData.details?.paymentTerms || '',
      termsAndConditions: formData.details?.termsAndConditions || '',
      latePaymentTerms: formData.details?.latePaymentTerms || '',
      
      // Payment information for business accounts
      ...(isBusinessAccount && formData.paymentInformation && {
        paymentInformation: formData.paymentInformation
      }),
      
      // Template selection
      templateId: formData.details?.pdfTemplate || 1
    };
    
    return invoicePayload;
  }, [getValues, invoiceData, isBusinessAccount]);

  // Handle generate PDF and create invoice
  const handleGeneratePdfAndShowOptions = useCallback(async () => {
    setFlowStep('generating');
    try {
      // Generate PDF first
      console.log('Generating PDF...');
      await generatePdf();
      
      // Show save options
      setFlowStep('options');
      
      setSnackbar({
        open: true,
        message: 'PDF generated successfully! Choose how to save your invoice.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setFlowStep('ready');
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF. Please try again.',
        severity: 'error'
      });
    }
  }, [generatePdf]);

  // Handle save invoice with PDF (only save as draft now)
  const handleSaveInvoice = useCallback(async () => {
    setSaveOption('save');
    setFlowStep('saving');
    
    try {
      const invoiceData = prepareInvoiceData('DRAFT');
      
      // Create the invoice
      const createdInvoice = await createInvoiceMutation.mutateAsync(invoiceData);
      
      // Upload PDF to S3 if available
      if (invoicePdf?.url) {
        try {
          console.log('Uploading PDF securely...');
          const response = await fetch(invoicePdf.url);
          const pdfBlob = await response.blob();
          const pdfFile = new File([pdfBlob], `invoice_${invoiceData.invoiceNumber}.pdf`, { type: 'application/pdf' });
          
          const formData = new FormData();
          formData.append('file', pdfFile);
          const uploadResponse = await uploadPdfOnly(formData);
          
          // Update invoice with PDF URL
          if (uploadResponse?.uploadedFileKey) {
            await updateInvoice(createdInvoice.id, { pdfUrl: uploadResponse.uploadedFileKey });
            console.log('PDF uploaded and linked to invoice');
          }
        } catch (uploadError) {
          console.error('Error uploading PDF:', uploadError);
          // Don't fail the whole process if PDF upload fails
        }
      }
      
    } catch (error) {
      setFlowStep('options');
    }
  }, [prepareInvoiceData, createInvoiceMutation, invoicePdf, updateInvoice]);

  // Get client email from form data or created invoice
  const getClientEmail = useCallback(() => {
    const formData = getValues();
    
    // Try multiple sources for client email
    const clientEmail = 
      createdInvoice?.client?.email ||           // From created invoice
      createdInvoice?.Client?.email ||           // Alternative casing
      formData.receiver?.email ||                // From form receiver data
      formData.client?.email ||                  // From form client data
      '';
    
    console.log('Client email sources:', {
      'createdInvoice.client.email': createdInvoice?.client?.email,
      'createdInvoice.Client.email': createdInvoice?.Client?.email,
      'formData.receiver.email': formData.receiver?.email,
      'formData.client.email': formData.client?.email,
      'resolved': clientEmail
    });
    
    return clientEmail;
  }, [createdInvoice, getValues]);

  // Handle sending directly to client email
  const handleSendToClient = useCallback(async () => {
    try {
      const clientEmail = getClientEmail();
      
      if (!clientEmail) {
        setSnackbar({
          open: true,
          message: 'No client email found. Please use the "Send Again" button to enter an email manually.',
          severity: 'warning'
        });
        return;
      }

      console.log('=== SEND TO CLIENT START ===');
      console.log('Sending to client email:', clientEmail);
      
      if (!createdInvoice?.id) {
        throw new Error('Invoice must be saved before sending');
      }

      const response = await sendInvoice(createdInvoice.id, {
        email: clientEmail,
        message: `Please find your invoice ${createdInvoice.invoiceNumber} attached. Thank you for your business!`
      });

      console.log('API response received:', response);

      // Update the created invoice status locally
      setCreatedInvoice(prev => ({
        ...prev,
        status: 'SENT',
        emailSentAt: new Date().toISOString(),
        emailSentTo: clientEmail
      }));

      setSnackbar({
        open: true,
        message: `Invoice sent successfully to ${clientEmail}!`,
        severity: 'success'
      });

      console.log('=== SEND TO CLIENT SUCCESS ===');
    } catch (error) {
      console.error('=== SEND TO CLIENT ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = 'Failed to send invoice email. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  }, [createdInvoice, getClientEmail]);

  // Handle email invoice (for manual email entry via dialog)
  const handleSendEmail = useCallback(async (emailData) => {
    try {
      console.log('=== SEND EMAIL DEBUG START ===');
      console.log('1. Email data received:', emailData);
      console.log('2. Created invoice:', createdInvoice);
      
      if (!createdInvoice?.id) {
        console.error('3. ERROR: No invoice ID found');
        throw new Error('Invoice must be saved before sending');
      }

      console.log('3. Invoice ID found:', createdInvoice.id);
      console.log('4. Calling sendInvoice API with:', {
        invoiceId: createdInvoice.id,
        email: emailData.email,
        message: emailData.message
      });

      const response = await sendInvoice(createdInvoice.id, {
        email: emailData.email,
        message: emailData.message
      });

      console.log('5. API response received:', response);

      // Update the created invoice status locally
      setCreatedInvoice(prev => ({
        ...prev,
        status: 'SENT',
        emailSentAt: new Date().toISOString(),
        emailSentTo: emailData.email
      }));

      console.log('6. Local state updated');

      setSnackbar({
        open: true,
        message: `Invoice sent successfully to ${emailData.email}!`,
        severity: 'success'
      });

      setEmailDialogOpen(false);
      console.log('7. Success state set, dialog closed');
      console.log('=== SEND EMAIL DEBUG END ===');
    } catch (error) {
      console.error('=== SEND EMAIL ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('=== SEND EMAIL ERROR END ===');
      
      let errorMessage = 'Failed to send invoice email. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  }, [createdInvoice]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (invoicePdf?.url) {
      const link = document.createElement('a');
      link.href = invoicePdf.url;
      link.download = `invoice-${getValues('details.invoiceNumber') || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [invoicePdf, getValues]);

  // Handle print PDF
  const handlePrintPdf = useCallback(() => {
    if (invoicePdf?.url) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = invoicePdf.url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  }, [invoicePdf]);

  // Validation check
  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = isValid && !hasErrors && invoiceData.charges?.totalAmount > 0;

  // Get form validation summary
  const getValidationSummary = () => {
    const summary = [];
    if (!getValues('sender.name')) summary.push('Sender name is required');
    if (!getValues('receiver.name')) summary.push('Client name is required');
    if (!getValues('details.items') || getValues('details.items').length === 0) {
      summary.push('At least one item is required');
    }
    if (invoiceData.charges?.totalAmount <= 0) summary.push('Invoice total must be greater than 0');
    
    return summary;
  };

  const validationIssues = getValidationSummary();

  // Step 1: Ready to generate PDF
  if (flowStep === 'ready') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description color="primary" />
          Ready to Generate Your Invoice
        </Typography>

        {/* Validation Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FactCheck color="primary" />
            Validation Status
          </Typography>
          
          {validationIssues.length === 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutline fontSize="small" color="success" />
                All required fields are completed!
              </Typography>
              <Typography variant="body2">
                Your invoice is ready to be generated.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Warning fontSize="small" color="warning" />
                Please complete the following before generating:
              </Typography>
              <List dense>
                {validationIssues.map((issue, index) => (
                  <ListItem key={index} sx={{ py: 0, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={issue} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Invoice Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Summarize color="primary" />
            Invoice Summary
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Invoice Number:</strong> {getValues('details.invoiceNumber') || 'Auto-generated'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Client:</strong> {getValues('receiver.name') || 'Not specified'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Items:</strong> {getValues('details.items')?.length || 0} item(s)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total Amount:</strong> {invoiceData.charges?.totalAmount ? 
                new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: getValues('details.currency') || 'USD' 
                }).format(invoiceData.charges.totalAmount) : '$0.00'
              }
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Generate PDF Action */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketLaunch color="primary" />
            Generate Invoice PDF
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<PictureAsPdf />}
            onClick={handleGeneratePdfAndShowOptions}
            disabled={!canSubmit}
            sx={{ minWidth: 200 }}
          >
            Generate PDF
          </Button>

          {!canSubmit && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Complete all required fields to generate the invoice.
            </Typography>
          )}
        </Box>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    );
  }

  // Step 2: Generating PDF
  if (flowStep === 'generating') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
          <CircularProgress size={16} sx={{ mr: 1, verticalAlign: 'middle' }} /> Generating Your Invoice PDF...
        </Typography>
        
        <CircularProgress size={60} sx={{ mb: 3 }} />
        
        <Typography variant="body1" color="text.secondary">
          Please wait while we create your professional invoice PDF.
        </Typography>
      </Paper>
    );
  }

  // Step 3: Show save options after PDF is generated
  if (flowStep === 'options') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Celebration color="success" />
          PDF Generated Successfully!
        </Typography>

        {/* PDF Preview Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            <Preview sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 18 }} /> Preview Your PDF
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => window.open(invoicePdf.url, '_blank')}
            >
              Preview PDF
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrintPdf}
            >
              Print PDF
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Save Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            💾 How would you like to save this invoice?
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="large"
              startIcon={flowStep === 'saving' && saveOption === 'save' ? 
                <CircularProgress size={16} color="inherit" /> : <SaveAlt />}
              onClick={handleSaveInvoice}
              disabled={flowStep === 'saving'}
              sx={{ minWidth: 150 }}
            >
              {flowStep === 'saving' && saveOption === 'save' ? 'Saving...' : 'Save as Draft'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • <strong>Save as Draft:</strong> Save the invoice for later editing or sending
          </Typography>
        </Box>

        {/* Back option */}
        <Divider sx={{ my: 3 }} />
        <Button
          variant="outlined"
          onClick={() => setFlowStep('ready')}
          disabled={flowStep === 'saving'}
        >
          ← Back to Edit
        </Button>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    );
  }

  // Step 4: Completed - Show success and next actions
  if (flowStep === 'completed') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskAlt color="success" />
          Invoice {createdInvoice?.status === 'SENT' ? 'Saved & Sent' : 'Saved'} Successfully!
        </Typography>

        {/* Invoice Details */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Invoice Number:</strong> {createdInvoice?.invoiceNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> 
                  <Chip 
                    label={createdInvoice?.status} 
                    size="small" 
                    color={createdInvoice?.status === 'SENT' ? 'success' : 'default'} 
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Amount:</strong> {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: createdInvoice?.currency || 'USD' 
                  }).format(createdInvoice?.totalAmount || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Due Date:</strong> {new Date(createdInvoice?.dueDate).toLocaleDateString()}
                </Typography>
                {createdInvoice?.emailSentTo && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Sent to:</strong> {createdInvoice.emailSentTo}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          What's Next?
        </Typography>

        {/* Email Status Info */}
        {getClientEmail() ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Ready to Send:</strong> {getClientEmail()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click the green button below to send your invoice directly to the client.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Manual Email Entry Required</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No client email found in the form. You can enter the recipient's email manually.
            </Typography>
          </Alert>
        )}

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {createdInvoice?.status !== 'SENT' ? (
            /* Send to Client Email Button */
            getClientEmail() ? (
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendToClient}
                sx={{ 
                  bgcolor: 'success.main',
                  '&:hover': { bgcolor: 'success.dark' }
                }}
              >
                Send to {getClientEmail()}
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => setEmailDialogOpen(true)}
              >
                Send Invoice via Email
              </Button>
            )
          ) : (
            /* Resend to Same Email */
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSendToClient}
              color="success"
            >
              Send Again to {createdInvoice.emailSentTo}
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => navigate('/dashboard/invoices')}
          >
            View All Invoices
          </Button>
        </Stack>

        {/* Navigation */}
        <Divider sx={{ my: 3 }} />
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ minWidth: 200 }}
        >
          Create Another Invoice
        </Button>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    );
  }

  return (
    <>
      {/* Send Email Dialog */}
      <SendEmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSend={handleSendEmail}
        title="Send Invoice Email"
        defaultEmail={getClientEmail()}
        itemType="invoice"
        itemData={createdInvoice}
      />
    </>
  );
};

export default FinalSubmission; 