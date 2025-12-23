import React from 'react';
import { Container } from '@mui/material';

const InvoiceLayout = ({ data, children }) => {
  const { details } = data;

  // If details.signature.fontFamily is e.g. "Dancing Script", you likely need
  // the Google Fonts variant like "Dancing+Script" in the href.
  // This is a simplistic example that does no conversions:
  const fontHref = details?.signature?.fontFamily
    ? `https://fonts.googleapis.com/css2?family=${details.signature.fontFamily}&display=swap`
    : '';

  return (
    <>
      {/* Dynamically load the user’s chosen font if specified */}
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      <Container
        maxWidth="md"
        sx={{
          p: 4,
          backgroundColor: '#fff',
          borderRadius: 0,
          my: 4,
          fontFamily: 'Roboto, sans-serif'
        }}
      >
        {children}
      </Container>
    </>
  );
};

export default InvoiceLayout;
