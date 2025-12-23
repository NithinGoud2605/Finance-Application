import React, { useCallback } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const SignatureFontSelector = ({
  typedSignatureFonts,
  selectedFont,
  setSelectedFont
}) => {
  const handleChangeFont = useCallback(
    (e) => {
      const fontVariable = e.target.value;
      const foundFont = typedSignatureFonts.find(
        (font) => font.variable === fontVariable
      );
      if (foundFont) {
        setSelectedFont(foundFont);
      }
    },
    [typedSignatureFonts, setSelectedFont]
  );

  return (
    <FormControl fullWidth variant="outlined" size="small">
      <InputLabel id="signature-font-label">Select Font</InputLabel>
      <Select
        labelId="signature-font-label"
        value={selectedFont?.variable || ''}
        label="Select Font"
        onChange={handleChangeFont}
      >
        {typedSignatureFonts.map((font) => (
          <MenuItem
            key={font.name}
            value={font.variable}
            style={{ fontFamily: font.variable }}
          >
            {font.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SignatureFontSelector;
