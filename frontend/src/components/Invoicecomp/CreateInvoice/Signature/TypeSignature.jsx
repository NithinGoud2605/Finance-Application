import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useSignatureContext } from '../contexts/SignatureContext';

const fonts = [
  { name: 'Dancing Script', value: "'Dancing Script', cursive" },
  { name: 'Great Vibes', value: "'Great Vibes', cursive" },
  { name: 'Sacramento', value: "'Sacramento', cursive" }
];

const TypeSignature = ({ handleSaveSignature }) => {
  const {
    typedSignature,
    setTypedSignature,
    selectedFont,
    setSelectedFont
  } = useSignatureContext();

  const handleTypedChange = useCallback(
    (e) => {
      setTypedSignature(e.target.value);
    },
    [setTypedSignature]
  );

  const handleFontChange = useCallback(
    (e) => {
      const newFontName = e.target.value;
      const foundFont = fonts.find((font) => font.name === newFontName);
      if (foundFont) {
        setSelectedFont(foundFont);
      }
    },
    [setSelectedFont]
  );

  return (
    <Box>
      <TextField
        label="Type your signature"
        value={typedSignature}
        onChange={handleTypedChange}
        fullWidth
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Font</InputLabel>
        <Select
          value={selectedFont?.name || ''}
          label="Select Font"
          onChange={handleFontChange}
        >
          {fonts.map((font) => (
            <MenuItem
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Preview of typed signature */}
      <Box
        sx={{
          fontFamily: selectedFont?.value || 'inherit',
          fontSize: '2rem',
          mb: 2,
          border: '1px dashed #ccc',
          p: 1
        }}
      >
        {typedSignature}
      </Box>

      <Button variant="contained" onClick={handleSaveSignature}>
        Save
      </Button>
    </Box>
  );
};

export default TypeSignature;
