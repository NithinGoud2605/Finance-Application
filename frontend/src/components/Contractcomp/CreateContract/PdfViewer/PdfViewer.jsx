import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, useTheme } from '@mui/material';
import { PictureAsPdf as PdfIcon, Download as DownloadIcon } from '@mui/icons-material';

const PdfViewer = ({ pdfData, isLoading, onDownload, onGenerate }) => {
  const theme = useTheme();
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (pdfData?.url) {
      setPdfUrl(pdfData.url);
    }
  }, [pdfData]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
        <CircularProgress sx={{ mb: 2, color: theme.palette.primary.main }} />
        <Typography variant="body2" color="text.secondary">
          Generating contract PDF...
        </Typography>
      </Box>
    );
  }

  if (!pdfUrl) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        <PdfIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h6" gutterBottom color="text.secondary">
          No PDF Generated
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Generate a PDF preview of your contract to review before submission.
        </Typography>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={onGenerate}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            }
          }}
        >
          Generate PDF Preview
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6">Contract PDF Preview</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          size="small"
        >
          Download
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <iframe
          src={pdfUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Contract PDF Preview"
        />
      </Box>
    </Box>
  );
};

export default PdfViewer; 