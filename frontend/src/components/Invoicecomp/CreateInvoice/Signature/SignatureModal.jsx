import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Box,
  Button,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useSignatureContext } from '../contexts/SignatureContext';
import DrawSignature from './DrawSignature';
import TypeSignature from './TypeSignature';
import UploadSignature from './UploadSignature';
import { useTranslation } from 'react-i18next';

const SignatureModal = () => {
  const { setValue } = useFormContext();
  const {
    handleCanvasEnd,
    signatureData,
    typedSignature,
    selectedFont,
    uploadSignatureImg,
    signatureRef,
  } = useSignatureContext();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleTabChange = useCallback((_, newValue) => {
    setTab(newValue);
  }, []);

  // Save the signature based on the active tab
  const handleSaveSignature = useCallback(() => {
    if (tab === 0) {
      // Drawn signature
      handleCanvasEnd();
      setValue('details.signature.data', signatureData, { shouldDirty: true });
    } else if (tab === 1) {
      // Typed signature
      setValue(
        'details.signature',
        {
          data: typedSignature,
          fontFamily: selectedFont?.name,
        },
        { shouldDirty: true }
      );
    } else if (tab === 2) {
      // Uploaded signature
      setValue('details.signature.data', uploadSignatureImg, { shouldDirty: true });
    }
    handleClose();
  }, [
    tab,
    handleCanvasEnd,
    signatureData,
    typedSignature,
    selectedFont,
    uploadSignatureImg,
    setValue,
    handleClose,
  ]);

  // When the modal opens, re-render the drawn signature from saved data
  useEffect(() => {
    if (open && signatureData && signatureRef.current) {
      setTimeout(() => {
        signatureRef.current.fromDataURL(signatureData);
      }, 50);
    }
  }, [open, tab, signatureData, signatureRef]);

  return (
    <>
      <Button variant="outlined" onClick={handleOpen} sx={{ mb: 2 }}>
        {t('form.steps.summary.signatureModal.heading') || 'Add Signature'}
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{t('form.steps.summary.signatureModal.heading') || 'Add Signature'}</DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
            <Tab label={t('form.steps.summary.signatureModal.draw') || 'Draw'} />
            <Tab label={t('form.steps.summary.signatureModal.type') || 'Type'} />
            <Tab label={t('form.steps.summary.signatureModal.upload') || 'Upload'} />
          </Tabs>
          <Box sx={{ mt: 2, p: 2 }}>
            {tab === 0 && <DrawSignature handleSaveSignature={handleSaveSignature} />}
            {tab === 1 && <TypeSignature handleSaveSignature={handleSaveSignature} />}
            {tab === 2 && <UploadSignature handleSaveSignature={handleSaveSignature} />}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignatureModal;
