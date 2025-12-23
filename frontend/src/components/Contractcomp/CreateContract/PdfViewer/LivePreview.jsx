import React from 'react';
import { Box, Typography, useTheme, Paper, Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from '../contexts/ContractContext';
import { useSignatureContext } from '../contexts/SignatureContext';
import DynamicContractTemplate from '../templates/DynamicContractTemplate';

const LivePreview = () => {
  const theme = useTheme();
  const { watch } = useFormContext();
  const { 
    isGenerating, 
    contractPdf,
    previewPdfInTab,
    downloadPdf,
    printPdf 
  } = useContractContext();
  const { signatures } = useSignatureContext();

  // Watch all form data for real-time updates
  const formData = watch();

  // Transform form data to contract template format
  const getContractData = React.useCallback((formData) => {
    // Provide sensible defaults
    if (!formData || Object.keys(formData).length === 0) {
      return {
        party1: { 
          name: 'Your Name',
          email: 'your.email@example.com',
          address: 'Your Address',
          city: 'Your City',
          state: 'Your State',
          zipCode: 'Your ZIP',
          country: 'United States',
          phoneNumber: '+1 (555) 123-4567',
          companyName: '',
          position: 'Individual',
          registrationNumber: '',
          logo: null
        },
        party2: { 
          name: 'Client Name',
          email: 'client.email@example.com',
          address: 'Client Address',
          city: 'Client City',
          state: 'Client State',
          zipCode: 'Client ZIP',
          country: 'United States',
          phoneNumber: '+1 (555) 987-6543',
          companyName: '',
          position: ''
        },
        details: { 
          contractNumber: `CNT-${Date.now()}`, 
          title: 'Sample Contract',
          contractType: 'service_agreement',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currency: 'USD', 
          description: 'This is a sample contract description to show how your contract will appear.',
          objectives: [],
          deliverables: [],
          milestones: [],
          paymentTerms: 'Payment terms will be specified here.',
          terminationClause: 'Termination clause will be specified here.',
          additionalTerms: '',
          autoRenew: false,
          renewalPeriod: 12,
          confidentialityClause: '',
          liabilityClause: '',
          disputeResolution: '',
          governingLaw: '',
          notes: '',
          pdfTemplate: 1
        },
        financials: {
          totalValue: 5000,
          paymentSchedule: 'monthly',
          currency: 'USD',
          paymentMethod: 'Bank Transfer',
          lateFee: 0,
          retainerAmount: 0,
          expenseReimbursement: false
        },
        legal: {
          jurisdiction: 'United States',
          arbitrationClause: false,
          forceMajeureClause: false,
          intellectualPropertyClause: '',
          nonCompeteClause: '',
          nonDisclosureClause: '',
          warrantyClause: ''
        },
        approvals: {
          party1Approval: false,
          party2Approval: false,
          party1ApprovedDate: null,
          party2ApprovedDate: null,
          party1Signature: null,
          party2Signature: null
        },
        status: 'DRAFT'
      };
    }

    // Merge form data with defaults, ensuring proper structure
    const merged = {
      party1: {
        name: formData.party1?.name || '',
        email: formData.party1?.email || '',
        address: formData.party1?.address || '',
        city: formData.party1?.city || '',
        state: formData.party1?.state || '',
        zipCode: formData.party1?.zipCode || '',
        country: formData.party1?.country || '',
        phoneNumber: formData.party1?.phoneNumber || '',
        companyName: formData.party1?.companyName || '',
        position: formData.party1?.position || '',
        registrationNumber: formData.party1?.registrationNumber || '',
        logo: formData.party1?.logo || null
      },
      party2: {
        name: formData.party2?.name || '',
        email: formData.party2?.email || '',
        address: formData.party2?.address || '',
        city: formData.party2?.city || '',
        state: formData.party2?.state || '',
        zipCode: formData.party2?.zipCode || '',
        country: formData.party2?.country || '',
        phoneNumber: formData.party2?.phoneNumber || '',
        companyName: formData.party2?.companyName || '',
        position: formData.party2?.position || ''
      },
      details: {
        contractNumber: formData.details?.contractNumber || `CNT-${Date.now()}`,
        title: formData.details?.title || '',
        contractType: formData.details?.contractType || 'service_agreement',
        startDate: formData.details?.startDate || new Date().toISOString().split('T')[0],
        endDate: formData.details?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: formData.details?.currency || 'USD',
        description: formData.details?.description || '',
        objectives: formData.objectives || [],
        deliverables: formData.deliverables || [],
        milestones: formData.milestones || [],
        paymentTerms: formData.details?.paymentTerms || formData.financials?.paymentTerms || '',
        terminationClause: formData.details?.terminationClause || '',
        additionalTerms: formData.details?.additionalTerms || '',
        autoRenew: formData.details?.autoRenew || false,
        renewalPeriod: formData.details?.renewalPeriod || 12,
        confidentialityClause: formData.legal?.confidentialityClause || '',
        liabilityClause: formData.legal?.liabilityClause || '',
        disputeResolution: formData.legal?.disputeResolutionClause || '',
        governingLaw: formData.legal?.governingLaw || '',
        notes: formData.details?.notes || formData.financials?.notes || '',
        pdfTemplate: formData.details?.pdfTemplate || 1
      },
      financials: {
        totalValue: formData.financials?.totalValue || 0,
        paymentSchedule: formData.financials?.paymentSchedule || 'one_time',
        currency: formData.financials?.currency || formData.details?.currency || 'USD',
        paymentMethod: formData.financials?.paymentMethod || '',
        paymentTerms: formData.financials?.paymentTerms || '',
        lateFee: formData.financials?.lateFee || 0,
        retainerAmount: formData.financials?.retainerAmount || 0,
        expenseReimbursement: formData.financials?.expenseReimbursement || false,
        notes: formData.financials?.notes || ''
      },
      legal: {
        jurisdiction: formData.legal?.jurisdiction || '',
        arbitrationClause: formData.legal?.arbitrationClause || false,
        forceMajeureClause: formData.legal?.forceMajeureClause || false,
        intellectualPropertyClause: formData.legal?.intellectualPropertyClause || '',
        nonCompeteClause: formData.legal?.nonCompeteClause || '',
        nonDisclosureClause: formData.legal?.nonDisclosureClause || '',
        warrantyClause: formData.legal?.warrantyClause || ''
      },
      approvals: {
        party1Approval: formData.approvals?.party1Approval || false,
        party2Approval: formData.approvals?.party2Approval || false,
        party1ApprovedDate: formData.approvals?.party1ApprovedDate || null,
        party2ApprovedDate: formData.approvals?.party2ApprovedDate || null,
        party1Signature: formData.approvals?.party1Signature || null,
        party2Signature: formData.approvals?.party2Signature || null
      },
      status: formData.status || 'DRAFT'
    };

    return merged;
  }, [formData]);

  const contractData = getContractData(formData);

  // Handle PDF actions
  const handleDownloadPdf = () => {
    downloadPdf();
  };

  const handlePreviewPdf = () => {
    previewPdfInTab();
  };

  const handlePrintPdf = () => {
    printPdf();
  };

  return (
    <Box sx={{ 
        height: '100%',
        overflow: 'auto',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Loading State */}
      {isGenerating && (
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="body2">
            Generating PDF... Please wait.
          </Typography>
        </Alert>
      )}

      {/* Contract Preview */}
      <Box sx={{ 
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100%'
      }}>
        <Paper
          elevation={3}
          sx={{
            maxWidth: '210mm', // A4 width
            width: '100%',
            minHeight: '297mm', // A4 height
            bgcolor: 'white',
            position: 'relative'
          }}
        >
          <DynamicContractTemplate 
            party1={contractData.party1}
            party2={contractData.party2}
            details={contractData.details}
            financials={contractData.financials}
            legal={contractData.legal}
            approvals={contractData.approvals}
            signatures={signatures}
            forPdf={false}
            showPdfActions={!!contractPdf.url}
            onDownload={handleDownloadPdf}
            onPreview={handlePreviewPdf}
            onPrint={handlePrintPdf}
          />
        </Paper>
        </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
            textAlign: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }}>
        <Typography variant="caption" color="text.secondary">
          Live Preview • Updates automatically as you fill the form • 
          {contractData.party1?.name || 'Your Name'} & {contractData.party2?.name || 'Client Name'}
          </Typography>
        </Box>
    </Box>
  );
};

export default LivePreview; 