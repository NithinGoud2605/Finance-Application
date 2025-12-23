import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Paper,
  useTheme,
  Divider
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useTranslationContext } from '../contexts/TranslationContext';
import { useContractContext } from '../contexts/ContractContext';
import TextFieldWrapper from './TextFieldWrapper';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';

const ContractDetails = ({ isBusinessAccount }) => {
  const { watch, setValue } = useFormContext();
  const { t } = useTranslationContext();
  const { updateContractFormData } = useContractContext();
  const theme = useTheme();

  const contractDetailsData = watch('details');

  useEffect(() => {
    if (contractDetailsData) {
      updateContractFormData({ details: contractDetailsData });
    }
  }, [contractDetailsData, updateContractFormData]);

  const contractTypes = [
    // Core Service Agreements
    { value: 'service_agreement', label: 'Service Agreement', description: 'General service-based contract', category: 'Service', icon: '🤝' },
    { value: 'consulting', label: 'Consulting Agreement', description: 'Professional consulting services', category: 'Service', icon: '💼' },
    { value: 'consulting_retainer', label: 'Consulting Retainer', description: 'Ongoing consulting services with retainer', category: 'Service', icon: '🔄' },
    { value: 'freelance', label: 'Freelance Contract', description: 'Independent contractor agreement', category: 'Service', icon: '👤' },
    { value: 'maintenance', label: 'Maintenance Agreement', description: 'Ongoing maintenance and support', category: 'Service', icon: '🔧' },

    // Pricing Models
    { value: 'fixed_price', label: 'Fixed Price Contract', description: 'Fixed scope and price project', category: 'Pricing', icon: '💰' },
    { value: 'time_and_materials', label: 'Time & Materials', description: 'Hourly or time-based billing', category: 'Pricing', icon: '⏱️' },
    { value: 'retainer', label: 'Retainer Agreement', description: 'Pre-paid service hours or ongoing commitment', category: 'Pricing', icon: '🔒' },

    // Technology & Licensing
    { value: 'software_license', label: 'Software License Agreement', description: 'Software licensing and usage rights', business: true, category: 'Technology', icon: '💻' },
    { value: 'saas_agreement', label: 'SaaS Agreement', description: 'Software as a Service subscription', business: true, category: 'Technology', icon: '☁️' },
    { value: 'license', label: 'License Agreement', description: 'General intellectual property licensing', business: true, category: 'Technology', icon: '📜' },
    { value: 'api_agreement', label: 'API License Agreement', description: 'API access and integration rights', business: true, category: 'Technology', icon: '🔌' },
    { value: 'white_label', label: 'White Label Agreement', description: 'White label product licensing', business: true, category: 'Technology', icon: '🏷️' },

    // Employment & HR
    { value: 'employment', label: 'Employment Contract', description: 'Full-time employment agreement', business: true, category: 'Employment', icon: '👔' },
    { value: 'independent_contractor', label: 'Independent Contractor', description: '1099 contractor agreement', business: true, category: 'Employment', icon: '📋' },
    { value: 'internship', label: 'Internship Agreement', description: 'Internship program contract', business: true, category: 'Employment', icon: '🎓' },

    // Business Partnerships
    { value: 'partnership', label: 'Partnership Agreement', description: 'Business partnership terms', business: true, category: 'Partnership', icon: '🤝' },
    { value: 'joint_venture', label: 'Joint Venture Agreement', description: 'Collaborative business venture', business: true, category: 'Partnership', icon: '🚀' },
    { value: 'strategic_alliance', label: 'Strategic Alliance', description: 'Strategic business partnership', business: true, category: 'Partnership', icon: '🎯' },

    // Vendor & Supply Chain
    { value: 'vendor_agreement', label: 'Vendor Agreement', description: 'Vendor service provider contract', business: true, category: 'Vendor', icon: '🏢' },
    { value: 'supplier_agreement', label: 'Supplier Agreement', description: 'Product or material supplier', business: true, category: 'Vendor', icon: '📦' },
    { value: 'distribution_agreement', label: 'Distribution Agreement', description: 'Product distribution rights', business: true, category: 'Vendor', icon: '🚚' },
    { value: 'reseller_agreement', label: 'Reseller Agreement', description: 'Product reseller authorization', business: true, category: 'Vendor', icon: '🛒' },

    // Subscription & Revenue
    { value: 'subscription', label: 'Subscription Agreement', description: 'Recurring subscription services', business: true, category: 'Revenue', icon: '🔄' },
    { value: 'membership', label: 'Membership Agreement', description: 'Membership program terms', category: 'Revenue', icon: '🎫' },
    { value: 'affiliate', label: 'Affiliate Agreement', description: 'Affiliate marketing program', category: 'Revenue', icon: '💸' },

    // Legal & Compliance
    { value: 'nda', label: 'Non-Disclosure Agreement (NDA)', description: 'Confidentiality and non-disclosure', category: 'Legal', icon: '🔒' },
    { value: 'non_disclosure', label: 'Confidentiality Agreement', description: 'Bilateral confidentiality terms', category: 'Legal', icon: '🤐' },
    { value: 'non_compete', label: 'Non-Compete Agreement', description: 'Competition restriction terms', business: true, category: 'Legal', icon: '⛔' },
    { value: 'data_processing', label: 'Data Processing Agreement (DPA)', description: 'GDPR/CCPA data processing terms', business: true, category: 'Legal', icon: '🛡️' },
    { value: 'privacy_agreement', label: 'Privacy Agreement', description: 'Privacy policy and data handling', category: 'Legal', icon: '🔐' },

    // Real Estate & Facilities
    { value: 'lease_agreement', label: 'Lease Agreement', description: 'Property or equipment lease', business: true, category: 'Real Estate', icon: '🏠' },
    { value: 'rental_agreement', label: 'Rental Agreement', description: 'Short-term rental or equipment', category: 'Real Estate', icon: '🔑' },

    // Creative & Media
    { value: 'creative_services', label: 'Creative Services Agreement', description: 'Design, content, and creative work', category: 'Creative', icon: '🎨' },
    { value: 'content_license', label: 'Content License Agreement', description: 'Content licensing and usage rights', category: 'Creative', icon: '📝' },
    { value: 'media_production', label: 'Media Production Agreement', description: 'Video, audio, and media production', category: 'Creative', icon: '🎬' },

    // Financial Services
    { value: 'investment_agreement', label: 'Investment Agreement', description: 'Investment terms and conditions', business: true, category: 'Financial', icon: '📈' },
    { value: 'loan_agreement', label: 'Loan Agreement', description: 'Lending terms and repayment', business: true, category: 'Financial', icon: '💳' },

    // Professional Services
    { value: 'legal_services', label: 'Legal Services Agreement', description: 'Attorney-client service agreement', category: 'Professional', icon: '⚖️' },
    { value: 'accounting_services', label: 'Accounting Services Agreement', description: 'Accounting and bookkeeping services', category: 'Professional', icon: '📊' },
    { value: 'medical_services', label: 'Medical Services Agreement', description: 'Healthcare service provider contract', category: 'Professional', icon: '🏥' },

    // Custom & General
    { value: 'master_service_agreement', label: 'Master Service Agreement (MSA)', description: 'Umbrella agreement for multiple projects', business: true, category: 'Framework', icon: '📋' },
    { value: 'statement_of_work', label: 'Statement of Work (SOW)', description: 'Specific project scope and deliverables', category: 'Framework', icon: '📄' },
    { value: 'other', label: 'Custom Contract', description: 'Custom contract type not listed above', category: 'Custom', icon: '📑' }
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CHF', label: 'Swiss Franc (CHF)' },
    { value: 'CNY', label: 'Chinese Yuan (¥)' }
  ];

  const availableTypes = contractTypes.filter(type => 
    !type.business || isBusinessAccount
  );

  return (
    <Box sx={{ p: 0 }}>
      {/* Compact Form Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5,
        mb: 2
      }}>
        <TextFieldWrapper
          name="details.contractNumber"
          label="Contract Number"
          placeholder="CNT-001"
          sx={{ mb: 1 }}
        />

        <TextFieldWrapper
          name="details.title"
          label={t('field.title', 'Title')}
          placeholder="Contract title"
          sx={{ mb: 1 }}
        />

        <FormControl sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.9rem' }}>Type</InputLabel>
          <Select
            value={contractDetailsData?.contractType || 'service_agreement'}
            onChange={(e) => setValue('details.contractType', e.target.value)}
            label="Type"
            size="small"
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.info.main,
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: { 
                  maxHeight: 300,
                  borderRadius: '8px',
                }
              }
            }}
          >
            {availableTypes.slice(0, 10).map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ mr: 1, fontSize: '1rem' }}>
                    {type.icon || '📄'}
                  </Box>
                  <Typography variant="body2">
                    {type.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.9rem' }}>Currency</InputLabel>
          <Select
            value={contractDetailsData?.currency || 'USD'}
            onChange={(e) => setValue('details.currency', e.target.value)}
            label="Currency"
            size="small"
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          >
            {currencies.map((currency) => (
              <MenuItem key={currency.value} value={currency.value}>
                {currency.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextFieldWrapper
          name="details.startDate"
          label={t('field.startDate', 'Start Date')}
          type="date"
          sx={{ mb: 1 }}
          InputLabelProps={{ shrink: true }}
        />

        <TextFieldWrapper
          name="details.endDate"
          label={t('field.endDate', 'End Date')}
          type="date"
          sx={{ mb: 1 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <TextFieldWrapper
        name="details.description"
        label={t('field.description', 'Description')}
        placeholder="Brief description of the contract..."
        multiline
        rows={2}
        sx={{ width: '100%', mb: 1 }}
      />
    </Box>
  );
};

export default ContractDetails; 