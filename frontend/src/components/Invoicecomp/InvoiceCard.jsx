import React, { useState, useEffect, forwardRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import DownloadIcon from '@mui/icons-material/Download';
import { updateInvoice } from '../../services/api';
import { getInvoicePdf } from '../../services/api';

const InvoiceCard = forwardRef(function InvoiceCard({
  invoice,
  onEdit,
  onDelete,
  onStatusChange,
  refetchInvoices
}, ref) {
  const [clientName, setClientName] = useState('No Client');
  const [clientEmail, setClientEmail] = useState('No Email');
  const [clientAddress, setClientAddress] = useState('No Address');

  // PDF preview state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    // Handle client information from either Client object or flattened properties
    const client = invoice.Client || invoice;
    
    setClientName(client.name || client.clientName || 'No Client');
    setClientEmail(client.email || client.clientEmail || 'No Email');
    
    // Handle address from either nested Client object or flattened properties
    const addressParts = client.address ? 
      [client.address, client.city, client.zipCode, client.country].filter(Boolean) :
      [client.clientAddress].filter(Boolean);
    
    setClientAddress(addressParts.join(', ') || 'No Address');
  }, [invoice]);

  // Fetch a secure PDF URL if needed
  useEffect(() => {
    async function fetchPdf() {
      if (!invoice.pdfUrl) return;

      // If pdfUrl already looks like a full URL/Blob, use it directly
      if (typeof invoice.pdfUrl === 'string' && /^(https?:\/\/|blob:)/i.test(invoice.pdfUrl)) {
        setPreviewUrl(invoice.pdfUrl);
        return;
      }

      // Otherwise, request a secure streaming URL from backend
      try {
        setPdfLoading(true);
        const response = await getInvoicePdf(invoice.id, 'view');
        if (response?.url) {
          setPreviewUrl(response.url);
        } else {
          throw new Error('No URL returned');
        }
      } catch (err) {
        console.error('Failed to load secure PDF URL:', err);
        setPdfError(true);
      } finally {
        setPdfLoading(false);
      }
    }

    fetchPdf();
  }, [invoice.id, invoice.pdfUrl]);

  const createdDate = invoice.created_at || invoice.createdAt || invoice.date;
  const formattedCreated = createdDate
    ? new Date(createdDate).toLocaleDateString()
    : 'N/A';
  const formattedDue = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString()
    : 'N/A';

  const now = new Date();
  const dueEnd = invoice.dueDate ? new Date(`${invoice.dueDate}T23:59:59Z`) : null;
  const isOverdue = dueEnd ? now > dueEnd : false;

  const statusOrder = ['DRAFT','SENT','PAID','CANCELLED'];
  const statusColors = {
    DRAFT: 'secondary',
    SENT: 'primary',
    PAID: 'success',
    CANCELLED: 'error'
  };

  const handleStatusToggle = async () => {
    if (isOverdue) return;
    const idx = statusOrder.indexOf(invoice.status);
    const next = statusOrder[(idx + 1) % statusOrder.length];
    await updateInvoice(invoice.id, { status: next });
    onStatusChange(next);
    refetchInvoices();
  };

  const handleDownload = () => {
    if (!invoice.pdfUrl) return;
    const a = document.createElement('a');
    a.href = invoice.pdfUrl;
    a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card
      ref={ref}
      sx={{
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 3,
        border: parseFloat(invoice.totalAmount||0) > 0 ? '2px solid green' : '2px solid red',
        transition: 'transform .3s, box-shadow .3s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
      }}
    >
      <CardContent sx={{ flexGrow:1, p:2 }}>
        <Typography variant="h6" noWrap>
          {invoice.invoiceNumber}
        </Typography>

        <Chip
          label={invoice.status}
          color={statusColors[invoice.status]||'default'}
          onClick={handleStatusToggle}
          sx={{ mt:1, mb:2, cursor: isOverdue?'default':'pointer' }}
        />

        <Typography variant="body2" gutterBottom>
          <strong>Client:</strong> {clientName}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Email:</strong> {clientEmail}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Address:</strong> {clientAddress}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Created:</strong> {formattedCreated}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Due:</strong> {formattedDue}
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          ${parseFloat(invoice.totalAmount||0).toFixed(2)}
        </Typography>

        {invoice.pdfUrl && 
         (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '210/297',
              border: '0px solid #ddd',
              borderRadius: '10px',
              overflow: 'hidden',
              mt: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5'
            }}
          >
            {pdfLoading && <CircularProgress size={24} />}
            {pdfError && (
              <Typography variant="caption" color="error">
                Viewer Error
              </Typography>
            )}
            {!pdfLoading && !pdfError && previewUrl && (
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer
                  fileUrl={previewUrl}
                  defaultScale={SpecialZoomLevel.PageFit}
                  initialPage={0}
                  onDocumentLoadError={() => setPdfError(true)}
                />
              </Worker>
            )}
          </Box>
        )}
      </CardContent>

      <Stack direction="row" spacing={1} sx={{ p:2, borderTop:1, borderColor:'divider', justifyContent:'flex-end' }}>
        <Button size="small" variant="outlined" onClick={()=>onEdit(invoice)} disabled={isOverdue}>
          {isOverdue?'Completed':'Edit'}
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={()=>onDelete(invoice.id)}>
          Delete
        </Button>
      </Stack>
    </Card>
  );
});

export default InvoiceCard;
