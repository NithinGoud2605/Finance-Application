import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Wizard } from 'react-use-wizard';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import InboxIcon from '@mui/icons-material/Inbox';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WizardStep from './Wizard/WizardStep';

// Section components
import BillFromSection from './Sections/BillFromSection';
import BillToSection from './Sections/BillToSection';
import InvoiceDetails from './Sections/InvoiceDetails';
import Items from './Sections/Items';
import Charges from './Sections/Charges';
import PaymentInformation from './Sections/PaymentInformation';
import InvoiceSummary from './Sections/InvoiceSummary';
import FinalSubmission from './Sections/FinalSubmission';

const InvoiceForm = ({ onClose, isBusinessAccount }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Header - Only show on mobile when onClose is provided */}
      {onClose && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon fontSize="small" />
              Invoice Details
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ 
                color: 'inherit',
                border: '1px solid currentColor',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Form Content with Perfect Scrolling */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: theme.palette.divider,
            borderRadius: '3px',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          },
        }}
      >
        <Wizard>
          {/* Step 1: Billing Information */}
          <WizardStep title="Billing Information" stepNumber={1}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              maxWidth: '100%',
              overflow: 'visible'
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SendIcon fontSize="small" />
                  Bill From (Your Information)
                </Typography>
                <BillFromSection isBusinessAccount={isBusinessAccount} />
              </Paper>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" color="secondary" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InboxIcon fontSize="small" />
                  Bill To (Client Information)
                </Typography>
                <BillToSection isBusinessAccount={isBusinessAccount} />
              </Paper>
            </Box>
          </WizardStep>

          {/* Step 2: Invoice Details */}
          <WizardStep title="Invoice Details" stepNumber={2}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                maxWidth: '100%',
                overflow: 'visible'
              }}
            >
              <Typography variant="subtitle2" color="info.main" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ReceiptIcon fontSize="small" />
                Invoice Information
              </Typography>
              <InvoiceDetails isBusinessAccount={isBusinessAccount} />
            </Paper>
          </WizardStep>

          {/* Step 3: Items */}
          <WizardStep title="Items & Services" stepNumber={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                maxWidth: '100%',
                overflow: 'visible'
              }}
            >
              <Typography variant="subtitle2" color="success.main" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ShoppingCartIcon fontSize="small" />
                Products & Services
              </Typography>
              <Items />
            </Paper>
          </WizardStep>

          {/* Step 4: Charges & Taxes */}
          <WizardStep title="Charges & Taxes" stepNumber={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                maxWidth: '100%',
                overflow: 'visible'
              }}
            >
              <Typography variant="subtitle2" color="warning.main" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoneyIcon fontSize="small" />
                Pricing & Calculations
              </Typography>
              <Charges isBusinessAccount={isBusinessAccount} />
            </Paper>
          </WizardStep>

          {/* Step 5: Payment Information (Business only) */}
          {isBusinessAccount && (
            <WizardStep title="Payment Information" stepNumber={5}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  maxWidth: '100%',
                  overflow: 'visible'
                }}
              >
                <Typography variant="subtitle2" color="info.main" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CreditCardIcon fontSize="small" />
                  Payment Details
                </Typography>
                <PaymentInformation isBusinessAccount={isBusinessAccount} />
              </Paper>
            </WizardStep>
          )}

          {/* Step 6: Summary & Notes */}
          <WizardStep title="Summary & Notes" stepNumber={isBusinessAccount ? 6 : 5}>
            <InvoiceSummary isBusinessAccount={isBusinessAccount} />
          </WizardStep>

          {/* Final Step: Create Invoice */}
          <WizardStep title="Create Invoice" stepNumber={isBusinessAccount ? 7 : 6}>
            <FinalSubmission isBusinessAccount={isBusinessAccount} />
          </WizardStep>

        </Wizard>
      </Box>
    </Box>
  );
};

export default InvoiceForm;
