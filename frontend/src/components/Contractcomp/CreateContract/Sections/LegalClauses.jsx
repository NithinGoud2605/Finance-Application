import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from '../contexts/ContractContext';
import TextFieldWrapper from './TextFieldWrapper';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';

const LegalClauses = ({ isBusinessAccount }) => {
  const { watch, setValue } = useFormContext();
  const { updateContractFormData } = useContractContext();

  const legalData = watch('legal');

  useEffect(() => {
    if (legalData) {
      updateContractFormData({ legal: legalData });
    }
  }, [legalData, updateContractFormData]);

  if (!isBusinessAccount) {
    return (
      <Alert severity="info">
        Legal clauses are available for business accounts only. 
        Upgrade to access advanced legal terms and protections.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GavelIcon color="error" sx={{ mr: 1 }} />
        <Typography variant="h6" color="error.main">
          Legal Terms & Clauses
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Legal Disclaimer:</strong> These clauses are for informational purposes only. 
          Please consult with a qualified attorney before finalizing any contract with legal implications.
        </Typography>
      </Alert>

      {/* Jurisdiction */}
      <Box sx={{ mb: 3 }}>
        <TextFieldWrapper
          name="legal.jurisdiction"
          label="Governing Law & Jurisdiction"
          placeholder="e.g., State of California, United States"
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Standard Legal Clauses */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Standard Legal Protections
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={legalData?.arbitrationClause || false}
              onChange={(e) => setValue('legal.arbitrationClause', e.target.checked)}
            />
          }
          label="Include Arbitration Clause"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={legalData?.forceMajeureClause || false}
              onChange={(e) => setValue('legal.forceMajeureClause', e.target.checked)}
            />
          }
          label="Include Force Majeure Clause"
        />
      </Box>

      {/* Detailed Legal Clauses */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Intellectual Property Terms</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextFieldWrapper
            name="legal.intellectualPropertyClause"
            label="Intellectual Property Rights"
            placeholder="Define ownership and rights to intellectual property created during this contract..."
            multiline
            rows={4}
            sx={{ width: '100%' }}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Confidentiality & Non-Disclosure</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextFieldWrapper
            name="legal.nonDisclosureClause"
            label="Non-Disclosure Agreement"
            placeholder="Define confidential information and non-disclosure obligations..."
            multiline
            rows={4}
            sx={{ width: '100%' }}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Non-Compete Terms</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextFieldWrapper
            name="legal.nonCompeteClause"
            label="Non-Compete Agreement"
            placeholder="Define non-compete restrictions and duration..."
            multiline
            rows={4}
            sx={{ width: '100%' }}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Warranty & Liability</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextFieldWrapper
            name="legal.warrantyClause"
            label="Warranty & Liability Terms"
            placeholder="Define warranties, disclaimers, and liability limitations..."
            multiline
            rows={4}
            sx={{ width: '100%' }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Additional Legal Terms */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Additional Legal Terms
        </Typography>
        <TextFieldWrapper
          name="details.additionalTerms"
          label="Additional Legal Terms"
          placeholder="Any additional legal terms, conditions, or clauses..."
          multiline
          rows={4}
          sx={{ width: '100%' }}
        />
      </Box>
    </Box>
  );
};

export default LegalClauses; 