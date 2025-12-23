import React, { useCallback } from 'react';
import { IconButton, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const SignatureColorSelector = ({
  colors,
  selectedColor,
  handleColorButtonClick
}) => {
  const onColorClick = useCallback(
    (color) => {
      handleColorButtonClick(color);
    },
    [handleColorButtonClick]
  );

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {colors.map((colorObj) => {
        const { color } = colorObj;
        const isSelected = selectedColor === color;
        return (
          <IconButton
            key={color}
            onClick={() => onColorClick(color)}
            sx={{
              backgroundColor: color,
              border: isSelected ? '2px solid blue' : 'none',
              width: 32,
              height: 32,
              '&:hover': { backgroundColor: color }
            }}
          >
            {isSelected && (
              <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
            )}
          </IconButton>
        );
      })}
    </Box>
  );
};

export default SignatureColorSelector;
