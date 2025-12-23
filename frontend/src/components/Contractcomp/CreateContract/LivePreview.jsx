import React, { useMemo } from 'react';
import { Box, Paper, useTheme, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from './contexts/ContractContext';
import { useSignatureContext } from './contexts/SignatureContext';
import DynamicContractTemplate from './templates/DynamicContractTemplate';
import PDFActions from './PDFActions';

const LivePreview = () => {
  const theme = useTheme();
  const { watch } = useFormContext();
  const { updateContractFormData, isGenerating, contractPdf } = useContractContext();
  const { signatures, signatureStatus } = useSignatureContext();

  // Watch form data and transform for template
  const watchedData = watch();
  
  // Transform watched data to match template props
  const templateData = useMemo(() => {
    // Map watched data to template structure
    const data = {
      party1: {
        name: watchedData.party1?.name || '',
        email: watchedData.party1?.email || '',
        address: watchedData.party1?.address || '',
        city: watchedData.party1?.city || '',
        state: watchedData.party1?.state || '',
        zipCode: watchedData.party1?.zipCode || '',
        country: watchedData.party1?.country || '',
        companyName: watchedData.party1?.companyName || '',
        position: watchedData.party1?.position || '',
        phoneNumber: watchedData.party1?.phoneNumber || '',
        logo: watchedData.party1?.logo || null,
        registrationNumber: watchedData.party1?.registrationNumber || ''
      },
      party2: {
        name: watchedData.party2?.name || '',
        email: watchedData.party2?.email || '',
        address: watchedData.party2?.address || '',
        city: watchedData.party2?.city || '',
        state: watchedData.party2?.state || '',
        zipCode: watchedData.party2?.zipCode || '',
        country: watchedData.party2?.country || '',
        companyName: watchedData.party2?.companyName || '',
        position: watchedData.party2?.position || '',
        phoneNumber: watchedData.party2?.phoneNumber || ''
      },
      details: {
        contractNumber: watchedData.details?.contractNumber || '',
        title: watchedData.details?.title || '',
        contractType: watchedData.details?.contractType || 'service_agreement',
        startDate: watchedData.details?.startDate || '',
        endDate: watchedData.details?.endDate || '',
        description: watchedData.details?.description || '',
        objectives: watchedData.objectives || watchedData.details?.objectives || [],
        deliverables: watchedData.deliverables || watchedData.details?.deliverables || [],
        milestones: watchedData.milestones || watchedData.details?.milestones || [],
        paymentTerms: watchedData.details?.paymentTerms || '',
        terminationClause: watchedData.details?.terminationClause || '',
        additionalTerms: watchedData.details?.additionalTerms || '',
        notes: watchedData.details?.notes || '',
        autoRenew: watchedData.details?.autoRenew || false,
        renewalPeriod: watchedData.details?.renewalPeriod || 12,
        confidentialityClause: watchedData.details?.confidentialityClause || '',
        liabilityClause: watchedData.details?.liabilityClause || '',
        disputeResolution: watchedData.details?.disputeResolution || '',
        governingLaw: watchedData.details?.governingLaw || ''
      },
      financials: {
        totalValue: watchedData.financials?.totalValue || 0,
        paymentSchedule: watchedData.financials?.paymentSchedule || 'monthly',
        currency: watchedData.financials?.currency || 'USD',
        paymentMethod: watchedData.financials?.paymentMethod || '',
        lateFee: watchedData.financials?.lateFee || 0,
        retainerAmount: watchedData.financials?.retainerAmount || 0,
        expenseReimbursement: watchedData.financials?.expenseReimbursement || false
      },
      legal: {
        jurisdiction: watchedData.legal?.jurisdiction || '',
        arbitrationClause: watchedData.legal?.arbitrationClause || false,
        forceMajeureClause: watchedData.legal?.forceMajeureClause || false,
        intellectualPropertyClause: watchedData.legal?.intellectualPropertyClause || '',
        nonCompeteClause: watchedData.legal?.nonCompeteClause || '',
        nonDisclosureClause: watchedData.legal?.nonDisclosureClause || '',
        warrantyClause: watchedData.legal?.warrantyClause || '',
        privacyClause: watchedData.legal?.privacyClause || ''
      },
      approvals: {
        party1Approval: watchedData.approvals?.party1Approval || false,
        party2Approval: watchedData.approvals?.party2Approval || false,
        party1ApprovedDate: watchedData.approvals?.party1ApprovedDate || null,
        party2ApprovedDate: watchedData.approvals?.party2ApprovedDate || null,
        party1Signature: watchedData.approvals?.party1Signature || null,
        party2Signature: watchedData.approvals?.party2Signature || null
      }
    };

    // Add signatures from SignatureContext and form data
    console.log('Signature debugging:', {
      signatureStatus,
      signatures: signatures,
      watchedSignatures: watchedData.signatures,
      approvals: watchedData.approvals
    });

    // Map signatures from both sources (signatures comes directly from context, not from signatureStatus)
    if (signatures.party1 || signatures.party2 || watchedData.signatures) {
      data.signatures = {
        party1: signatures.party1 || watchedData.signatures?.party1 || null,
        party2: signatures.party2 || watchedData.signatures?.party2 || null,
      };
      
      console.log('Mapped signatures for template:', data.signatures);
    }

    // Also map to approvals for backward compatibility with template
    if (signatures.party1) {
      data.approvals.party1Signature = signatures.party1.dataURL || signatures.party1;
    }
    if (signatures.party2) {
      data.approvals.party2Signature = signatures.party2.dataURL || signatures.party2;
    }

    // Additional mapping from watched form data
    if (watchedData.signatures?.party1) {
      data.approvals.party1Signature = data.approvals.party1Signature || watchedData.signatures.party1.dataURL || watchedData.signatures.party1;
    }
    if (watchedData.signatures?.party2) {
      data.approvals.party2Signature = data.approvals.party2Signature || watchedData.signatures.party2.dataURL || watchedData.signatures.party2;
    }

    // Test signature rendering with mock data if no real signatures
    if (!signatures.party1 && !signatures.party2 && !watchedData.signatures) {
      console.log('No signatures found, checking if test signatures should be added...');
      
      // Only add test signatures if we have party names (indicates user is actively testing)
      if (data.party1.name && data.party2.name) {
        console.log('Adding test signatures for debugging...');
        data.signatures = {
          party1: {
            type: 'type',
            text: data.party1.name,
            fontFamily: 'Dancing Script',
            timestamp: new Date().toISOString(),
            signerName: data.party1.name
          },
          party2: null
        };
      }
    }

    console.log('Final template data with signatures:', {
      hasSignatures: !!data.signatures,
      hasApprovals: !!(data.approvals.party1Signature || data.approvals.party2Signature),
      party1Sig: !!signatures.party1,
      party2Sig: !!signatures.party2,
      finalSignatures: data.signatures
    });

    return data;
  }, [watchedData, signatureStatus, signatures]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.grey[50],
      }}
    >
      {/* PDF Actions - only show when PDF is available */}
      {contractPdf && contractPdf.url && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <PDFActions />
        </Box>
      )}

      {/* Contract Preview */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: theme.palette.divider,
            borderRadius: '4px',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            minHeight: '297mm', // A4 height
            width: '210mm', // A4 width
            mx: 'auto',
            bgcolor: 'white',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'hidden',
            transform: 'scale(0.8)', // Scale down for better fit
            transformOrigin: 'top center',
            mb: 4, // Add margin bottom for better spacing
          }}
        >
          <DynamicContractTemplate
            {...templateData}
            forPdf={false}
          />
        </Paper>
      </Box>

      {/* Loading overlay */}
      {isGenerating && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" color="primary">
              Generating contract preview...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LivePreview; 