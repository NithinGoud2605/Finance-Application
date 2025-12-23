import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from '../contexts/ContractContext';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  AssignmentTurnedIn as TaskIcon,
  LocalOffer as ContractIcon,
  AccountBalance as LegalIcon,
} from '@mui/icons-material';
import { useUser } from '../../../../hooks/useUser';

const ContractSummary = ({ isBusinessAccount }) => {
  const { watch } = useFormContext();
  const { formatCurrency, calculateDuration, validationErrors = [], warnings = [] } = useContractContext();
  const { user } = useUser();

  const party1 = watch('party1');
  const party2 = watch('party2');
  const details = watch('details');
  const financials = watch('financials');
  const legal = watch('legal');

  const contractDuration = calculateDuration(details?.startDate, details?.endDate);

  // Ensure arrays are always defined
  const safeValidationErrors = Array.isArray(validationErrors) ? validationErrors : [];
  const safeWarnings = Array.isArray(warnings) ? warnings : [];

  return (
    <Box sx={{ p: 0 }}>
      {/* Contract Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ContractIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary">
              Contract Overview
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Contract Title
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {details?.title || 'Professional Services Agreement'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Contract Type
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                {details?.contractType?.replace(/_/g, ' ') || 'Service Agreement'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {contractDuration}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {details?.startDate ? new Date(details.startDate).toLocaleDateString() : 'Not specified'}
              </Typography>
            </Grid>
          </Grid>
          
          {details?.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                {details.description}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Parties Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Party 1 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                {party1?.companyName ? <BusinessIcon sx={{ mr: 1 }} /> : <PersonIcon sx={{ mr: 1 }} />}
                Party 1 (Provider)
              </Typography>
              
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {party1?.name || 'Not specified'}
                </Typography>
                {party1?.companyName && (
                  <Typography variant="body2" color="text.secondary">
                    {party1.companyName}
                  </Typography>
                )}
                {party1?.position && (
                  <Typography variant="body2" color="text.secondary">
                    {party1.position}
                  </Typography>
                )}
                {party1?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {party1.email}
                  </Typography>
                )}
                {party1?.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {party1.address}
                    {party1.city && `, ${party1.city}`}
                    {party1.state && `, ${party1.state}`}
                    {party1.zipCode && ` ${party1.zipCode}`}
                    {party1.country && `, ${party1.country}`}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Party 2 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                {party2?.companyName ? <BusinessIcon sx={{ mr: 1 }} /> : <PersonIcon sx={{ mr: 1 }} />}
                Party 2 (Client)
              </Typography>
              
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {party2?.name || 'Not specified'}
                </Typography>
                {party2?.companyName && (
                  <Typography variant="body2" color="text.secondary">
                    {party2.companyName}
                  </Typography>
                )}
                {party2?.position && (
                  <Typography variant="body2" color="text.secondary">
                    {party2.position}
                  </Typography>
                )}
                {party2?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {party2.email}
                  </Typography>
                )}
                {party2?.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {party2.address}
                    {party2.city && `, ${party2.city}`}
                    {party2.state && `, ${party2.state}`}
                    {party2.zipCode && ` ${party2.zipCode}`}
                    {party2.country && `, ${party2.country}`}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Terms */}
      {financials?.totalValue > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Financial Terms
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(financials.totalValue, details?.currency)}
                </Typography>
              </Box>
              
              {financials?.retainerAmount > 0 && (
                <Box sx={{ minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Retainer/Deposit
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(financials.retainerAmount, details?.currency)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Schedule
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {financials?.paymentSchedule?.replace(/_/g, ' ') || 'Not specified'}
                </Typography>
              </Box>
            </Box>

            {(details?.paymentTerms || financials?.paymentTerms) && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Payment Terms
                </Typography>
                <Typography variant="body2">
                  {details?.paymentTerms || financials?.paymentTerms}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contract Terms */}
      {(details?.terminationClause || details?.additionalTerms) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contract Terms
            </Typography>
            
            {details?.terminationClause && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Termination Clause
                </Typography>
                <Typography variant="body2">
                  {details.terminationClause}
                </Typography>
              </Box>
            )}
            
            {details?.additionalTerms && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Additional Terms
                </Typography>
                <Typography variant="body2">
                  {details.additionalTerms}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legal Terms (Business only) */}
      {isBusinessAccount && (legal?.jurisdiction || legal?.arbitrationClause || legal?.forceMajeureClause) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" color="error.main" gutterBottom>
              Legal Terms
            </Typography>
            
            {legal?.jurisdiction && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Governing Law: {legal.jurisdiction}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {legal?.arbitrationClause && (
                <Chip label="Arbitration Clause" size="small" color="error" variant="outlined" />
              )}
              {legal?.forceMajeureClause && (
                <Chip label="Force Majeure" size="small" color="error" variant="outlined" />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {(safeValidationErrors.length > 0 || safeWarnings.length > 0) && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contract Review
            </Typography>
            
            {safeValidationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Required Information Missing:
                </Typography>
                <List dense>
                  {safeValidationErrors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
            
            {safeWarnings.length > 0 && (
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations:
                </Typography>
                <List dense>
                  {safeWarnings.map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ContractSummary; 