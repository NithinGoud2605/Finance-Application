import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useContractContext } from '../contexts/ContractContext';
import { useSignatureContext } from '../contexts/SignatureContext';
import { createContract, uploadContractPdf, updateContract } from '../../../../services/api';
import { apiFetch } from '../../../../services/apiConfig.js';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import PreviewIcon from '@mui/icons-material/Preview';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckIcon from '@mui/icons-material/Check';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CelebrationIcon from '@mui/icons-material/Celebration';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { motion, AnimatePresence } from 'framer-motion';

const FinalSubmission = ({ isBusinessAccount }) => {
  const { getValues } = useFormContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    contractData, 
    generatePdf, 
    isGenerating,
    saveContractToLocal,
    contractPdf,
    previewPdfInTab,
    downloadPdf,
    printPdf,
    removeFinalPdf,
    formatCurrency,
    formatDate,
  } = useContractContext();

  const { signatures, areAllPartiesSigned, getSigningProgress } = useSignatureContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdContract, setCreatedContract] = useState(null);
  const [flowStep, setFlowStep] = useState('ready'); // 'ready', 'generating', 'options', 'saving'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Simple validation check - get current form values
  const formData = getValues();
  const isFormValid = formData?.party1?.name && formData?.party2?.name && formData?.details?.title;
  const contractValue = parseFloat(formData.financials?.totalValue) || 0;
  const hasValidContractValue = contractValue > 0;

  // Check if form is ready for submission (includes contract value validation)
  const canSubmit = isFormValid && hasValidContractValue;

  // Handle generate PDF and show options (similar to invoice)
  const handleGeneratePdfAndShowOptions = useCallback(async () => {
    // Get current form data to validate contract value
    const formData = getValues();
    const contractValue = parseFloat(formData.financials?.totalValue) || 0;
    
    // Validate contract value before generating PDF
    if (contractValue <= 0) {
      setSnackbar({
        open: true,
        message: 'Contract value must be greater than zero to generate PDF. Please set a valid contract value in Financial Terms.',
        severity: 'error'
      });
      return;
    }
    
    setFlowStep('generating');
    try {
      // Generate PDF first

      console.log('Contract value validated:', contractValue);

      // Ensure signatures are included in the data
      const dataWithSignatures = {
        ...formData,
        signatures: signatures && Object.keys(signatures).length > 0 ? signatures : null
      };
      
      
      
      await generatePdf('contract-preview', dataWithSignatures);
      
      // Show save options
      setFlowStep('options');
      
      setSnackbar({
        open: true,
        message: 'PDF generated successfully! Choose how to save your contract.',
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
      }, [generatePdf, getValues, signatures]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    downloadPdf();
    setSnackbar({
      open: true,
      message: 'Contract PDF downloaded successfully!',
      severity: 'success'
    });
  }, [downloadPdf]);

  // Handle print PDF
  const handlePrintPdf = useCallback(() => {
    printPdf();
    setSnackbar({
      open: true,
      message: 'Contract PDF sent to printer!',
      severity: 'success'
    });
  }, [printPdf]);

  // Handle preview PDF
  const handlePreviewPdf = useCallback(() => {
    previewPdfInTab();
    setSnackbar({
      open: true,
      message: 'Contract PDF opened in new tab!',
      severity: 'success'
    });
  }, [previewPdfInTab]);

  // Handle save as draft with PDF upload
  const handleSaveAsDraft = async () => {
    setFlowStep('saving');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('=== SAVE AS DRAFT TIMEOUT ===');
      setFlowStep('options');
      setSnackbar({
        open: true,
        message: 'Contract creation timed out. Please try again.',
        severity: 'error'
      });
    }, 30000); // 30 second timeout
    
    try {
      const formData = getValues();
      
            // Track generated PDF URL for upload
      let generatedPdfUrl = null;
      
      // Generate PDF first if not already generated
      if (!contractPdf.url) {
        try {
          // Create data structure with signatures for PDF generation
          const dataWithSignatures = {
            ...contractData,
            ...formData,
            approvals: {
              ...contractData.approvals,
              party1Signature: signatures.party1 || null,
              party2Signature: signatures.party2 || null
            }
          };
          
          // Update contract data temporarily for PDF generation
          updateContractData(dataWithSignatures);
          
          // Wait a moment for the UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Generate PDF
          generatedPdfUrl = await generatePdf('contract-preview', dataWithSignatures);
          
          // Wait a moment for state to update
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (pdfError) {
          console.warn('Failed to generate PDF before saving:', pdfError);
          // Continue saving even if PDF generation fails
        }
      }
      
      // Create contract payload matching backend Contract model
      const contractPayload = {
        // Required fields from backend model
        title: formData.details?.title || 'Untitled Contract',
        contractType: formData.details?.contractType || 'service_agreement',
        startDate: formData.details?.startDate,
        endDate: formData.details?.endDate,
        value: parseFloat(formData.financials?.totalValue) || 0,
        currency: formData.financials?.currency || formData.details?.currency || 'USD',
        
        // Contract details
        description: formData.details?.description || '',
        paymentTerms: formData.details?.paymentTerms || '',
        terminationClause: formData.details?.terminationClause || '',
        autoRenew: formData.details?.autoRenew || false,
        
        // Financial terms - map payment schedule to billing frequency
        billingFrequency: (() => {
          const schedule = formData.financials?.paymentSchedule;
          if (schedule === 'one_time') return null;
          if (schedule === 'monthly') return 'monthly';
          if (schedule === 'quarterly') return 'quarterly';
          if (schedule === 'annually') return 'annually';
          if (schedule === 'weekly') return 'weekly';
          if (schedule === 'biweekly') return 'biweekly';
          return null;
        })(),
        
        // Default contract status
        status: 'draft',
        
        // Client handling - use existing client ID if available, otherwise create new client
        ...(formData.clientId ? {
          // Use existing client
          clientId: formData.clientId
        } : formData.party2?.name ? {
          // Create new client from party2 data
          client: {
            name: formData.party2?.name,
            email: formData.party2?.email || '',
            phone: formData.party2?.phoneNumber || '',
            address: formData.party2?.address || '',
            city: formData.party2?.city || '',
            state: formData.party2?.state || '',
            zipCode: formData.party2?.zipCode || '',
            country: formData.party2?.country || '',
            companyName: formData.party2?.companyName || '',
            type: formData.party2?.companyName ? 'business' : 'individual'
          }
        } : {}),
        
        // Enhanced metadata including all form data
        metadata: {
          // Store original contract type for frontend compatibility
          originalContractType: formData.details?.contractType,
          
          // Party 1 information (contract creator - without large files)
          party1: {
            name: formData.party1?.name,
            email: formData.party1?.email,
            address: formData.party1?.address,
            city: formData.party1?.city,
            state: formData.party1?.state,
            zipCode: formData.party1?.zipCode,
            country: formData.party1?.country,
            companyName: formData.party1?.companyName,
            position: formData.party1?.position,
            phoneNumber: formData.party1?.phoneNumber,
            registrationNumber: formData.party1?.registrationNumber,
            // Exclude logo to reduce payload size
            hasLogo: !!formData.party1?.logo
          },
          
          // Project details
          projectDetails: {
            objectives: formData.objectives || [],
            deliverables: formData.deliverables || [],
            milestones: formData.milestones || []
          },
          
          // Enhanced financial terms
          financialTerms: {
            totalValue: formData.financials?.totalValue,
            paymentSchedule: formData.financials?.paymentSchedule,
            paymentMethod: formData.financials?.paymentMethod,
            paymentDueDate: formData.financials?.paymentDueDate,
            lateFee: formData.financials?.lateFee,
            latePaymentFee: formData.financials?.latePaymentFee,
            latePaymentFeeType: formData.financials?.latePaymentFeeType,
            retainerAmount: formData.financials?.retainerAmount,
            expenseReimbursement: formData.financials?.expenseReimbursement
          },
          
          // Legal clauses (business accounts)
          ...(isBusinessAccount && formData.legal && {
            legalClauses: {
              jurisdiction: formData.legal?.jurisdiction,
              arbitrationClause: formData.legal?.arbitrationClause,
              forceMajeureClause: formData.legal?.forceMajeureClause,
              intellectualPropertyClause: formData.legal?.intellectualPropertyClause,
              nonCompeteClause: formData.legal?.nonCompeteClause,
              nonDisclosureClause: formData.legal?.nonDisclosureClause,
              warrantyClause: formData.legal?.warrantyClause,
              privacyClause: formData.legal?.privacyClause,
              confidentialityClause: formData.details?.confidentialityClause,
              liabilityClause: formData.details?.liabilityClause,
              disputeResolution: formData.details?.disputeResolution,
              governingLaw: formData.details?.governingLaw
            }
          }),
          
          // Signature information if available (compressed)
          ...(signatures && Object.keys(signatures).length > 0) && {
            signatures: Object.keys(signatures).reduce((acc, party) => {
              const sig = signatures[party];
              // Only store essential signature data, not the full base64 image
              acc[party] = {
                signatureType: sig.signatureType,
                signedAt: sig.timestamp || new Date().toISOString(),
                // Store a flag that signature exists, but not the actual data to reduce payload
                hasSignature: !!(sig.signatureData || sig.dataURL),
                // Only include minimal signature data for typed signatures
                ...(sig.signatureType === 'typed' && {
                  signatureText: sig.signatureData,
                  fontFamily: sig.fontFamily,
                  color: sig.color
                })
              };
              return acc;
            }, {})
          },
          
          // Additional contract details
          contractDetails: {
            contractNumber: formData.details?.contractNumber,
            additionalTerms: formData.details?.additionalTerms,
            notes: formData.details?.notes,
            renewalPeriod: formData.details?.renewalPeriod,
            pdfTemplate: formData.details?.pdfTemplate
          },
          
          // Creation metadata
          createdAt: new Date().toISOString(),
          createdVia: 'contract_wizard',
          version: '1.0'
        }
      };

      // Create contract via API
      
      const response = await createContract(contractPayload);
      
              // Check both response.data and direct response for contract data
        const contractData = response?.data || response;
        
                if (contractData && contractData.id) {
          setCreatedContract(contractData);

                  // Upload PDF if available
          let pdfUploadSuccess = false;
          
          // Use either the state PDF URL or the newly generated one
          const pdfUrlToUse = contractPdf.url || (generatedPdfUrl || null);
        
                  if (pdfUrlToUse) {
            try {
              // Convert blob URL to file
              const pdfResponse = await fetch(pdfUrlToUse);
              const pdfBlob = await pdfResponse.blob();
              
              const file = new File([pdfBlob], `contract-${contractData.id}.pdf`, { type: 'application/pdf' });
            
              // Create FormData for upload
              const uploadFormData = new FormData();
              uploadFormData.append('file', file);
              uploadFormData.append('contractId', contractData.id);
            
              // Upload PDF to S3
              const uploadResponse = await uploadContractPdf(uploadFormData);
            
                          if (uploadResponse && uploadResponse.success && uploadResponse.uploadedFileKey) {
                // Update contract with PDF URL
                try {
                  const contractUpdateData = {
                    pdfUrl: uploadResponse.uploadedFileKey,
                    pdfFileName: file.name,
                    pdfSize: file.size
                  };
                  
                  const updatedContract = await updateContract(contractData.id, contractUpdateData);
                  pdfUploadSuccess = true;
                  
                  // Invalidate contracts cache to ensure fresh data on next fetch
                  try {
                    queryClient.invalidateQueries(['contracts']);
                  } catch (cacheError) {
                    console.warn('Could not invalidate cache:', cacheError);
                  }
                  
                } catch (updateError) {
                  console.error('Failed to update contract with PDF URL:', updateError);
                  
                  // Try alternative approach: direct API call with explicit organization header
                  if (updateError.response?.status === 404 || updateError.response?.status === 403) {
                    try {
                      // Get cached user data for organization context
                      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
                      const accountType = localStorage.getItem('accountType');
                      
                      if (accountType === 'business' && cachedUser.defaultOrganizationId) {
                        // Make direct API call with centralized configuration
                        const directResponse = await apiFetch(`/contracts/${contractData.id}`, {
                          method: 'PUT',
                          body: JSON.stringify(contractUpdateData)
                        });
                        
                        if (directResponse.ok) {
                          pdfUploadSuccess = true;
                          
                          // Invalidate cache
                          try {
                            queryClient.invalidateQueries(['contracts']);
                          } catch (cacheError) {
                            console.warn('Could not invalidate cache:', cacheError);
                          }
                        }
                      }
                    } catch (altError) {
                      console.error('Alternative update approach failed:', altError);
                    }
                  }
                  
                  if (!pdfUploadSuccess) {
                    console.warn('PDF uploaded to S3 but contract update failed - PDF may not be linked');
                  }
                }
              }
            
          } catch (uploadError) {
            console.error('Failed to upload PDF:', uploadError);
            // Continue anyway as contract was created successfully
          }
        }
        
                // Show success dialog after successful save
        setShowSuccessDialog(true);
        setFlowStep('ready'); // Reset to ready for potential new contract creation
        
        setSnackbar({
          open: true,
          message: pdfUploadSuccess 
            ? 'Contract saved successfully with PDF!' 
            : 'Contract saved successfully!',
          severity: 'success'
        });
        
        // Invalidate contracts cache to ensure fresh data
        try {
          queryClient.invalidateQueries(['contracts']);
        } catch (cacheError) {
          console.warn('Could not invalidate contracts cache:', cacheError);
        }
        
        // Clear timeout
        clearTimeout(timeoutId);
      } else {
        console.error('Contract creation failed - no valid contract data received');
        
        setFlowStep('options');
        setSnackbar({
          open: true,
          message: 'Contract creation failed - no valid contract data received.',
          severity: 'error'
        });
        
        // Clear timeout
        clearTimeout(timeoutId);
      }

    } catch (error) {
      console.error('Contract creation error:', error);
      
      setFlowStep('options'); // Go back to options instead of ready so user can try again
      
      // Extract more detailed error message
      let errorMessage = 'Failed to save contract';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      setSnackbar({
        open: true,
        message: `Failed to save contract: ${errorMessage}. Please try again.`,
        severity: 'error'
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
    }
  };

  const handleBackToEdit = () => {
    removeFinalPdf();
    setFlowStep('ready');
  };

  // Handle actions from success dialog
  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    // Reset form and go back to first step
    removeFinalPdf();
    setCreatedContract(null);
    setFlowStep('ready');
    // You might want to reset the form here if you have access to reset function
  };

  const handleViewContracts = () => {
    setShowSuccessDialog(false);
    navigate('/contracts');
  };

  // Dynamic steps based on account type and current step
  const getSteps = () => {
    const baseSteps = [
      'Parties Information',
      'Contract Details', 
      'Project & Financial Terms'
    ];
    
    if (isBusinessAccount) {
      baseSteps.push('Legal Terms');
    }
    
    baseSteps.push(
      'Digital Signatures',
      'Contract Summary',
      'Final Submission'
    );
    
    return baseSteps;
  };

  const steps = getSteps();

  // Step 1: Ready to generate PDF
  if (flowStep === 'ready') {
  return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RocketLaunchIcon color="primary" />
          Final Contract Submission
      </Typography>

        {/* Validation Summary */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {canSubmit ? (
              <CheckCircleIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            Contract Validation
          </Typography>
          
          {(!isFormValid || !hasValidContractValue) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Required fields missing:</Typography>
              <List dense>
                {!formData?.party1?.name && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Party 1 name is required" />
                  </ListItem>
                )}
                {!formData?.party2?.name && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Party 2 name is required" />
                  </ListItem>
                )}
                {!formData?.details?.title && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Contract title is required" />
                  </ListItem>
                )}
                {!hasValidContractValue && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Contract value must be greater than zero (set in Financial Terms)" />
                  </ListItem>
                )}
              </List>
        </Alert>
      )}

          {canSubmit && (
            <Alert severity="success">
              <Typography variant="body2">
                ✓ Contract is ready for PDF generation! All required fields are completed.
              </Typography>
            </Alert>
          )}
        </Paper>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdfIcon color="primary" />
            Generate Contract PDF
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGeneratePdfAndShowOptions}
            disabled={!canSubmit}
            sx={{ minWidth: 200 }}
          >
            Generate PDF
          </Button>

          {!canSubmit && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {!isFormValid 
                ? "Complete all required fields to generate the contract." 
                : !hasValidContractValue 
                ? "Set a contract value greater than zero in Financial Terms to generate PDF."
                : "Complete all requirements to generate the contract."
              }
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
          <CircularProgress size={16} sx={{ mr: 1, verticalAlign: 'middle' }} /> Generating Your Contract PDF...
          </Typography>
        
        <CircularProgress size={60} sx={{ mb: 3 }} />

        <Typography variant="body1" color="text.secondary">
          Please wait while we create your professional contract PDF.
        </Typography>
      </Paper>
    );
  }

  // Step 2.5: Saving Contract
  if (flowStep === 'saving') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold', mb: 3 }}>
          💾 Saving Your Contract...
        </Typography>
        
        <CircularProgress size={60} sx={{ mb: 3 }} color="success" />

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Please wait while we save your contract and upload the PDF.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            • Creating contract record...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Uploading PDF to secure storage...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Setting up notifications...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Step 3: Show save options after PDF is generated
  if (flowStep === 'options') {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom color="success.main" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CelebrationIcon color="success" />
          PDF Generated Successfully!
        </Typography>
        
        {/* PDF Preview Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            <PreviewIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 18 }} /> Preview Your PDF
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handlePreviewPdf}
          >
              Preview PDF
          </Button>

          <Button
            variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPdf}
          >
              Download PDF
          </Button>

            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
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
            💾 Save Your Contract
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={flowStep === 'saving' ? null : <SaveIcon />}
            onClick={handleSaveAsDraft}
            disabled={flowStep === 'saving'}
            color="success"
            size="large"
            sx={{ minWidth: 160 }}
          >
            {flowStep === 'saving' ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
            
            <Button
              variant="outlined"
              onClick={handleBackToEdit}
              disabled={flowStep === 'saving'}
            >
              Back to Edit
            </Button>
          </Stack>
        </Box>

        {/* Contract Info Summary */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Contract Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Contract Number:</Typography>
                <Typography variant="body2">{contractData?.details?.contractNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">PDF Size:</Typography>
                <Typography variant="body2">{(contractPdf.size / 1024).toFixed(1)} KB</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Parties:</Typography>
                <Typography variant="body2">
                  {getValues('party1.name')} & {getValues('party2.name')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Generated:</Typography>
                <Typography variant="body2">{new Date().toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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

  // Success Dialog
  return (
    <>
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CelebrationIcon color="success" />
                Contract Saved Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your contract has been saved as a draft and is ready for use
              </Typography>
                    </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {/* Contract Summary Card */}
          {createdContract && (
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="primary" />
                  Contract Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Contract Title:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {getValues('details.title') || 'Untitled Contract'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Contract ID:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      #{createdContract.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Parties:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {getValues('party1.name')} & {getValues('party2.name')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip 
                      label="Draft" 
                      color="warning" 
                      size="small" 
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Grid>
                  {getValues('financials.totalValue') && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Contract Value:</Typography>
                      <Typography variant="body1" fontWeight="medium" color="success.main">
                        {formatCurrency(getValues('financials.totalValue'), getValues('financials.currency'))}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Created:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date().toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* What's Next Section */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon color="primary" />
            What's Next?
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'primary.light', 
                  borderRadius: 2,
                  height: '100%',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ManageSearchIcon fontSize="small" color="primary" />
                  Manage Contract
                </Typography>
                <Typography variant="body2">
                  View, edit, and track your contract status in the contracts dashboard
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'success.light', 
                  borderRadius: 2,
                  height: '100%',
                  bgcolor: 'success.light',
                  color: 'success.contrastText'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📤 Send for Signature
              </Typography>
              <Typography variant="body2">
                  Send the contract to the other party for review and digital signature
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'info.light', 
                  borderRadius: 2,
                  height: '100%',
                  bgcolor: 'info.light',
                  color: 'info.contrastText'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  <DownloadIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 18 }} /> Download PDF
              </Typography>
              <Typography variant="body2">
                  Download the contract PDF for your records or offline sharing
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'warning.light', 
                  borderRadius: 2,
                  height: '100%',
                  bgcolor: 'warning.light',
                  color: 'warning.contrastText'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EditNoteIcon fontSize="small" color="primary" />
                  Edit Anytime
              </Typography>
              <Typography variant="body2">
                  Make changes to the contract details until it's finalized and signed
              </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCreateAnother}
            variant="outlined"
            sx={{ minWidth: 140 }}
            startIcon={<SendIcon />}
          >
            Create Another
          </Button>
          <Button 
            variant="contained" 
            onClick={handleViewContracts}
            color="primary"
            sx={{ minWidth: 140 }}
            startIcon={<VisibilityIcon />}
          >
            View All Contracts
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for other notifications */}
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
    </>
  );
};

export default FinalSubmission; 