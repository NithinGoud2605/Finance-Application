import React from 'react';
import { Box, Fade } from '@mui/material';
import WizardProgress from './WizardProgress';
import WizardNavigation from './WizardNavigation';
import { useWizard } from 'react-use-wizard';

const WizardStep = ({ children, isBusinessAccount = false }) => {
  const { activeStep } = useWizard();

  return (
    <Box
        sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, md: 3 },
        backgroundColor: 'background.paper',
      }}
    >
      <WizardProgress isBusinessAccount={isBusinessAccount} />
      <Fade in key={activeStep} timeout={500}>
      <Box sx={{ 
        flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Important for proper flex child sizing
      }}>
        {children}
        </Box>
      </Fade>
      <WizardNavigation isBusinessAccount={isBusinessAccount} />
    </Box>
  );
};

export default WizardStep; 