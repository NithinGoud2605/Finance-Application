import React, { useCallback, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

const UploadSignature = ({ onSaveSignature }) => {
  const [uploadSignatureImg, setUploadSignatureImg] = useState('');

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
    []
  );

  const handleSave = useCallback(() => {
    if (uploadSignatureImg) {
      onSaveSignature(uploadSignatureImg);
    }
  }, [uploadSignatureImg, onSaveSignature]);

  return (
    <Box>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'block', marginBottom: '24px' }}
      />

      {uploadSignatureImg && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Preview:
          </Typography>
          <Box sx={{
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            p: 2,
            bgcolor: '#fafafa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 120
          }}>
            <img
              src={uploadSignatureImg}
              alt="Uploaded Signature"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100px',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={!uploadSignatureImg}
        fullWidth
      >
        Save Signature
      </Button>
    </Box>
  );
};

export default UploadSignature; 