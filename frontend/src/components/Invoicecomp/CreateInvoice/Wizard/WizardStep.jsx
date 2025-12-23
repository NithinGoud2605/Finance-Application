import React from 'react';
import { Box, Fade } from '@mui/material';
import WizardProgress from './WizardProgress';
import WizardNavigation from './WizardNavigation';
import { useWizard } from 'react-use-wizard';

const WizardStep = ({ children }) => {
  const { activeStep } = useWizard();

  return (
    <Box
      sx={{
        minHeight: '25rem',
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <WizardProgress />
      <Fade in key={activeStep} timeout={500}>
        <Box sx={{ my: 3 }}>{children}</Box>
      </Fade>
      <WizardNavigation />
    </Box>
  );
};

export default WizardStep;
