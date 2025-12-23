import React, { useRef, useCallback } from 'react';
import { Button, Box } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';

const DrawSignature = ({ onSaveSignature }) => {
  const signatureRef = useRef(null);

  // Clear the canvas
  const clearSignature = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  }, []);

  // Save the signature
  const handleSave = useCallback(() => {
    if (signatureRef.current) {
      const dataURL = signatureRef.current.toDataURL();
      if (dataURL && dataURL !== 'data:image/png;base64,') {
        onSaveSignature(dataURL);
      }
    }
  }, [onSaveSignature]);

  return (
    <Box>
      <SignatureCanvas
        ref={signatureRef}
        penColor="black"
        canvasProps={{
          width: 500,
          height: 200,
          className: 'sigCanvas',
          style: { 
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }
        }}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={clearSignature}>
          Clear
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save Signature
        </Button>
      </Box>
    </Box>
  );
};

export default DrawSignature; 