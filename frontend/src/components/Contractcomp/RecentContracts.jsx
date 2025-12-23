import React, { useState } from 'react';
import { 
  Box, Typography, IconButton, Tooltip, Table, TableHead, TableBody, 
  TableRow, TableCell, Collapse, Grid 
} from '@mui/material';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getContractPdf } from '../../services/api'; // Ensure this is correctly exported from your API module

const RecentContracts = ({
  contracts = [],
  onEdit,
  onCancel,
  onRenew,
  onSendForSignature,
  existingClients = [],
}) => {
  const [expandedContractId, setExpandedContractId] = useState(null);
  const [pdfUrls, setPdfUrls] = useState({}); // Cache pre-signed URLs by contract ID

  const getClientName = (clientId) => {
    if (!clientId) return 'No client';
    const found = existingClients.find((c) => c.id === clientId);
    return found ? found.name : 'Unknown';
  };

  const toggleExpand = async (contractId, storedPdfUrl) => {
    // Toggle collapse: if already expanded, collapse it
    if (expandedContractId === contractId) {
      setExpandedContractId(null);
      return;
    }
    setExpandedContractId(contractId);

    // If the contract’s pdfUrl isn’t a full URL, get a pre-signed URL
    if (storedPdfUrl && !storedPdfUrl.startsWith('http') && !pdfUrls[contractId]) {
      try {
        const data = await getContractPdf(contractId, 'view');
        setPdfUrls((prev) => ({ ...prev, [contractId]: data.url }));
      } catch (error) {
        console.error('Error fetching pre-signed URL for contract', contractId, error);
      }
    }
  };
// In your RecentContracts.jsx component
const handleDownload = async (contractId) => {
  try {
    // First, get the secure download URL from your API
    const data = await getContractPdf(contractId, 'download');
    const secureUrl = data.url;
    
    // Use fetch to get the file blob
    const response = await fetch(secureUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    const blob = await response.blob();
    
    // Create a temporary URL and trigger download without revealing the direct S3 URL
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `contract-${contractId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading contract:', error);
    alert('Failed to download contract PDF.');
  }
};

  // Helper to choose a color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'CANCELLED': return 'red';
      case 'TRIAL': return 'orange';
      default: return 'inherit';
    }
  };

  // Define icon button styles
  const iconStyles = {
    edit: { color: '#1976d2' },
    cancel: { color: '#d32f2f' },
    renew: { color: '#388e3c' },
    signature: { color: '#fbc02d' },
    pdf: { color: '#5e35b1' }
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Plan Name</TableCell>
          <TableCell>Client</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Start Date</TableCell>
          <TableCell>End Date</TableCell>
          <TableCell>Billing Cycle</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {contracts.length > 0 ? (
          contracts.map((contract) => {
            const isExpanded = expandedContractId === contract.id;
            const client = existingClients.find((c) => c.id === contract.clientId) || {};
            const statusColor = getStatusColor(contract.status);

            // Determine the final PDF URL:
            // If contract.pdfUrl starts with "http", use it;
            // otherwise, use the cached pre-signed URL if available.
            let finalPdfUrl = '';
            if (contract.pdfUrl) {
              finalPdfUrl = contract.pdfUrl.startsWith('http')
                ? contract.pdfUrl
                : pdfUrls[contract.id] || '';
              console.log(`PDF URL for contract ${contract.id}:`, finalPdfUrl);
            }

            return (
              <React.Fragment key={contract.id}>
                <TableRow>
                  <TableCell>{contract.planName || 'N/A'}</TableCell>
                  <TableCell>{getClientName(contract.clientId)}</TableCell>
                  <TableCell>
                    <Typography style={{ color: statusColor, fontWeight: 600 }}>
                      {contract.status}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{contract.billingCycle || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit Contract">
                      <IconButton onClick={() => onEdit(contract.id)}>
                        <i className="fas fa-edit" style={iconStyles.edit} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel Contract">
                      <IconButton onClick={() => onCancel(contract.id)}>
                        <i className="fas fa-ban" style={iconStyles.cancel} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Renew Contract">
                      <IconButton onClick={() => onRenew(contract.id, null)}>
                        <i className="fas fa-redo" style={iconStyles.renew} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send for E-Signature">
                      <IconButton onClick={() => onSendForSignature(contract.id)}>
                        <i className="fas fa-file-signature" style={iconStyles.signature} />
                      </IconButton>
                    </Tooltip>
                    {contract.pdfUrl && (
                      <Tooltip title="View PDF">
                        <IconButton onClick={() => toggleExpand(contract.id, contract.pdfUrl)}>
                          <i className="far fa-file-pdf" style={iconStyles.pdf} />
                        </IconButton>
                      </Tooltip>
                      
                    )}
                    <Tooltip title="Download PDF">
  <IconButton onClick={() => handleDownload(contract.id)}>
    <i className="fas fa-download" style={{ ...iconStyles.pdf, color: '#1976d2' }} />
  </IconButton>
</Tooltip>

                  </TableCell>
                </TableRow>

                {/* Expanded Section for PDF and Client Details */}
                <TableRow>
                  <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2, border: '1px solid #ddd', padding: 2, borderRadius: '8px' }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                          Client Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Email:</Typography>
                            <Typography>{client.email || 'N/A'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Phone:</Typography>
                            <Typography>{client.phone || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Address:</Typography>
                            <Typography>{client.address || 'N/A'}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Business Type:</Typography>
                            <Typography>{client.businessType || 'N/A'}</Typography>
                          </Grid>
                        </Grid>

                        {contract.pdfUrl && finalPdfUrl && (
                          <>
                            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                              Contract Preview
                            </Typography>
                            <Box sx={{ height: 500, border: '1px solid #ccc', borderRadius: '4px' }}>
                              <Worker workerUrl="/pdf.worker.min.js">
                                <Viewer
                                  fileUrl={finalPdfUrl}
                                  defaultScale={SpecialZoomLevel.PageFit}
                                  initialPage={0}
                                />
                              </Worker>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={7} align="center">
              <Typography variant="body2">No contracts available.</Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default RecentContracts;
