// src/components/Dashcomp/HighlightedCard.jsx
import React from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

export default function HighlightedCard() {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <InsightsRoundedIcon />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
          Explore your data
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Uncover performance and visitor insights with our data wizardry.
        </Typography>
        <Button
          variant="contained"
          size="small"
          endIcon={<ChevronRightRoundedIcon />}
        >
          Get insights
        </Button>
      </CardContent>
    </Card>
  );
}
