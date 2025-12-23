import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Box,
  Button,
  Typography,
  Alert,
  Stack,
  useTheme,
  IconButton,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useSignatureContext } from '../contexts/SignatureContext';
import DrawSignature from './DrawSignature';
import TypeSignature from './TypeSignature';
import UploadSignature from './UploadSignature';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

const ContractSignatureModal = ({ party, disabled = false }) => {
  const theme = useTheme();
  const { setValue, watch } = useFormContext();
  const { signatures, addSignature, removeSignature } = useSignatureContext();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  // Watch party data for signature
  const partyData = watch(party);
  const currentSignature = signatures[party];

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTab(0);
  }, []);

  const handleTabChange = useCallback((_, newValue) => {
    setTab(newValue);
  }, []);

  // Save signature based on the active tab
  const handleSaveSignature = useCallback((signatureData) => {
    const timestamp = new Date().toISOString();
    const signerName = partyData?.name || `${party === 'party1' ? 'First' : 'Second'} Party`;
    
    let finalSignatureData = {
      timestamp,
      signerName,
      partyType: party,
      ...signatureData
    };

    // Add signature to context
    addSignature(party, finalSignatureData);

    // Also save to form data
    setValue(`signatures.${party}`, finalSignatureData, { shouldDirty: true });

    handleClose();
  }, [partyData, party, addSignature, setValue, handleClose]);

  const handleRemoveSignature = useCallback(() => {
    removeSignature(party);
    setValue(`signatures.${party}`, null, { shouldDirty: true });
  }, [party, removeSignature, setValue]);

  const hasSignature = currentSignature && (currentSignature.dataURL || currentSignature.text);

  return (
    <>
      <Button 
        variant="outlined" 
        onClick={handleOpen}
        disabled={disabled}
        startIcon={hasSignature ? <EditIcon /> : null}
        sx={{ 
          mb: 2,
          width: '100%',
          justifyContent: 'center',
          borderStyle: hasSignature ? 'solid' : 'dashed',
          borderColor: hasSignature ? theme.palette.success.main : theme.palette.divider,
          color: hasSignature ? theme.palette.success.main : theme.palette.text.secondary,
          '&:hover': {
            borderColor: hasSignature ? theme.palette.success.dark : theme.palette.primary.main,
            backgroundColor: hasSignature ? theme.palette.success.light + '20' : theme.palette.action.hover,
          }
        }}
      >
        {hasSignature ? 'Edit Signature' : 'Add Signature'}
      </Button>

      {/* Signature Preview */}
      {hasSignature && (
        <Box sx={{ 
          border: `2px solid ${theme.palette.success.main}`,
          borderRadius: 2,
          p: 2,
          mb: 2,
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.success.light + '10',
        }}>
          {/* Signature Display */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            maxHeight: 60,
            width: '100%',
            mb: 1
          }}>
            {currentSignature.type === 'draw' || currentSignature.type === 'upload' ? (
              <img 
                src={currentSignature.dataURL} 
                alt={`${party} signature`}
                style={{ 
                  maxHeight: '50px', 
                  maxWidth: '150px',
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: `'${currentSignature.fontFamily}', cursive`,
                  color: theme.palette.text.primary,
                  fontStyle: 'italic'
                }}
              >
                {currentSignature.text}
              </Typography>
            )}
          </Box>
          
          {/* Signature Info */}
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
            ✓ Signed by {currentSignature.signerName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(currentSignature.timestamp).toLocaleDateString()}
          </Typography>

          {/* Remove Button */}
          {!disabled && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleRemoveSignature}
              sx={{ mt: 1 }}
            >
              Remove
            </Button>
          )}
        </Box>
      )}

      {/* Signature Modal */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div">
              Add Signature for {partyData?.name || `${party === 'party1' ? 'First' : 'Second'} Party`}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Choose how you'd like to add your signature. This will be included in the final contract document.
            </Typography>
          </Alert>

          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Draw" />
            <Tab label="Type" />
            <Tab label="Upload" />
          </Tabs>

          <Box sx={{ mt: 2, minHeight: '300px' }}>
            {tab === 0 && (
              <DrawSignature 
                onSaveSignature={(dataURL) => handleSaveSignature({ type: 'draw', dataURL })}
              />
            )}
            {tab === 1 && (
              <TypeSignature 
                onSaveSignature={(data) => handleSaveSignature({ type: 'type', ...data })}
              />
            )}
            {tab === 2 && (
              <UploadSignature 
                onSaveSignature={(dataURL) => handleSaveSignature({ type: 'upload', dataURL })}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractSignatureModal; 