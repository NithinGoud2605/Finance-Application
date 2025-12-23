import React from 'react';
import { Box, Typography } from '@mui/material';

const ClientInfoDisplay = ({ client, variant = 'default', textColor, marginBottom = 0.5 }) => {
  const renderClientField = (value, fallback) => value || fallback;

  return (
    <Box>
      <Typography sx={{ color: textColor, mt: marginBottom }}>
        {renderClientField(client.name, 'Client Name')}
      </Typography>
      <Typography sx={{ color: textColor, mt: marginBottom }}>
        {renderClientField(client.address, 'Address')}
      </Typography>
      <Typography sx={{ color: textColor, mt: marginBottom }}>
        {`${renderClientField(client.zipCode, 'ZIP')} ${renderClientField(client.city, 'City')}`}
      </Typography>
      <Typography sx={{ color: textColor, mt: marginBottom }}>
        {renderClientField(client.country, 'Country')}
      </Typography>
      {variant === 'full' && (
        <>
          <Typography sx={{ color: textColor, mt: marginBottom }}>
            {renderClientField(client.email, 'client@example.com')}
          </Typography>
          {client.phone && (
            <Typography sx={{ color: textColor, mt: marginBottom }}>
              {client.phone}
            </Typography>
          )}
          {client.taxId && (
            <Typography sx={{ color: textColor, mt: marginBottom }}>
              Tax ID: {client.taxId}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default ClientInfoDisplay;