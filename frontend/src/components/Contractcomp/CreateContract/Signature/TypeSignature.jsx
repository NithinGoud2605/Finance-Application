import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const TypeSignature = ({ onSaveSignature }) => {
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState({
    name: 'Dancing Script',
    value: 'Dancing Script'
  });

  const fonts = [
    { name: 'Dancing Script', value: 'Dancing Script' },
    { name: 'Great Vibes', value: 'Great Vibes' },
    { name: 'Allura', value: 'Allura' },
    { name: 'Pacifico', value: 'Pacifico' },
    { name: 'Sacramento', value: 'Sacramento' },
    { name: 'Satisfy', value: 'Satisfy' },
    { name: 'Kaushan Script', value: 'Kaushan Script' }
  ];

  const handleSave = useCallback(() => {
    if (typedSignature.trim()) {
      onSaveSignature({
        text: typedSignature,
        fontFamily: selectedFont.value
      });
    }
  }, [typedSignature, selectedFont, onSaveSignature]);

  return (
    <Box>
      <TextField
        fullWidth
        label="Type your signature"
        value={typedSignature}
        onChange={(e) => setTypedSignature(e.target.value)}
        placeholder="Enter your full name"
        variant="outlined"
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Font Style</InputLabel>
        <Select
          value={selectedFont.value}
          label="Font Style"
          onChange={(e) => {
            const font = fonts.find(f => f.value === e.target.value);
            setSelectedFont(font);
          }}
        >
          {fonts.map((font) => (
            <MenuItem 
              key={font.value} 
              value={font.value}
              sx={{ fontFamily: font.value }}
            >
              {font.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Preview of typed signature */}
      <Box
        sx={{
          fontFamily: selectedFont.value,
          fontSize: '2rem',
          mb: 3,
          border: '2px solid #e0e0e0',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fafafa',
          fontStyle: 'italic'
        }}
      >
        {typedSignature || 'Your signature preview will appear here'}
      </Box>

      <Button 
        variant="contained" 
        onClick={handleSave}
        disabled={!typedSignature.trim()}
        fullWidth
      >
        Save Signature
      </Button>
    </Box>
  );
};

export default TypeSignature; 