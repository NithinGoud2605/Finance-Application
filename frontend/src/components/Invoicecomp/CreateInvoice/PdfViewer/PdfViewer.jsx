// /frontend/src/components/Invoicecomp/CreateInvoice/PdfViewer/PdfViewer.jsx
import React, { Suspense } from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  useTheme, 
  Paper,
  Chip,
  useMediaQuery
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import { useFormContext } from 'react-hook-form';
import { useInvoiceContext } from '../contexts/InvoiceContext';
import LivePreview from './LivePreview';
import FinalPdf from './FinalPdf';

const PdfViewer = () => {
  const theme = useTheme();
  const { watch } = useFormContext();
  const { invoicePdf, isGenerating } = useInvoiceContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formValues = watch(); // Real-time form data
  const hasGeneratedPdf = invoicePdf && invoicePdf.url;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {hasGeneratedPdf ? 'Generated PDF' : 'Live Preview'}
            </Typography>
            {isGenerating && (
              <Chip
                icon={<CircularProgress size={16} />}
                label="Generating PDF..."
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">
              {hasGeneratedPdf 
                ? 'Use the actions above to download, print, or save' 
                : 'Preview updates automatically as you fill the form'
              }
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Preview Container with Perfect A4 Aspect Ratio */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
          bgcolor: 'grey.50',
          p: { xs: 1, sm: 2 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '600px', md: '800px', lg: '900px' },
            aspectRatio: '210 / 297', // Perfect A4 ratio (210mm x 297mm)
            bgcolor: '#ffffff',
            boxShadow: theme.shadows[8],
            borderRadius: 1,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            // Perfect container for both live preview and final PDF
            display: 'flex',
            flexDirection: 'column',
            minHeight: { xs: '500px', sm: '600px', md: '700px', lg: '800px' },
            maxHeight: { xs: '75vh', sm: '85vh', md: '90vh' },
            margin: '0 auto',
            // Ensure proper content scaling and management
            '& > *': {
              width: '100%',
              height: '100%',
              flex: 1,
              overflow: 'auto', // Allow scrolling if content exceeds container
            },
            // Better typography scaling for different screen sizes
            fontSize: { xs: '12px', sm: '14px', md: '16px' },
            lineHeight: 1.4,
            // Optimize for PDF rendering
            '&.pdf-mode': {
              overflow: 'visible',
              height: 'auto',
              minHeight: 'auto',
              maxHeight: 'none',
              aspectRatio: 'auto',
            }
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  bgcolor: '#ffffff',
                  gap: 2,
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Loading preview...
                </Typography>
              </Box>
            }
          >
            {hasGeneratedPdf ? (
              <FinalPdf />
            ) : (
              <LivePreview formData={formValues} />
            )}
          </Suspense>
        </Box>
      </Box>

      {/* Footer Info */}
      <Paper
        elevation={0}
        sx={{
          py: 1,
          px: 2,
          bgcolor: 'background.paper',
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block',
            textAlign: 'center',
            lineHeight: 1.3
          }}
        >
          {hasGeneratedPdf
            ? <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><CheckCircleIcon fontSize="small" color="success" /> PDF generated successfully. Ready for download, print, or save.</Box>
            : <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><SyncIcon fontSize="small" color="info" /> Preview updates automatically as you fill the form. Click "Generate PDF" when ready.</Box>}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PdfViewer;