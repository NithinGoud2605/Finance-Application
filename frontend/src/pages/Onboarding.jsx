import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { updateMe } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';

export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: '',
    role: '',
    teamSize: ''
  });

  const navigate           = useNavigate();
  const { addOrganization } = useOrganization();

  const handleComplete = async () => {
    try {
      // 1. Create org & switch context
      const org = await addOrganization({
        name    : formData.organizationName,
        industry: formData.industry
      });

      // 2. Update user profile
      await updateMe({
        defaultOrganizationId: org.id,
        industry             : formData.industry
      });

      // 3. Done
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step><StepLabel>Organization</StepLabel></Step>
        <Step><StepLabel>Profile</StepLabel></Step>
      </Stepper>

      {/* ---- very minimal demo form ---- */}
      <TextField
        label="Organization name"
        fullWidth
        sx={{ mb: 2 }}
        value={formData.organizationName}
        onChange={(e) =>
          setFormData({ ...formData, organizationName: e.target.value })
        }
      />

      <Button
        variant="contained"
        fullWidth
        disabled={!formData.organizationName}
        onClick={handleComplete}
      >
        Complete setup
      </Button>
    </Box>
  );
}
