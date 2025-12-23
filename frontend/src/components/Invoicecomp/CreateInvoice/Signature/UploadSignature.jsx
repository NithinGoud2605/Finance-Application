import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useSignatureContext } from '../contexts/SignatureContext';

const UploadSignature = ({ handleSaveSignature }) => {
  const { setUploadSignatureImg, uploadSignatureImg } = useSignatureContext();

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Optional: Check file type or size for validation
      // e.g., if (file.size > MAX_SIZE) ...

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadSignatureImg(reader.result);
      };
      reader.readAsDataURL(file);
    },
    [setUploadSignatureImg]
  );

  return (
    <Box>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'block', marginBottom: '16px' }}
      />

      {uploadSignatureImg && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Preview:
          </Typography>
          <img
            src={uploadSignatureImg}
            alt="Uploaded Signature"
            style={{ maxWidth: '100%', maxHeight: '200px' }}
          />
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleSaveSignature}
        disabled={!uploadSignatureImg}
      >
        Save
      </Button>
    </Box>
  );
};

export default UploadSignature;
