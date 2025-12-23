import React, { useMemo } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Typography,
  LinearProgress
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useWizard } from 'react-use-wizard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const WizardProgress = () => {
  const { activeStep, goToStep } = useWizard();
  const {
    formState: { errors }
  } = useFormContext();
  const { t } = useTranslation();

  // If you want to derive validity from errors, update the conditions below.
  // For a simple case, we mark all steps as valid:
  const steps = useMemo(
    () => [
      { id: 0, label: t("fromAndTo", "From & To"), isValid: true },
      { id: 1, label: t("invoiceDetails", "Details"), isValid: true },
      { id: 2, label: t("lineItems", "Items"), isValid: true },
      { id: 3, label: t("charges", "Charges"), isValid: true },
      { id: 4, label: t("summary", "Payment"), isValid: true },
      { id: 5, label: t("paymentInfo", "Summary"), isValid: true },
      { id: 6, label: t("createInvoice", "Create Invoice"), isValid: true },
    ],
    [t] // Remove errors from dependency if you don't rely on them
  );

  const progress = (activeStep / (steps.length - 1)) * 100;

  return (
    <>
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step) => {
          const completed = step.isValid && step.id < activeStep;
          const icon = step.isValid ? (
            <CheckCircleIcon color={step.id < activeStep ? 'success' : 'primary'} />
          ) : (
            <ErrorIcon color="error" />
          );
          return (
            <Step key={step.id} completed={completed}>
              <StepLabel
                onClick={() => goToStep(step.id)}
                sx={{ cursor: 'pointer' }}
                icon={icon}
              >
                <Typography variant="caption">{step.label}</Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </>
  );
};

export default WizardProgress;
