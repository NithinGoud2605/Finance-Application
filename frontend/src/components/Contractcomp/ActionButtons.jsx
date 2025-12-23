import React from 'react';
import { Stack, Button } from '@mui/material';


export default function ActionButtons({ onFileUpload, onCreate }) {
  return (
    <Stack direction="row" spacing={2}>
      <Button variant="contained" component="label">
        Upload Contract
        <input
          type="file"
          hidden
          accept="application/pdf"
          onChange={onFileUpload}
        />
      </Button>

      <Button variant="outlined" onClick={onCreate}>
        Create Contract
      </Button>
    </Stack>
  );
}
