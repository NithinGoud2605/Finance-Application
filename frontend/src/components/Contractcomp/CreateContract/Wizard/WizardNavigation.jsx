import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useWizard } from 'react-use-wizard';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from '../contexts/ContractContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const WizardNavigation = ({ isBusinessAccount }) => {
  const { activeStep, previousStep, nextStep, isFirstStep, isLastStep, stepCount } = useWizard();
  const { formState: { errors } } = useFormContext();
  const { isValid } = useContractContext();

  // Calculate total steps based on account type
  const totalSteps = isBusinessAccount ? 7 : 6; // Corrected to match actual form structure
  
  // Step validation logic
  const getStepValidation = (step) => {
    switch (step) {
      case 0: // Party Info (Party 1 + Party 2)
        return !errors.party1 && !errors.party2;
      case 1: // Contract Details
        return !errors.details;
      case 2: // Project & Financial Terms
        return !errors.objectives && !errors.financials;
      case 3: // Legal Terms (business only) or Signatures (individual)
        return isBusinessAccount ? !errors.legal : true;
      case 4: // Signatures (business) or Summary (individual)
        return true;
      case 5: // Summary (business) or Submit (individual)
        return isValid;
      case 6: // Submit (business only)
        return isValid;
      default:
        return true;
    }
  };

  const canProceed = getStepValidation(activeStep);
  const isOnLastStep = activeStep === totalSteps - 1;

  return (
    <Box 
      sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={previousStep}
        disabled={isFirstStep}
        sx={{ minWidth: 120 }}
      >
        Back
      </Button>

      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Step {activeStep + 1} of {totalSteps}
        </Box>
      </Stack>

      <Button
        variant="contained"
        endIcon={!isOnLastStep ? <ArrowForwardIcon /> : null}
        onClick={nextStep}
        disabled={isOnLastStep || !canProceed}
        sx={{ minWidth: 120 }}
      >
        {isOnLastStep ? 'Complete' : 'Next'}
      </Button>
    </Box>
  );
};

export default WizardNavigation; 