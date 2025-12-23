import React from 'react';
import { Box, Stepper, Step, StepLabel, useTheme } from '@mui/material';
import { useWizard } from 'react-use-wizard';

const WizardProgress = ({ isBusinessAccount }) => {
  const { activeStep } = useWizard();
  const theme = useTheme();

  // Define steps based on account type
  const steps = isBusinessAccount
    ? [
        'Party Info',
        'Contract Details',
        'Project & Financial Terms',
        'Legal Terms',
        'Signatures',
        'Summary',
        'Submit'
      ]
    : [
        'Party Info',
        'Contract Details',
        'Project & Financial Terms',
        'Signatures',
        'Summary',
        'Submit'
      ];

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: '0.75rem',
            fontWeight: 500,
          },
          '& .MuiStepIcon-root': {
            fontSize: '1.2rem',
          },
          '& .MuiStepIcon-text': {
            fontSize: '0.75rem',
            fontWeight: 600,
          },
          '& .MuiStepConnector-line': {
            borderTopWidth: 2,
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  color: index === activeStep 
                    ? theme.palette.primary.main 
                    : index < activeStep 
                      ? theme.palette.success.main
                      : theme.palette.text.secondary,
                  fontWeight: index === activeStep ? 600 : 500,
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default WizardProgress; 