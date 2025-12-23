import { Box, Typography } from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

export default function AccessDenied() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <SentimentDissatisfiedIcon color="error" sx={{ fontSize: 64, mb: 1 }} />
      <Typography variant="h5">Access denied</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        You don’t have permission to view this page.
      </Typography>
    </Box>
  );
}
