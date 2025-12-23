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
import PersonIcon from '@mui/icons-material/Person';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ArticleIcon from '@mui/icons-material/Article';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GavelIcon from '@mui/icons-material/Gavel';
import DrawIcon from '@mui/icons-material/Draw';
import SummarizeIcon from '@mui/icons-material/Summarize';
import WizardStep from './Wizard/WizardStep';

// Section components
import Party1Section from './Sections/Party1Section';
import Party2Section from './Sections/Party2Section';
import ContractDetails from './Sections/ContractDetails';
import ObjectivesAndDeliverables from './Sections/ObjectivesAndDeliverables';
import FinancialTerms from './Sections/FinancialTerms';
import LegalClauses from './Sections/LegalClauses';
import ContractSummary from './Sections/ContractSummary';
import FinalSubmission from './Sections/FinalSubmission';
import SignatureSection from './Sections/SignatureSection';

const ContractForm = ({ onClose, isBusinessAccount, user }) => {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
        <Paper
          elevation={0}
          sx={{
          p: { xs: 1.5, md: 2 }, 
          bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <DescriptionIcon fontSize="small" />
          Create Contract
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {isBusinessAccount ? 'Business' : 'Individual'}
            </Typography>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 16 }} />
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ 
                '&:hover': {
                bgcolor: theme.palette.error.light + '20',
                color: theme.palette.error.main 
                }
              }}
            >
            <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

      {/* Wizard Content */}
      <Box sx={{ 
          flex: 1,
        overflow: 'hidden',
        bgcolor: theme.palette.background.default
      }}>
        <Wizard>
          {/* Step 1: Parties Information */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              height: '100%',
          overflow: 'auto',
              pr: 1,
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
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.primary.main, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Party 1 Information
                </Typography>
                <Party1Section isBusinessAccount={isBusinessAccount} />
              </Paper>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.secondary.main, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <HandshakeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Party 2 Information
                    </Typography>
                    <Party2Section isBusinessAccount={isBusinessAccount} />
              </Paper>
            </Box>
          </WizardStep>

          {/* Step 2: Contract Details */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              height: '100%',
              overflow: 'auto',
              pr: 1,
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
            }}>
            <Paper 
              elevation={0} 
              sx={{ 
                  p: 3, 
                bgcolor: theme.palette.background.paper, 
                border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
              }}
            >
              <Typography 
                  variant="subtitle1" 
                sx={{ 
                  color: theme.palette.info.main, 
                    mb: 2,
                  fontWeight: 600,
                }}
              >
                  <ArticleIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Contract Details
              </Typography>
              <ContractDetails isBusinessAccount={isBusinessAccount} />
            </Paper>
            </Box>
          </WizardStep>

          {/* Step 3: Project Details (Combined) */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              height: '100%',
              overflow: 'auto',
              pr: 1,
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
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.success.main, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <TrackChangesIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Project Scope
                </Typography>
                <ObjectivesAndDeliverables isBusinessAccount={isBusinessAccount} />
              </Paper>

              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.warning.main, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Financial Terms
                </Typography>
                <FinancialTerms isBusinessAccount={isBusinessAccount} />
              </Paper>
            </Box>
          </WizardStep>

          {/* Step 4: Legal Clauses (Business only) */}
          {isBusinessAccount && (
            <WizardStep isBusinessAccount={isBusinessAccount}>
              <Box sx={{ 
                height: '100%',
                overflow: 'auto',
                pr: 1,
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
              }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: theme.palette.background.paper, 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.error.main, 
                      mb: 2,
                      fontWeight: 600,
                    }}
                  >
                    <GavelIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Legal Terms
                  </Typography>
                  <LegalClauses isBusinessAccount={isBusinessAccount} />
                </Paper>
              </Box>
            </WizardStep>
          )}

          {/* Step 5: Digital Signatures */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              height: '100%',
              overflow: 'auto',
              pr: 1,
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
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.info.main, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <DrawIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Digital Signatures
                </Typography>
                <SignatureSection isBusinessAccount={isBusinessAccount} />
              </Paper>
            </Box>
            </WizardStep>

          {/* Step 6: Summary */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              height: '100%',
              overflow: 'auto',
              pr: 1,
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
            }}>
            <Paper 
              elevation={0} 
              sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.background.paper, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.primary, 
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  <SummarizeIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Contract Summary
              </Typography>
              <ContractSummary isBusinessAccount={isBusinessAccount} />
            </Paper>
            </Box>
          </WizardStep>

          {/* Final Step: Submit Contract */}
          <WizardStep isBusinessAccount={isBusinessAccount}>
            <Box sx={{ 
              height: '100%',
              overflow: 'auto',
              pr: 1,
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
            }}>
              <FinalSubmission isBusinessAccount={isBusinessAccount} />
            </Box>
          </WizardStep>

        </Wizard>
      </Box>
    </Box>
  );
};

export default ContractForm; 